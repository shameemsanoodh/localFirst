# NearBy Final Project - Implementation Plan

## 📋 Overview

Complete implementation of NearBy platform with three separate apps:
1. **Customer App** - User-facing (main entry point)
2. **Merchant App** - Merchant-facing (real-time broadcasts)
3. **Admin App** - Admin-facing (platform management)

All apps deployed to CloudFront, sharing one AWS backend in ap-south-1.

---

## 📁 Specification Files Created

✅ `.kiro/specs/nearby-final/requirements.md` - Complete requirements
✅ `.kiro/specs/nearby-final/design.md` - Technical design
✅ `.kiro/specs/nearby-final/tasks.md` - Implementation tasks

---

## 🎯 Implementation Phases

### Phase 0: Backend Additions (CRITICAL - Do First)
**Status**: Ready to start
**Tasks**: 25 tasks (0.1 - 0.25)

**Key Additions**:
- Config table (search radius, global settings)
- Queries table (feature requests from users/merchants)
- Analytics enhancements (track all searches)
- Admin authentication (email/password login)
- Admin endpoints (users, merchants, offers, notifications)

**Why First**: All frontend work depends on these backend endpoints.

---

### Phase 1: Admin App
**Status**: Partially complete (needs updates)
**Tasks**: 55 tasks (1.1 - 1.55)

**Current State**:
- ✅ Basic structure exists
- ✅ Sidebar navigation
- ✅ Dashboard with metrics
- ✅ Users page
- ✅ Merchants page
- ⬜ Needs rebranding (Studio Admin → NearBy Admin)
- ⬜ Needs new pages (Queries, Locations, Offers, Notifications)
- ⬜ Needs CloudFront deployment

