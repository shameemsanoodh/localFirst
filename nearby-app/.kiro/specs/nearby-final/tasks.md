# NearBy – Final Implementation Tasks

## PHASE 0: Backend additions (do first, everything depends on this)

- [ ] 0.1 Create nearby-backend-prod-config DynamoDB table (PK: configKey)
- [ ] 0.2 Seed config: { searchRadiusKm: 3, globalOffersEnabled: true }
- [ ] 0.3 Create nearby-backend-prod-queries DynamoDB table (PK: queryId)
- [ ] 0.4 Add GET /admin/config handler (admin JWT required)
- [ ] 0.5 Add PATCH /admin/config handler (admin JWT required)
- [ ] 0.6 Add POST /queries handler (any authenticated user or merchant)
- [ ] 0.7 Add GET /admin/queries handler (admin JWT required)
- [ ] 0.8 Add DELETE /admin/queries/{id} handler
- [ ] 0.9 Add GET /admin/analytics/search handler (reads analytics table, aggregates top queries/categories/supply gaps)
- [ ] 0.10 Add POST /admin/login handler (email+password → admin JWT with role: "admin")
- [ ] 0.11 Add admin JWT middleware (verify role: "admin" on all /admin/* routes)
- [ ] 0.12 Update broadcast handler to write analytics record on every search
- [ ] 0.13 Add GET /admin/users (list, filter, paginate)
- [ ] 0.14 Add PATCH /admin/users/{id}/status (suspend/reactivate)
- [ ] 0.15 Add DELETE /admin/users/{id}
- [ ] 0.16 Add GET /admin/merchants (list, filter)
- [ ] 0.17 Add PATCH /admin/merchants/{id}/status (approve/suspend/reactivate)
- [ ] 0.18 Add DELETE /admin/merchants/{id}
- [ ] 0.19 Add GET /admin/offers (all offers across merchants)
- [ ] 0.20 Add POST /admin/offers (global offer)
- [ ] 0.21 Add PATCH /admin/offers/{id}/status (pause/activate)
- [ ] 0.22 Add DELETE /admin/offers/{id}
- [ ] 0.23 Add POST /admin/notifications (send SNS push to all users / all merchants / city)
- [ ] 0.24 Deploy backend: serverless deploy --stage prod --region ap-south-1
- [ ] 0.25 Test all new endpoints with curl/Postman before frontend work

---

## PHASE 1: Admin App (build and deploy first)

### Setup
- [ ] 1.1 Update branding: Change "Studio Admin" to "NearBy Admin"
- [ ] 1.2 Update logo color to green (#22C55E)
- [ ] 1.3 Update .env.production with correct API URL
- [ ] 1.4 Create admin JWT interceptor in api.service.ts

### Login
- [ ] 1.5 Update Login.tsx to use POST /admin/login
- [ ] 1.6 Store admin JWT with role in localStorage
- [ ] 1.7 Add email field (not just username)

### Dashboard Page
- [ ] 1.8 Update KPI cards to match REQ-1.2
- [ ] 1.9 Add "Searches with No Supply" metric
- [ ] 1.10 Add "Pending Merchant Approvals" metric
- [ ] 1.11 Connect to real backend endpoints

### Users Page
- [ ] 1.12 Add columns: phone, email, joined, status, last active, total searches
- [ ] 1.13 Add Suspend/Reactivate/Delete actions
- [ ] 1.14 Add search history modal (last 20 queries)
- [ ] 1.15 Connect to GET /admin/users

### Merchants Page
- [ ] 1.16 Add columns: shopName, ownerName, phone, category, city, status, responseRate
- [ ] 1.17 Add Approve/Suspend/Delete actions
- [ ] 1.18 Add merchant detail drawer with capabilities
- [ ] 1.19 Add filter by category, status, city
- [ ] 1.20 Connect to GET /admin/merchants

### Queries Page (NEW)
- [ ] 1.21 Create QueriesPage.tsx
- [ ] 1.22 Table: senderType, phone, message (truncated), timestamp, status
- [ ] 1.23 Actions: Mark Reviewed, Delete
- [ ] 1.24 Modal to view full message
- [ ] 1.25 Connect to GET /admin/queries

### Locations Page (NEW)
- [ ] 1.26 Create LocationsPage.tsx
- [ ] 1.27 Show merchant clusters by city → locality
- [ ] 1.28 Add search radius slider (1-20km)
- [ ] 1.29 Save button → PATCH /admin/config
- [ ] 1.30 Show current radius with last updated

### Offers Page (NEW)
- [ ] 1.31 Create OffersPage.tsx
- [ ] 1.32 Table: offer title, merchant name, status, expiry
- [ ] 1.33 "Add Global Offer" form
- [ ] 1.34 Actions: Pause, Activate, Delete
- [ ] 1.35 Connect to GET /admin/offers

### Notifications Page (NEW)
- [ ] 1.36 Create NotificationsPage.tsx
- [ ] 1.37 Form: audience selector, title, message (160 char limit)
- [ ] 1.38 POST /admin/notifications on submit
- [ ] 1.39 Sent notifications history table

### AI Analytics Page
- [ ] 1.40 Update to show top 20 searched queries
- [ ] 1.41 Add top categories bar chart
- [ ] 1.42 Add searches per day line chart (30 days)
- [ ] 1.43 Add supply gaps table (matchCount = 0)
- [ ] 1.44 Add category distribution pie chart
- [ ] 1.45 Connect to GET /admin/analytics/search

### Sidebar Updates
- [ ] 1.46 Update logo to "NearBy Admin" with green color
- [ ] 1.47 Add Queries menu item
- [ ] 1.48 Add Locations menu item
- [ ] 1.49 Add Offers menu item
- [ ] 1.50 Add Notifications menu item
- [ ] 1.51 Rename "Bookings" to "Broadcasts"

### Deploy Admin App
- [ ] 1.52 npm run build
- [ ] 1.53 Create CloudFront distribution for admin app
- [ ] 1.54 aws s3 sync dist/ s3://nearby-admin-frontend/ --delete
- [ ] 1.55 Note down ADMIN_CLOUDFRONT_URL

---

## PHASE 2: Merchant App Updates

- [ ] 2.1 Add VITE_ADMIN_URL to .env.production
- [ ] 2.2 Add "Admin Panel" link in footer/settings
- [ ] 2.3 Implement broadcast polling (15 second interval)
- [ ] 2.4 Update broadcast card UI with AI category, distance, confidence
- [ ] 2.5 Add "I Have It" button → POST /broadcasts/{id}/respond
- [ ] 2.6 Add "Schedule" button with time picker
- [ ] 2.7 Add "No Stock" button
- [ ] 2.8 Update card state after response (RESPONDED)
- [ ] 2.9 Move responded cards to bottom
- [ ] 2.10 Add "Feature Request" button → POST /queries
- [ ] 2.11 npm run build
- [ ] 2.12 Create CloudFront distribution for merchant app
- [ ] 2.13 aws s3 sync dist/ s3://nearby-merchant-frontend/ --delete
- [ ] 2.14 CloudFront invalidation
- [ ] 2.15 Note down MERCHANT_CLOUDFRONT_URL

---

## PHASE 3: Customer App Updates

- [ ] 3.1 Add VITE_MERCHANT_URL to .env.production
- [ ] 3.2 Add "Register your shop" button → opens merchant app
- [ ] 3.3 Implement response polling (10 second interval)
- [ ] 3.4 Show response cards: YES (green), ALTERNATIVE (amber), NO (grey)
- [ ] 3.5 Add "Reserve" button on YES cards
- [ ] 3.6 Create Search History page → GET /user/history
- [ ] 3.7 Show query, timestamp, status for each search
- [ ] 3.8 Tap history item → show merchant responses
- [ ] 3.9 Create "My Activity" tab with Accepted/Rejected
- [ ] 3.10 Add "Feature Request" button → POST /queries
- [ ] 3.11 npm run build
- [ ] 3.12 Create CloudFront distribution for customer app
- [ ] 3.13 aws s3 sync dist/ s3://nearby-customer-frontend/ --delete
- [ ] 3.14 CloudFront invalidation
- [ ] 3.15 Note down CUSTOMER_CLOUDFRONT_URL (final demo link)

---

## PHASE 4: End-to-End Validation Checklist

Run through each flow manually after all three are deployed:

### Admin flow
- [ ] 4.1 Login to admin with email+password → reaches dashboard
- [ ] 4.2 KPIs show correct counts from DynamoDB
- [ ] 4.3 Create a test global offer → verify it appears in customer app
- [ ] 4.4 Change search radius to 5km → verify config saved
- [ ] 4.5 Send a test notification → verify it arrives on browser
- [ ] 4.6 AI analytics shows search data
- [ ] 4.7 View and manage queries from users/merchants
- [ ] 4.8 Suspend a user → verify they can't login
- [ ] 4.9 Approve a merchant → verify status changes

### Merchant flow
- [ ] 4.10 New merchant signs up via full 8-step onboarding
- [ ] 4.11 DynamoDB record has: shopName, majorCategory, capabilitiesEnabled, location
- [ ] 4.12 Merchant logs in → dashboard loads with OPEN status
- [ ] 4.13 Broadcast card appears within 15 seconds of customer search
- [ ] 4.14 Merchant responds YES → card updates to RESPONDED
- [ ] 4.15 Responded card moves to bottom of list
- [ ] 4.16 "Admin Panel" link opens admin app

### Customer flow
- [ ] 4.17 Customer searches for a product merchant sells
- [ ] 4.18 Broadcast created → merchant receives it within 15 seconds
- [ ] 4.19 Merchant responds YES → customer sees green response card within 10 seconds
- [ ] 4.20 Customer can see search history with response status
- [ ] 4.21 "Register your shop" button → opens merchant app in new tab
- [ ] 4.22 Customer can view My Activity (Accepted/Rejected)
- [ ] 4.23 Customer can submit feature request

### Cross-app navigation
- [ ] 4.24 Customer app → "Register your shop" → merchant app signup
- [ ] 4.25 Merchant app settings → "Admin Panel" → admin login page
- [ ] 4.26 All three apps load correctly on mobile browser
- [ ] 4.27 All three apps work on desktop browser

---

## Deployment Summary (fill in as you go)

| App | S3 Bucket | CloudFront URL | Status |
|-----|-----------|----------------|--------|
| admin-app | nearby-admin-frontend | TBD | ⬜ |
| merchant-app | nearby-merchant-frontend | TBD | ⬜ |
| customer-app | nearby-customer-frontend | TBD | ⬜ |

**Final demo URL = customer-app CloudFront URL**

---

## Current Status

Based on existing work:
- ✅ Admin app basic structure exists (needs rebranding and new pages)
- ✅ Merchant app exists (needs broadcast polling and response handling)
- ✅ Customer app exists (needs response polling and history)
- ✅ Backend has basic admin endpoints (needs config, queries, analytics)
- ⬜ CloudFront distributions (need to be created)
- ⬜ Cross-app navigation (needs environment variables)

**Next Step**: Start with PHASE 0 (Backend additions)
