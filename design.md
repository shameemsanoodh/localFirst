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
```

---

## 5. UI/UX DESIGN

### 5.1 Design System

#### 5.1.1 Color Palette

**Primary Colors**:
- Blue Primary: `#2563EB` (rgb(37, 99, 235))
- Blue Light: `#60A5FA` (rgb(96, 165, 250))
- Blue Dark: `#1E40AF` (rgb(30, 64, 175))
- Coral Primary: `#FF6B6B` (rgb(255, 107, 107))
- Coral Light: `#FF8787` (rgb(255, 135, 135))
- Coral Dark: `#FA5252` (rgb(250, 82, 82))

**Neutral Colors**:
- Background: `#F8FAFC` (rgb(248, 250, 252))
- Surface: `#FFFFFF` (rgb(255, 255, 255))
- Border: `#E2E8F0` (rgb(226, 232, 240))
- Text Primary: `#1E293B` (rgb(30, 41, 59))
- Text Secondary: `#64748B` (rgb(100, 116, 139))
- Text Disabled: `#94A3B8` (rgb(148, 163, 184))

**Semantic Colors**:
- Success: `#10B981` (rgb(16, 185, 129))
- Warning: `#F59E0B` (rgb(245, 158, 11))
- Error: `#EF4444` (rgb(239, 68, 68))
- Info: `#3B82F6` (rgb(59, 130, 246))

#### 5.1.2 Typography

**Font Stack**: 
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
```

**Type Scale**:
- Display: 48px / 3rem, Bold, Line-height: 1.2
- H1: 32px / 2rem, Bold, Line-height: 1.25
- H2: 24px / 1.5rem, Semibold, Line-height: 1.3
- H3: 20px / 1.25rem, Semibold, Line-height: 1.4
- Body Large: 18px / 1.125rem, Regular, Line-height: 1.6
- Body: 16px / 1rem, Regular, Line-height: 1.5
- Body Small: 14px / 0.875rem, Regular, Line-height: 1.5
- Caption: 12px / 0.75rem, Regular, Line-height: 1.4
- Overline: 10px / 0.625rem, Medium, Line-height: 1.6, Uppercase

#### 5.1.3 Spacing System

**Base Unit**: 4px

**Scale**:
- xs: 4px (0.25rem)
- sm: 8px (0.5rem)
- md: 16px (1rem)
- lg: 24px (1.5rem)
- xl: 32px (2rem)
- 2xl: 48px (3rem)
- 3xl: 64px (4rem)

#### 5.1.4 Border Radius

- sm: 4px
- md: 8px
- lg: 12px
- xl: 16px
- full: 9999px (circular)

#### 5.1.5 Shadows

```css
/* Elevation 1 */
box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);

/* Elevation 2 */
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);

/* Elevation 3 */
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);

/* Elevation 4 */
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
```

### 5.2 Component Specifications

#### 5.2.1 Button Component

**Variants**:

```jsx
// Primary Button
<button className="
  bg-blue-600 hover:bg-blue-700 active:bg-blue-800
  text-white font-semibold
  px-6 py-3 rounded-lg
  shadow-md hover:shadow-lg
  transition-all duration-200
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Primary Action
</button>

// Secondary Button
<button className="
  bg-white hover:bg-gray-50 active:bg-gray-100
  text-blue-600 font-semibold
  border-2 border-blue-600
  px-6 py-3 rounded-lg
  transition-all duration-200
">
  Secondary Action
</button>

// Coral Accent Button
<button className="
  bg-coral-500 hover:bg-coral-600 active:bg-coral-700
  text-white font-semibold
  px-6 py-3 rounded-lg
  shadow-md hover:shadow-lg
  transition-all duration-200
">
  Find Near Me
</button>

// Icon Button
<button className="
  w-10 h-10 rounded-full
  bg-gray-100 hover:bg-gray-200
  flex items-center justify-center
  transition-colors duration-200
">
  <Icon />
