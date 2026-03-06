# NearBy – Complete Task Master

## Legend
- ✅ Done  |  🔄 In Progress  |  ⬜ Todo  |  🔴 Critical for submission

---

## PHASE 1: Featured Offer Banner
✅ 1.1 FeaturedOfferBanner component
✅ 1.2 Integrate into Offers page
✅ 1.3 Banner data management with expiry logic

**Status:** ✅ COMPLETE

---

## PHASE 2: Voice Search
✅ 2.1 useVoiceSearch hook (Web Speech API, en-IN, hi-IN, kn-IN)
✅ 2.2 VoiceSearchButton component with animation
✅ 2.3 Integrated into Hero section
⬜ 2.4 Voice search analytics (track usage, errors)

**Status:** 🔄 75% COMPLETE (Core functionality done, analytics pending)

---

## PHASE 3: Image Search  🔴

⬜ 3.1 ImageSearchButton component
- Camera icon, hidden file input, mobile capture
- Image preview modal, upload progress, cancel

⬜ 3.2 imageCompression.ts utility
- Canvas-based, max 1024x1024, quality 0.8
- 5MB limit, JPG/PNG/WEBP validation

⬜ 3.3 Backend: POST /ai/analyze-image Lambda
- Use Amazon Nova Pro (amazon.nova-pro-v1:0) — NOT Claude
- Image + text multimodal prompt
- Returns: { product_name, brand, category, broadcast_message }
- Rate limiting + request validation

⬜ 3.4 Frontend ai.service.ts: analyzeImage() method

⬜ 3.5 Integrate into Hero section
- Show preview → AI analysis → fill search → trigger broadcast → radar page

⬜ 3.6 Image search analytics

**Status:** ⬜ NOT STARTED

---

## PHASE 4: AI Pipeline Final Wiring  🔴

⬜ 4.1 Unified search flow
- Text → normalize (Nova Lite) → intent (Nova Pro)
- Voice → transcript → same pipeline
- Image → Nova Pro vision → same broadcast trigger

⬜ 4.2 Error handling + retry + fallback to text search

⬜ 4.3 Performance: cache AI results (DynamoDB TTL 5min), lazy load

⬜ 4.4 Accessibility: ARIA labels, keyboard nav, screen reader

⬜ 4.5 Browser compatibility: Chrome/Safari/Firefox/Edge + polyfills

⬜ 4.6 Mobile testing: voice + camera on iOS + Android

**Status:** ⬜ NOT STARTED

---

## PHASE 5: Three-App Architecture Migration  🔴 CRITICAL

🔄 5.1 Split monolithic SPA into three independent Vite apps
- User App (`/frontend` — trimmed, user routes only)
- Merchant App (`/merchant-frontend` — new Vite project)
- Admin App (`/admin-frontend` — new Vite project)
- All three share same backend API & DynamoDB

⬜ 5.2 Scaffold Merchant Frontend
- Vite + React + TS + Tailwind at /merchant-frontend
- Copy shared modules (api.ts, authStore.ts, types/, constants.ts)
- Migrate merchant pages & hooks from /frontend/src/pages/merchant/
- Own login, sidebar layout, routing on port 5174

⬜ 5.3 Scaffold Admin Frontend
- Vite + React + TS + Tailwind at /admin-frontend
- Copy shared modules
- Migrate AdminDashboardEnhanced from /frontend/src/pages/admin/
- Own login, sidebar layout, routing on port 5175

⬜ 5.4 Clean up User Frontend
- Remove all merchant & admin routes from App.tsx
- Remove unused merchant/admin imports, hooks, services
- User app runs standalone on port 5173

⬜ 5.5 Each app has own login, no cross-app navigation
- Fixes the "back button shows user page" bug
- Each app deployed independently (S3/CloudFront)

**Status:** 🔄 IN PROGRESS (planning complete, see requirement.md & design.md)

---

## PHASE 6: Merchant Portal  🔴

⬜ 6.1 /merchant/requests – Live Request Inbox
- List of open broadcasts matching merchant category + radius
- Card: message, distance, time since posted, category badge
- Actions: "Send Offer" modal (price, note, ETA) | "Skip"
- Real-time refresh via WebSocket or polling every 10s

⬜ 6.2 /merchant/offers – My Offers Sent
- Status: pending | accepted | rejected | expired
- Accepted: show reservation countdown + customer pickup info

⬜ 6.3 /merchant/profile – Shop Profile
- Form: name, address, lat/lng map pin, hours, categories
- Tag-based inventory (e.g. "Nandini Blue Milk", "Pixel 6a cases")
- Save to merchants DynamoDB table

⬜ 6.4 /merchant/insights – Locality Intelligence
- Pull from locality-intelligence DynamoDB table
- Show: top devices, milk brands, footwear demand, top searches
- Charts using recharts (bar, pie)
- "Recommended stock" section based on demand gaps

