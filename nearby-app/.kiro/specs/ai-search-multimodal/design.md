# AI-Powered Multimodal Search - Design

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Text Search  │  │ Voice Search │  │ Image Search │ │
│  │   (Existing) │  │    (New)     │  │    (New)     │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                  │                  │          │
│         └──────────────────┼──────────────────┘          │
│                            │                             │
│                    ┌───────▼────────┐                   │
│                    │  AI Service    │                   │
│                    │  (Enhanced)    │                   │
│                    └───────┬────────┘                   │
│                            │                             │
└────────────────────────────┼─────────────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │   Backend API    │
                    ├──────────────────┤
                    │ /ai/detect-      │
                    │  category        │
                    │ /ai/analyze-     │
                    │  image (NEW)     │
                    │ /broadcasts/     │
                    │  category-       │
                    │  filtered        │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  AWS Bedrock     │
                    │  Claude 3.5      │
                    │  Sonnet (Vision) │
                    └──────────────────┘
```

## Component Design

### 1. Featured Offer Banner Component

**Location:** `frontend/src/components/offers/FeaturedOfferBanner.tsx`

**Props:**
```typescript
interface FeaturedOfferBannerProps {
  title: string;
  description: string;
  promoCode: string;
  validUntil: string;
  discount: number;
}
```

**UI Structure:**
```
┌─────────────────────────────────────────────────────┐
│  Featured                                      %    │
│                                                     │
│  First Order Bonus!                                │
│  Get ₹50 off on your first purchase from any shop  │
│                                                     │
│  [NEARBY50]  ⏰ Valid till Dec 31                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Styling:**
- Gradient background: `from-blue-500 via-blue-600 to-purple-700`
- White text with opacity variations
- Rounded corners: `rounded-2xl`
- Shadow: `shadow-lg`
- Responsive padding

### 2. Enhanced Search Bar Component

**Location:** `frontend/src/components/home/EnhancedHeroSection.tsx` (update existing)

**New Features:**
- Voice input button
- Image input button
- Visual feedback for recording
- Image preview modal

**UI Structure:**
```
┌─────────────────────────────────────────────────────┐
│  🔍  Search for products...  🎤  📷  [Search]      │
└─────────────────────────────────────────────────────┘
     ↑                           ↑    ↑
   Search                      Voice Camera
   Icon                        Input Input
```

### 3. Voice Search Component

**Location:** `frontend/src/components/search/VoiceSearch.tsx`

**Features:**
- Microphone button with animation
- Recording indicator (pulsing red dot)
- Waveform visualization (optional)
- Language selector
- Permission handling

**States:**
```typescript
type VoiceSearchState = 
  | 'idle'           // Ready to record
  | 'requesting'     // Asking for permission
  | 'recording'      // Currently recording
  | 'processing'     // Converting to text
  | 'error'          // Permission denied or error
```

**Flow:**
```
User clicks mic → Request permission → Start recording
→ Show visual feedback → Stop recording (auto/manual)
→ Convert to text → Fill search input → Trigger search
```

### 4. Image Search Component

**Location:** `frontend/src/components/search/ImageSearch.tsx`

**Features:**
- Camera button
- File picker
- Image preview
- Crop/rotate (optional)
- Upload progress
- AI analysis status

**Flow:**
```
User clicks camera → Choose source (camera/file)
→ Select/capture image → Show preview
→ Compress image → Upload to backend
→ AI analyzes image → Extract product info
→ Trigger broadcast → Navigate to radar
```

## API Design

### 1. Analyze Image Endpoint

**Endpoint:** `POST /ai/analyze-image`

**Request:**
```json
{
  "image": "base64_encoded_image_string",
  "prompt": "optional_custom_prompt"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "name": "Fresh Tomatoes",
        "category": "Groceries",
        "confidence": 0.95,
        "description": "Red ripe tomatoes"
      }
    ],
    "primaryProduct": {
      "name": "Fresh Tomatoes",
      "category": "Groceries"
    },
    "searchQuery": "tomatoes",
    "processingTime": 2.3
  }
}
```

**Implementation:**
```typescript
// backend/src/ai/analyzeImage.ts
export const handler = async (event) => {
  const { image, prompt } = JSON.parse(event.body);
  
  // Call Bedrock with vision
  const response = await bedrockClient.invokeModel({
    modelId: 'apac.anthropic.claude-3-5-sonnet-20241022-v2:0',
    body: {
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: image
            }
          },
          {
            type: 'text',
            text: prompt || DEFAULT_PRODUCT_DETECTION_PROMPT
          }
        ]
      }],
      max_tokens: 500,
      temperature: 0.1
    }
  });
  
  // Parse and return structured data
  return parseProductInfo(response);
};
```

### 2. Voice-to-Text (Frontend Only)

**Implementation:** Use Web Speech API

```typescript
// frontend/src/hooks/useVoiceSearch.ts
export const useVoiceSearch = () => {
  const recognition = new (window.SpeechRecognition || 
                           window.webkitSpeechRecognition)();
  
  recognition.lang = 'en-IN'; // or 'hi-IN', 'kn-IN'
  recognition.continuous = false;
  recognition.interimResults = false;
  
  const startRecording = () => {
    recognition.start();
  };
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    // Fill search input with transcript
    handleSearch(transcript);
  };
  
  return { startRecording, isRecording, error };
};
```