**Key Updates**:
1. Rebrand to "NearBy Admin" with green (#22C55E)
2. Add 4 new pages (Queries, Locations, Offers, Notifications)
3. Update existing pages with new requirements
4. Deploy to CloudFront

---

### Phase 2: Merchant App
**Status**: Exists, needs real-time features
**Tasks**: 15 tasks (2.1 - 2.15)

**Current State**:
- ✅ Onboarding complete
- ✅ Dashboard exists
- ✅ Product management
- ⬜ Needs broadcast polling (15 second interval)
- ⬜ Needs response handling (I Have It / Schedule / No Stock)
- ⬜ Needs admin panel link
- ⬜ Needs CloudFront deployment

**Key Updates**:
1. Implement real-time broadcast polling
2. Add response buttons and handling
3. Add admin panel link
4. Deploy to CloudFront

---

### Phase 3: Customer App
**Status**: Exists, needs real-time features
**Tasks**: 15 tasks (3.1 - 3.15)

**Current State**:
- ✅ Search/broadcast creation
- ✅ Basic UI
- ⬜ Needs response polling (10 second interval)
- ⬜ Needs search history
- ⬜ Needs My Activity (Accepted/Rejected)
- ⬜ Needs merchant app link
- ⬜ Needs CloudFront deployment

**Key Updates**:
1. Implement response polling
2. Add search history page
3. Add My Activity section
4. Add merchant registration link
5. Deploy to CloudFront

---

### Phase 4: End-to-End Testing
**Status**: Not started
**Tasks**: 27 validation checks (4.1 - 4.27)

**Test Flows**:
- Admin flow (9 checks)
- Merchant flow (7 checks)
- Customer flow (7 checks)
- Cross-app navigation (4 checks)

---

## 🚀 Deployment Strategy

### Order (CRITICAL)
```
1. Deploy Backend (Phase 0)
   ↓
2. Deploy Admin App → Get CloudFront URL
   ↓
3. Add Admin URL to Merchant App → Deploy Merchant App → Get CloudFront URL
   ↓
4. Add Merchant URL to Customer App → Deploy Customer App → Get CloudFront URL
   ↓
5. Customer CloudFront URL = Final Demo Link
```

### CloudFront Setup
Each app needs:
- S3 bucket (Block Public Access ON)
- CloudFront distribution with OAC
- Custom error response (404 → /index.html for SPA routing)

**Buckets**:
- `nearby-admin-frontend`
- `nearby-merchant-frontend`
- `nearby-customer-frontend`

---

## 📊 Current vs Target State

### Admin App
| Feature | Current | Target |
|---------|---------|--------|
| Branding | Studio Admin | NearBy Admin (green) |
| Dashboard KPIs | 6 basic metrics | 6 specific metrics |
| Users Page | Basic table | + search history modal |
| Merchants Page | Basic table | + detail drawer, filters |
| Queries Page | ❌ Missing | ✅ New page |
| Locations Page | ❌ Missing | ✅ New page |
| Offers Page | ❌ Missing | ✅ New page |
| Notifications Page | ❌ Missing | ✅ New page |
| Analytics | Basic charts | AI search analytics |
| Deployment | S3 static | CloudFront |

### Merchant App
| Feature | Current | Target |
|---------|---------|--------|
| Broadcast View | Static list | Real-time polling (15s) |
| Response Actions | ❌ Missing | I Have It / Schedule / No Stock |
| Card States | Basic | PENDING / RESPONDED / EXPIRED |
| Admin Link | ❌ Missing | Footer link to admin |
| Deployment | S3 static | CloudFront |

### Customer App
| Feature | Current | Target |
|---------|---------|--------|
| Response View | Static | Real-time polling (10s) |
| Search History | ❌ Missing | Last 20 searches |
| My Activity | ❌ Missing | Accepted / Rejected |
| Merchant Link | ❌ Missing | Register shop button |
| Deployment | S3 static | CloudFront |

---

## 🔑 Key Technical Decisions

### Real-Time Strategy
- **Polling** (not WebSocket) for simplicity
- Merchant: 15 second interval
- Customer: 10 second interval
- Use `since` parameter to fetch only new data

### Authentication
- Admin: Email + password → JWT with role: "admin"
- Merchant: Phone + passcode → JWT
- Customer: Phone + OTP → JWT

### Cross-App Navigation
- Environment variables for URLs
- `window.open()` for external links
- No iframe embedding

### Data Flow
```
Customer Search
    ↓
Broadcast Created (DynamoDB)
    ↓
Analytics Record Written
    ↓
Merchant Polls (15s) → Sees Broadcast
    ↓
Merchant Responds
    ↓
Customer Polls (10s) → Sees Response
```

---

## 📝 Environment Variables

### Admin App (.env.production)
```
VITE_API_BASE_URL=https://4cwdqd7sz4.execute-api.ap-south-1.amazonaws.com/prod
VITE_APP_NAME=NearBy Admin
```

### Merchant App (.env.production)
```
VITE_API_BASE_URL=https://4cwdqd7sz4.execute-api.ap-south-1.amazonaws.com/prod
VITE_ADMIN_URL=https://[admin-cloudfront-id].cloudfront.net
```

### Customer App (.env.production)
```
VITE_API_BASE_URL=https://4cwdqd7sz4.execute-api.ap-south-1.amazonaws.com/prod
VITE_MERCHANT_URL=https://[merchant-cloudfront-id].cloudfront.net
```

---

## 🎯 Success Criteria

### Must Have
- ✅ All 3 apps deployed to CloudFront
- ✅ Cross-app navigation works
- ✅ Real-time broadcasts (merchant sees within 15s)
- ✅ Real-time responses (customer sees within 10s)
- ✅ Admin can manage users, merchants, offers
- ✅ Search history and analytics work
- ✅ Mobile responsive

### Nice to Have
- Push notifications (SNS + FCM)
- Advanced analytics charts
- Bulk actions in admin
- Export data to CSV

---

## 📅 Estimated Timeline

### Phase 0: Backend (2-3 hours)
- Create tables
- Write handlers
- Test endpoints
- Deploy

### Phase 1: Admin App (3-4 hours)
- Rebrand
- Create new pages
- Update existing pages
- Deploy to CloudFront

### Phase 2: Merchant App (2-3 hours)
- Implement polling
- Add response handling
- Deploy to CloudFront

### Phase 3: Customer App (2-3 hours)
- Implement polling
- Add history pages
- Deploy to CloudFront

### Phase 4: Testing (1-2 hours)
- End-to-end flows
- Cross-app navigation
- Mobile testing

**Total**: 10-15 hours

---

## 🚦 Next Steps

1. **Start Phase 0** - Backend additions
2. Create DynamoDB tables (config, queries)
3. Write admin handlers
4. Test with curl/Postman
5. Deploy backend
6. Move to Phase 1 (Admin App)

---

## 📞 Quick Reference

**Current Deployment**:
- Admin: http://nearby-admin-app.s3-website.ap-south-1.amazonaws.com
- Merchant: http://nearby-merchant-app.s3-website.ap-south-1.amazonaws.com
- Customer: http://nearby-customer-app.s3-website.ap-south-1.amazonaws.com
- Backend: https://4cwdqd7sz4.execute-api.ap-south-1.amazonaws.com/prod

**Target Deployment**:
- Admin: https://[admin-id].cloudfront.net
- Merchant: https://[merchant-id].cloudfront.net
- Customer: https://[customer-id].cloudfront.net (FINAL DEMO LINK)

---

**Created**: March 6, 2026
**Status**: Ready to implement Phase 0
**Spec Files**: `.kiro/specs/nearby-final/`