</button>
```

**Sizes**:
- Small: px-4 py-2, text-sm
- Medium: px-6 py-3, text-base (default)
- Large: px-8 py-4, text-lg

#### 5.2.2 Card Component

```jsx
<div className="
  bg-white rounded-xl
  shadow-md hover:shadow-lg
  transition-shadow duration-200
  overflow-hidden
">
  {/* Card content */}
</div>
```

#### 5.2.3 Input Component

```jsx
<div className="space-y-2">
  <label className="
    block text-sm font-medium text-gray-700
  ">
    Label
  </label>
  <input className="
    w-full px-4 py-3
    border border-gray-300 rounded-lg
    focus:ring-2 focus:ring-blue-500 focus:border-transparent
    outline-none
    transition-all duration-200
    placeholder:text-gray-400
  " 
  placeholder="Enter value"
  />
  <p className="text-sm text-gray-500">Helper text</p>
</div>
```

#### 5.2.4 Bottom Navigation

```jsx
<nav className="
  fixed bottom-0 left-0 right-0
  bg-white border-t border-gray-200
  px-4 py-2
  flex justify-around items-center
  z-50
">
  <NavItem icon={HomeIcon} label="Home" active />
  <NavItem icon={GridIcon} label="Categories" />
  <NavItem icon={SearchIcon} label="Search" large />
  <NavItem icon={TagIcon} label="Offers" />
  <NavItem icon={UserIcon} label="Account" />
</nav>
```

### 5.3 Screen Layouts

#### 5.3.1 Home Screen

```
┌─────────────────────────────────────┐
│  [Logo]              [Profile Icon] │ ← Header
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐ │
│  │   Hero Section                │ │
│  │   "Find What You Need,        │ │
│  │    Right Around You"          │ │
│  │   [Animated Illustration]     │ │
│  └───────────────────────────────┘ │
│                                     │
│  Popular Categories                 │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │ 🍕  │ │ 🛒  │ │ 🏥  │ │ 🔧  │  │
│  │Food │ │Shop │ │Med  │ │Serv │  │
│  └─────┘ └─────┘ └─────┘ └─────┘  │
│                                     │
│  Nearby Offers                      │
│  ┌───────────────────────────────┐ │
│  │ [Image]                       │ │
│  │ 50% Off Fresh Strawberries    │ │
│  │ ⏱ 2h left  📍 1.2 km          │ │
│  └───────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ [🏠] [📁] [🔍] [🏷️] [👤]          │ ← Bottom Nav
└─────────────────────────────────────┘
```

#### 5.3.2 Product Detail Screen

```
┌─────────────────────────────────────┐
│  [← Back]                           │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐ │
│  │                               │ │
│  │     [Product Image]           │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│                                     │
│  Fresh Organic Tomatoes             │
│  Home > Vegetables > Tomatoes       │
│                                     │
│  Description:                       │
│  Lorem ipsum dolor sit amet...      │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   🎯 Find Near Me              │ │
│  └───────────────────────────────┘ │
│                                     │
│  Similar Products                   │
│  [Card] [Card] [Card]               │
│                                     │
└─────────────────────────────────────┘
```

#### 5.3.3 Broadcast Screen (Radar Animation)

```
┌─────────────────────────────────────┐
│  Finding Nearby Merchants...        │
├─────────────────────────────────────┤
│                                     │
│         ┌─────────────┐             │
│      ╱  │             │  ╲          │
│    ╱    │   📍 You    │    ╲        │
│  ╱      │             │      ╲      │
│ ────────┴─────────────┴──────────   │
│  ╲                           ╱      │
│    ╲    [Radar Waves]      ╱        │
│      ╲                   ╱          │
│         ╲             ╱             │
│                                     │
│  Searching within 5 km...           │
│  ⏱ 30 seconds remaining             │
│                                     │
│  [Cancel Search]                    │
│                                     │
└─────────────────────────────────────┘
```

#### 5.3.4 Merchant Response Cards

```
┌─────────────────────────────────────┐
│  3 Merchants Responded              │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐ │
│  │ ✅ Fresh Mart                 │ │
│  │ ₹38/kg • 1.2 km               │ │
│  │ "Available now"               │ │
│  │ [Navigate] [Order]            │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ ✅ Green Grocers              │ │
│  │ ₹40/kg • 2.5 km               │ │
│  │ "Fresh stock just arrived"    │ │
│  │ [Navigate] [Order]            │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 🕐 Organic Store              │ │
│  │ ₹45/kg • 0.8 km               │ │
│  │ "Available in 2 hours"        │ │
│  │ [Navigate] [Schedule]         │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

