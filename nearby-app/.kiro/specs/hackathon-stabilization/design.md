# Hackathon Demo Stabilization - Design

## Overview
This design document outlines the technical approach for stabilizing the three-app architecture and ensuring reliable end-to-end flows for the hackathon demo.

## Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Customer App   │     │  Merchant App   │     │   Admin App     │
│  (port 5173)    │     │  (port 5174)    │     │  (port 5175)    │
│  CloudFront     │     │  To Deploy      │     │  To Create      │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┴───────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   API Gateway          │
                    │   ap-south-1           │
                    │   4cwdqd7sz4...        │
                    └────────────┬───────────┘
                                 │
                    ┌────────────┴───────────┐
                    │   Lambda Functions     │
                    │   - Auth               │
                    │   - Broadcasts         │
                    │   - AI Category        │
                    │   - Orders             │
                    └────────────┬───────────┘
                                 │
                    ┌────────────┴───────────┐
                    │   DynamoDB Tables      │
                    │   - users              │
                    │   - merchants          │
                    │   - broadcasts         │
                    │   - orders             │
                    │   - categories         │
                    └────────────────────────┘
```

## Technology Stack

### Frontend (All Apps)
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- Framer Motion (animations)
- React Router DOM (routing)
- Zustand (state management)
- Axios (HTTP client)

### Backend
- AWS Lambda (Node.js 20.x)
- API Gateway (REST API)
- DynamoDB (NoSQL database)
- S3 (file storage for capabilities JSON)
- Bedrock (AI for category detection)
- SNS (notifications - stretch goal)

### Deployment
- Customer App: S3 + CloudFront
- Merchant App: S3 + CloudFront (to be deployed)
- Admin App: S3 + CloudFront (to be created & deployed)
- Backend: Serverless Framework

---

## 1. Merchant App - Onboarding Component Design

### 1.1 Component Structure

```typescript
// MerchantOnboarding.tsx structure
interface OnboardingState {
  // Step 1: Phone (already collected in Signup.tsx)
  phone: string
  
  // Step 2: Shop Details
  shopName: string
  ownerName: string
  email: string
  
  // Step 3: Major Category
  majorCategory: string
  
  // Step 4: Subcategory
  subCategory: string
  
  // Step 5: Capabilities
  capabilities: string[]
  
  // Step 6: Location & Timings
  location: {
    lat: number
    lng: number
    address?: string
    mapLink?: string
  }
  timing: {
    openHour: number
    closeHour: number
  }
  whatsapp?: string
  
  // Step 7: Merchant ID & Passcode (generated)
  merchantId?: string
  passcode: string
  passcodeConfirm: string
}