⬜ 6.5 Merchant Notification Badge
- Bell icon in sidebar with unread count
- Mark as read on click

**Status:** ⬜ NOT STARTED

---

## PHASE 7: Admin Console  🔴

⬜ 7.1 /admin/overview – Dashboard
- KPI cards: users, merchants, broadcasts today, acceptance rate
- Location heatmap (Amazon Location + Leaflet or simple grid)
- Top 10 searched products city-wide

⬜ 7.2 /admin/localities – Locality Intelligence
- Table of localities with: device split, milk brands, demand gaps
- Drill-down per locality
- Export CSV button

⬜ 7.3 /admin/users – User Management
- List + search users
- View profile, last active, role

⬜ 7.4 /admin/merchants – Merchant Management
- Approve / deactivate merchants
- View shop profile, offers sent, acceptance rate

⬜ 7.5 /admin/broadcasts – Broadcast Log
- Inspect all broadcasts, AI decisions, offers
- Filter by category, locality, date

**Status:** ⬜ NOT STARTED

---

## PHASE 8: Real-Time Features  🔴

⬜ 8.1 API Gateway WebSocket
- Connect on broadcast creation
- Push new offers to user radar page as they arrive
- Push new broadcasts to merchant inbox

⬜ 8.2 Broadcast Radar WebSocket Integration
- Replace current polling with WebSocket on /app/radar
- Animate new cards sliding in as offers arrive

⬜ 8.3 Merchant Inbox WebSocket Integration
- New broadcast appears in merchant /merchant/requests live

**Status:** ⬜ NOT STARTED

---

## PHASE 9: Notifications (SNS)  🔴 MISSING

⬜ 9.1 Create SNS topics
- nearby-merchant-{area} — broadcast requests for merchants
- nearby-user-notifications — offer accepted, order ready
- nearby-admin-alerts — system errors, flagged content

⬜ 9.2 Merchant notification flow
- On broadcast created → Lambda publishes to SNS topic for that area + category
- Merchant subscribed → receives push/email: "New request: 1kg tomato in Neelasandra"

⬜ 9.3 User notification flow
- On merchant offer accepted by user → SNS → merchant gets: "Customer accepted your offer, coming soon"
- On broadcast expired (no offers) → user gets: "No shops responded, try again or expand radius"

⬜ 9.4 In-app notification bell (all three portals)
- Notification bell component in all layouts
- Unread count badge
- Dropdown with last 10 notifications
- Mark all read

⬜ 9.5 Email/SMS fallback via SNS + SES
- For merchants who don't have the app open

**Status:** ⬜ NOT STARTED

---

## PHASE 10: Location-Based Detection (Final)  🔴

⬜ 10.1 Confirm Amazon Location Service reverse geocoding is live
- On GPS detected → show locality name (Neelasandra, Koramangala)

⬜ 10.2 Distance filter wired to broadcast
- Broadcast only reaches merchants within 3km (server-side Haversine)

⬜ 10.3 Radius control on user side
- Option to expand to 5km if no results at 3km

⬜ 10.4 Location permission handling
- Friendly prompt if blocked
- Manual locality selector as fallback

**Status:** ⬜ NOT STARTED

---

## PHASE 11: AWS Deployment (Required for Submission)  🔴 CRITICAL

⬜ 11.1 Frontend: S3 + CloudFront
- Build React PWA → upload to S3 bucket
- CloudFront distribution with custom domain (optional)
- Enable PWA manifest + service worker headers

⬜ 11.2 Backend: Lambda + API Gateway
- All Lambda functions deployed (ai-search, broadcast, merchants, shops, admin)
- API Gateway REST + WebSocket both deployed
- Environment variables set in Lambda config

⬜ 11.3 Database: DynamoDB tables live
- users, merchants, broadcasts, broadcast_offers, shops, locality-intelligence, local-demand, user-profiles, ai-logs
- Seed data in all tables for demo

⬜ 11.4 Auth: Cognito user pool live
- User pool with USER, MERCHANT, ADMIN groups
- App client configured for frontend
- Test accounts for all 3 roles created

⬜ 11.5 Storage: S3 buckets
- nearby-shop-images (shop cover/logo)
- nearby-product-catalog (taxonomy JSON for Knowledge Base)
- nearby-user-uploads (image search uploads, TTL 24h)

⬜ 11.6 AI: Bedrock model access enabled
- Nova Pro + Nova Lite + Nova Micro enabled in ap-south-1
- IAM role for Lambda has bedrock:InvokeModel permission

⬜ 11.7 Location Service: Place index live
- NearByPlaceIndex with Esri data provider
- API key created and saved in .env

⬜ 11.8 Notifications: SNS topics created
- Topics for merchant areas and user notifications