#### 5.3.5 Merchant Dashboard

```
┌─────────────────────────────────────┐
│  Dashboard                          │
│  [Orders] [Offers] [Analytics]      │
├─────────────────────────────────────┤
│                                     │
│  Pending Orders (5)                 │
│  ┌───────────────────────────────┐ │
│  │ Order #1234                   │ │
│  │ Tomatoes • 2kg                │ │
│  │ John Doe • 1.2 km             │ │
│  │ [Accept] [Reject] [Schedule]  │ │
│  └───────────────────────────────┘ │
│                                     │
│  Active Broadcasts (3)              │
│  🔔 New request for "Milk"          │
│  🔔 New request for "Bread"         │
│                                     │
│  Today's Stats                      │
│  📦 12 Orders  💰 ₹2,450            │
│  👁 45 Views   ❤️ 23 Likes          │
│                                     │
└─────────────────────────────────────┘
```

### 5.4 Animation Specifications

#### 5.4.1 Radar Animation

**Implementation**:
```jsx
// CSS Animation
@keyframes radar-pulse {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.radar-wave {
  animation: radar-pulse 2s ease-out infinite;
}
```

**Behavior**:
- 3 concentric circles expanding outward
- Each wave starts 0.5s after the previous
- Continuous loop during broadcast
- Blue color (#2563EB) with decreasing opacity

#### 5.4.2 Card Hover Effects

```css
.card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

#### 5.4.3 Page Transitions

```jsx
// Framer Motion example
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  {/* Page content */}
</motion.div>
```

#### 5.4.4 Loading States

**Skeleton Loader**:
```jsx
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
</div>
```

**Spinner**:
```jsx
<div className="
  w-8 h-8 border-4 border-blue-200 border-t-blue-600
  rounded-full animate-spin
"></div>
```

---

## 6. REAL-TIME COMMUNICATION DESIGN

### 6.1 WebSocket Architecture

#### 6.1.1 Connection Management

```javascript
// WebSocket Service
class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.heartbeatInterval = null;
  }

  connect(token) {
    const wsUrl = `wss://api.nearby.com/ws?token=${token}`;
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
    this.ws.onerror = this.handleError.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
  }

  handleOpen() {
    console.log('WebSocket connected');
    this.reconnectAttempts = 0;
    this.startHeartbeat();
  }

  handleMessage(event) {
    const message = JSON.parse(event.data);
    this.emit(message.event, message.data);
  }

  handleError(error) {
    console.error('WebSocket error:', error);
  }

  handleClose() {
    console.log('WebSocket disconnected');
    this.stopHeartbeat();
    this.reconnect();
  }

  reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      setTimeout(() => this.connect(), delay);
    }
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.send({ action: 'ping' });
    }, 30000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  subscribe(channel) {
    this.send({ action: 'subscribe', channel });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
```

#### 6.1.2 Message Types

**Client → Server**:
```javascript
// Subscribe to broadcasts (Merchant)
{
  "action": "subscribe_broadcasts",
  "merchantId": "merchant123",
  "categories": ["cat1", "cat2"]
}

// Unsubscribe
{
  "action": "unsubscribe_broadcasts",
  "merchantId": "merchant123"
}

// Heartbeat
{
  "action": "ping"
}
```

**Server → Client**:
```javascript
// New broadcast notification (to Merchant)
{
  "event": "new_broadcast",
  "data": {
    "broadcastId": "bc123",
    "product": {
      "productId": "p123",
      "name": "Fresh Tomatoes",
      "image": "https://..."
    },
    "user": {
      "userId": "u123",
      "name": "John Doe",
      "lat": 12.34,
      "lng": 56.78
    },
    "distance": 2.5,
    "expiresAt": "2026-02-27T12:30:00Z"
  }
}

// Merchant response (to User)
{
  "event": "broadcast_response",
  "data": {
    "broadcastId": "bc123",
    "merchant": {
      "merchantId": "m123",
      "shopName": "Fresh Mart",
      "lat": 12.35,
      "lng": 56.79,
      "distance": 2.5
    },
    "response": "accept",
    "price": 38,
    "notes": "Available now"
  }
}

// Order status update
{
  "event": "order_status_update",
  "data": {
    "orderId": "o123",
    "status": "approved",
    "timestamp": "2026-02-27T12:00:00Z"
  }
}

// Heartbeat response
{
  "event": "pong"
}
```

### 6.2 Broadcast Matching Algorithm

```javascript
async function matchMerchants(broadcast) {
  const { productId, categoryId, userLat, userLng, radius } = broadcast;
  
  // Step 1: Query merchants by category
  const merchantsByCategory = await db.query({
    TableName: 'merchants',
    IndexName: 'categoryId-index',
    KeyConditionExpression: 'categoryId = :categoryId',
    ExpressionAttributeValues: {
      ':categoryId': categoryId
    }
  });
  
  // Step 2: Filter by verification status
  const verifiedMerchants = merchantsByCategory.Items.filter(
    m => m.verificationStatus === 'verified'
  );
  
  // Step 3: Calculate distances using Location Service
  const merchantsWithDistance = await Promise.all(
    verifiedMerchants.map(async (merchant) => {
      const distance = await calculateDistance(
        userLat, userLng,
        merchant.lat, merchant.lng
      );
      return { ...merchant, distance };
    })
  );
  
  // Step 4: Filter by radius
  const nearbyMerchants = merchantsWithDistance.filter(
    m => m.distance <= radius
  );
  
  // Step 5: Filter by operating hours
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;
  
  const openMerchants = nearbyMerchants.filter(merchant => {
    const [openHour, openMin] = merchant.openTime.split(':').map(Number);
    const [closeHour, closeMin] = merchant.closeTime.split(':').map(Number);
    const openTimeMinutes = openHour * 60 + openMin;
    const closeTimeMinutes = closeHour * 60 + closeMin;
    
    return currentTimeMinutes >= openTimeMinutes && 
           currentTimeMinutes <= closeTimeMinutes;
  });
  
  // Step 6: Sort by distance
  openMerchants.sort((a, b) => a.distance - b.distance);
  
  return openMerchants;
}
```

---

## 7. AI INTEGRATION DESIGN

### 7.1 Amazon Bedrock Integration

#### 7.1.1 Product Identification from Image

```javascript
async function identifyProductFromImage(imageBase64) {
  const prompt = `
    Analyze this image and identify the product shown.
    
    Provide your response in the following JSON format:
    {
      "productName": "specific product name",
      "category": "most relevant category from the list",
      "confidence": 0.0-1.0,
      "attributes": {
        "color": "if visible",
        "size": "if determinable",
        "brand": "if visible"
      },
      "alternatives": ["alternative interpretation 1", "alternative 2"]
    }
    
    Available categories: ${JSON.stringify(categories)}
  `;
  
  const response = await bedrock.invokeModel({
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ]
    })
  });
  
  const result = JSON.parse(response.body);
  return JSON.parse(result.content[0].text);
}
```

#### 7.1.2 Smart Search Query Analysis

```javascript
async function analyzeSearchQuery(query, categories) {
  const prompt = `
    User search query: "${query}"
    
    Available categories: ${JSON.stringify(categories)}
    
    Analyze this query and provide:
    1. The most relevant category
    2. Extracted product attributes
    3. Follow-up questions if the query is ambiguous
    4. Suggested search keywords
    
    Response format (JSON):
    {
      "detectedCategory": "category name or null",
      "confidence": 0.0-1.0,
      "attributes": {
        "extracted": "attributes"
      },
      "followUpQuestions": ["question 1", "question 2"],
      "searchKeywords": ["keyword1", "keyword2"],
      "isAmbiguous": true/false
    }
  `;
  
  const response = await bedrock.invokeModel({
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 500,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });
  
  const result = JSON.parse(response.body);
  return JSON.parse(result.content[0].text);
}
```

### 7.2 Search Enhancement Flow

```
User Input → AI Analysis → Category Detection → Product Matching
     │              │              │                    │
     │              │              │                    ▼
     │              │              │            DynamoDB Query
     │              │              │                    │
     │              │              │                    ▼
     │              │              │            Results Ranking
     │              │              │                    │
     │              │              ▼                    │
     │              │      Follow-up Questions         │
     │              │              │                    │
     │              ▼              │                    │
     │      Confidence Score       │                    │
     │              │              │                    │
     └──────────────┴──────────────┴────────────────────┘
                            │
                            ▼
                    Display to User
