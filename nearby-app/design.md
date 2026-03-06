# NearBy – Design Document

## Architecture: Three Independent SPAs → One Backend

```
┌────────────────────────────────────────────────────────────────────┐
│                        AWS Backend (shared)                        │
│  Lambda (auth, broadcasts, orders, merchant, admin, ai, etc.)     │
│  API Gateway → DynamoDB, S3, Bedrock, Cognito, Location Service   │
└──────────┬────────────────────┬────────────────────┬───────────────┘
           │                    │                    │
    ┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐
    │  User App   │     │ Merchant App│     │  Admin App  │
    │  :5173      │     │  :5174      │     │  :5175      │
    │  /frontend  │     │  /merchant- │     │  /admin-    │
    │             │     │  frontend   │     │  frontend   │
    └─────────────┘     └─────────────┘     └─────────────┘
```

---

## Directory Structure

```
nearby-app/
├── backend/                    # Shared backend (unchanged)
│   ├── serverless.yml
│   └── src/
├── frontend/                   # USER APP (trimmed — no merchant/admin)
│   ├── src/
│   │   ├── App.tsx             # User routes only
│   │   ├── pages/user/         # Home, Search, Categories, etc.
│   │   ├── pages/auth/         # Login, Signup, UserOnboarding
│   │   ├── components/         # User UI components
│   │   ├── services/           # API services (user-relevant)
│   │   ├── store/              # Auth + location + UI stores
│   │   ├── hooks/              # User hooks only
│   │   └── types/              # Shared types
│   └── package.json
├── merchant-frontend/          # MERCHANT APP (new Vite app)
│   ├── src/
│   │   ├── App.tsx             # Merchant routes only
│   │   ├── pages/              # MerchantHome, Products, Stats, etc.
│   │   ├── components/         # Merchant-specific UI
│   │   ├── services/           # API + merchant services
│   │   ├── store/              # Auth store (shared) + merchant store
│   │   ├── hooks/              # Merchant hooks
│   │   └── types/              # Shared types
│   └── package.json
├── admin-frontend/             # ADMIN APP (new Vite app)
│   ├── src/
│   │   ├── App.tsx             # Admin routes only
│   │   ├── pages/              # AdminDashboard
│   │   ├── components/         # Admin-specific UI
│   │   ├── services/           # API + admin services
│   │   ├── store/              # Auth store (shared)
│   │   ├── hooks/              # Admin hooks
│   │   └── types/              # Shared types
│   └── package.json
└── requirement.md / design.md / TASK_MASTER.md
```

---

## Routing Design

### User App (`/frontend`)
| Path | Page | Auth |
|------|------|------|
| `/` | Home | No |
| `/search` | AI Search | No |
| `/categories` | Categories | No |
| `/offers` | Offers | No |
| `/account` | Account | Yes |
| `/broadcast` | Broadcast | Yes |
| `/broadcast/radar/:id` | Radar | Yes |
| `/login` | Login | No |
| `/signup` | Signup | No |
| `/onboarding` | User Onboarding | No |

### Merchant App (`/merchant-frontend`)
| Path | Page | Auth |
|------|------|------|
| `/` | Dashboard/Home | Yes (merchant) |
| `/login` | Merchant Login | No |
| `/onboarding` | Merchant Onboarding | No |
| `/products` | Product Management | Yes |
| `/stats` | Statistics | Yes |
| `/profile` | Merchant Profile | Yes |
| `/orders` | Order Inbox | Yes |
| `/broadcast/:id` | Broadcast Detail | Yes |

### Admin App (`/admin-frontend`)
| Path | Page | Auth |
|------|------|------|
| `/` | Dashboard | Yes (admin) |
| `/login` | Admin Login | No |
| `/users` | User Management | Yes |
| `/merchants` | Merchant Management | Yes |
| `/broadcasts` | Broadcast Log | Yes |
| `/categories` | Category Management | Yes |
| `/analytics` | Analytics | Yes |

---

## Shared Module Strategy

Each app copies (not symlinks) these shared files to maintain independence:

### Must-Have Shared Files
1. **`services/api.ts`** – Axios instance with JWT interceptor, token refresh
2. **`store/authStore.ts`** – Zustand auth state with localStorage persist
3. **`types/`** – All TypeScript type definitions (user, merchant, order, broadcast, category)
4. **`utils/constants.ts`** – API_BASE_URL, roles, statuses, categories

### Per-App Customization
- **User App**: Keeps `locationStore`, `broadcastStore`, `uiStore`, user hooks, search/broadcast components
- **Merchant App**: Gets `useMerchantAPI`, `useMerchantOrders`, `useMerchantProfile`, merchant components
- **Admin App**: Gets `admin.service.ts`, admin dashboard component

---

## Authentication Flow

Each app handles its own auth:
- Login page within each app
- Auth token stored in `localStorage` under `auth-storage` key
- Role check on login: if role doesn't match app type, show error (not redirect to another app)
- Logout clears localStorage and returns to login page within the same app

---

## Deployment Strategy

```
CloudFront Distribution 1 → S3 (user-app)     → nearby.example.com
CloudFront Distribution 2 → S3 (merchant-app)  → merchant.nearby.example.com
CloudFront Distribution 3 → S3 (admin-app)     → admin.nearby.example.com
```

All three point to the same API Gateway backend.
