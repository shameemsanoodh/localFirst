# Hackathon Demo Stabilization - Tasks

## Phase 1: Merchant App - Onboarding & Auth (HIGHEST PRIORITY)

### 1.1 Rebuild MerchantOnboarding Component
- [x] 1.1.1 Create new MerchantOnboarding.tsx file
  - [x] 1.1.1.1 Set up component structure with state management
  - [x] 1.1.1.2 Implement step navigation (currentStep state)
  - [x] 1.1.1.3 Add progress indicator component
- [ ] 1.1.2 Implement Step 2: Shop Details
  - [ ] 1.1.2.1 Shop name input with validation
  - [ ] 1.1.2.2 Owner name input with validation
  - [ ] 1.1.2.3 Email input with validation
  - [ ] 1.1.2.4 "Next" button (disabled until valid)
- [ ] 1.1.3 Implement Step 3: Major Category Selection
  - [ ] 1.1.3.1 Load categories from categoryTemplates.ts
  - [ ] 1.1.3.2 Render category grid with icons
  - [ ] 1.1.3.3 Handle category selection
  - [ ] 1.1.3.4 Green border for selected category
- [ ] 1.1.4 Implement Step 4: Subcategory Selection
  - [ ] 1.1.4.1 Load subcategories based on major category
  - [ ] 1.1.4.2 Render radio list
  - [ ] 1.1.4.3 Handle subcategory selection
- [ ] 1.1.5 Implement Step 5: Capabilities Multi-Select
  - [ ] 1.1.5.1 Load capabilities from categoryTemplates.ts
  - [ ] 1.1.5.2 Pre-select recommended capabilities
  - [ ] 1.1.5.3 Render chip-style buttons
  - [ ] 1.1.5.4 Handle multi-select toggle
- [ ] 1.1.6 Implement Step 6: Location & Timings
  - [ ] 1.1.6.1 Google Maps link input
  - [ ] 1.1.6.2 Smart resolver to extract lat/lng
  - [ ] 1.1.6.3 Time sliders for opening/closing hours
  - [ ] 1.1.6.4 WhatsApp number input (optional)
- [ ] 1.1.7 Implement Step 7: Passcode Setup
  - [ ] 1.1.7.1 6-digit passcode input (numeric only)
  - [ ] 1.1.7.2 Confirm passcode input
  - [ ] 1.1.7.3 Validation (must match)
  - [ ] 1.1.7.4 "Launch My Shop" button
- [ ] 1.1.8 Implement Step 8: Success Preview
  - [ ] 1.1.8.1 Success animation (checkmark)
  - [ ] 1.1.8.2 Display Merchant ID prominently
  - [ ] 1.1.8.3 Show login credentials summary
  - [ ] 1.1.8.4 "Go to Dashboard" button
  - [ ] 1.1.8.5 Auto-redirect after 5 seconds