```

---

## 8. SECURITY DESIGN

### 8.1 Authentication & Authorization

#### 8.1.1 JWT Token Structure

```javascript
// Access Token (1 hour expiry)
{
  "sub": "user123",
  "email": "user@example.com",
  "roles": ["user"],
  "iat": 1709035200,
  "exp": 1709038800
}

// Refresh Token (30 days expiry)
{
  "sub": "user123",
  "type": "refresh",
  "iat": 1709035200,
  "exp": 1711627200
}
```

#### 8.1.2 Authorization Middleware

```javascript
async function authorizeRequest(event, requiredRole) {
  // Extract token from Authorization header
  const token = event.headers.Authorization?.replace('Bearer ', '');
  
  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'No token provided' })
    };
  }
  
  try {
    // Verify token with Cognito
    const decoded = await verifyToken(token);
    
    // Check role
    if (requiredRole && !decoded.roles.includes(requiredRole)) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Insufficient permissions' })
      };
    }
    
    // Attach user info to event
    event.user = decoded;
    return null; // Authorization successful
    
  } catch (error) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid token' })
    };
  }
}
```

### 8.2 Data Security

#### 8.2.1 S3 Signed URLs

```javascript
async function generateSignedUploadUrl(userId, fileType) {
  const key = `uploads/${userId}/${Date.now()}-${uuidv4()}.${fileType}`;
  
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Expires: 300, // 5 minutes
    ContentType: `image/${fileType}`,
    ACL: 'private'
  };
  
  const signedUrl = await s3.getSignedUrlPromise('putObject', params);
  
  return {
    uploadUrl: signedUrl,
    fileKey: key,
    publicUrl: `https://${process.env.CDN_DOMAIN}/${key}`
  };
}
```

#### 8.2.2 Input Validation

```javascript
const Joi = require('joi');

