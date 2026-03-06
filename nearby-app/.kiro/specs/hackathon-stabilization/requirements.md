# Hackathon Demo Stabilization - Requirements

## Overview
Stabilize the three-app architecture (customer, merchant, admin), verify end-to-end flows, and align UI + backend + AI categories so the hackathon demo is reliable.

## Architecture
- **customer-app** – search, AI, broadcasts (port 5173, deployed to CloudFront)
- **merchant-app** – onboarding, requests, offers (port 5174, partially broken)
- **admin-app** – monitoring, categories, analytics (not created)
- **backend** – Lambda/API Gateway (live in ap-south-1)

---

## 1. Merchant App - Onboarding + Auth (HIGHEST PRIORITY)

### 1.1 Rebuild MerchantOnboarding.tsx
**Status**: Corrupted & commented out in `merchant-app/src/App.tsx` → merchant signup is blocked

**User Story**: As a new merchant, I want to complete a guided onboarding process so I can start receiving customer requests.

**Acceptance Criteria**:
- [ ] 1.1.1 Component implements 6-step wizard flow:
  - Step 1: Phone verification (auto-check DB when 10 digits entered)
  - Step 2: Shop details (owner name, shop name, email)
  - Step 3: Major category selection (from categoryTemplates.ts)
  - Step 4: Subcategory selection (based on major category)
  - Step 5: Capabilities multi-select (from categoryTemplates.ts)
  - Step 6: Shop details (location, timings, WhatsApp)
  - Step 7: Generate Merchant ID + set 6-digit passcode
  - Step 8: Success preview screen showing Merchant ID