- [ ] 1.1.9 Add styling and animations
  - [ ] 1.1.9.1 Centered layout (max-w-sm)
  - [ ] 1.1.9.2 Green (#22C55E) color scheme
  - [ ] 1.1.9.3 Framer-motion transitions
  - [ ] 1.1.9.4 Responsive design

### 1.2 Wire Onboarding to Backend
- [ ] 1.2.1 Create API client utility
  - [ ] 1.2.1.1 Set up Axios instance with base URL
  - [ ] 1.2.1.2 Add request interceptor for auth token
  - [ ] 1.2.1.3 Add response interceptor for error handling
- [ ] 1.2.2 Implement signup API call
  - [ ] 1.2.2.1 Create submitOnboarding function
  - [ ] 1.2.2.2 Call POST /merchants/signup with all data
  - [ ] 1.2.2.3 Handle success response (merchantId, token)
  - [ ] 1.2.2.4 Store token in localStorage
  - [ ] 1.2.2.5 Update auth store
  - [ ] 1.2.2.6 Navigate to dashboard
- [ ] 1.2.3 Add error handling
  - [ ] 1.2.3.1 Display validation errors
  - [ ] 1.2.3.2 Handle network errors
  - [ ] 1.2.3.3 Show user-friendly error messages
- [ ] 1.2.4 Test end-to-end flow
  - [ ] 1.2.4.1 Test with valid data
  - [ ] 1.2.4.2 Test with invalid data
  - [ ] 1.2.4.3 Test network failure scenarios

### 1.3 Fix Merchant Login
- [ ] 1.3.1 Update Login.tsx
  - [ ] 1.3.1.1 Verify identifier input (Merchant ID or Email)
  - [ ] 1.3.1.2 Verify 6-digit passcode input
  - [ ] 1.3.1.3 Update API call to POST /merchants/login
  - [ ] 1.3.1.4 Handle success (store token, navigate)
  - [ ] 1.3.1.5 Handle errors (invalid credentials)
- [ ] 1.3.2 Update App.tsx routes
  - [ ] 1.3.2.1 Uncomment /onboarding route
  - [ ] 1.3.2.2 Add route protection
  - [ ] 1.3.2.3 Test navigation flow
- [ ] 1.3.3 Test login flow
  - [ ] 1.3.3.1 Test with Merchant ID
  - [ ] 1.3.3.2 Test with Email
  - [ ] 1.3.3.3 Test with invalid credentials

---

## Phase 2: Merchant App - Dashboard Features

### 2.1 Implement Broadcasts/Requests Section
- [ ] 2.1.1 Create BroadcastCard component
  - [ ] 2.1.1.1 Display query text
  - [ ] 2.1.1.2 Display distance, time, confidence
  - [ ] 2.1.1.3 Display match reason
  - [ ] 2.1.1.4 Add response buttons
- [ ] 2.1.2 Fetch broadcasts on dashboard load
  - [ ] 2.1.2.1 Call GET /merchant/broadcasts
  - [ ] 2.1.2.2 Store in state
  - [ ] 2.1.2.3 Handle loading state
  - [ ] 2.1.2.4 Handle empty state
- [ ] 2.1.3 Implement response handlers
  - [ ] 2.1.3.1 "No Stock" button → POST with responseType: "NO"
  - [ ] 2.1.3.2 "Schedule" button → POST with responseType: "ALTERNATIVE"
  - [ ] 2.1.3.3 "I Have It" button → open price modal
  - [ ] 2.1.3.4 Price modal → POST with responseType: "YES" + price
- [ ] 2.1.4 Update UI after response
  - [ ] 2.1.4.1 Show "You responded: ..." message
  - [ ] 2.1.4.2 Disable response buttons
  - [ ] 2.1.4.3 Update broadcast status
- [ ] 2.1.5 Add polling for real-time updates
  - [ ] 2.1.5.1 Poll every 30 seconds
  - [ ] 2.1.5.2 Update broadcasts list
  - [ ] 2.1.5.3 Show notification for new broadcasts

### 2.2 Implement Reservation Shelf
- [ ] 2.2.1 Create OrderCard component
  - [ ] 2.2.1.1 Display order details
  - [ ] 2.2.1.2 Display token/advance amount
  - [ ] 2.2.1.3 Display expiry countdown
  - [ ] 2.2.1.4 Add action buttons
- [ ] 2.2.2 Fetch orders on dashboard load
  - [ ] 2.2.2.1 Call GET /merchant/orders
  - [ ] 2.2.2.2 Store in state
  - [ ] 2.2.2.3 Handle loading state
  - [ ] 2.2.2.4 Handle empty state
- [ ] 2.2.3 Implement order actions
  - [ ] 2.2.3.1 "Picked Up" → POST /orders/{id}/picked-up
  - [ ] 2.2.3.2 "Mark Expired" → POST /orders/{id}/expired
  - [ ] 2.2.3.3 Update UI after action
- [ ] 2.2.4 Add expiry countdown timer
  - [ ] 2.2.4.1 Calculate time remaining
  - [ ] 2.2.4.2 Update every second
  - [ ] 2.2.4.3 Show warning when < 30 min

### 2.3 Implement Broadcast Offers
- [ ] 2.3.1 Create OfferCard component
  - [ ] 2.3.1.1 Display offer details
  - [ ] 2.3.1.2 Display valid until date
  - [ ] 2.3.1.3 Add enable/disable toggle
- [ ] 2.3.2 Fetch offers on dashboard load
  - [ ] 2.3.2.1 Call GET /merchant/offers
  - [ ] 2.3.2.2 Store in state
- [ ] 2.3.3 Implement "Create Offer" modal
  - [ ] 2.3.3.1 Title input
  - [ ] 2.3.3.2 Description textarea
  - [ ] 2.3.3.3 Price input
  - [ ] 2.3.3.4 Valid until date picker
  - [ ] 2.3.3.5 Submit → POST /merchant/offers
- [ ] 2.3.4 Implement offer toggle
  - [ ] 2.3.4.1 Enable/disable switch
  - [ ] 2.3.4.2 Update offer status

### 2.4 Implement Store Status Toggle
- [ ] 2.4.1 Add status indicator to header
  - [ ] 2.4.1.1 Show ● Open or ● Closed
  - [ ] 2.4.1.2 Show today's timings
- [ ] 2.4.2 Create large toggle button
  - [ ] 2.4.2.1 Open/Close switch
  - [ ] 2.4.2.2 Call PATCH /merchants/toggle-status
  - [ ] 2.4.2.3 Update UI immediately
- [ ] 2.4.3 Implement timings editor
  - [ ] 2.4.3.1 "Edit Hours" button
  - [ ] 2.4.3.2 Modal with time sliders
  - [ ] 2.4.3.3 Submit → PUT /merchants/profile
  - [ ] 2.4.3.4 Update header display

---

## Phase 3: Customer App - Validation

### 3.1 Verify Search → AI → Broadcast Flow
- [ ] 3.1.1 Review search component
  - [ ] 3.1.1.1 Verify API endpoint (POST /broadcasts)
  - [ ] 3.1.1.2 Verify request payload
  - [ ] 3.1.1.3 Verify response handling
- [ ] 3.1.2 Test AI category detection
  - [ ] 3.1.2.1 Test with various queries
  - [ ] 3.1.2.2 Verify category classification
  - [ ] 3.1.2.3 Verify merchant matching
- [ ] 3.1.3 Update broadcast detail page
  - [ ] 3.1.3.1 Show broadcast status
  - [ ] 3.1.3.2 Show matched merchants count
  - [ ] 3.1.3.3 Show merchant responses
  - [ ] 3.1.3.4 Add polling for updates

### 3.2 Test Reservation Flow
- [ ] 3.2.1 Test token-based reservation (< ₹200)
  - [ ] 3.2.1.1 Create test order
  - [ ] 3.2.1.2 Verify ₹50 token amount
  - [ ] 3.2.1.3 Verify 2-hour hold window
- [ ] 3.2.2 Test advance payment (₹200-500)
  - [ ] 3.2.2.1 Create test order
  - [ ] 3.2.2.2 Verify 50% advance amount
  - [ ] 3.2.2.3 Verify hold window
- [ ] 3.2.3 Test full payment (> ₹500)
  - [ ] 3.2.3.1 Create test order
  - [ ] 3.2.3.2 Verify full amount
  - [ ] 3.2.3.3 Verify hold window
- [ ] 3.2.4 Verify order appears in merchant shelf
  - [ ] 3.2.4.1 Check merchant dashboard
  - [ ] 3.2.4.2 Verify order details match

---

## Phase 4: Admin App - Creation

### 4.1 Project Setup
- [ ] 4.1.1 Create admin-app directory
  - [ ] 4.1.1.1 Run `npm create vite@latest admin-app -- --template react-ts`
  - [ ] 4.1.1.2 Install dependencies (react-router-dom, tailwindcss, etc.)
  - [ ] 4.1.1.3 Configure Tailwind
  - [ ] 4.1.1.4 Set up project structure
- [ ] 4.1.2 Create basic layout
  - [ ] 4.1.2.1 Create Sidebar component
  - [ ] 4.1.2.2 Create Header component
  - [ ] 4.1.2.3 Create Layout wrapper
- [ ] 4.1.3 Set up routing
  - [ ] 4.1.3.1 Configure React Router
  - [ ] 4.1.3.2 Create route definitions
  - [ ] 4.1.3.3 Add protected routes
- [ ] 4.1.4 Create login page
  - [ ] 4.1.4.1 Email/password form
  - [ ] 4.1.4.2 Call POST /admin/login
  - [ ] 4.1.4.3 Store admin token
  - [ ] 4.1.4.4 Redirect to dashboard

### 4.2 Dashboard Page
- [ ] 4.2.1 Create KPICard component
  - [ ] 4.2.1.1 Display metric value
  - [ ] 4.2.1.2 Display metric label
  - [ ] 4.2.1.3 Display trend indicator
- [ ] 4.2.2 Fetch and display KPIs
  - [ ] 4.2.2.1 Total users
  - [ ] 4.2.2.2 Total merchants
  - [ ] 4.2.2.3 Broadcasts today
  - [ ] 4.2.2.4 Active offers
- [ ] 4.2.3 Create "Recent Broadcasts" table
  - [ ] 4.2.3.1 Fetch data from API
  - [ ] 4.2.3.2 Display in DataTable component
  - [ ] 4.2.3.3 Add status badges
- [ ] 4.2.4 Create "Latest Signups" table
  - [ ] 4.2.4.1 Fetch data from API
  - [ ] 4.2.4.2 Display in DataTable component
- [ ] 4.2.5 Add charts
  - [ ] 4.2.5.1 Broadcasts per day (line chart)
  - [ ] 4.2.5.2 Signups per day (bar chart)

### 4.3 Merchants Management Page
- [ ] 4.3.1 Create merchants table
  - [ ] 4.3.1.1 Fetch GET /admin/merchants
  - [ ] 4.3.1.2 Display in DataTable
  - [ ] 4.3.1.3 Add search/filter
  - [ ] 4.3.1.4 Add pagination
- [ ] 4.3.2 Create merchant detail page
  - [ ] 4.3.2.1 Fetch merchant profile
  - [ ] 4.3.2.2 Display full details
  - [ ] 4.3.2.3 Show capabilities list
  - [ ] 4.3.2.4 Show recent broadcasts
  - [ ] 4.3.2.5 Show orders fulfilled
- [ ] 4.3.3 Implement merchant actions
  - [ ] 4.3.3.1 "Approve" button
  - [ ] 4.3.3.2 "Suspend" button
  - [ ] 4.3.3.3 Confirmation modal
  - [ ] 4.3.3.4 Update status via API

### 4.4 Categories Editor Page
- [ ] 4.4.1 Create three-column layout
  - [ ] 4.4.1.1 Major categories column
  - [ ] 4.4.1.2 Subcategories column
  - [ ] 4.4.1.3 Capabilities column
- [ ] 4.4.2 Fetch categories data
  - [ ] 4.4.2.1 Load from DynamoDB
  - [ ] 4.4.2.2 Load from S3 JSON
  - [ ] 4.4.2.3 Merge data sources
- [ ] 4.4.3 Implement capability CRUD
  - [ ] 4.4.3.1 Add capability modal
  - [ ] 4.4.3.2 Edit capability modal
  - [ ] 4.4.3.3 Delete capability (with confirmation)
  - [ ] 4.4.3.4 API calls for each operation
- [ ] 4.4.4 Implement export/sync
  - [ ] 4.4.4.1 "Export JSON" button
  - [ ] 4.4.4.2 Download updated schema
  - [ ] 4.4.4.3 "Sync to Backend" button
  - [ ] 4.4.4.4 Upload to S3

### 4.5 Analytics Page
- [ ] 4.5.1 Create "Most Searched Products" chart
  - [ ] 4.5.1.1 Fetch from analytics table
  - [ ] 4.5.1.2 Display as bar chart
- [ ] 4.5.2 Create "Searches with No Supply" list
  - [ ] 4.5.2.1 Fetch unmatched broadcasts
  - [ ] 4.5.2.2 Display in table
  - [ ] 4.5.2.3 Show demand count
- [ ] 4.5.3 Create "Top Merchants" table
  - [ ] 4.5.3.1 Calculate response rate
  - [ ] 4.5.3.2 Sort by performance
  - [ ] 4.5.3.3 Display in table
- [ ] 4.5.4 Create "Category Distribution" chart
  - [ ] 4.5.4.1 Aggregate by category
  - [ ] 4.5.4.2 Display as pie chart

---

## Phase 5: Backend Updates

### 5.1 Deploy New Auth Handlers
- [ ] 5.1.1 Build backend
  - [ ] 5.1.1.1 Run `npm run build`
  - [ ] 5.1.1.2 Verify no TypeScript errors
- [ ] 5.1.2 Deploy to AWS
  - [ ] 5.1.2.1 Run `serverless deploy --stage prod`
  - [ ] 5.1.2.2 Verify deployment success
  - [ ] 5.1.2.3 Note new API endpoints
- [ ] 5.1.3 Test endpoints
  - [ ] 5.1.3.1 Test GET /check-phone/{phone}
  - [ ] 5.1.3.2 Test POST /merchants/signup
  - [ ] 5.1.3.3 Test POST /merchants/login
  - [ ] 5.1.3.4 Test GET /merchants/profile
  - [ ] 5.1.3.5 Test PATCH /merchants/toggle-status

### 5.2 Verify DynamoDB Tables
- [ ] 5.2.1 Check table creation
  - [ ] 5.2.1.1 Verify nearby-users table exists
  - [ ] 5.2.1.2 Verify nearby-merchants table exists
  - [ ] 5.2.1.3 Verify nearby-products table exists
- [ ] 5.2.2 Verify GSIs
  - [ ] 5.2.2.1 Check phone-index on users
  - [ ] 5.2.2.2 Check email-index on users
  - [ ] 5.2.2.3 Check phone-index on merchants
  - [ ] 5.2.2.4 Check email-index on merchants
  - [ ] 5.2.2.5 Check merchantId-index on products

---

## Phase 6: Deployment

### 6.1 Deploy Merchant App
- [ ] 6.1.1 Build merchant-app
  - [ ] 6.1.1.1 Update .env with production API URL
  - [ ] 6.1.1.2 Run `npm run build`
  - [ ] 6.1.1.3 Verify build output
- [ ] 6.1.2 Create S3 bucket
  - [ ] 6.1.2.1 Create bucket (e.g., nearby-merchant-app)
  - [ ] 6.1.2.2 Enable static website hosting
  - [ ] 6.1.2.3 Configure bucket policy
- [ ] 6.1.3 Upload to S3
  - [ ] 6.1.3.1 Sync dist/ folder to S3
  - [ ] 6.1.3.2 Verify files uploaded
- [ ] 6.1.4 Configure CloudFront
  - [ ] 6.1.4.1 Create distribution
  - [ ] 6.1.4.2 Set S3 as origin
  - [ ] 6.1.4.3 Configure error pages
  - [ ] 6.1.4.4 Wait for deployment
- [ ] 6.1.5 Test deployed app
  - [ ] 6.1.5.1 Access CloudFront URL
  - [ ] 6.1.5.2 Test onboarding flow
  - [ ] 6.1.5.3 Test login flow
  - [ ] 6.1.5.4 Test dashboard

### 6.2 Deploy Admin App
- [ ] 6.2.1 Build admin-app
  - [ ] 6.2.1.1 Update .env with production API URL
  - [ ] 6.2.1.2 Run `npm run build`
  - [ ] 6.2.1.3 Verify build output
- [ ] 6.2.2 Create S3 bucket
  - [ ] 6.2.2.1 Create bucket (e.g., nearby-admin-app)
  - [ ] 6.2.2.2 Enable static website hosting
  - [ ] 6.2.2.3 Configure bucket policy
- [ ] 6.2.3 Upload to S3
  - [ ] 6.2.3.1 Sync dist/ folder to S3
  - [ ] 6.2.3.2 Verify files uploaded
- [ ] 6.2.4 Configure CloudFront
  - [ ] 6.2.4.1 Create distribution
  - [ ] 6.2.4.2 Set S3 as origin
  - [ ] 6.2.4.3 Configure error pages
  - [ ] 6.2.4.4 Wait for deployment
- [ ] 6.2.5 Test deployed app
  - [ ] 6.2.5.1 Access CloudFront URL
  - [ ] 6.2.5.2 Test login
  - [ ] 6.2.5.3 Test all pages

### 6.3 Update Customer App
- [ ] 6.3.1 Update API endpoints
  - [ ] 6.3.1.1 Verify broadcast endpoint
  - [ ] 6.3.1.2 Verify order endpoint
- [ ] 6.3.2 Build and deploy
  - [ ] 6.3.2.1 Run `npm run build`
  - [ ] 6.3.2.2 Upload to existing S3 bucket
  - [ ] 6.3.2.3 Invalidate CloudFront cache
- [ ] 6.3.3 Test deployed app
  - [ ] 6.3.3.1 Test search flow
  - [ ] 6.3.3.2 Test reservation flow

---

## Phase 7: End-to-End Testing

### 7.1 Merchant Onboarding Test
- [ ] 7.1.1 Complete onboarding as new merchant
- [ ] 7.1.2 Verify Merchant ID generated (SHOP####)
- [ ] 7.1.3 Verify can login with ID + passcode
- [ ] 7.1.4 Verify dashboard shows correct data
- [ ] 7.1.5 Verify category/capabilities saved correctly

### 7.2 Customer Search & Broadcast Test
- [ ] 7.2.1 Search for product as customer
- [ ] 7.2.2 Verify broadcast created
- [ ] 7.2.3 Verify AI classification correct
- [ ] 7.2.4 Verify merchant receives broadcast
- [ ] 7.2.5 Verify match reason displayed

### 7.3 Merchant Response Test
- [ ] 7.3.1 Merchant sees request in dashboard
- [ ] 7.3.2 Merchant clicks "I Have It"
- [ ] 7.3.3 Merchant enters price
- [ ] 7.3.4 Verify response saved
- [ ] 7.3.5 Verify customer sees offer

### 7.4 Reservation Test
- [ ] 7.4.1 Customer reserves item (₹300)
- [ ] 7.4.2 Verify 50% advance (₹150)
- [ ] 7.4.3 Verify order in merchant shelf
- [ ] 7.4.4 Merchant marks as "Picked Up"
- [ ] 7.4.5 Verify order status updated

### 7.5 Admin Visibility Test
- [ ] 7.5.1 Admin logs in
- [ ] 7.5.2 Verify new merchant in table
- [ ] 7.5.3 Verify broadcast in table
- [ ] 7.5.4 Verify order in analytics
- [ ] 7.5.5 Test merchant approval/suspension

---

## Phase 8: Polish & Bug Fixes

### 8.1 UI/UX Polish
- [ ] 8.1.1 Review all pages for consistency
- [ ] 8.1.2 Fix any layout issues
- [ ] 8.1.3 Add loading states
- [ ] 8.1.4 Add empty states
- [ ] 8.1.5 Add error states
- [ ] 8.1.6 Improve animations
- [ ] 8.1.7 Test responsive design

### 8.2 Performance Optimization
- [ ] 8.2.1 Optimize images
- [ ] 8.2.2 Add code splitting
- [ ] 8.2.3 Implement lazy loading
- [ ] 8.2.4 Add API response caching
- [ ] 8.2.5 Optimize bundle size

### 8.3 Bug Fixes
- [ ] 8.3.1 Fix any console errors
- [ ] 8.3.2 Fix any TypeScript errors
- [ ] 8.3.3 Fix any broken links
- [ ] 8.3.4 Fix any API errors
- [ ] 8.3.5 Test edge cases

---

## Phase 9: Demo Preparation

### 9.1 Create Demo Data
- [ ] 9.1.1 Create 5 test merchants
- [ ] 9.1.2 Create 10 test broadcasts
- [ ] 9.1.3 Create 5 test orders
- [ ] 9.1.4 Create 3 test offers

### 9.2 Demo Script
- [ ] 9.2.1 Write demo script
- [ ] 9.2.2 Practice demo flow
- [ ] 9.2.3 Time demo (should be < 10 min)
- [ ] 9.2.4 Prepare backup demo video

### 9.3 Documentation
- [ ] 9.3.1 Update README with deployment URLs
- [ ] 9.3.2 Document API endpoints
- [ ] 9.3.3 Create user guide
- [ ] 9.3.4 Create admin guide

---

## Stretch Goals (If Time Permits)

### Notifications
- [ ] Set up FCM for WebPush
- [ ] Request notification permission
- [ ] Store FCM tokens in DB
- [ ] Trigger notifications on new broadcasts
- [ ] Test notification delivery

### Advanced Features
- [ ] Add merchant verification badge
- [ ] Add customer reviews
- [ ] Add merchant ratings
- [ ] Add search history
- [ ] Add favorites/bookmarks

---

## Success Checklist

Before demo, verify:
- [ ] All three apps are deployed and accessible
- [ ] Merchant can complete onboarding
- [ ] Merchant can login
- [ ] Customer can search and create broadcasts
- [ ] Merchant receives and responds to broadcasts
- [ ] Customer can reserve items
- [ ] Admin can view all activity
- [ ] No critical bugs or crashes
- [ ] UI is polished and professional
- [ ] Demo script is ready