const broadcastSchema = Joi.object({
  productId: Joi.string().required(),
  userLat: Joi.number().min(-90).max(90).required(),
  userLng: Joi.number().min(-180).max(180).required(),
  radius: Joi.number().min(0.5).max(50).default(5)
});

function validateInput(data, schema) {
  const { error, value } = schema.validate(data);
  
  if (error) {
    throw new ValidationError(error.details[0].message);
  }
  
  return value;
}
```

### 8.3 Rate Limiting

```javascript
// API Gateway Usage Plan
{
  "throttle": {
    "rateLimit": 100,  // requests per second
    "burstLimit": 200  // burst capacity
  },
  "quota": {
    "limit": 10000,    // requests per day
    "period": "DAY"
  }
}

// Custom rate limiting in Lambda
async function checkRateLimit(userId) {
  const key = `ratelimit:${userId}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, 60); // 1 minute window
  }
  
  if (count > 100) {
    throw new RateLimitError('Too many requests');
  }
}
```

---

## 9. PERFORMANCE OPTIMIZATION

### 9.1 Frontend Optimization

#### 9.1.1 Code Splitting

```javascript
// React lazy loading
const Home = lazy(() => import('./pages/Home'));
const Categories = lazy(() => import('./pages/Categories'));
const Search = lazy(() => import('./pages/Search'));
const MerchantDashboard = lazy(() => import('./pages/MerchantDashboard'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/search" element={<Search />} />
        <Route path="/merchant" element={<MerchantDashboard />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Suspense>
  );
}
```

#### 9.1.2 Image Optimization

```javascript
// Lazy loading images
<img 
  src={placeholder} 
  data-src={actualImage}
  loading="lazy"
  className="lazy-image"
  alt="Product"
/>

// Responsive images
<picture>
  <source 
    media="(max-width: 640px)" 
    srcSet={`${imageUrl}?w=640`} 
  />
  <source 
    media="(max-width: 1024px)" 
    srcSet={`${imageUrl}?w=1024`} 
  />
  <img src={`${imageUrl}?w=1920`} alt="Product" />
</picture>
```

#### 9.1.3 Service Worker Caching

```javascript
// service-worker.js
const CACHE_NAME = 'nearby-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

### 9.2 Backend Optimization

#### 9.2.1 DynamoDB Query Optimization

```javascript
// Bad: Scan entire table
const allOrders = await db.scan({
  TableName: 'orders',
  FilterExpression: 'userId = :userId'
});

// Good: Use GSI
const userOrders = await db.query({
  TableName: 'orders',
  IndexName: 'userId-createdAt-index',
  KeyConditionExpression: 'userId = :userId',
  ExpressionAttributeValues: {
    ':userId': userId
  },
  ScanIndexForward: false,
  Limit: 20
});
```

#### 9.2.2 Lambda Optimization

```javascript
// Connection reuse
let dbClient;

function getDbClient() {
  if (!dbClient) {
    dbClient = new DynamoDB.DocumentClient({
      maxRetries: 3,
      httpOptions: {
        timeout: 5000,
        connectTimeout: 3000
      }
    });
  }
  return dbClient;
}

// Parallel execution
async function getBroadcastDetails(broadcastId) {
  const [broadcast, responses, product] = await Promise.all([
    getBroadcast(broadcastId),
    getResponses(broadcastId),
    getProduct(productId)
  ]);
  
  return { broadcast, responses, product };
}
```

#### 9.2.3 Caching Strategy

```javascript
// CloudFront caching headers
{
  'Cache-Control': 'public, max-age=3600',  // 1 hour
  'ETag': generateETag(content),
  'Last-Modified': lastModifiedDate
}

// API Gateway caching
{
  "cacheKeyParameters": ["method.request.path.id"],
  "cacheTtlInSeconds": 300,
  "cacheDataEncrypted": true
}
```

---

## 10. MONITORING & OBSERVABILITY

### 10.1 CloudWatch Metrics

```javascript
// Custom metrics
await cloudwatch.putMetricData({
  Namespace: 'NearBy/Application',
  MetricData: [
    {
      MetricName: 'BroadcastCreated',
      Value: 1,
      Unit: 'Count',
      Timestamp: new Date(),
      Dimensions: [
        { Name: 'Environment', Value: 'production' },
        { Name: 'Category', Value: categoryId }
      ]
    }
  ]
});
```

### 10.2 Structured Logging

```javascript
function log(level, message, context = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    requestId: context.requestId,
    userId: context.userId,
    ...context
  };
  
  console.log(JSON.stringify(logEntry));
}

