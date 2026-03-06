# NearBy - Local Commerce Broadcasting Platform
## Design Document

---

## 1. DOCUMENT OVERVIEW

### 1.1 Purpose
This document provides comprehensive design specifications for the NearBy platform, including system architecture, database design, UI/UX guidelines, API design, and technical implementation details.

### 1.2 Scope
- System architecture and component design
- Database schema and data flow
- User interface and experience design
- API architecture and contracts
- Security and authentication design
- Real-time communication architecture
- AI/ML integration design

### 1.3 Audience
- Software Engineers
- UI/UX Designers
- DevOps Engineers
- Product Managers
- QA Engineers

---

## 2. SYSTEM ARCHITECTURE

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React PWA (Mobile-First)                            │   │
│  │  - Tailwind CSS                                      │   │
│  │  - Service Worker (Offline Support)                 │   │
│  │  - WebSocket Client                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/WSS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     CDN LAYER                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Amazon CloudFront                                   │   │
│  │  - Static Assets Caching                            │   │
│  │  - API Response Caching                            │   │
│  │  - Global Distribution                              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     API GATEWAY LAYER                        │
│  ┌────────────────────┐    ┌──────────────────────────┐    │
│  │  REST API Gateway  │    │  WebSocket API Gateway   │    │
│  │  - Authentication  │    │  - Real-time Broadcasts  │    │
│  │  - Rate Limiting   │    │  - Order Updates         │    │
│  │  - Request Valid.  │    │  - Notifications         │    │
│  └────────────────────┘    └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   COMPUTE LAYER (Lambda)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │   Auth   │ │ Category │ │ Broadcast│ │  Orders  │      │
│  │ Functions│ │ Functions│ │ Functions│ │ Functions│      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  Search  │ │  Offers  │ │  Support │ │  Admin   │      │
│  │ Functions│ │ Functions│ │ Functions│ │ Functions│      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   INTEGRATION LAYER                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Cognito  │ │ Bedrock  │ │ Location │ │   SNS    │      │
│  │  (Auth)  │ │   (AI)   │ │ Service  │ │ (Notify) │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                               │
│  ┌────────────────────┐              ┌──────────────────┐   │
│  │   DynamoDB         │              │   Amazon S3      │   │
│  │   - profiles       │              │   - User Avatars │   │
│  │   - merchants      │              │   - Product Imgs │   │
│  │   - categories     │              │   - Offer Images │   │
│  │   - products       │              │   - Category Ico │   │
│  │   - broadcasts     │              └──────────────────┘   │
│  │   - orders         │                                     │
│  │   - offers         │                                     │
│  │   - reservations   │                                     │
│  │   - support_tickets│                                     │
│  └────────────────────┘                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   MONITORING LAYER                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  CloudWatch (Logs, Metrics, Alarms, Dashboards)     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Component Architecture

#### 2.2.1 Frontend Architecture (React)