⬜ 11.9 Demo accounts seeded
- 1 admin account
- 2–3 merchant accounts (different categories, Bengaluru coords)
- 1 user account with profile (Pixel 9, KTM Duke, Nandini milk)

⬜ 11.10 Live URL documented
- Deployed CloudFront URL ready for submission

**Status:** ⬜ NOT STARTED

---

## PHASE 12: Submission Readiness  🔴

⬜ 12.1 PPT completed (all 13 slides per template)
- Team info, problem, idea, why AI, features, flow diagram, wireframes, architecture, tech stack, cost estimate, screenshots, performance, future roadmap, assets

⬜ 12.2 Architecture diagram created
- Shows: S3/CloudFront, API GW, Lambda, DynamoDB, Bedrock, Location Service, SNS, Cognito, S3 (images)
- Labels AWS region ap-south-1

⬜ 12.3 Demo video (≤ 3 minutes) recorded
- Script:
  1. User opens app, GPS detects Neelasandra (0:00–0:20)
  2. Types "I need tomato 1kg" → AI normalizes → broadcasts (0:20–0:50)
  3. Merchant app shows request → sends offer (0:50–1:20)
  4. User sees offer on radar → accepts → gets map link (1:20–1:50)
  5. Voice search demo (1:50–2:10)
  6. Image search demo — photo a product (2:10–2:40)
  7. Admin dashboard shows locality insights (2:40–3:00)

⬜ 12.4 GitHub repo public + README complete
- README: what it is, tech stack, how to run, AWS setup
- Architecture diagram image in repo

⬜ 12.5 Final checklist before submit
- [ ] Live MVP URL works on mobile browser
- [ ] All 3 demo accounts login correctly
- [ ] Broadcast flow works end to end
- [ ] Merchant receives notification
- [ ] Admin can see locality data
- [ ] PPT exported as PDF
- [ ] Video link is public (YouTube/Vimeo unlisted)

**Status:** ⬜ NOT STARTED

---

## Priority Order (Do This First)

1. 🔴 **Phase 5** – Role routing (auth guard + separate layouts)
2. 🔴 **Phase 9** – SNS notifications (most missing piece)
3. 🔴 **Phase 8** – WebSocket real-time
4. 🔴 **Phase 6** – Merchant portal pages
5. 🔴 **Phase 3** – Image search backend
6. 🔴 **Phase 11** – Full AWS deployment + seed data
7. 🔴 **Phase 12** – PPT + demo video + GitHub

---

## AWS Services Coverage (Hackathon Checklist)

| Service | Used For | Status |
|---|---|---|
| AWS Lambda | All backend logic | ✅ Deployed |
| Amazon API Gateway | REST + WebSocket | ✅ REST done, ⬜ WS pending |
| Amazon DynamoDB | All data storage | ✅ Tables created |
| Amazon S3 | Images + frontend hosting | ⬜ Frontend not deployed yet |
| Amazon Cognito | Auth + role groups | ⬜ Groups pending |
| Amazon SNS | Notifications | ⬜ Not started |
| Amazon Bedrock | AI search + image | 🔄 Text done, ⬜ Image pending |
| Amazon Location | Geocoding + distance | ✅ Done |
| AWS CloudFront | CDN for frontend | ⬜ Pending |
| AWS Amplify | Optional hosting alt | ⬜ Optional |

---

## Current Progress Summary

### ✅ Completed Features
- Featured offer banner system with expiry management
- Voice search with Web Speech API (English, Hindi, Kannada)
- Voice search UI with animations and error handling
- Voice search integrated into hero section
- Text-based AI search with category detection
- Broadcast system with category filtering
- Location services with Amazon Location
- Nearby shops display
- Broadcast radar page

### 🔄 In Progress
- Voice search analytics (pending)
- Image search (not started)

### ⬜ Critical Missing Pieces
1. Role-based authentication and routing
2. Merchant portal (all pages)
3. Admin console (all pages)
4. Real-time WebSocket notifications
5. SNS notification system
6. Image search with Nova Pro
7. Full AWS deployment (S3/CloudFront)
8. Demo accounts and seed data
9. Submission materials (PPT, video, README)

---

## Next Immediate Actions

1. **Complete multimodal search spec tasks** (current focus)
   - Finish remaining voice/image search tasks
   - Add analytics tracking

2. **Shift to critical hackathon features**
   - Implement role-based routing (Phase 5)
   - Build merchant portal (Phase 6)
   - Set up SNS notifications (Phase 9)
   - Deploy to AWS (Phase 11)
   - Create submission materials (Phase 12)

---

**Last Updated:** March 2, 2026
**Spec Progress:** Phase 1 ✅ | Phase 2 🔄 75% | Phase 3-5 ⬜
**Hackathon Readiness:** ~30% complete