## Data Flow

### Text Search (Existing)
```
User types "milk" → AI detects category (Groceries)
→ Create broadcast → Navigate to radar
```

### Voice Search (New)
```
User clicks mic → Speaks "I need milk"
→ Speech-to-text: "I need milk"
→ AI detects category (Groceries)
→ Create broadcast → Navigate to radar
```

### Image Search (New)
```
User uploads tomato image → Compress & upload
→ Bedrock analyzes: "Fresh Tomatoes, Groceries"
→ AI detects category (Groceries)
→ Create broadcast → Navigate to radar
```

## AI Prompts

### Image Analysis Prompt
```
You are a product identification expert. Analyze this image and identify:

1. Product name (be specific)
2. Product category (choose from: Groceries, Pharmacy, Electronics, Hardware, Automobile, Mobile, Home Essentials, Pet Supplies, Clothing, Fitness, Books, Cafe)
3. Confidence level (0-1)
4. Brief description

If multiple products are visible, list all but identify the PRIMARY product.

Return JSON format:
{
  "products": [
    {
      "name": "product name",
      "category": "category",
      "confidence": 0.95,
      "description": "brief description"
    }
  ],
  "primaryProduct": {
    "name": "main product",
    "category": "category"
  },
  "searchQuery": "simple search term"
}

Image shows:
```

## UI/UX Design

### Voice Search UX

**Idle State:**
```
┌─────────────────────────────────┐
│  🔍  Search...  🎤  📷  Search │
└─────────────────────────────────┘
                     ↑
                  Gray mic icon
```

**Recording State:**
```
┌─────────────────────────────────┐
│  🔍  Listening...  🔴  📷      │
└─────────────────────────────────┘
                     ↑
                  Pulsing red dot
```

**Processing State:**
```
┌─────────────────────────────────┐
│  🔍  "I need milk"  ⏳  📷     │
└─────────────────────────────────┘
                     ↑
                  Processing
```

### Image Search UX

**Image Preview Modal:**
```
┌─────────────────────────────────┐
│  Product Image                  │
│  ┌───────────────────────────┐ │
│  │                           │ │
│  │     [Image Preview]       │ │
│  │                           │ │
│  └───────────────────────────┘ │
│                                 │
│  AI is analyzing...             │
│  [████████░░] 80%               │
│                                 │
│  [Cancel]  [Search]             │
└─────────────────────────────────┘
```

## Error Handling

### Voice Search Errors
- **Permission Denied:** "Microphone access denied. Please enable in settings."
- **Not Supported:** "Voice search not supported in this browser."
- **No Speech:** "No speech detected. Please try again."
- **Network Error:** "Connection error. Please check your internet."

### Image Search Errors
- **File Too Large:** "Image too large. Please select image < 5MB."
- **Invalid Format:** "Unsupported format. Please use JPG, PNG, or WEBP."
- **AI Analysis Failed:** "Couldn't identify product. Please try text search."
- **No Product Found:** "No product detected in image. Please try another image."

## Performance Optimization

### Image Compression
```typescript
// Compress before upload
const compressImage = async (file: File): Promise<string> => {
  const maxWidth = 1024;
  const maxHeight = 1024;
  const quality = 0.8;
  
  // Use canvas to resize and compress
  // Return base64 string
};
```

### Caching
- Cache voice recognition results
- Cache image analysis results (by image hash)
- Cache category detection results

### Progressive Enhancement
- Text search works without voice/image
- Voice search degrades to text input
- Image search degrades to text input

## Security Considerations

### Image Upload
- Validate file type on frontend and backend
- Limit file size (5MB max)
- Scan for malicious content
- Temporary storage only (delete after analysis)
- No PII in images

### Voice Input
- No audio recording stored
- Only text transcript used
- Clear user consent

### API Security
- Rate limiting on image analysis
- Authentication required
- Input validation
- Output sanitization

## Testing Strategy

### Unit Tests
- Voice recognition mock
- Image compression
- AI response parsing
- Error handling

### Integration Tests
- End-to-end voice search flow
- End-to-end image search flow
- AI analysis accuracy
- Broadcast creation

### Manual Tests
- Test on different browsers
- Test on mobile devices
- Test with various images
- Test with different accents (voice)
- Test error scenarios

## Rollout Plan

### Phase 1: Featured Offer Banner (Week 1)
- Design and implement banner component
- Add to Offers page
- Test responsiveness
- Deploy

### Phase 2: Voice Search (Week 2)
- Implement voice recognition
- Add UI components
- Test on multiple browsers
- Deploy with feature flag

### Phase 3: Image Search (Week 3-4)
- Implement image upload
- Integrate Bedrock vision API
- Add image preview and analysis
- Test accuracy
- Deploy with feature flag

### Phase 4: Optimization (Week 5)
- Performance tuning
- Error handling improvements
- Analytics integration
- Full rollout

## Success Metrics

### Adoption
- % of searches using voice
- % of searches using image
- Daily active users of multimodal search

### Accuracy
- Voice recognition accuracy
- Image product detection accuracy
- Category detection accuracy

### Performance
- Average image analysis time
- Average voice recognition time
- Error rate

### Business Impact
- Increase in broadcasts created
- Increase in shop responses
- User satisfaction score