```
src/
├── components/
│   ├── common/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Card.jsx
│   │   ├── Modal.jsx
│   │   ├── Loader.jsx
│   │   └── BottomNav.jsx
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   └── LocationCapture.jsx
│   ├── categories/
│   │   ├── CategoryGrid.jsx
│   │   ├── CategoryCard.jsx
│   │   └── Breadcrumb.jsx
│   ├── products/
│   │   ├── ProductList.jsx
│   │   ├── ProductCard.jsx
│   │   └── ProductDetail.jsx
│   ├── broadcast/
│   │   ├── BroadcastButton.jsx
│   │   ├── RadarAnimation.jsx
│   │   ├── ResponseCard.jsx
│   │   └── MerchantList.jsx
│   ├── offers/
│   │   ├── OfferFeed.jsx
│   │   ├── OfferCard.jsx
│   │   └── CountdownTimer.jsx
│   ├── merchant/
│   │   ├── Dashboard.jsx
│   │   ├── OrderQueue.jsx
│   │   ├── CreateOffer.jsx
│   │   └── Analytics.jsx
│   ├── admin/
│   │   ├── AdminDashboard.jsx
│   │   ├── CategoryBuilder.jsx
│   │   ├── UserManagement.jsx
│   │   └── TicketManagement.jsx
│   └── search/
│       ├── SearchBar.jsx
│       ├── Autocomplete.jsx
│       └── ImageUpload.jsx
├── pages/
│   ├── Home.jsx
│   ├── Categories.jsx
│   ├── Search.jsx
│   ├── Offers.jsx
│   ├── Account.jsx
│   ├── ProductDetail.jsx
│   ├── MerchantDashboard.jsx
│   └── AdminPanel.jsx
├── services/
│   ├── api.js              // Axios instance & interceptors
│   ├── auth.js             // Authentication service
│   ├── websocket.js        // WebSocket connection manager
│   ├── location.js         // Geolocation service
│   ├── storage.js          // LocalStorage wrapper
│   └── notifications.js    // Push notification handler
├── hooks/
│   ├── useAuth.js
│   ├── useWebSocket.js
│   ├── useLocation.js
│   ├── useBroadcast.js
│   └── useInfiniteScroll.js
├── context/
│   ├── AuthContext.jsx
│   ├── LocationContext.jsx
│   └── WebSocketContext.jsx
├── utils/
│   ├── constants.js
│   ├── helpers.js
│   ├── validators.js
│   └── formatters.js
├── styles/
│   └── tailwind.config.js
├── App.jsx
├── index.jsx
└── serviceWorker.js
```

#### 2.2.2 Backend Architecture (Lambda Functions)

```
lambda/
├── auth/
│   ├── register.js
│   ├── login.js
│   ├── refresh.js
│   └── getProfile.js
├── categories/
│   ├── list.js
│   ├── get.js
│   ├── create.js
│   ├── update.js
│   └── delete.js
├── products/
│   ├── list.js
│   ├── get.js
│   ├── create.js
│   └── update.js
├── broadcasts/
│   ├── create.js
│   ├── get.js
│   ├── cancel.js
│   ├── respond.js
│   └── matchMerchants.js
├── orders/
│   ├── create.js
│   ├── get.js
│   ├── updateStatus.js
│   └── list.js
├── offers/
│   ├── create.js
│   ├── getNearby.js
│   ├── reserve.js
│   └── like.js
├── search/
│   ├── search.js
│   ├── autocomplete.js
│   └── aiSearch.js
├── merchants/
│   ├── create.js
│   ├── get.js
│   ├── update.js
│   └── getNearby.js
├── support/
│   ├── createTicket.js
│   ├── getTickets.js
│   ├── addMessage.js
│   └── updateStatus.js
├── admin/
│   ├── getStats.js
│   ├── getUsers.js
│   ├── verifyMerchant.js
│   └── getAnalytics.js
├── websocket/
│   ├── connect.js
│   ├── disconnect.js
│   ├── message.js
│   └── broadcast.js
├── shared/
│   ├── db.js              // DynamoDB client
│   ├── s3.js              // S3 client
│   ├── cognito.js         // Cognito client
│   ├── bedrock.js         // Bedrock client
│   ├── location.js        // Location Service client
│   ├── sns.js             // SNS client
│   ├── auth.js            // JWT validation
│   └── utils.js           // Common utilities
└── layers/
    └── nodejs/
        └── node_modules/  // Shared dependencies
```

---

## 3. DATABASE DESIGN

### 3.1 DynamoDB Table Design Principles

1. **Single Table Design**: Consider consolidating related entities
2. **Access Patterns First**: Design based on query requirements
3. **Denormalization**: Store redundant data to avoid joins
4. **GSI Strategy**: Create indexes for alternate access patterns
5. **Partition Key Distribution**: Ensure even distribution to avoid hot partitions

