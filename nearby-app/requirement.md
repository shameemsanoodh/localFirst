# NearBy – Requirements Document

## Overview

NearBy is a local commerce broadcasting platform that connects users, merchants, and administrators. The system must be restructured from a **single monolithic SPA** into **three independent web applications** — each tailored for its specific role — while sharing the same backend API and database.

---

## Problem Statement

The current single-app architecture causes **navigation conflicts** — pressing back from a merchant/admin page navigates to user pages. All roles share one bundle, increasing load times and creating UX issues with mixed navigation stacks.

---

## Application Structure

### 1. User App (`/frontend` – existing, to be trimmed)
- **Purpose**: Consumer-facing app for discovering local products, AI-powered search, and broadcasting demand.
- **Features**:
  - Home page with location detection, categories, nearby shops, offer cards
  - AI-powered text, voice, and image search
  - Broadcast creation and radar tracking
  - Offers browsing and categories
  - User account and profile management
  - PWA support for mobile

### 2. Merchant App (`/merchant-frontend` – new Vite app)
- **Purpose**: Merchant portal for managing orders, replying to broadcasts, managing products/inventory.
- **Features**:
  - Merchant login and onboarding
  - Live order inbox (incoming broadcasts matching merchant's category/radius)
  - Reply to broadcasts with offers (price, note, ETA)
  - Product/inventory management (CRUD)
  - Merchant dashboard with stats (orders, acceptance rate, revenue)
  - Merchant profile management
  - AI search results view (what users are searching for nearby)

### 3. Admin App (`/admin-frontend` – new Vite app)
- **Purpose**: Full monitoring dashboard for administrators.
- **Features**:
  - Admin login
  - Overview dashboard with KPI cards (users, merchants, broadcasts, acceptance rate)
  - User management (list, search, view, activate/deactivate)
  - Merchant management (approve, deactivate, view profiles)
  - Broadcast log (inspect all broadcasts, AI decisions, offers)
  - Analytics and locality intelligence
  - Category management

---

## Shared Infrastructure

### Backend (unchanged)
- **Same Serverless backend** (AWS Lambda + API Gateway)
- **Same DynamoDB tables** (users, merchants, broadcasts, orders, offers, etc.)
- **Same authentication** (JWT via `authStore`, Cognito)
- Each app points to the same `API_BASE_URL`

### Shared Code (via copy, not monorepo)
- `types/` – TypeScript type definitions
- `services/api.ts` – Axios instance with auth interceptor
- `store/authStore.ts` – Zustand auth store with persist
- `utils/constants.ts` – Shared constants (API URL, roles, statuses)

---

## Non-Functional Requirements

- Each app builds independently (`npm run build`)
- Each app runs on a different port locally (User: 5173, Merchant: 5174, Admin: 5175)
- Each app can be deployed to a separate S3/CloudFront distribution
- Login redirects should stay within each app's domain
- No cross-app navigation (no links between user/merchant/admin apps)
- Each app has its own PWA manifest and branding