// Usage
log('info', 'Broadcast created', {
  requestId: event.requestContext.requestId,
  userId: user.userId,
  broadcastId: broadcast.broadcastId,
  category: broadcast.categoryId
});
```

### 10.3 Error Tracking

```javascript
class ApplicationError extends Error {
  constructor(message, code, statusCode = 500, details = {}) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

function handleError(error, context) {
  log('error', error.message, {
    ...context,
    errorCode: error.code,
    errorStack: error.stack,
    errorDetails: error.details
  });
  
  // Send to error tracking service
  // await errorTracker.captureException(error);
  
  return {
    statusCode: error.statusCode || 500,
    body: JSON.stringify({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message,
        details: error.details
      }
    })
  };
}
```

---

## 11. DEPLOYMENT ARCHITECTURE

### 11.1 Infrastructure as Code (CloudFormation)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Parameters:
  Environment:
    Type: String
    AllowedValues: [dev, staging, prod]
    Default: dev

Resources:
  # API Gateway
  RestApi:
    Type: AWS::Serverless::Api
    Properties:
      StageName: !Ref Environment
      Cors:
        AllowOrigin: "'*'"
        AllowHeaders: "'*'"
      Auth:
        DefaultAuthorizer: CognitoAuthorizer
        Authorizers:
          CognitoAuthorizer:
            UserPoolArn: !GetAtt UserPool.Arn

  # Cognito User Pool
  UserPool:
    Type: AWS::Cognito::UserPool
    Properties:
      UserPoolName: !Sub nearby-users-${Environment}
      AutoVerifiedAttributes:
        - email
      Schema:
        - Name: email
          Required: true
        - Name: name
          Required: true

  # DynamoDB Tables
  ProfilesTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub nearby-profiles-${Environment}
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
      KeySchema:
        - AttributeName: userId
          KeyType: HASH

  # Lambda Functions
  CreateBroadcastFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: lambda/broadcasts/
      Handler: create.handler
      Runtime: nodejs18.x
      Environment:
        Variables:
          BROADCASTS_TABLE: !Ref BroadcastsTable
      Events:
        Api:
          Type: Api
          Properties:
            RestApiId: !Ref RestApi
            Path: /broadcasts
            Method: POST
```