### 3.2 Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   profiles  │────────▶│  user_roles  │◀────────│  merchants  │
│             │  1:N    │              │   1:1   │             │
│  - userId   │         │  - userId    │         │ - merchantId│
│  - name     │         │  - role      │         │ - shopName  │
│  - lat/lng  │         └──────────────┘         │ - lat/lng   │
└─────────────┘                                   └─────────────┘
      │                                                  │
      │ 1:N                                         1:N │
      ▼                                                  ▼
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│ broadcasts  │────────▶│broadcast_resp│◀────────│   offers    │
│             │  1:N    │              │   N:1   │             │
│-broadcastId │         │ - responseId │         │  - offerId  │
│- productId  │         │- merchantId  │         │ - productId │
│- userLat/Lng│         │ - response   │         │ - radius    │
└─────────────┘         └──────────────┘         └─────────────┘
      │                                                  │
      │ 1:N                                         1:N │
      ▼                                                  ▼
┌─────────────┐                                   ┌─────────────┐
│   orders    │                                   │reservations │
│             │                                   │             │
│  - orderId  │                                   │-reservationId│
│  - userId   │                                   │ - offerId   │
│  - status   │                                   │ - userId    │
└─────────────┘                                   └─────────────┘

┌─────────────┐         ┌──────────────┐
│ categories  │────────▶│   products   │
│             │  1:N    │              │
│ - categoryId│         │  - productId │
│ - parentId  │         │ - categoryId │
│ - level     │         │ - name       │
└─────────────┘         └──────────────┘
      │
      │ Self-referencing (Tree)
      └──────┐
             │
             ▼
       (parentId)

┌─────────────┐         ┌──────────────┐
│   profiles  │────────▶│support_ticket│
│             │  1:N    │              │
│  - userId   │         │  - ticketId  │
└─────────────┘         │  - messages[]│
                        └──────────────┘
```

### 3.3 Access Patterns & Indexes

#### profiles Table
**Primary Key**: userId (PK)

**Access Patterns**:
- Get user by ID: Query by PK
- Update user location: Update by PK

#### merchants Table
**Primary Key**: merchantId (PK)

**GSI-1**: categoryId (PK) + merchantId (SK)
- Access Pattern: Find merchants by category

**GSI-2**: verificationStatus (PK) + createdAt (SK)
- Access Pattern: Get pending merchant verifications

**Access Patterns**:
- Get merchant by ID: Query by PK
- Find merchants by category: Query GSI-1
- Get pending verifications: Query GSI-2 where status = 'pending'
- Find nearby merchants: Query by category + filter by lat/lng using Location Service

#### broadcasts Table
**Primary Key**: broadcastId (PK)

**GSI-1**: userId (PK) + createdAt (SK)
- Access Pattern: Get user's broadcast history

**GSI-2**: status (PK) + createdAt (SK)
- Access Pattern: Get active broadcasts

**TTL**: expiresAt (auto-delete expired broadcasts)

**Access Patterns**:
- Get broadcast by ID: Query by PK
- Get user's broadcasts: Query GSI-1
- Get active broadcasts: Query GSI-2 where status = 'active'

#### orders Table
**Primary Key**: orderId (PK)

**GSI-1**: userId (PK) + createdAt (SK)
- Access Pattern: Get user's order history

**GSI-2**: merchantId (PK) + status (SK)
- Access Pattern: Get merchant's orders by status

**Access Patterns**:
- Get order by ID: Query by PK
- Get user's orders: Query GSI-1
- Get merchant's pending orders: Query GSI-2 where status = 'pending'

#### offers Table
**Primary Key**: offerId (PK)

**GSI-1**: merchantId (PK) + createdAt (SK)
- Access Pattern: Get merchant's offers

**GSI-2**: isActive (PK) + validUntil (SK)
- Access Pattern: Get active offers

**Access Patterns**:
- Get offer by ID: Query by PK
- Get merchant's offers: Query GSI-1
- Get nearby offers: Query GSI-2 + filter by location

#### support_tickets Table
**Primary Key**: ticketId (PK)

**GSI-1**: userId (PK) + status (SK)
- Access Pattern: Get user's tickets

**GSI-2**: status (PK) + createdAt (SK)
- Access Pattern: Get tickets by status (admin view)

---

## 4. API DESIGN

### 4.1 REST API Design Principles

1. **RESTful Conventions**: Use standard HTTP methods (GET, POST, PUT, DELETE)
2. **Resource-Based URLs**: `/resources/{id}/sub-resources`
3. **Versioning**: `/v1/` prefix for future compatibility
4. **Consistent Response Format**: Standard success/error structure
5. **Pagination**: Cursor-based for large datasets
6. **Rate Limiting**: 100 requests/minute per user

### 4.2 Standard Response Format

#### Success Response
```json
{
  "success": true,
  "data": {
    // Response payload
  },
  "meta": {
    "timestamp": "2026-02-27T12:00:00Z",
    "requestId": "req_abc123"
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Product ID is required",
    "details": {
      "field": "productId",
      "constraint": "required"
    }
  },
  "meta": {
    "timestamp": "2026-02-27T12:00:00Z",
    "requestId": "req_abc123"
  }
}
```

#### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "nextCursor": "eyJsYXN0S2V5IjoiYWJjMTIzIn0=",
      "hasMore": true,
      "total": 150
    }
  }
}
```