- [ ] 1.1.2 Uses TypeScript with proper types for each step's state
- [ ] 1.1.3 Shows progress indicator (step X of 8)
- [ ] 1.1.4 Disables "Next" button until required fields are valid
- [ ] 1.1.5 Centered layout (max-w-sm) matching Login/Signup pages
- [ ] 1.1.6 Green (#22C55E) color scheme throughout
- [ ] 1.1.7 Smooth transitions between steps with framer-motion

### 1.2 Wire Onboarding to Backend
**User Story**: As a merchant completing onboarding, I want my data saved to the backend so I can login later.

**Acceptance Criteria**:
- [ ] 1.2.1 Calls `POST /merchants/signup` on final submit with:
  - phone, email, passcode
  - shopName, ownerName
  - majorCategory, subCategory, capabilities[]
  - location (lat, lng, mapLink)
  - timing (openHour, closeHour)
  - whatsapp (optional)
- [ ] 1.2.2 Receives merchantId (SHOP####) and JWT token
- [ ] 1.2.3 Stores token in localStorage and auth store
- [ ] 1.2.4 Redirects to `/` (dashboard) after success
- [ ] 1.2.5 Shows error messages for validation failures
- [ ] 1.2.6 Handles network errors gracefully

### 1.3 Fix Merchant Login
**User Story**: As a returning merchant, I want to login with my Merchant ID/Email and passcode.

**Acceptance Criteria**:
- [ ] 1.3.1 Login.tsx accepts Merchant ID OR Email + 6-digit passcode
- [ ] 1.3.2 Calls `POST /merchants/login` with identifier and passcode
- [ ] 1.3.3 Stores JWT token and merchant profile on success
- [ ] 1.3.4 Redirects to `/` (dashboard)
- [ ] 1.3.5 Shows error for invalid credentials
- [ ] 1.3.6 App.tsx routes properly configured:
  - `/login` → Login page
  - `/signup` → Signup page (phone check)
  - `/onboarding` → MerchantOnboarding (protected, requires signup-phone)
  - `/` → Dashboard (protected, requires JWT)

---

## 2. Merchant App - Core Dashboard Flows

### 2.1 Requests / Broadcasts
**User Story**: As a merchant, I want to see customer requests that match my capabilities so I can respond to them.

**Acceptance Criteria**:
- [ ] 2.1.1 Dashboard loads broadcasts with `GET /merchant/broadcasts` (with JWT)
- [ ] 2.1.2 Renders broadcast cards showing:
  - Query text
  - Distance from shop
  - Time posted
  - AI confidence score
  - Match reason ("we matched you because you sell X")
- [ ] 2.1.3 Each card has response buttons:
  - "No Stock" (red)
  - "Schedule" (yellow)
  - "I Have It" (green)
- [ ] 2.1.4 Response buttons call `POST /broadcasts/{id}/respond` with:
  - responseType: "YES" | "ALTERNATIVE" | "NO"
  - price (optional)
  - note (optional)
- [ ] 2.1.5 After response, card UI updates to show "You responded: ..."
- [ ] 2.1.6 Real-time updates (polling or WebSocket)

### 2.2 Reservation Shelf & Offers
**User Story**: As a merchant, I want to manage customer reservations and create broadcast offers.

**Acceptance Criteria**:
- [ ] 2.2.1 Reservation Shelf section calls `GET /merchant/orders`
- [ ] 2.2.2 Shows order cards with:
  - Customer name
  - Product/service
  - Token amount or advance paid
  - Hold window (expiry time)
- [ ] 2.2.3 Order actions:
  - "Picked Up" → `POST /orders/{id}/picked-up`
  - "Mark Expired" → `POST /orders/{id}/expired`
- [ ] 2.2.4 Broadcast Offers section with "Create Offer" button
- [ ] 2.2.5 Offer creation form calls `POST /merchant/offers` with:
  - title, description, price, validUntil
- [ ] 2.2.6 Shows list of active offers with enable/disable toggle

### 2.3 Store Status & Timings
**User Story**: As a merchant, I want to toggle my shop open/closed and update operating hours.

**Acceptance Criteria**:
- [ ] 2.3.1 Dashboard header shows current status: ● Open or ● Closed
- [ ] 2.3.2 Large toggle button calls `PATCH /merchants/toggle-status` with:
  - isOpen: true | false
- [ ] 2.3.3 Shows today's timings (e.g., "9:00 AM - 9:00 PM")
- [ ] 2.3.4 "Edit Hours" button opens modal
- [ ] 2.3.5 Timings editor calls `PUT /merchants/profile` with:
  - timing: { openHour, closeHour }
- [ ] 2.3.6 Status persists across page reloads

---

## 3. Customer App - Validate and Align with Backend

### 3.1 Verify Search → AI → Broadcast
**User Story**: As a customer, I want my search to be intelligently matched to relevant merchants.

**Acceptance Criteria**:
- [ ] 3.1.1 Search form calls `POST /broadcasts` (or `/search`) with:
  - query (text)
  - targetPrice (optional)
  - category (optional)
  - location (lat, lng)
- [ ] 3.1.2 Backend `detectCategory.ts` processes query using:
  - `merchant_capabilities_schema.json`
  - S3 `nearby-kb` bucket
- [ ] 3.1.3 Response includes:
  - majorCategory
  - subCategory
  - capabilityId
  - confidence score
  - matched merchants[]
- [ ] 3.1.4 Frontend displays broadcast status:
  - "Searching for merchants..."
  - "X merchants matched"
  - Merchant responses as they arrive
- [ ] 3.1.5 Poll `GET /requests/{id}` or use WebSocket for updates

### 3.2 Test Reservations & Orders
**User Story**: As a customer, I want to reserve items with appropriate payment based on price.

**Acceptance Criteria**:
- [ ] 3.2.1 For items < ₹200: Token-based reservation
- [ ] 3.2.2 For items ₹200-500: 50% advance payment
- [ ] 3.2.3 For items > ₹500: Full payment upfront
- [ ] 3.2.4 "Reserve" button opens modal with:
  - Payment amount
  - Hold window (e.g., "Hold for 2 hours")
  - Merchant details
- [ ] 3.2.5 Calls `POST /orders` with:
  - merchantId, productId, quantity
  - paymentMode: "TOKEN" | "ADVANCE" | "FULL"
  - amount
- [ ] 3.2.6 Order appears in merchant's "Reservation Shelf"
- [ ] 3.2.7 Customer can view order status in "My Orders"

---

## 4. Admin App - New React App

### 4.1 Setup
**User Story**: As an admin, I want a dedicated dashboard to monitor the platform.

**Acceptance Criteria**:
- [ ] 4.1.1 Create `admin-app/` directory with Vite + React + TypeScript
- [ ] 4.1.2 Install dependencies: react-router-dom, tailwindcss, framer-motion
- [ ] 4.1.3 Configure Tailwind with same color scheme as other apps
- [ ] 4.1.4 Basic routes:
  - `/` → Dashboard
  - `/merchants` → Merchants management
  - `/broadcasts` → Broadcasts monitoring
  - `/categories` → Categories editor
  - `/offers` → Offers management
  - `/analytics` → Analytics dashboard
- [ ] 4.1.5 Simple login page (email/password or hardcoded for now)
- [ ] 4.1.6 Protected routes with admin JWT

### 4.2 Dashboard
**User Story**: As an admin, I want to see key metrics at a glance.

**Acceptance Criteria**:
- [ ] 4.2.1 KPI cards showing:
  - Total users (from `nearby-backend-prod-users`)
  - Total merchants (from `nearby-backend-prod-merchants`)
  - Broadcasts today (from `nearby-backend-prod-broadcasts`)
  - Active offers (from `nearby-backend-prod-offers`)
- [ ] 4.2.2 "Recent Broadcasts" table with:
  - Query, category, status (matched/no match), time
- [ ] 4.2.3 "Latest Merchant Signups" table with:
  - Shop name, owner, category, city, signup date
- [ ] 4.2.4 Charts:
  - Broadcasts per day (last 7 days)
  - Merchant signups per day (last 30 days)

### 4.3 Merchants Management
**User Story**: As an admin, I want to view and manage all merchants.

**Acceptance Criteria**:
- [ ] 4.3.1 Calls `GET /admin/merchants` to fetch all merchants
- [ ] 4.3.2 Table columns:
  - Shop name, owner, category, city, status, last active, response rate
- [ ] 4.3.3 Search/filter by:
  - Category, city, status (active/suspended)
- [ ] 4.3.4 Click merchant row to view detail page:
  - Full profile
  - Capabilities list
  - Recent broadcasts received
  - Orders fulfilled
- [ ] 4.3.5 Actions:
  - "Approve" → `POST /admin/merchants/{id}/status` with status: "APPROVED"
  - "Suspend" → `POST /admin/merchants/{id}/status` with status: "SUSPENDED"

### 4.4 Categories & Capabilities Editor
**User Story**: As an admin, I want to manage categories and capabilities for better matching.

**Acceptance Criteria**:
- [ ] 4.4.1 Three-column layout:
  - Left: Major categories (18 items)
  - Middle: Subcategories (based on selected major)
  - Right: Capabilities list (based on selected subcategory)
- [ ] 4.4.2 Data loaded from:
  - `nearby-backend-prod-categories` (DynamoDB)
  - `merchant_capabilities_schema.json` (S3 nearby-kb)
- [ ] 4.4.3 Add capability form:
  - Capability name
  - Example queries (comma-separated)
  - Keywords (comma-separated)
- [ ] 4.4.4 Edit capability:
  - Update name, queries, keywords
- [ ] 4.4.5 Delete capability (with confirmation)
- [ ] 4.4.6 "Export JSON" button to download updated schema
- [ ] 4.4.7 "Sync to Backend" button to upload to S3

### 4.5 Offers & Analytics
**User Story**: As an admin, I want to see platform-wide offers and analytics.

**Acceptance Criteria**:
- [ ] 4.5.1 Offers page calls `GET /admin/offers`
- [ ] 4.5.2 Shows table of all offers:
  - Merchant, title, price, valid until, status
- [ ] 4.5.3 Analytics page shows:
  - "Most Searched Products" chart (from `nearby-backend-prod-analytics`)
  - "Searches with No Supply" list (high demand, no capable merchants)
  - "Top Performing Merchants" (by response rate)
  - "Category Distribution" pie chart

---

## 5. Auth and Shared Concerns

### 5.1 Normalize Auth Across Apps
**User Story**: As a developer, I want consistent auth handling across all three apps.

**Acceptance Criteria**:
- [ ] 5.1.1 Backend accepts JWT for:
  - Customers (role: "customer")
  - Merchants (role: "merchant")
  - Admins (role: "admin")
- [ ] 5.1.2 Each app has shared auth utility:
  - `utils/auth.ts` with:
    - `getToken()` - retrieve from localStorage
    - `setToken(token)` - store in localStorage
    - `clearToken()` - remove from localStorage
    - `isAuthenticated()` - check if token exists and valid
- [ ] 5.1.3 Axios/fetch interceptor attaches `Authorization: Bearer <token>` header
- [ ] 5.1.4 Protected routes redirect to login if not authenticated
- [ ] 5.1.5 Token expiry handling (refresh or re-login)

---

## 6. Notifications (Stretch Goal)

### 6.1 WebPush Notifications
**User Story**: As a merchant, I want to receive push notifications when a customer broadcasts a request.

**Acceptance Criteria**:
- [ ] 6.1.1 Implement FCM (Firebase Cloud Messaging) setup
- [ ] 6.1.2 Request notification permission on merchant dashboard load
- [ ] 6.1.3 Store FCM token in `nearby-backend-prod-merchants` table
- [ ] 6.1.4 Backend triggers SNS → FCM on new broadcast
- [ ] 6.1.5 Notification shows:
  - Title: "New Customer Request"
  - Body: Query text
  - Click action: Open dashboard to broadcast
- [ ] 6.1.6 Customer receives notification when merchant responds

---

## 7. Validation Checklist

### 7.1 End-to-End Test Flows
**User Story**: As a QA tester, I want to verify all critical flows work before the demo.

**Test Cases**:
- [ ] 7.1.1 **Merchant Onboarding**:
  - New merchant completes onboarding
  - Receives SHOP#### ID
  - Can login with ID + passcode
  - Dashboard shows correct category/capabilities
- [ ] 7.1.2 **Customer Search & Broadcast**:
  - Customer searches for "iPhone 15"
  - Broadcast created
  - AI classification shows correct category (Electronics → Mobile Shop)
  - Matched merchants receive broadcast
- [ ] 7.1.3 **Merchant Response**:
  - Merchant sees request in dashboard
  - Clicks "I Have It"
  - Enters price
  - Customer sees new offer in request thread
- [ ] 7.1.4 **Reservation**:
  - Customer reserves item (₹300 → 50% advance)
  - Order appears in merchant "Reservation Shelf"
  - Merchant marks as "Picked Up"
  - Order status updates for customer
- [ ] 7.1.5 **Admin Visibility**:
  - Admin logs in
  - Sees new merchant in merchants table
  - Sees broadcast in broadcasts table
  - Sees order in analytics

---

## Open Questions

### Q1: Exact Backend Routes
**Question**: Can you confirm the actual API paths for:
- Merchant signup/login
- Merchant broadcasts list + respond
- Customer search/broadcast create
- Admin merchants/broadcasts/categories

**Current Assumption**:
- `POST /merchants/signup`
- `POST /merchants/login`
- `GET /merchants/profile`
- `PATCH /merchants/toggle-status`
- `GET /merchant/broadcasts`
- `POST /broadcasts/{id}/respond`
- `POST /broadcasts` (customer search)
- `GET /admin/merchants`
- `GET /admin/broadcasts`
- `GET /admin/categories`

### Q2: Authoritative Categories Source
**Question**: Should the system treat `nearby-backend-prod-categories` (DynamoDB) as the single source of truth, and `ALL_MERCHANT_CAPABILITIES.json` only as a seed? Or is the JSON the master, and the table is derived?

**Current Assumption**: DynamoDB table is authoritative, JSON is for seeding/backup.

### Q3: Merchant vs Shop Table
**Question**: Which table should UI use for status/timings – `nearby-backend-prod-merchants` or `nearby-backend-prod-shops`?

**Current Assumption**: Use `nearby-backend-prod-merchants` table (has all merchant data including status/timings).

---

## Success Criteria

The hackathon demo is considered successful when:
1. ✅ Merchant can complete onboarding and login
2. ✅ Customer can search and create broadcasts
3. ✅ Merchant receives and responds to broadcasts
4. ✅ Customer can reserve items with correct payment flow
5. ✅ Admin can view all activity in dashboard
6. ✅ All three apps are deployed and accessible
7. ✅ No critical bugs or crashes during demo
8. ✅ UI is polished and professional-looking

---

## Out of Scope (Post-Hackathon)
- WhatsApp notifications
- SMS notifications
- Payment gateway integration
- Advanced analytics (ML-based insights)
- Multi-language support
- Mobile apps (iOS/Android)