### 11.2 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main, staging, dev]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: |
          npm install
          npm test
          npm run test:e2e

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build frontend
        run: |
          cd frontend
          npm install
          npm run build
      - name: Upload artifacts
        uses: actions/upload-artifact@v2
        with:
          name: build
          path: frontend/build

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - name: Deploy SAM application
        run: |
          sam build
          sam deploy --no-confirm-changeset --no-fail-on-empty-changeset
```

---

## 12. TESTING STRATEGY

### 12.1 Unit Tests

```javascript
// Example: Broadcast matching algorithm test
describe('matchMerchants', () => {
  it('should return merchants within radius', async () => {
    const broadcast = {
      productId: 'p123',
      categoryId: 'cat123',
      userLat: 12.34,
      userLng: 56.78,
      radius: 5
    };
    
    const merchants = await matchMerchants(broadcast);
    
    expect(merchants).toHaveLength(3);
    expect(merchants[0].distance).toBeLessThanOrEqual(5);
  });
  
  it('should filter by operating hours', async () => {
    // Mock current time to 2 AM
    jest.useFakeTimers().setSystemTime(new Date('2026-02-27T02:00:00'));
    
    const merchants = await matchMerchants(broadcast);
    
    // Should not include merchants closed at 2 AM
    expect(merchants).toHaveLength(0);
  });
});
```

### 12.2 Integration Tests

```javascript
// Example: API endpoint test
describe('POST /broadcasts', () => {
  it('should create broadcast and notify merchants', async () => {
    const response = await request(app)
      .post('/broadcasts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productId: 'p123',
        userLat: 12.34,
        userLng: 56.78,
        radius: 5
      });
    
    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('broadcastId');
    
    // Verify WebSocket notification sent
    expect(mockWebSocket.send).toHaveBeenCalled();
  });
});
```

### 12.3 E2E Tests

```javascript
// Example: Cypress test
describe('Broadcast Flow', () => {
  it('should complete full broadcast flow', () => {
    cy.login('user@example.com', 'password');
    cy.visit('/products/p123');
    cy.contains('Find Near Me').click();
    
    // Wait for radar animation
    cy.get('.radar-animation').should('be.visible');
    
    // Wait for responses
    cy.get('.merchant-response-card', { timeout: 10000 })
      .should('have.length.greaterThan', 0);
    
    // Click navigate on first merchant
    cy.get('.merchant-response-card').first()
      .contains('Navigate').click();
    
    // Verify Google Maps opened
    cy.window().its('open').should('be.called');
  });
});
```

---

## 13. REVISION HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-27 | Initial | Complete design document created |

---

**Document Status**: Draft  
**Last Updated**: February 27, 2026  
**Next Review Date**: March 15, 2026

---

*End of Design Document*