### 4.3 Authentication Flow

```
┌──────────┐                                    ┌──────────┐
│  Client  │                                    │ Cognito  │
└────┬─────┘                                    └────┬─────┘
     │                                                │
     │  1. POST /auth/register                       │
     │  { email, password, name }                    │
     ├──────────────────────────────────────────────▶│
     │                                                │
     │  2. Create user in Cognito                    │
     │◀──────────────────────────────────────────────┤
     │  { userId, token, refreshToken }              │
     │                                                │
     │  3. Store profile in DynamoDB                 │
     │                                                │
     │  4. Subsequent requests with token            │
     │  Authorization: Bearer {token}                │
     ├──────────────────────────────────────────────▶│
     │                                                │
     │  5. Validate token                            │
     │◀──────────────────────────────────────────────┤
     │                                                │
     │  6. Token expires (1 hour)                    │
     │                                                │
     │  7. POST /auth/refresh                        │
     │  { refreshToken }                             │
     ├──────────────────────────────────────────────▶│
     │                                                │
     │  8. New token pair                            │
     │◀──────────────────────────────────────────────┤
     │  { token, refreshToken }                      │
     │                                                │
```

### 4.4 Broadcast Flow Design

```
┌──────┐         ┌─────────┐         ┌──────────┐         ┌──────────┐
│ User │         │   API   │         │ WebSocket│         │ Merchant │
└──┬───┘         └────┬────┘         └────┬─────┘         └────┬─────┘
   │                  │                   │                     │
   │ 1. Find Near Me  │                   │                     │
   ├─────────────────▶│                   │                     │
   │ POST /broadcasts │                   │                     │
   │                  │                   │                     │
   │ 2. Create broadcast in DB            │                     │
   │                  │                   │                     │
   │ 3. Query nearby merchants            │                     │
   │                  │ (Location Service)│                     │
   │                  │                   │                     │
   │ 4. Send via WebSocket                │                     │
   │                  ├──────────────────▶│                     │
   │                  │                   │ 5. Push to merchant │
   │                  │                   ├────────────────────▶│
   │                  │                   │                     │
   │ 6. Return broadcastId                │                     │
   │◀─────────────────┤                   │                     │
   │                  │                   │                     │
   │ 7. Merchant responds                 │                     │
   │                  │                   │◀────────────────────┤
   │                  │                   │ POST /broadcasts/   │
   │                  │                   │ {id}/responses      │
   │                  │                   │                     │
   │ 8. Store response in DB              │                     │
   │                  │◀──────────────────┤                     │
   │                  │                   │                     │
   │ 9. Push to user  │                   │                     │
   │◀─────────────────┼───────────────────┤                     │
   │                  │                   │                     │