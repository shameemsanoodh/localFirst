# NearBy – Final Project Requirements

## Project Overview
Three separate React apps sharing one AWS backend:
- customer-app → CloudFront (user-facing)
- merchant-app → CloudFront (merchant-facing)
- admin-app → CloudFront (admin-facing, NEW)

All three must be deployed. Customer app is the single entry point with links to merchant and admin.

---

## REQ-1: Admin App (NEW – build first)

### REQ-1.1 Branding
- App name: "NearBy Admin" (NOT Studio Admin)
- Sidebar logo: NearBy green (#22C55E) with admin badge
- Remove all Studio Admin references

### REQ-1.2 Dashboard KPIs
- Total Users (from nearby-backend-prod-users)
- Total Merchants (from nearby-backend-prod-merchants)
- Total Broadcasts Today (from nearby-backend-prod-broadcasts)
- Active Offers (from nearby-backend-prod-offers)
- Pending Merchant Approvals
- Searches with No Supply (broadcasts with 0 responses)

### REQ-1.3 User Management
- Table: phone, email, joined date, status, last active, total searches
- Actions: Suspend, Reactivate, Delete
- Search/filter by phone or email
- View user search history (last 20 queries)

### REQ-1.4 Merchant Management
- Table: shopName, ownerName, phone, category, subcategory, city, status, response rate
- Actions: Approve, Suspend, Reactivate, Delete, Edit
- View merchant detail: profile + capabilities + broadcast history
- Filter by category, status, city

### REQ-1.5 Queries Section
- Shows all feature requests submitted by users or merchants
- Each query: sender type (user/merchant), phone, message (max 100 words displayed), timestamp
- Admin can: Mark as Reviewed, Delete

### REQ-1.6 Location Clusters
- Show merchants grouped by area (city → locality)
- Admin can change global search radius (3km default, range 1–20km)
- Radius change saves to nearby-backend-prod-config table
- Backend reads config radius for all broadcast queries

### REQ-1.7 Offers Management
- Table of all offers (merchant name, offer text, status, expires)
- Admin can: Add global offer, Pause, Remove
- Global offers appear on customer-app home screen
- Merchant-specific offers managed by merchant

### REQ-1.8 Notifications
- Admin can send broadcast notification to: All Users, All Merchants, Specific city
- Message: title + body (max 160 chars)
- Delivery via SNS → FCM WebPush

### REQ-1.9 AI Search Analytics
- Most searched queries (top 20, ranked by frequency)
- Most searched product categories
- Top capability IDs users searched for
- Searches with zero merchant matches ("supply gap" list)
- Chart: searches per day (last 30 days)
- Chart: category distribution of searches
- All data from nearby-backend-prod-analytics DynamoDB table

---

## REQ-2: Merchant App – Real-Time Broadcasts

### REQ-2.1 Live Broadcasts
- Dashboard loads GET /merchant/broadcasts with JWT
- New broadcasts appear in real time (polling every 15 seconds or WebSocket)
- Each broadcast card shows: user query, AI category match, distance, time ago, confidence %
- Three action buttons: "I Have It" | "Schedule" | "No Stock"

### REQ-2.2 Responses
- "I Have It" → POST /broadcasts/{id}/respond { responseType: "YES", price?, note? }
- "Schedule" → POST /broadcasts/{id}/respond { responseType: "ALTERNATIVE", scheduledTime? }
- "No Stock" → POST /broadcasts/{id}/respond { responseType: "NO" }
- After response: card updates to show "Responded: YES/SCHEDULE/NO" with timestamp
- Responded cards move to bottom of list

### REQ-2.3 Store Status
- Header toggle: OPEN / CLOSED
- Calls PATCH /merchants/toggle-status
- Status must reflect in customer search results immediately

### REQ-2.4 Admin Link in Merchant App
- Footer or settings: "Admin Panel" link → ADMIN_PRODUCTION_URL
- This is set via VITE_ADMIN_URL environment variable

---

## REQ-3: Customer App – Real-Time Search & History

### REQ-3.1 Broadcast Flow
- User searches → POST /broadcasts with query, location, category
- App polls GET /broadcasts/{id}/responses every 10 seconds
- Shows merchant responses as cards (shop name, price, distance, response type)
- Accept/Schedule response triggers reservation flow

### REQ-3.2 Search History
- GET /user/history → shows last 20 searches
- Each entry: query text, timestamp, status (responses received / no match)
- Tap entry to see merchant responses for that search

### REQ-3.3 Accepted/Rejected History
- Under "My Activity":
  - Accepted: queries where user accepted a merchant offer
  - Rejected: queries where all merchants replied No Stock or no one responded

### REQ-3.4 Merchant App Link in Customer App
- "Register your shop" button → MERCHANT_PRODUCTION_URL
- Set via VITE_MERCHANT_URL environment variable

### REQ-3.5 Feature Query Submission
- "Send feedback / request a feature" button in settings/profile
- POST /queries { type: "user", message } → stored in DynamoDB
- Admin can see these in REQ-1.5

---

## REQ-4: Backend Additions

### REQ-4.1 Config Table
- Table: nearby-backend-prod-config
- Keys: searchRadiusKm, globalOffersEnabled
- GET /admin/config → read config
- PATCH /admin/config → update (admin JWT required)

### REQ-4.2 Queries Table
- Table: nearby-backend-prod-queries
- POST /queries → store user/merchant feature request
- GET /admin/queries → list all (admin JWT required)
- DELETE /admin/queries/{id} → delete

### REQ-4.3 Analytics
- Every broadcast → write to nearby-backend-prod-analytics:
  { queryText, majorCategory, subCategory, capabilityId, timestamp, matchCount }
- GET /admin/analytics/search → aggregate top queries, categories, supply gaps

### REQ-4.4 Admin Auth
- POST /admin/login { email, password } → return JWT with role: "admin"
- All /admin/* routes require admin JWT
- Hardcode one admin account in env vars for now

---

## REQ-5: Deployment Order

1. Build and deploy admin-app → get CloudFront URL (ADMIN_URL)
2. Add ADMIN_URL to merchant-app .env.production as VITE_ADMIN_URL
3. Build and deploy merchant-app → get CloudFront URL (MERCHANT_URL)
4. Add MERCHANT_URL to customer-app .env.production as VITE_MERCHANT_URL
5. Build and deploy customer-app → get CloudFront URL (CUSTOMER_URL)
6. CUSTOMER_URL is the single shareable link for demo