// Step component interface
interface StepProps {
  state: OnboardingState
  updateState: (updates: Partial<OnboardingState>) => void
  onNext: () => void
  onBack: () => void
}
```

### 1.2 Step-by-Step Flow

**Step 1: Phone Verification** (handled in Signup.tsx)
- Auto-validates when 10 digits entered
- Calls `GET /check-phone/{phone}`
- Stores phone in localStorage
- Navigates to `/onboarding`

**Step 2: Shop Details**
- Input: Shop Name (required, min 2 chars)
- Input: Owner Name (required, min 2 chars)
- Input: Email (required, valid email format)
- Validation: All fields required before "Next"

**Step 3: Major Category Selection**
- Grid of 11 category cards (from categoryTemplates.ts)
- Each card shows icon + name
- Green border when selected
- Single selection only

**Step 4: Subcategory Selection**
- Radio list based on selected major category
- Dynamically loaded from categoryTemplates.ts
- Green radio button when selected

**Step 5: Capabilities Multi-Select**
- Chip-style buttons for each capability
- Pre-selected recommended capabilities
- Green background when selected
- Allow multiple selections

**Step 6: Location & Timings**
- Google Maps Link input (textarea)
- Smart resolver extracts lat/lng from link
- Time sliders for opening/closing hours
- WhatsApp number (optional, defaults to phone)

**Step 7: Generate Merchant ID**
- Backend generates unique SHOP#### ID
- Display prominently with "Save this ID" message
- Input: 6-digit passcode (numeric only)
- Input: Confirm passcode (must match)
- Button: "Launch My Shop"

**Step 8: Success Preview**
- Success animation (checkmark)
- Display Merchant ID again (large, bold)
- Show login credentials:
  - Merchant ID: SHOP7234
  - Email: merchant@email.com
  - Passcode: ••••••
- Reminder: "Save your credentials"
- Button: "Go to Dashboard" (auto-redirect after 5s)

### 1.3 API Integration

```typescript
// Final submit to backend
const submitOnboarding = async (state: OnboardingState) => {
  const response = await fetch(`${API_BASE_URL}/merchants/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: state.phone,
      email: state.email,
      passcode: state.passcode,
      shopName: state.shopName,
      ownerName: state.ownerName,
      majorCategory: state.majorCategory,
      subCategory: state.subCategory,
      capabilities: state.capabilities,
      location: state.location,
      timing: state.timing,
      whatsapp: state.whatsapp || state.phone
    })
  })
  
  const data = await response.json()
  // data = { success, merchantId, token, merchant }
  
  // Store token and merchant data
  localStorage.setItem('auth-token', data.token)
  localStorage.setItem('merchant-data', JSON.stringify(data.merchant))
  
  // Update auth store
  setAuth(data.merchant, ['merchant'], data.token)
  
  // Navigate to dashboard
  navigate('/')
}
```

---

## 2. Merchant Dashboard Design

### 2.1 Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Header: Shop Name | ● Open | Logout                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Store Status Card                               │   │
│  │  [Open/Close Toggle]  Today: 9 AM - 9 PM        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Incoming Requests (3)                           │   │
│  │  ┌───────────────────────────────────────────┐  │   │
│  │  │ "iPhone 15 under 80k"                     │  │   │
│  │  │ 2.3 km away • 5 min ago • 95% match       │  │   │
│  │  │ [No Stock] [Schedule] [I Have It]         │  │   │
│  │  └───────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Reservation Shelf (2)                           │   │
│  │  ┌───────────────────────────────────────────┐  │   │
│  │  │ Order #1234 • ₹150 token                  │  │   │
│  │  │ Expires in 1h 23m                         │  │   │
│  │  │ [Picked Up] [Mark Expired]                │  │   │
│  │  └───────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Broadcast Offers                                │   │
│  │  [+ Create New Offer]                            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```typescript
// Dashboard data fetching
useEffect(() => {
  const fetchDashboardData = async () => {
    const token = localStorage.getItem('auth-token')
    
    // Fetch broadcasts
    const broadcasts = await fetch(`${API_BASE_URL}/merchant/broadcasts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json())
    
    // Fetch orders
    const orders = await fetch(`${API_BASE_URL}/merchant/orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json())
    
    // Fetch profile (for status)
    const profile = await fetch(`${API_BASE_URL}/merchants/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json())
    
    setDashboardData({ broadcasts, orders, profile })
  }
  
  fetchDashboardData()
  
  // Poll every 30 seconds
  const interval = setInterval(fetchDashboardData, 30000)
  return () => clearInterval(interval)
}, [])
```

### 2.3 Response Handling

```typescript
// Handle merchant response to broadcast
const handleResponse = async (
  broadcastId: string, 
  responseType: 'YES' | 'ALTERNATIVE' | 'NO',
  price?: number,
  note?: string
) => {
  const token = localStorage.getItem('auth-token')
  
  await fetch(`${API_BASE_URL}/broadcasts/${broadcastId}/respond`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ responseType, price, note })
  })
  
  // Update UI optimistically
  setBroadcasts(prev => prev.map(b => 
    b.id === broadcastId 
      ? { ...b, responded: true, responseType, price, note }
      : b
  ))
}
```

---

## 3. Customer App Integration

### 3.1 Search Flow

```typescript
// Customer search component
const handleSearch = async (query: string) => {
  const location = await getCurrentLocation()
  
  const response = await fetch(`${API_BASE_URL}/broadcasts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${customerToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query,
      location: { lat: location.lat, lng: location.lng },
      targetPrice: priceRange,
      radius: 5000 // 5km
    })
  })
  
  const broadcast = await response.json()
  // broadcast = { id, query, category, matchedMerchants[], status }
  
  // Navigate to broadcast detail page
  navigate(`/requests/${broadcast.id}`)
}
```

### 3.2 AI Category Detection

Backend flow (already implemented in `detectCategory.ts`):
1. Receive query text
2. Load `merchant_capabilities_schema.json` from S3
3. Use Bedrock AI to classify query
4. Return: majorCategory, subCategory, capabilityId, confidence
5. Match merchants with those capabilities
6. Create broadcast entries in DynamoDB

### 3.3 Reservation Flow

```typescript
// Determine payment mode based on price
const getPaymentMode = (price: number): PaymentMode => {
  if (price < 200) return 'TOKEN'
  if (price <= 500) return 'ADVANCE'
  return 'FULL'
}

// Create reservation
const createReservation = async (
  merchantId: string,
  productId: string,
  price: number
) => {
  const paymentMode = getPaymentMode(price)
  const amount = paymentMode === 'TOKEN' ? 50 
    : paymentMode === 'ADVANCE' ? price * 0.5 
    : price
  
  await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${customerToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      merchantId,
      productId,
      quantity: 1,
      paymentMode,
      amount,
      holdWindow: 2 * 60 * 60 * 1000 // 2 hours in ms
    })
  })
}
```

---

## 4. Admin App Architecture

### 4.1 Project Structure

```
admin-app/
├── src/
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Merchants.tsx
│   │   ├── MerchantDetail.tsx
│   │   ├── Broadcasts.tsx
│   │   ├── Categories.tsx
│   │   ├── Offers.tsx
│   │   └── Analytics.tsx
│   ├── components/
│   │   ├── KPICard.tsx
│   │   ├── DataTable.tsx
│   │   ├── CategoryEditor.tsx
│   │   └── Chart.tsx
│   ├── utils/
│   │   ├── auth.ts
│   │   └── api.ts
│   ├── store/
│   │   └── authStore.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

### 4.2 Dashboard KPIs

```typescript
interface DashboardKPIs {
  totalUsers: number
  totalMerchants: number
  broadcastsToday: number
  activeOffers: number
  avgResponseTime: number
  matchRate: number
}

// Fetch KPIs
const fetchKPIs = async (): Promise<DashboardKPIs> => {
  const [users, merchants, broadcasts, offers] = await Promise.all([
    fetch(`${API_BASE_URL}/admin/users/count`),
    fetch(`${API_BASE_URL}/admin/merchants/count`),
    fetch(`${API_BASE_URL}/admin/broadcasts/today`),
    fetch(`${API_BASE_URL}/admin/offers/active`)
  ])
  
  return {
    totalUsers: await users.json(),
    totalMerchants: await merchants.json(),
    broadcastsToday: await broadcasts.json(),
    activeOffers: await offers.json(),
    avgResponseTime: 0, // Calculate from broadcasts
    matchRate: 0 // Calculate from broadcasts
  }
}
```

### 4.3 Categories Editor

```typescript
interface Category {
  id: string
  name: string
  icon: string
  subcategories: Subcategory[]
}

interface Subcategory {
  id: string
  name: string
  capabilities: Capability[]
}

interface Capability {
  id: string
  name: string
  exampleQueries: string[]
  keywords: string[]
}

// Three-column layout
const CategoriesEditor = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null)
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Column 1: Major Categories */}
      <div>
        {categories.map(cat => (
          <CategoryCard 
            key={cat.id}
            category={cat}
            selected={selectedCategory?.id === cat.id}
            onClick={() => setSelectedCategory(cat)}
          />
        ))}
      </div>
      
      {/* Column 2: Subcategories */}
      <div>
        {selectedCategory?.subcategories.map(sub => (
          <SubcategoryCard
            key={sub.id}
            subcategory={sub}
            selected={selectedSubcategory?.id === sub.id}
            onClick={() => setSelectedSubcategory(sub)}
          />
        ))}
      </div>
      
      {/* Column 3: Capabilities */}
      <div>
        {selectedSubcategory?.capabilities.map(cap => (
          <CapabilityCard
            key={cap.id}
            capability={cap}
            onEdit={() => openEditModal(cap)}
            onDelete={() => deleteCapability(cap.id)}
          />
        ))}
        <button onClick={openAddModal}>+ Add Capability</button>
      </div>
    </div>
  )
}
```

---

## 5. Authentication Design

### 5.1 JWT Token Structure

```typescript
interface JWTPayload {
  merchantId?: string  // For merchants
  userId?: string      // For customers
  adminId?: string     // For admins
  email: string
  role: 'customer' | 'merchant' | 'admin'
  phone?: string
  exp: number          // Expiry timestamp
  iat: number          // Issued at timestamp
}
```

### 5.2 Auth Utility (Shared)

```typescript
// utils/auth.ts
export const getToken = (): string | null => {
  return localStorage.getItem('auth-token')
}

export const setToken = (token: string): void => {
  localStorage.setItem('auth-token', token)
}

export const clearToken = (): void => {
  localStorage.removeItem('auth-token')
  localStorage.removeItem('merchant-data')
  localStorage.removeItem('user-data')
}

export const isAuthenticated = (): boolean => {
  const token = getToken()
  if (!token) return false
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export const getRole = (): string | null => {
  const token = getToken()
  if (!token) return null
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role
  } catch {
    return null
  }
}
```

### 5.3 Protected Route Component

```typescript
// components/ProtectedRoute.tsx
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate()
  
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login')
    }
  }, [navigate])
  
  if (!isAuthenticated()) {
    return null
  }
  
  return <>{children}</>
}
```

---

## 6. Database Schema Alignment

### 6.1 DynamoDB Tables

**nearby-backend-prod-users**
- PK: userId (UUID)
- GSI: phone-index (phone)
- GSI: email-index (email)
- Attributes: name, role, createdAt, updatedAt

**nearby-backend-prod-merchants**
- PK: merchantId (SHOP####)
- GSI: phone-index (phone)
- GSI: email-index (email)
- GSI: geohash-index (geohash)
- Attributes: shopName, ownerName, majorCategory, subCategory, capabilities[], location, timing, isOpen, isVerified

**nearby-backend-prod-broadcasts**
- PK: broadcastId (UUID)
- GSI: status-createdAt-index
- GSI: geohash-index
- GSI: userId-createdAt-index
- Attributes: query, category, matchedMerchants[], status, createdAt, expiresAt

**nearby-backend-prod-orders**
- PK: orderId (UUID)
- GSI: userId-createdAt-index
- GSI: merchantId-createdAt-index
- Attributes: merchantId, userId, productId, amount, paymentMode, status, holdWindow, createdAt

**nearby-backend-prod-categories**
- PK: categoryId (UUID)
- Attributes: name, icon, subcategories[], capabilities[]

### 6.2 New Tables (from my implementation)

**nearby-users**
- PK: phone (String)
- GSI: email-index
- Attributes: email, role, name, merchantId, shopName, createdAt, updatedAt

**nearby-merchants**
- PK: merchantId (String)
- GSI: phone-index
- GSI: email-index
- Attributes: phone, email, passcode (hashed), shopName, ownerName, majorCategory, subCategory, capabilities[], location, timing, whatsapp, isOpen, isVerified

**nearby-products**
- PK: productId (String)
- GSI: merchantId-index
- Attributes: merchantId, name, description, price, stock, category, imageUrl, isAvailable

**Decision**: Use both sets of tables during transition, then consolidate post-hackathon.

---

## 7. API Endpoints Summary

### Auth Endpoints
- `GET /check-phone/{phone}` - Check if phone exists
- `POST /merchants/signup` - Merchant signup
- `POST /merchants/login` - Merchant login
- `POST /customers/login` - Customer login
- `POST /admin/login` - Admin login

### Merchant Endpoints
- `GET /merchants/profile` - Get merchant profile
- `PUT /merchants/profile` - Update merchant profile
- `PATCH /merchants/toggle-status` - Toggle shop open/closed
- `GET /merchant/broadcasts` - Get broadcasts for merchant
- `POST /broadcasts/{id}/respond` - Respond to broadcast
- `GET /merchant/orders` - Get merchant orders
- `POST /orders/{id}/picked-up` - Mark order as picked up
- `POST /orders/{id}/expired` - Mark order as expired
- `GET /merchant/offers` - Get merchant offers
- `POST /merchant/offers` - Create new offer

### Customer Endpoints
- `POST /broadcasts` - Create new broadcast (search)
- `GET /requests/{id}` - Get broadcast status
- `POST /orders` - Create reservation/order
- `GET /orders` - Get customer orders

### Admin Endpoints
- `GET /admin/merchants` - List all merchants
- `GET /admin/merchants/{id}` - Get merchant details
- `POST /admin/merchants/{id}/status` - Approve/suspend merchant
- `GET /admin/broadcasts` - List all broadcasts
- `GET /admin/categories` - Get categories
- `POST /admin/categories` - Add category
- `PUT /admin/categories/{id}` - Update category
- `DELETE /admin/categories/{id}` - Delete category
- `GET /admin/offers` - List all offers
- `GET /admin/analytics` - Get analytics data

---

## 8. Deployment Strategy

### Phase 1: Backend Deployment
1. Deploy updated Lambda functions with new auth handlers
2. Create new DynamoDB tables (nearby-users, nearby-merchants, nearby-products)
3. Test all endpoints with Postman/curl
4. Verify JWT authentication works

### Phase 2: Merchant App Deployment
1. Build merchant-app with `npm run build`
2. Upload to S3 bucket (e.g., `nearby-merchant-app`)
3. Configure CloudFront distribution
4. Update DNS (if custom domain)
5. Test onboarding flow end-to-end

### Phase 3: Admin App Creation & Deployment
1. Create admin-app project
2. Implement dashboard and management pages
3. Build and deploy to S3 + CloudFront
4. Test admin workflows

### Phase 4: Customer App Updates
1. Update customer-app to use new broadcast endpoints
2. Test search → broadcast → response flow
3. Redeploy to existing CloudFront distribution

---

## 9. Testing Strategy

### Unit Tests
- Auth utility functions
- Form validation logic
- API client functions

### Integration Tests
- Merchant onboarding flow
- Login/logout flow
- Broadcast creation and response
- Order creation and management

### End-to-End Tests
- Complete merchant journey (signup → login → respond to broadcast)
- Complete customer journey (search → reserve → pickup)
- Admin monitoring and management

### Manual Testing Checklist
- [ ] Merchant can complete onboarding
- [ ] Merchant can login
- [ ] Merchant sees broadcasts
- [ ] Merchant can respond to broadcasts
- [ ] Customer can search
- [ ] Customer sees merchant responses
- [ ] Customer can reserve items
- [ ] Admin can view all data
- [ ] Admin can manage merchants
- [ ] Admin can edit categories

---

## 10. Performance Considerations

### Frontend Optimization
- Code splitting with React.lazy()
- Image optimization (WebP format)
- Lazy loading for lists
- Debounce search inputs
- Cache API responses

### Backend Optimization
- DynamoDB query optimization (use GSIs)
- Lambda cold start mitigation (provisioned concurrency)
- API Gateway caching
- S3 CloudFront caching for static assets

### Real-time Updates
- Polling interval: 30 seconds for dashboard
- WebSocket for instant notifications (stretch goal)
- Optimistic UI updates for better UX

---

## Success Metrics

### Technical Metrics
- Page load time < 2 seconds
- API response time < 500ms (p95)
- Zero critical bugs during demo
- 99% uptime during demo period

### User Experience Metrics
- Onboarding completion rate > 90%
- Merchant response time < 5 minutes
- Customer satisfaction with matches > 80%
- Admin can perform all tasks without errors

---

## Rollback Plan

If critical issues arise during demo:
1. Revert to previous CloudFront distribution
2. Use mock data in frontend
3. Disable problematic features
4. Have backup demo video ready

---

## Post-Hackathon Improvements

1. Implement real-time WebSocket connections
2. Add WhatsApp/SMS notifications
3. Integrate payment gateway
4. Add advanced analytics and ML insights
5. Implement merchant verification process
6. Add customer reviews and ratings
7. Mobile apps (React Native)
8. Multi-language support
