# HyperLocal AI - System Design Document

## Document Information

**Project Name:** HyperLocal AI - Market Intelligence for Neighborhood Retail  
**Document Type:** System Design Specification  
**Version:** 1.0  
**Last Updated:** February 15, 2026  
**Status:** Draft

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Component Design](#component-design)
4. [Database Design](#database-design)
5. [API Design](#api-design)
6. [User Flows](#user-flows)
7. [AI/ML Architecture](#aiml-architecture)
8. [Security Design](#security-design)
9. [Scalability & Performance](#scalability--performance)
10. [Deployment Architecture](#deployment-architecture)
11. [Monitoring & Observability](#monitoring--observability)
12. [Future Enhancements](#future-enhancements)

---

## System Architecture Overview

### High-Level Architecture

The system follows a modern three-tier architecture with microservices pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER (PWA)                     │
├─────────────────────────────────────────────────────────────┤
│  Customer Web App  │  Merchant Web App  │  Admin Dashboard  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND LAYER (Microservices)             │
├─────────────────────────────────────────────────────────────┤
│  API Gateway (Next.js)                                       │
│  ├── Authentication Service (Firebase Auth)                 │
│  ├── Search & Matching Service                              │
│  ├── Notification Service                                   │
│  ├── AI/ML Service (Python FastAPI)                         │
│  └── Analytics Service                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        DATA LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  Firebase Firestore  │  PostgreSQL  │  Redis  │  S3/Storage │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Principles

1. **Separation of Concerns:** Each service handles a specific domain
2. **Scalability:** Stateless services enable horizontal scaling
3. **Resilience:** Graceful degradation and fallback mechanisms
4. **Performance:** Multi-layer caching and optimized queries
5. **Security:** Defense in depth with multiple security layers

---

## Technology Stack

### Frontend Stack

| Component | Technology | Justification |
|-----------|-----------|---------------|
| Framework | Next.js 14 (React) | SSR/SSG for SEO, API routes, excellent DX |
| Styling | Tailwind CSS | Rapid UI development, small bundle size |
| State Management | Zustand | Lightweight, simple API, no boilerplate |
| Maps | Leaflet / Mapbox GL | Open-source, customizable, good performance |
| Charts | Chart.js / Recharts | Rich visualizations for merchant dashboard |
| PWA | next-pwa plugin | Offline support, app-like experience |
| Forms | React Hook Form | Performance, validation, minimal re-renders |
| HTTP Client | Axios | Interceptors, request cancellation |

### Backend Stack

| Component | Technology | Justification |
|-----------|-----------|---------------|
| API Gateway | Next.js API Routes | Unified frontend/backend, serverless |
| AI/ML Service | Python FastAPI | High performance, async, ML ecosystem |
| Authentication | Firebase Auth | OTP, OAuth, managed service |
| Real-time DB | Firebase Firestore | Real-time updates, offline support |
| Analytics DB | PostgreSQL (Supabase) | Complex queries, ACID compliance |
| Caching | Redis | In-memory speed, pub/sub for real-time |
| Job Queue | Bull (Redis-based) | Reliable background job processing |
| File Storage | Firebase Storage / S3 | Scalable object storage |

### AI/ML Stack

| Component | Technology | Justification |
|-----------|-----------|---------------|
| Language | Python 3.11+ | Rich ML ecosystem, type hints |
| ML Framework | scikit-learn | Production-ready, well-documented |
| Time-series | Prophet (Facebook) | Handles seasonality, holidays, trends |
| NLP | HuggingFace Transformers | Pre-trained models, fine-tuning |
| Data Processing | Pandas, NumPy | Industry standard, efficient |
| Model Serving | FastAPI + Docker | REST API, containerized deployment |
| Experiment Tracking | MLflow | Model versioning, experiment tracking |

### Infrastructure & DevOps

| Component | Technology | Justification |
|-----------|-----------|---------------|
| Frontend Hosting | Vercel | Zero-config, edge network, auto-scaling |
| Backend Hosting | Railway / Render | Easy deployment, auto-scaling |
| Database | Firebase, Supabase | Managed services, reduced ops overhead |
| CDN | Vercel Edge Network | Global distribution, low latency |
| CI/CD | GitHub Actions | Native GitHub integration, free tier |
| Monitoring | Sentry, LogRocket | Error tracking, session replay |
| Analytics | Mixpanel, GA4 | User behavior, conversion tracking |
| Load Testing | k6 | Scriptable, developer-friendly |

---

## Component Design

### 1. Search & Matching Service

**Responsibility:** Match customer searches with relevant merchants

**Architecture:**
```
Customer Search → NLP Parser → Geospatial Filter → Merchant Matcher → Notification Dispatcher
```

**Input:**
- Customer search query (string)
- Customer location (latitude, longitude)
- Search radius (meters, default: 1000m)
- Optional filters (price range, brand)

**Processing Logic:**
1. **Query Parsing:**
   - Send query to ML service for NLP parsing
   - Extract: product name, brand, specifications, price intent
   - Confidence scoring for each extracted entity

2. **Merchant Discovery:**
   - Geospatial query: Find merchants within radius
   - Filter by merchant category (based on product type)
   - Rank by: distance, response rate, rating
   - Select top 5-10 merchants

3. **Broadcast:**
   - Create search_request record
   - Queue notification jobs for each merchant
   - Set expiry timer (5 minutes)

**Output:**
- `request_id`: Unique identifier for tracking
- `broadcasted_to`: List of merchant IDs notified
- `estimated_response_time`: Based on historical data

**Technology:**
- Language: TypeScript (Node.js)
- Database: Firestore for real-time updates
- Geospatial: PostGIS functions via PostgreSQL
- Queue: Bull for async notification dispatch

**Performance Targets:**
- Query parsing: <500ms
- Merchant matching: <1s
- Total end-to-end: <2s

---

### 2. AI Demand Forecasting Service

**Responsibility:** Predict future product demand for merchants

**Architecture:**
```
Historical Data → Feature Engineering → Prophet Model → Confidence Scoring → API Response
```

**Input:**
- `merchant_id`: Target merchant
- `product`: Product name (normalized)
- `historical_data`: 7-30 days of search data
- `forecast_horizon`: Days to predict (default: 7)

**Processing Logic:**
1. **Data Aggregation:**
   - Query search_requests for product in merchant's area
   - Aggregate by date: search_count, response_count, conversion_count
   - Include external factors: day of week, holidays, weather

2. **Feature Engineering:**
   - Time features: hour, day_of_week, is_weekend, is_holiday
   - Trend features: 7-day moving average, growth rate
   - Seasonal features: monthly patterns, festival periods
   - External features: weather (temperature, rain), local events

3. **Model Prediction:**
   - Load pre-trained Prophet model for product category
   - Generate forecast with confidence intervals (80%, 95%)
   - Apply business rules (minimum threshold, maximum cap)

4. **Confidence Scoring:**
   - High (>80%): Sufficient historical data, stable patterns
   - Medium (50-80%): Limited data, some volatility
   - Low (<50%): Insufficient data, high uncertainty

**Output:**
```json
{
  "forecast": [
    {
      "date": "2026-02-16",
      "predicted_demand": 12,
      "confidence_interval": [8, 16],
      "confidence_level": "high"
    }
  ],
  "insights": {
    "trend": "increasing",
    "seasonality": "weekend_peak",
    "recommendation": "Stock 15 units for weekend"
  }
}
```

**Technology:**
- Language: Python 3.11+
- Framework: FastAPI for REST API
- ML Library: Prophet (time-series forecasting)
- Data Processing: Pandas, NumPy
- Deployment: Docker container

**Model Retraining:**
- Frequency: Weekly (every Sunday night)
- Trigger: New data availability, accuracy drop
- Validation: MAPE (Mean Absolute Percentage Error) <20%

---

### 3. Pricing Intelligence Service

**Responsibility:** Analyze market pricing and provide recommendations

**Architecture:**
```
Merchant Prices → Market Analysis → Elasticity Calculation → Recommendation Engine → API Response
```

**Input:**
- `product`: Product name (normalized)
- `merchant_id`: Target merchant
- `current_price`: Merchant's current price (optional)
- `location`: Merchant location for regional analysis

**Processing Logic:**
1. **Market Price Aggregation:**
   - Query merchant_responses for product in area (5km radius)
   - Calculate: mean, median, min, max, std_dev
   - Filter outliers (prices beyond 2 standard deviations)

2. **Price Elasticity Analysis:**
   - Correlate price points with search volume
   - Calculate elasticity coefficient: % change in demand / % change in price
   - Identify optimal price point (maximize revenue)

3. **Competitive Positioning:**
   - Compare merchant's price vs market average
   - Identify price gaps (opportunities)
   - Analyze competitor pricing strategies

4. **Recommendation Generation:**
   - Suggest optimal price range
   - Provide reasoning (data-driven insights)
   - Estimate revenue impact

**Output:**
```json
{
  "market_analysis": {
    "average_price": 48.50,
    "median_price": 48.00,
    "price_range": [42, 55],
    "your_price": 52.00,
    "position": "above_average"
  },
  "recommendation": {
    "optimal_price": 47.00,
    "reasoning": "Market average is ₹48.50. Reducing to ₹47 can increase demand by 15%",
    "estimated_impact": {
      "demand_increase": "15%",
      "revenue_increase": "8%"
    }
  },
  "elasticity": {
    "coefficient": -1.2,
    "interpretation": "elastic_demand"
  }
}
```

**Technology:**
- Language: Python 3.11+
- Framework: FastAPI
- ML: scikit-learn (regression models)
- Statistics: SciPy for statistical tests

---

### 4. Notification Service

**Responsibility:** Deliver real-time notifications to merchants and customers

**Architecture:**
```
Notification Request → Priority Queue → Channel Router → Delivery → Status Tracking
```

**Channels:**
1. **Push Notifications:** Firebase Cloud Messaging (primary)
2. **SMS:** Twilio/MSG91 (fallback, critical alerts)
3. **Email:** SendGrid (reports, summaries)
4. **In-App:** WebSocket for real-time updates

**Notification Types:**

**For Merchants:**
- New search request (high priority, immediate)
- Customer reservation (high priority)
- Daily insights summary (low priority, scheduled)
- Payment received (medium priority)

**For Customers:**
- Merchant response received (high priority)
- Reservation confirmed (high priority)
- Product available (medium priority)

**Processing Logic:**
1. **Priority Routing:**
   - High priority: Push + SMS (if no response in 2 min)
   - Medium priority: Push only
   - Low priority: In-app + email

2. **Delivery Optimization:**
   - Check merchant online status (Redis cache)
   - Batch notifications for same merchant
   - Rate limiting to prevent spam

3. **Retry Logic:**
   - Exponential backoff: 1s, 5s, 30s
   - Max retries: 3 attempts
   - Dead letter queue for failed notifications

4. **Status Tracking:**
   - Sent, Delivered, Read, Clicked
   - Store in notification_logs table
   - Analytics for delivery rates

**Technology:**
- Queue: Bull (Redis-based)
- Push: Firebase Cloud Messaging
- SMS: Twilio API
- Email: SendGrid API
- WebSocket: Socket.io for real-time

**Performance Targets:**
- Notification dispatch: <1s
- Push delivery: <3s (95th percentile)
- SMS fallback: <30s

---

### 5. Analytics Service

**Responsibility:** Process and serve business intelligence data

**Architecture:**
```
Raw Events → ETL Pipeline → Data Warehouse → Aggregation → Dashboard API
```

**Data Pipeline:**
1. **Event Collection:**
   - User actions: search, click, purchase
   - Merchant actions: response, update inventory
   - System events: API calls, errors

2. **ETL Process:**
   - Extract: Stream events from Firestore
   - Transform: Clean, normalize, enrich
   - Load: Store in PostgreSQL (time-series optimized)

3. **Aggregation:**
   - Real-time: Redis for live metrics
   - Batch: Daily/weekly aggregations
   - Materialized views for common queries

**Key Metrics Tracked:**

**Merchant Metrics:**
- Response rate, response time
- Conversion rate (response → sale)
- Revenue per search
- Top products searched
- Competitive positioning

**Customer Metrics:**
- Search success rate
- Time to find product
- Repeat usage rate
- Geographic distribution

**System Metrics:**
- API latency (p50, p95, p99)
- Error rates by endpoint
- Database query performance
- ML model accuracy

**Technology:**
- Database: PostgreSQL with TimescaleDB extension
- ETL: Node.js workers + Bull queue
- Caching: Redis for real-time metrics
- Visualization: Chart.js on frontend

---

### 6. Authentication Service

**Responsibility:** User authentication and authorization

**Architecture:**
```
Login Request → Firebase Auth → JWT Token → Role-Based Access Control
```

**Authentication Methods:**
1. **Phone OTP (Primary):**
   - Send OTP via SMS
   - Verify code (6 digits)
   - Create/update user record
   - Issue JWT token

2. **OAuth (Future):**
   - Google Sign-In
   - Facebook Login

**Authorization:**
- Role-based access control (RBAC)
- Roles: customer, merchant, admin
- Permissions stored in custom claims (JWT)

**Session Management:**
- JWT tokens (1 hour expiry)
- Refresh tokens (30 days)
- Token revocation for logout

**Security Features:**
- Rate limiting on OTP requests (3 per hour)
- IP-based fraud detection
- Device fingerprinting
- Suspicious activity alerts

**Technology:**
- Provider: Firebase Authentication
- Token: JWT (JSON Web Tokens)
- Storage: Secure HTTP-only cookies

---

## Database Design

### Database Strategy

**Hybrid Approach:**
- **Firebase Firestore:** Real-time data, operational workloads
- **PostgreSQL:** Analytics, complex queries, historical data
- **Redis:** Caching, session management, real-time counters

### Firestore Collections

#### 1. users (Customers)

```typescript
{
  id: string;                    // Auto-generated UUID
  phone: string;                 // Unique, indexed
  name: string;
  email?: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  preferences: {
    search_radius: number;       // Default: 1000m
    notifications_enabled: boolean;
  };
  created_at: Timestamp;
  last_active: Timestamp;
}
```

**Indexes:**
- `phone` (unique)
- `created_at` (for analytics)

---

#### 2. merchants

```typescript
{
  id: string;                    // Auto-generated UUID
  business_name: string;
  owner_name: string;
  phone: string;                 // Unique, indexed
  email?: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    landmark?: string;
  };
  categories: string[];          // ['grocery', 'medical', 'hardware']
  business_hours: {
    [day: string]: {             // 'monday', 'tuesday', etc.
      open: string;              // '09:00'
      close: string;             // '21:00'
      is_closed: boolean;
    }
  };
  subscription: {
    tier: 'free' | 'standard' | 'premium';
    started_at: Timestamp;
    expires_at: Timestamp;
    auto_renew: boolean;
  };
  metrics: {
    response_rate: number;       // 0-100
    avg_response_time: number;   // Seconds
    total_responses: number;
    total_conversions: number;
    rating: number;              // 0-5
    total_ratings: number;
  };
  online_status: {
    is_online: boolean;
    last_seen: Timestamp;
  };
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Indexes:**
- `phone` (unique)
- `location` (geohash for geospatial queries)
- `categories` (array-contains)
- `subscription.tier`

---

#### 3. search_requests

```typescript
{
  id: string;                    // Auto-generated UUID
  customer_id: string;           // Foreign key to users
  customer_location: {
    latitude: number;
    longitude: number;
  };
  query: {
    raw: string;                 // Original search query
    parsed: {
      product: string;
      brand?: string;
      specifications?: string;
      price_range?: {
        min: number;
        max: number;
      };
      confidence: number;        // 0-1
    }
  };
  search_params: {
    radius: number;              // Meters
    categories?: string[];
  };
  broadcasted_to: string[];      // Array of merchant IDs
  status: 'pending' | 'active' | 'completed' | 'expired';
  response_count: number;
  expires_at: Timestamp;         // 5 minutes from creation
  created_at: Timestamp;
}
```

**Indexes:**
- `customer_id`
- `status`
- `created_at`
- `expires_at` (for TTL cleanup)

---

#### 4. merchant_responses

```typescript
{
  id: string;                    // Auto-generated UUID
  request_id: string;            // Foreign key to search_requests
  merchant_id: string;           // Foreign key to merchants
  response_type: 'available' | 'unavailable' | 'scheduled';
  details: {
    price?: number;
    quantity_available?: number;
    available_at?: Timestamp;    // For scheduled responses
    notes?: string;
  };
  responded_at: Timestamp;
  response_time: number;         // Seconds from request creation
}
```

**Indexes:**
- `request_id`
- `merchant_id`
- `responded_at`

---

#### 5. reservations

```typescript
{
  id: string;                    // Auto-generated UUID
  request_id: string;
  customer_id: string;
  merchant_id: string;
  product: {
    name: string;
    price: number;
    quantity: number;
  };
  token_payment: {
    amount: number;              // ₹20
    payment_id: string;
    status: 'pending' | 'completed' | 'refunded';
    paid_at?: Timestamp;
  };
  pickup_window: {
    start: Timestamp;
    end: Timestamp;
  };
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'expired';
  completed_at?: Timestamp;
  created_at: Timestamp;
}
```

**Indexes:**
- `customer_id`
- `merchant_id`
- `status`
- `created_at`

---

### PostgreSQL Tables (Analytics)

#### 1. demand_analytics (Time-series)

```sql
CREATE TABLE demand_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  hour INT,                      -- 0-23 for hourly granularity
  merchant_id UUID NOT NULL,
  product VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  location_geohash VARCHAR(20),  -- For regional analysis
  search_count INT DEFAULT 0,
  response_count INT DEFAULT 0,
  conversion_count INT DEFAULT 0,
  avg_price DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(date, hour, merchant_id, product)
);

CREATE INDEX idx_demand_date ON demand_analytics(date DESC);
CREATE INDEX idx_demand_merchant ON demand_analytics(merchant_id, date DESC);
CREATE INDEX idx_demand_product ON demand_analytics(product, date DESC);
CREATE INDEX idx_demand_location ON demand_analytics(location_geohash, date DESC);
```

---

#### 2. ai_insights

```sql
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL,
  insight_type VARCHAR(50) NOT NULL,  -- 'demand_forecast', 'pricing', 'inventory'
  product VARCHAR(255),
  data JSONB NOT NULL,                -- Flexible structure for different insights
  confidence_score DECIMAL(3, 2),     -- 0.00 to 1.00
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_insights_merchant (merchant_id, generated_at DESC),
  INDEX idx_insights_type (insight_type, generated_at DESC)
);
```

**Example JSONB data for demand_forecast:**
```json
{
  "forecast": [
    {"date": "2026-02-16", "predicted_demand": 12, "confidence_interval": [8, 16]},
    {"date": "2026-02-17", "predicted_demand": 15, "confidence_interval": [11, 19]}
  ],
  "trend": "increasing",
  "seasonality": "weekend_peak"
}
```

---

#### 3. pricing_history

```sql
CREATE TABLE pricing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL,
  product VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  recorded_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_pricing_merchant_product (merchant_id, product, recorded_at DESC)
);
```

---

#### 4. merchant_metrics_daily

```sql
CREATE TABLE merchant_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL,
  date DATE NOT NULL,
  total_requests INT DEFAULT 0,
  total_responses INT DEFAULT 0,
  total_conversions INT DEFAULT 0,
  response_rate DECIMAL(5, 2),        -- Percentage
  avg_response_time INT,              -- Seconds
  revenue_opportunity DECIMAL(10, 2), -- Estimated lost revenue
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(merchant_id, date)
);

CREATE INDEX idx_metrics_merchant_date ON merchant_metrics_daily(merchant_id, date DESC);
```

---

### Redis Cache Structure

#### 1. Merchant Online Status
```
Key: merchant:online:{merchant_id}
Value: "true" | "false"
TTL: 60 seconds
```

#### 2. Popular Searches Cache
```
Key: search:popular:{location_geohash}
Value: JSON array of top 10 searches
TTL: 300 seconds (5 minutes)
```

#### 3. Market Price Cache
```
Key: price:market:{product}:{location_geohash}
Value: JSON object with avg, min, max prices
TTL: 600 seconds (10 minutes)
```

#### 4. Session Data
```
Key: session:{user_id}
Value: JSON object with user session data
TTL: 3600 seconds (1 hour)
```

---

### Data Retention Policy

| Data Type | Retention Period | Archive Strategy |
|-----------|------------------|------------------|
| Search requests | 90 days | Move to cold storage (S3) |
| Merchant responses | 90 days | Move to cold storage |
| Demand analytics | 2 years | Aggregate to monthly after 1 year |
| AI insights | 30 days | Keep latest only |
| User activity logs | 180 days | Anonymize and aggregate |
| Payment records | 7 years | Compliance requirement |

---

## API Design

### API Architecture

**Base URLs:**
- Customer API: `https://api.hyperlocal.ai/v1/customer`
- Merchant API: `https://api.hyperlocal.ai/v1/merchant`
- ML API: `https://ml.hyperlocal.ai/v1` (Internal)
- Admin API: `https://api.hyperlocal.ai/v1/admin`

**Authentication:**
- Header: `Authorization: Bearer {jwt_token}`
- All endpoints require authentication except `/auth/*`

**Response Format:**
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2026-02-15T10:30:00Z"
}
```

---

### Customer APIs

#### POST /api/customer/search
**Description:** Create a new product search request

**Request:**
```json
{
  "query": "Harpic lemon 500ml under ₹50",
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090
  },
  "radius": 1000,
  "filters": {
    "price_range": {
      "min": 0,
      "max": 50
    },
    "categories": ["grocery", "supermarket"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "request_id": "req_abc123",
    "parsed_query": {
      "product": "Harpic toilet cleaner",
      "brand": "Harpic",
      "variant": "lemon 500ml",
      "price_range": { "min": 0, "max": 50 },
      "confidence": 0.92
    },
    "broadcasted_to": [
      {
        "merchant_id": "mer_xyz789",
        "business_name": "Sharma General Store",
        "distance": 250
      }
    ],
    "estimated_response_time": "2-3 minutes",
    "expires_at": "2026-02-15T10:35:00Z"
  }
}
```

**Status Codes:**
- 200: Success
- 400: Invalid request (missing location, invalid query)
- 401: Unauthorized
- 429: Rate limit exceeded

---

#### GET /api/customer/search/:request_id/responses
**Description:** Get merchant responses for a search request

**Response:**
```json
{
  "success": true,
  "data": {
    "request_id": "req_abc123",
    "status": "active",
    "response_count": 3,
    "responses": [
      {
        "merchant_id": "mer_xyz789",
        "business_name": "Sharma General Store",
        "response_type": "available",
        "price": 48,
        "distance": 250,
        "location": {
          "latitude": 28.6145,
          "longitude": 77.2095,
          "address": "123 Main Street, Sector 15"
        },
        "rating": 4.5,
        "response_time": "45 seconds",
        "responded_at": "2026-02-15T10:31:00Z"
      },
      {
        "merchant_id": "mer_abc456",
        "business_name": "Quick Mart",
        "response_type": "scheduled",
        "price": 47,
        "available_at": "2026-02-15T18:00:00Z",
        "distance": 500,
        "rating": 4.2
      },
      {
        "merchant_id": "mer_def789",
        "business_name": "City Store",
        "response_type": "unavailable",
        "distance": 800
      }
    ]
  }
}
```

---

#### POST /api/customer/reservation
**Description:** Reserve a product with token payment

**Request:**
```json
{
  "request_id": "req_abc123",
  "merchant_id": "mer_xyz789",
  "product": {
    "name": "Harpic lemon 500ml",
    "price": 48,
    "quantity": 1
  },
  "pickup_window": {
    "start": "2026-02-15T11:00:00Z",
    "end": "2026-02-15T13:00:00Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reservation_id": "res_xyz123",
    "token_amount": 20,
    "payment_url": "https://pay.hyperlocal.ai/res_xyz123",
    "expires_at": "2026-02-15T13:00:00Z"
  }
}
```

---

#### GET /api/customer/reservations
**Description:** Get customer's reservation history

**Query Parameters:**
- `status`: Filter by status (pending, completed, cancelled)
- `limit`: Number of results (default: 20)
- `offset`: Pagination offset

**Response:**
```json
{
  "success": true,
  "data": {
    "reservations": [
      {
        "reservation_id": "res_xyz123",
        "merchant": {
          "id": "mer_xyz789",
          "business_name": "Sharma General Store",
          "location": { ... }
        },
        "product": {
          "name": "Harpic lemon 500ml",
          "price": 48
        },
        "status": "completed",
        "created_at": "2026-02-15T10:32:00Z",
        "completed_at": "2026-02-15T11:45:00Z"
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 20,
      "offset": 0
    }
  }
}
```

---

### Merchant APIs

#### GET /api/merchant/requests
**Description:** Get pending search requests for merchant

**Query Parameters:**
- `status`: Filter by status (pending, responded)
- `limit`: Number of results (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "request_id": "req_abc123",
        "customer": {
          "name": "Rahul S.",
          "distance": 250
        },
        "product": {
          "name": "Harpic toilet cleaner",
          "brand": "Harpic",
          "variant": "lemon 500ml",
          "price_range": { "min": 0, "max": 50 }
        },
        "created_at": "2026-02-15T10:30:00Z",
        "expires_at": "2026-02-15T10:35:00Z",
        "time_remaining": "3 minutes"
      }
    ],
    "pending_count": 5
  }
}
```

---

#### POST /api/merchant/respond
**Description:** Respond to a customer search request

**Request:**
```json
{
  "request_id": "req_abc123",
  "response_type": "available",
  "details": {
    "price": 48,
    "quantity_available": 10,
    "notes": "Fresh stock available"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response_id": "resp_xyz789",
    "customer_notified": true,
    "response_time": "45 seconds"
  }
}
```

---

#### GET /api/merchant/insights
**Description:** Get AI-powered business insights

**Query Parameters:**
- `period`: Time period (today, week, month)
- `insight_type`: Filter by type (demand, pricing, inventory)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "week",
    "summary": {
      "total_requests": 127,
      "response_rate": 68.5,
      "conversion_rate": 42.3,
      "revenue_opportunity": 4500
    },
    "top_products": [
      {
        "product": "Harpic toilet cleaner",
        "search_count": 47,
        "your_responses": 12,
        "conversions": 8,
        "avg_market_price": 48.5,
        "your_price": 52,
        "revenue_opportunity": 450
      }
    ],
    "demand_forecast": [
      {
        "product": "Harpic toilet cleaner",
        "date": "2026-02-16",
        "predicted_demand": 12,
        "confidence": "high",
        "recommendation": "Stock 15 units"
      }
    ],
    "pricing_insights": [
      {
        "product": "Harpic toilet cleaner",
        "your_price": 52,
        "market_avg": 48.5,
        "recommendation": "Reduce to ₹47-48 to increase demand by 15%",
        "estimated_impact": {
          "demand_increase": "15%",
          "revenue_increase": "8%"
        }
      }
    ],
    "inventory_suggestions": [
      {
        "product": "Lizol floor cleaner",
        "reason": "High search volume (23 searches), you don't stock",
        "expected_revenue": "₹800/week",
        "confidence": "medium"
      }
    ]
  }
}
```

---

#### PUT /api/merchant/profile
**Description:** Update merchant profile and settings

**Request:**
```json
{
  "business_hours": {
    "monday": { "open": "09:00", "close": "21:00", "is_closed": false }
  },
  "categories": ["grocery", "household"],
  "notification_preferences": {
    "push_enabled": true,
    "sms_enabled": false,
    "email_enabled": true
  }
}
```

---

#### GET /api/merchant/analytics
**Description:** Get detailed performance analytics

**Query Parameters:**
- `start_date`: Start date (ISO 8601)
- `end_date`: End date (ISO 8601)
- `granularity`: Data granularity (hourly, daily, weekly)

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": [
      {
        "date": "2026-02-15",
        "requests": 18,
        "responses": 12,
        "conversions": 7,
        "response_rate": 66.7,
        "conversion_rate": 58.3,
        "avg_response_time": 52
      }
    ],
    "trends": {
      "requests": { "change": "+12%", "direction": "up" },
      "response_rate": { "change": "-3%", "direction": "down" }
    },
    "benchmarks": {
      "area_avg_response_rate": 72.5,
      "area_avg_response_time": 48
    }
  }
}
```

---

### ML Service APIs (Internal)

#### POST /ml/parse-query
**Description:** Parse natural language search query

**Request:**
```json
{
  "query": "Harpic lemon 500ml under ₹50",
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "product": "Harpic toilet cleaner",
    "brand": "Harpic",
    "variant": "lemon 500ml",
    "specifications": {
      "size": "500ml",
      "fragrance": "lemon"
    },
    "price_intent": {
      "max": 50,
      "operator": "under"
    },
    "category": "household_cleaning",
    "confidence": 0.92,
    "entities": [
      { "type": "brand", "value": "Harpic", "confidence": 0.98 },
      { "type": "variant", "value": "lemon", "confidence": 0.85 },
      { "type": "size", "value": "500ml", "confidence": 0.95 }
    ]
  }
}
```

---

#### POST /ml/forecast-demand
**Description:** Generate demand forecast for a product

**Request:**
```json
{
  "merchant_id": "mer_xyz789",
  "product": "Harpic toilet cleaner",
  "forecast_horizon": 7,
  "include_confidence_intervals": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "product": "Harpic toilet cleaner",
    "forecast": [
      {
        "date": "2026-02-16",
        "predicted_demand": 12,
        "confidence_interval_80": [10, 14],
        "confidence_interval_95": [8, 16],
        "confidence_level": "high"
      }
    ],
    "model_info": {
      "model_type": "prophet",
      "trained_on": "2026-02-14",
      "accuracy_mape": 15.2
    },
    "insights": {
      "trend": "increasing",
      "seasonality": "weekend_peak",
      "factors": ["weekend", "payday_week"]
    }
  }
}
```

---

#### POST /ml/pricing-analysis
**Description:** Analyze pricing and provide recommendations

**Request:**
```json
{
  "product": "Harpic toilet cleaner",
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090
  },
  "current_price": 52,
  "historical_data": {
    "search_volume": [45, 38, 52, 41],
    "prices": [48, 50, 47, 52]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "market_analysis": {
      "average_price": 48.5,
      "median_price": 48,
      "price_range": [42, 55],
      "std_deviation": 3.2,
      "sample_size": 23
    },
    "elasticity": {
      "coefficient": -1.2,
      "interpretation": "elastic_demand",
      "explanation": "1% price decrease leads to 1.2% demand increase"
    },
    "recommendation": {
      "optimal_price": 47,
      "reasoning": "Market average is ₹48.50. Price at ₹47 maximizes revenue.",
      "estimated_impact": {
        "demand_increase_pct": 15,
        "revenue_increase_pct": 8,
        "weekly_revenue_gain": 450
      }
    }
  }
}
```

---

### Error Responses

**Standard Error Format:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Location is required",
    "details": {
      "field": "location",
      "reason": "missing_required_field"
    }
  },
  "timestamp": "2026-02-15T10:30:00Z"
}
```

**Error Codes:**
- `INVALID_REQUEST`: Malformed request (400)
- `UNAUTHORIZED`: Authentication failed (401)
- `FORBIDDEN`: Insufficient permissions (403)
- `NOT_FOUND`: Resource not found (404)
- `RATE_LIMIT_EXCEEDED`: Too many requests (429)
- `INTERNAL_ERROR`: Server error (500)
- `SERVICE_UNAVAILABLE`: Service temporarily down (503)

---

### Rate Limiting

| Endpoint | Rate Limit | Window |
|----------|-----------|--------|
| POST /api/customer/search | 10 requests | 1 minute |
| GET /api/customer/search/:id/responses | 60 requests | 1 minute |
| POST /api/merchant/respond | 100 requests | 1 minute |
| GET /api/merchant/insights | 20 requests | 1 minute |
| ML APIs (internal) | 1000 requests | 1 minute |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1644926400
```

---

## User Flows

### Customer Flow: Product Search to Purchase

```
┌─────────────────────────────────────────────────────────────┐
│ 1. OPEN APP                                                  │
│    - Auto-detect location (GPS)                             │
│    - Or manually enter address                              │
│    - Set search radius (500m - 5km)                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. SEARCH FOR PRODUCT                                        │
│    - Type: "Harpic lemon 500ml under ₹50"                   │
│    - Voice search option available                          │
│    - Auto-complete suggestions appear                       │
│    - Apply filters (brand, price, category)                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. BROADCAST TO MERCHANTS                                    │
│    - System parses query using NLP                          │
│    - Identifies 5-10 relevant nearby merchants              │
│    - Sends push notifications to merchants                  │
│    - Shows: "Searching... 5 shops notified"                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. WAIT FOR RESPONSES (2-5 minutes)                         │
│    - Real-time updates as merchants respond                 │
│    - Progress indicator: "3 of 5 responded"                 │
│    - Can browse other products while waiting                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. VIEW RESULTS                                              │
│    ┌──────────────────────────────────────────────────┐    │
│    │ ✅ Sharma Store (200m) - ₹48 - Available now     │    │
│    │ ✅ Quick Mart (500m) - ₹47 - Available by 6 PM   │    │
│    │ ❌ City Store (800m) - Not available             │    │
│    └──────────────────────────────────────────────────┘    │
│    - Sort by: Distance, Price, Rating                       │
│    - Filter: Available now, Scheduled                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. SELECT MERCHANT                                           │
│    - View merchant details (rating, hours, address)         │
│    - See product price and availability                     │
│    - Option to reserve or just visit                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 7A. RESERVE PRODUCT (Optional)                              │
│    - Pay ₹20 token (UPI/Card)                               │
│    - Select pickup time window                              │
│    - Receive confirmation                                   │
│    - Merchant holds product                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 7B. NAVIGATE TO STORE                                        │
│    - Get directions (Google Maps integration)               │
│    - Walking/driving time estimate                          │
│    - Call merchant if needed                                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. PURCHASE & COMPLETE                                       │
│    - Visit store and buy product                            │
│    - Show reservation code (if reserved)                    │
│    - Rate merchant experience                               │
│    - Token refunded if reserved                             │
└─────────────────────────────────────────────────────────────┘
```

**Time Savings:**
- Traditional: 30-45 minutes (visiting 3-4 stores)
- With HyperLocal AI: 5-10 minutes (search + visit 1 store)

---

### Merchant Flow: Request to Response

```
┌─────────────────────────────────────────────────────────────┐
│ 1. RECEIVE NOTIFICATION                                      │
│    📱 Push: "Customer looking for Harpic lemon ₹50"         │
│    - Sound alert                                            │
│    - Badge on app icon                                      │
│    - SMS fallback if no response in 2 min                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. OPEN REQUEST                                              │
│    - See product details                                    │
│    - Customer distance (250m away)                          │
│    - Price range (under ₹50)                                │
│    - Time remaining (4 min 30 sec)                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. CHECK INVENTORY (30 seconds)                             │
│    - Physically check shelf                                 │
│    - Verify price                                           │
│    - Check quantity available                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. RESPOND                                                   │
│    Option A: ✅ Yes - ₹48 (Available now)                   │
│    Option B: ❌ No (Not in stock)                           │
│    Option C: 📅 Can get by 6 PM - ₹47                       │
│    - One-tap response                                       │
│    - Optional: Add notes                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. CUSTOMER NOTIFIED                                         │
│    - Instant notification sent                              │
│    - Response time recorded (45 seconds)                    │
│    - Wait for customer visit                                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. CUSTOMER VISITS (if "Yes")                               │
│    - Customer arrives at store                              │
│    - Shows reservation (if made)                            │
│    - Complete sale                                          │
│    - Mark as completed in app                               │
└─────────────────────────────────────────────────────────────┘
```

**Response Time Target:** <1 minute (average 45 seconds)

---

### Merchant Flow: Daily Insights Review

```
┌─────────────────────────────────────────────────────────────┐
│ 1. END OF DAY - OPEN INSIGHTS DASHBOARD                     │
│    - Notification: "Your daily insights are ready"          │
│    - Open merchant app                                      │
│    - Navigate to "AI Insights" tab                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. VIEW TODAY'S SUMMARY                                      │
│    ┌──────────────────────────────────────────────────┐    │
│    │ Today's Performance                               │    │
│    │ • 18 search requests received                     │    │
│    │ • 12 responses sent (67% response rate)           │    │
│    │ • 7 conversions (58% conversion rate)             │    │
│    │ • Avg response time: 52 seconds                   │    │
│    │ • Area average: 48 seconds ⚠️                     │    │
│    └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. TOP SEARCHED PRODUCTS                                     │
│    ┌──────────────────────────────────────────────────┐    │
│    │ 1. Harpic toilet cleaner - 47 searches           │    │
│    │    You responded: 12 times                        │    │
│    │    Conversions: 8                                 │    │
│    │    Revenue opportunity: ₹450/week                 │    │
│    │                                                   │    │
│    │ 2. Lizol floor cleaner - 23 searches             │    │
│    │    ⚠️ You don't stock this product               │    │
│    │    Potential revenue: ₹800/week                   │    │
│    └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. DEMAND FORECAST                                           │
│    ┌──────────────────────────────────────────────────┐    │
│    │ Tomorrow's Predicted Demand (High Confidence)     │    │
│    │                                                   │    │
│    │ Harpic toilet cleaner: 12 units                  │    │
│    │ 📊 [Chart showing 7-day forecast]                │    │
│    │ 💡 Recommendation: Stock 15 units for weekend    │    │
│    └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. PRICING INTELLIGENCE                                      │
│    ┌──────────────────────────────────────────────────┐    │
│    │ Harpic toilet cleaner                             │    │
│    │ Your price: ₹52                                   │    │
│    │ Market average: ₹48.50                            │    │
│    │ Competitors: ₹42-₹55                              │    │
│    │                                                   │    │
│    │ 💡 Recommendation: Reduce to ₹47-48              │    │
│    │ Expected impact: +15% demand, +8% revenue        │    │
│    └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. INVENTORY SUGGESTIONS                                     │
│    ┌──────────────────────────────────────────────────┐    │
│    │ Products to Consider Stocking:                    │    │
│    │                                                   │    │
│    │ 1. Lizol floor cleaner                            │    │
│    │    Reason: 23 searches, high demand               │    │
│    │    Expected revenue: ₹800/week                    │    │
│    │    [Add to Inventory] button                      │    │
│    │                                                   │    │
│    │ 2. Vim dishwash gel                               │    │
│    │    Reason: Trending in your area                  │    │
│    │    Expected revenue: ₹600/week                    │    │
│    └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. TAKE ACTION                                               │
│    - Update inventory based on suggestions                  │
│    - Adjust pricing                                         │
│    - Plan restocking for tomorrow                           │
│    - Review weekly trends                                   │
└─────────────────────────────────────────────────────────────┘
```

**Insight Generation:** Daily at 10 PM, Weekly on Sundays

---

### Admin Flow: System Monitoring

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DASHBOARD OVERVIEW                                        │
│    - Total active users (customers + merchants)             │
│    - Daily active users (DAU)                               │
│    - Search volume (last 24 hours)                          │
│    - Response rate (system-wide)                            │
│    - Conversion rate                                        │
│    - Revenue metrics                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. SYSTEM HEALTH                                             │
│    - API latency (p50, p95, p99)                            │
│    - Error rates by endpoint                                │
│    - Database performance                                   │
│    - ML model accuracy                                      │
│    - Notification delivery rates                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. MERCHANT MANAGEMENT                                       │
│    - Approve new merchant registrations                     │
│    - Review merchant performance                            │
│    - Handle disputes                                        │
│    - Manage subscriptions                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. ML MODEL MONITORING                                       │
│    - Query parsing accuracy                                 │
│    - Demand forecast accuracy (MAPE)                        │
│    - Pricing recommendation effectiveness                   │
│    - Model retraining status                                │
└─────────────────────────────────────────────────────────────┘
```

---

## AI/ML Architecture

### ML Pipeline Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA COLLECTION                           │
│  • Search queries (text)                                     │
│  • Merchant responses (structured)                           │
│  • Conversions (events)                                      │
│  • External data (weather, events, holidays)                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                  DATA PREPROCESSING                          │
│  • Text cleaning and normalization                           │
│  • Feature extraction                                        │
│  • Data validation and quality checks                        │
│  • Missing data handling                                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    MODEL TRAINING                            │
│  • NLP Model (Query Parsing)                                 │
│  • Time-series Model (Demand Forecasting)                    │
│  • Regression Model (Pricing Analysis)                       │
│  • Recommendation Model (Product Suggestions)                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   MODEL EVALUATION                           │
│  • Accuracy metrics (MAPE, RMSE, F1)                         │
│  • Cross-validation                                          │
│  • A/B testing                                               │
│  • Business impact analysis                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   MODEL DEPLOYMENT                           │
│  • Docker containerization                                   │
│  • FastAPI REST endpoints                                    │
│  • Load balancing                                            │
│  • Version management                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                  MONITORING & RETRAINING                     │
│  • Real-time accuracy tracking                               │
│  • Data drift detection                                      │
│  • Automated retraining (weekly)                             │
│  • Model versioning and rollback                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 1. NLP Model: Query Parsing

**Objective:** Extract structured information from natural language search queries

**Model Architecture:**
- Base: DistilBERT (lightweight transformer)
- Fine-tuned on e-commerce product queries
- Custom entity recognition layer

**Input:** Raw search query (string)
```
"Harpic lemon 500ml under ₹50"
```

**Output:** Structured entities
```json
{
  "product": "Harpic toilet cleaner",
  "brand": "Harpic",
  "variant": "lemon",
  "size": "500ml",
  "price_intent": { "max": 50, "operator": "under" },
  "category": "household_cleaning",
  "confidence": 0.92
}
```

**Training Data:**
- 100K+ labeled product queries
- Multi-language support (English, Hindi, Hinglish)
- Domain-specific vocabulary (Indian brands, colloquial terms)

**Features:**
- Named Entity Recognition (NER) for product attributes
- Intent classification (search, compare, price check)
- Spelling correction and fuzzy matching
- Synonym expansion (e.g., "toilet cleaner" → "Harpic")

**Performance Metrics:**
- Entity extraction accuracy: >90%
- Category classification accuracy: >95%
- Inference time: <200ms

**Technology Stack:**
```python
# Model: HuggingFace Transformers
from transformers import DistilBertForTokenClassification
import torch

# Preprocessing
from nltk import word_tokenize
import re

# Serving
from fastapi import FastAPI
```

---

### 2. Demand Forecasting Model

**Objective:** Predict future product demand for merchants

**Model:** Facebook Prophet (time-series forecasting)

**Why Prophet?**
- Handles seasonality (daily, weekly, yearly)
- Robust to missing data
- Incorporates holidays and events
- Provides confidence intervals
- Easy to interpret

**Input Features:**
```python
{
  "ds": "2026-02-15",           # Date
  "y": 47,                      # Search count (target)
  "day_of_week": 6,             # 0=Monday, 6=Sunday
  "is_weekend": 1,              # Binary
  "is_holiday": 0,              # Binary
  "temperature": 22,            # Celsius
  "is_rainy": 0,                # Binary
  "local_event": 0,             # Binary (festival, market day)
  "trend": 1.05                 # 7-day moving average ratio
}
```

**Model Configuration:**
```python
from prophet import Prophet

model = Prophet(
    seasonality_mode='multiplicative',
    yearly_seasonality=True,
    weekly_seasonality=True,
    daily_seasonality=False,
    holidays=indian_holidays,
    changepoint_prior_scale=0.05
)

# Add custom regressors
model.add_regressor('temperature')
model.add_regressor('is_rainy')
model.add_regressor('local_event')
```

**Output:**
```json
{
  "forecast": [
    {
      "date": "2026-02-16",
      "predicted_demand": 12,
      "yhat_lower": 8,
      "yhat_upper": 16,
      "confidence": "high"
    }
  ]
}
```

**Training:**
- Historical window: 30-90 days
- Retraining frequency: Weekly
- Validation: Last 7 days as test set
- Metric: MAPE (Mean Absolute Percentage Error) <20%

**Confidence Scoring:**
```python
def calculate_confidence(forecast, historical_std):
    interval_width = forecast['yhat_upper'] - forecast['yhat_lower']
    relative_width = interval_width / forecast['yhat']
    
    if relative_width < 0.3:
        return "high"
    elif relative_width < 0.6:
        return "medium"
    else:
        return "low"
```

---

### 3. Pricing Intelligence Model

**Objective:** Analyze price elasticity and recommend optimal pricing

**Model:** Multiple Linear Regression + Elasticity Analysis

**Input Features:**
```python
{
  "product": "Harpic toilet cleaner",
  "prices": [42, 45, 48, 50, 52, 55],
  "search_volumes": [65, 58, 52, 48, 42, 35],
  "conversions": [28, 26, 24, 21, 18, 14],
  "competitor_prices": [45, 47, 48, 50, 52],
  "location_income_level": "medium"
}
```

**Price Elasticity Calculation:**
```python
import numpy as np
from scipy.stats import linregress

def calculate_elasticity(prices, demand):
    # Log-log regression for elasticity
    log_prices = np.log(prices)
    log_demand = np.log(demand)
    
    slope, intercept, r_value, p_value, std_err = linregress(log_prices, log_demand)
    
    elasticity = slope  # Coefficient is elasticity
    return elasticity

# Interpretation:
# elasticity < -1: Elastic (demand sensitive to price)
# -1 < elasticity < 0: Inelastic (demand less sensitive)
# elasticity > 0: Giffen good (rare)
```

**Optimal Price Calculation:**
```python
def find_optimal_price(prices, demand, costs):
    revenues = prices * demand
    profits = revenues - (costs * demand)
    
    optimal_idx = np.argmax(profits)
    optimal_price = prices[optimal_idx]
    
    return {
        "optimal_price": optimal_price,
        "expected_demand": demand[optimal_idx],
        "expected_revenue": revenues[optimal_idx]
    }
```

**Output:**
```json
{
  "market_avg": 48.5,
  "optimal_price": 47,
  "elasticity": -1.2,
  "reasoning": "Elastic demand. Reducing price by ₹5 increases demand by 15%",
  "impact": {
    "demand_increase_pct": 15,
    "revenue_increase_pct": 8
  }
}
```

**Technology:**
```python
from sklearn.linear_model import LinearRegression
from scipy.optimize import minimize
import pandas as pd
```

---

### 4. Recommendation System

**Objective:** Suggest products for merchants to stock

**Approach:** Collaborative Filtering + Content-Based

**Collaborative Filtering:**
- Find similar merchants (by location, category, size)
- Recommend products that similar merchants stock
- Based on search patterns in the area

**Content-Based:**
- Analyze product attributes (category, brand, price)
- Recommend complementary products
- Based on merchant's current inventory

**Algorithm:**
```python
def recommend_products(merchant_id, top_n=5):
    # Get merchant profile
    merchant = get_merchant(merchant_id)
    
    # Find similar merchants
    similar_merchants = find_similar_merchants(
        location=merchant.location,
        category=merchant.categories,
        radius=5000  # 5km
    )
    
    # Get products they stock but merchant doesn't
    candidate_products = get_products_not_in_inventory(
        merchant_id, similar_merchants
    )
    
    # Score by search volume in area
    for product in candidate_products:
        product.score = get_search_volume(
            product, merchant.location, days=30
        )
    
    # Rank and return top N
    return sorted(candidate_products, key=lambda x: x.score, reverse=True)[:top_n]
```

**Features:**
- Search volume in merchant's area
- Conversion rate for product category
- Profit margin estimates
- Seasonality factors
- Complementary product analysis

**Output:**
```json
{
  "recommendations": [
    {
      "product": "Lizol floor cleaner",
      "reason": "High search volume (23 searches/week)",
      "expected_revenue": 800,
      "confidence": "medium",
      "similar_merchants_stocking": 8
    }
  ]
}
```

---

### 5. Trend Detection

**Objective:** Identify emerging product trends

**Approach:** Time-series anomaly detection + Growth rate analysis

**Algorithm:**
```python
def detect_trends(location, days=30):
    # Get search data for all products in area
    search_data = get_search_data(location, days)
    
    trends = []
    for product in search_data:
        # Calculate growth rate
        recent_volume = product.searches[-7:]  # Last 7 days
        previous_volume = product.searches[-14:-7]  # Previous 7 days
        
        growth_rate = (sum(recent_volume) - sum(previous_volume)) / sum(previous_volume)
        
        # Detect if trending
        if growth_rate > 0.3:  # 30% growth
            trends.append({
                "product": product.name,
                "growth_rate": growth_rate,
                "current_volume": sum(recent_volume),
                "trend": "rising"
            })
    
    return sorted(trends, key=lambda x: x['growth_rate'], reverse=True)
```

**Trend Categories:**
- Rising: >30% growth
- Stable: -10% to +10%
- Declining: <-30% decline

---

### ML Model Deployment

**Infrastructure:**
```
┌─────────────────────────────────────────────────────────────┐
│                    ML SERVICE (FastAPI)                      │
├─────────────────────────────────────────────────────────────┤
│  Docker Container                                            │
│  ├── Python 3.11                                             │
│  ├── FastAPI + Uvicorn                                       │
│  ├── Model artifacts (pickled models)                        │
│  ├── Dependencies (scikit-learn, prophet, transformers)     │
│  └── Health check endpoint                                   │
└─────────────────────────────────────────────────────────────┘
```

**Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy model artifacts
COPY models/ ./models/
COPY src/ ./src/

# Expose port
EXPOSE 8000

# Run FastAPI
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Model Versioning:**
```
models/
├── query_parser/
│   ├── v1.0/
│   │   ├── model.pkl
│   │   └── metadata.json
│   └── v1.1/  (current)
│       ├── model.pkl
│       └── metadata.json
├── demand_forecast/
│   └── v2.0/
└── pricing_analysis/
    └── v1.0/
```

**Model Serving:**
```python
from fastapi import FastAPI
import joblib

app = FastAPI()

# Load models on startup
@app.on_event("startup")
async def load_models():
    global query_parser, demand_model, pricing_model
    
    query_parser = joblib.load("models/query_parser/v1.1/model.pkl")
    demand_model = joblib.load("models/demand_forecast/v2.0/model.pkl")
    pricing_model = joblib.load("models/pricing_analysis/v1.0/model.pkl")

@app.post("/ml/parse-query")
async def parse_query(query: str):
    result = query_parser.predict(query)
    return {"data": result}
```

---

### Model Monitoring & Retraining

**Monitoring Metrics:**
```python
# Track in real-time
metrics = {
    "query_parser": {
        "accuracy": 0.92,
        "avg_inference_time": 180,  # ms
        "requests_per_day": 15000
    },
    "demand_forecast": {
        "mape": 15.2,  # Mean Absolute Percentage Error
        "accuracy_trend": "stable",
        "last_retrained": "2026-02-14"
    },
    "pricing_analysis": {
        "recommendation_acceptance_rate": 0.68,
        "revenue_impact": "+12%"
    }
}
```

**Automated Retraining Pipeline:**
```python
# Scheduled job (runs weekly)
def retrain_models():
    # 1. Fetch new data
    new_data = fetch_training_data(days=90)
    
    # 2. Validate data quality
    if not validate_data(new_data):
        alert_team("Data quality issues")
        return
    
    # 3. Train new model
    new_model = train_model(new_data)
    
    # 4. Evaluate against current model
    current_accuracy = evaluate_model(current_model, test_data)
    new_accuracy = evaluate_model(new_model, test_data)
    
    # 5. Deploy if better
    if new_accuracy > current_accuracy:
        deploy_model(new_model, version="v2.1")
        log_deployment("Deployed v2.1, accuracy improved by {:.2f}%".format(
            (new_accuracy - current_accuracy) * 100
        ))
    else:
        log_deployment("Kept current model, new model not better")
```

**A/B Testing:**
```python
# Route 10% of traffic to new model
@app.post("/ml/parse-query")
async def parse_query(query: str):
    if random.random() < 0.1:  # 10% traffic
        result = new_model.predict(query)
        log_experiment("new_model", query, result)
    else:
        result = current_model.predict(query)
        log_experiment("current_model", query, result)
    
    return {"data": result}
```

---

## Security Design

### Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                           │
├─────────────────────────────────────────────────────────────┤
│  1. Network Security (TLS, Firewall, DDoS Protection)       │
│  2. Authentication (Firebase Auth, JWT)                      │
│  3. Authorization (RBAC, API Keys)                           │
│  4. Data Encryption (At Rest, In Transit)                    │
│  5. Input Validation (Sanitization, Rate Limiting)           │
│  6. Audit Logging (All actions tracked)                      │
└─────────────────────────────────────────────────────────────┘
```

---

### 1. Authentication & Authorization

**Authentication Methods:**

**Phone OTP (Primary):**
```typescript
// Flow
1. User enters phone number
2. Backend sends OTP via SMS (6 digits)
3. User enters OTP
4. Backend verifies OTP
5. Issue JWT token (1 hour expiry)
6. Issue refresh token (30 days expiry)

// Security measures
- Rate limiting: 3 OTP requests per hour per phone
- OTP expiry: 5 minutes
- Max verification attempts: 3
- Account lockout after 5 failed attempts
```

**JWT Token Structure:**
```json
{
  "sub": "user_id_123",
  "role": "merchant",
  "phone": "+91XXXXXXXXXX",
  "merchant_id": "mer_xyz789",
  "iat": 1644926400,
  "exp": 1644930000
}
```

**Authorization (RBAC):**
```typescript
enum Role {
  CUSTOMER = "customer",
  MERCHANT = "merchant",
  ADMIN = "admin"
}

const permissions = {
  customer: [
    "search:create",
    "search:read:own",
    "reservation:create",
    "reservation:read:own"
  ],
  merchant: [
    "request:read:own",
    "response:create",
    "insights:read:own",
    "profile:update:own"
  ],
  admin: [
    "merchant:read:all",
    "merchant:update:all",
    "analytics:read:all",
    "system:manage"
  ]
};

// Middleware
function requirePermission(permission: string) {
  return (req, res, next) => {
    const userRole = req.user.role;
    if (permissions[userRole].includes(permission)) {
      next();
    } else {
      res.status(403).json({ error: "Forbidden" });
    }
  };
}
```

---

### 2. Data Encryption

**In Transit:**
- TLS 1.3 for all communications
- HTTPS enforced (HSTS enabled)
- Certificate pinning for mobile apps

**At Rest:**
- Database encryption (AES-256)
- Sensitive fields encrypted at application level
- Payment data: PCI-DSS compliant encryption

**Field-Level Encryption:**
```typescript
// Encrypt sensitive fields
const sensitiveFields = ['phone', 'email', 'payment_details'];

async function encryptField(value: string): Promise<string> {
  const algorithm = 'aes-256-gcm';
  const key = process.env.ENCRYPTION_KEY;
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}
```

---

### 3. Input Validation & Sanitization

**API Input Validation:**
```typescript
import { z } from 'zod';

// Schema validation
const searchRequestSchema = z.object({
  query: z.string().min(2).max(200),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  }),
  radius: z.number().min(100).max(10000),
  filters: z.object({
    price_range: z.object({
      min: z.number().min(0),
      max: z.number().min(0)
    }).optional()
  }).optional()
});

// Middleware
app.post('/api/search', async (req, res) => {
  try {
    const validated = searchRequestSchema.parse(req.body);
    // Process request
  } catch (error) {
    res.status(400).json({ error: "Invalid request" });
  }
});
```

**SQL Injection Prevention:**
```typescript
// Use parameterized queries
const query = `
  SELECT * FROM merchants 
  WHERE location <-> point($1, $2) < $3
  AND categories && $4
`;
const values = [lat, lng, radius, categories];
const result = await db.query(query, values);
```

**XSS Prevention:**
```typescript
import DOMPurify from 'isomorphic-dompurify';

// Sanitize user input
function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}
```

---

### 4. Rate Limiting

**Implementation:**
```typescript
import rateLimit from 'express-rate-limit';

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later'
});

// Endpoint-specific limiters
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 searches per minute
  keyGenerator: (req) => req.user.id
});

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 OTP requests per hour
  keyGenerator: (req) => req.body.phone
});

app.use('/api', globalLimiter);
app.post('/api/search', searchLimiter, searchHandler);
app.post('/api/auth/send-otp', otpLimiter, otpHandler);
```

**Redis-based Rate Limiting:**
```typescript
async function checkRateLimit(key: string, limit: number, window: number): Promise<boolean> {
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, window);
  }
  
  return current <= limit;
}
```

---

### 5. Payment Security

**PCI-DSS Compliance:**
- Never store full card numbers
- Use payment gateway (Razorpay/Stripe)
- Tokenization for recurring payments
- 3D Secure authentication

**Payment Flow:**
```typescript
// 1. Create payment intent
const paymentIntent = await paymentGateway.createIntent({
  amount: 2000, // ₹20 in paise
  currency: 'INR',
  customer_id: user.id,
  metadata: {
    reservation_id: reservation.id
  }
});

// 2. Return client secret (not payment details)
res.json({
  client_secret: paymentIntent.client_secret,
  payment_url: paymentIntent.url
});

// 3. Webhook for payment confirmation
app.post('/webhooks/payment', async (req, res) => {
  const signature = req.headers['x-signature'];
  
  // Verify webhook signature
  if (!verifyWebhookSignature(req.body, signature)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process payment
  const { payment_id, status } = req.body;
  if (status === 'success') {
    await updateReservationStatus(payment_id, 'confirmed');
  }
  
  res.status(200).send('OK');
});
```

---

### 6. Privacy & Data Protection

**GDPR Compliance:**

**Data Minimization:**
- Collect only necessary data
- Location: Approximate to 100m radius for analytics
- Search history: Retain 90 days, then anonymize

**User Rights:**
```typescript
// Right to access
app.get('/api/user/data', async (req, res) => {
  const userData = await getUserData(req.user.id);
  res.json(userData);
});

// Right to deletion
app.delete('/api/user/account', async (req, res) => {
  await anonymizeUserData(req.user.id);
  await deleteAccount(req.user.id);
  res.json({ message: 'Account deleted' });
});

// Right to portability
app.get('/api/user/export', async (req, res) => {
  const data = await exportUserData(req.user.id);
  res.json(data);
});
```

**Data Anonymization:**
```typescript
async function anonymizeUserData(userId: string) {
  // Replace PII with anonymized values
  await db.query(`
    UPDATE users 
    SET 
      phone = 'ANONYMIZED',
      email = 'ANONYMIZED',
      name = 'Deleted User',
      location = NULL
    WHERE id = $1
  `, [userId]);
  
  // Keep analytics data but remove user link
  await db.query(`
    UPDATE search_requests 
    SET customer_id = NULL 
    WHERE customer_id = $1
  `, [userId]);
}
```

---

### 7. Audit Logging

**Log All Security Events:**
```typescript
interface AuditLog {
  timestamp: Date;
  user_id: string;
  action: string;
  resource: string;
  ip_address: string;
  user_agent: string;
  status: 'success' | 'failure';
  metadata?: any;
}

async function logAuditEvent(event: AuditLog) {
  await db.query(`
    INSERT INTO audit_logs 
    (timestamp, user_id, action, resource, ip_address, user_agent, status, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [
    event.timestamp,
    event.user_id,
    event.action,
    event.resource,
    event.ip_address,
    event.user_agent,
    event.status,
    JSON.stringify(event.metadata)
  ]);
}

// Log authentication attempts
app.post('/api/auth/login', async (req, res) => {
  const result = await authenticateUser(req.body);
  
  await logAuditEvent({
    timestamp: new Date(),
    user_id: req.body.phone,
    action: 'login',
    resource: 'auth',
    ip_address: req.ip,
    user_agent: req.headers['user-agent'],
    status: result.success ? 'success' : 'failure'
  });
});
```

---

### 8. Security Headers

**HTTP Security Headers:**
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.hyperlocal.ai"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true
}));
```

---

### 9. Fraud Detection

**Suspicious Activity Detection:**
```typescript
async function detectSuspiciousActivity(userId: string): Promise<boolean> {
  const checks = [
    // Multiple accounts from same device
    checkMultipleAccountsSameDevice(userId),
    
    // Unusual search patterns
    checkUnusualSearchPatterns(userId),
    
    // Rapid account creation
    checkRapidAccountCreation(userId),
    
    // Location spoofing
    checkLocationSpoofing(userId),
    
    // Payment fraud patterns
    checkPaymentFraudPatterns(userId)
  ];
  
  const results = await Promise.all(checks);
  return results.some(result => result === true);
}

// Flag suspicious accounts
if (await detectSuspiciousActivity(user.id)) {
  await flagAccount(user.id, 'suspicious_activity');
  await notifySecurityTeam(user.id);
}
```

---

### 10. Incident Response Plan

**Security Incident Workflow:**
```
1. Detection → Automated alerts + monitoring
2. Containment → Isolate affected systems
3. Investigation → Analyze logs, identify root cause
4. Remediation → Patch vulnerabilities, restore services
5. Communication → Notify affected users (if required)
6. Post-mortem → Document lessons learned
```

**Automated Alerts:**
```typescript
// Monitor for security events
async function monitorSecurityEvents() {
  const alerts = [
    // High rate of failed login attempts
    checkFailedLoginRate(),
    
    // Unusual API usage patterns
    checkAPIAnomalies(),
    
    // Database access anomalies
    checkDatabaseAnomalies(),
    
    // Unauthorized access attempts
    checkUnauthorizedAccess()
  ];
  
  const triggered = await Promise.all(alerts);
  
  if (triggered.some(alert => alert.severity === 'critical')) {
    await notifySecurityTeam('CRITICAL', triggered);
    await triggerIncidentResponse();
  }
}
```

---

## Scalability & Performance

### Scalability Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LOAD BALANCER                             │
│                  (Vercel Edge Network)                       │
└─────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  API Server  │  │  API Server  │  │  API Server  │
│   Instance 1 │  │   Instance 2 │  │   Instance N │
└──────────────┘  └──────────────┘  └──────────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    CACHE LAYER (Redis)                       │
└─────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Firestore   │  │  PostgreSQL  │  │  ML Service  │
│  (Primary)   │  │  (Analytics) │  │   (Python)   │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

### 1. Horizontal Scaling

**Stateless Services:**
- All API servers are stateless
- Session data stored in Redis
- No server affinity required
- Auto-scaling based on CPU/memory

**Auto-Scaling Configuration:**
```yaml
# Vercel (Frontend + API Routes)
auto_scaling:
  min_instances: 2
  max_instances: 100
  target_cpu: 70%
  scale_up_cooldown: 60s
  scale_down_cooldown: 300s

# Railway (ML Service)
auto_scaling:
  min_instances: 1
  max_instances: 10
  target_cpu: 80%
  target_memory: 85%
```

**Load Distribution:**
```typescript
// Round-robin load balancing
const servers = [
  'api-1.hyperlocal.ai',
  'api-2.hyperlocal.ai',
  'api-3.hyperlocal.ai'
];

let currentIndex = 0;

function getNextServer() {
  const server = servers[currentIndex];
  currentIndex = (currentIndex + 1) % servers.length;
  return server;
}
```

---

### 2. Database Optimization

**Firestore Optimization:**

**Indexing Strategy:**
```typescript
// Composite indexes for common queries
const indexes = [
  // Search requests by customer and status
  { collection: 'search_requests', fields: ['customer_id', 'status', 'created_at'] },
  
  // Merchants by location and category
  { collection: 'merchants', fields: ['location', 'categories', 'subscription.tier'] },
  
  // Responses by request and merchant
  { collection: 'merchant_responses', fields: ['request_id', 'merchant_id', 'responded_at'] }
];
```

**Query Optimization:**
```typescript
// Bad: Fetching all data then filtering
const allRequests = await db.collection('search_requests').get();
const filtered = allRequests.docs.filter(doc => doc.data().status === 'pending');

// Good: Filter at database level
const pendingRequests = await db.collection('search_requests')
  .where('status', '==', 'pending')
  .where('expires_at', '>', new Date())
  .limit(50)
  .get();
```

**PostgreSQL Optimization:**

**Indexing:**
```sql
-- Geospatial index for location queries
CREATE INDEX idx_merchants_location ON merchants USING GIST(location);

-- Composite index for analytics queries
CREATE INDEX idx_demand_analytics_lookup 
ON demand_analytics(merchant_id, date DESC, product);

-- Partial index for active searches
CREATE INDEX idx_active_searches 
ON search_requests(created_at DESC) 
WHERE status = 'pending';
```

**Query Optimization:**
```sql
-- Use EXPLAIN ANALYZE to optimize queries
EXPLAIN ANALYZE
SELECT m.*, 
       ST_Distance(m.location, ST_MakePoint($1, $2)) as distance
FROM merchants m
WHERE ST_DWithin(m.location, ST_MakePoint($1, $2), $3)
  AND m.categories && $4
ORDER BY distance
LIMIT 10;

-- Add materialized views for expensive aggregations
CREATE MATERIALIZED VIEW merchant_daily_stats AS
SELECT 
  merchant_id,
  date,
  COUNT(*) as total_requests,
  SUM(CASE WHEN responded THEN 1 ELSE 0 END) as total_responses,
  AVG(response_time) as avg_response_time
FROM search_requests
GROUP BY merchant_id, date;

-- Refresh daily
REFRESH MATERIALIZED VIEW CONCURRENTLY merchant_daily_stats;
```

**Connection Pooling:**
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

---

### 3. Caching Strategy

**Multi-Layer Caching:**

**Layer 1: Browser Cache**
```typescript
// Static assets: 1 year
res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

// API responses: 5 minutes
res.setHeader('Cache-Control', 'public, max-age=300');

// Dynamic content: No cache
res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
```

**Layer 2: CDN Cache (Vercel Edge)**
```typescript
// Cache at edge locations
export const config = {
  runtime: 'edge',
  regions: ['sin1', 'bom1', 'del1'] // Singapore, Mumbai, Delhi
};
```

**Layer 3: Redis Cache**
```typescript
// Cache frequently accessed data
async function getMerchant(merchantId: string) {
  const cacheKey = `merchant:${merchantId}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fetch from database
  const merchant = await db.collection('merchants').doc(merchantId).get();
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(merchant.data()));
  
  return merchant.data();
}

// Cache invalidation
async function updateMerchant(merchantId: string, data: any) {
  await db.collection('merchants').doc(merchantId).update(data);
  
  // Invalidate cache
  await redis.del(`merchant:${merchantId}`);
}
```

**Cache Patterns:**

| Data Type | TTL | Invalidation Strategy |
|-----------|-----|----------------------|
| Merchant profile | 5 minutes | On update |
| Market prices | 10 minutes | Time-based |
| Popular searches | 5 minutes | Time-based |
| User session | 1 hour | On logout |
| ML predictions | 1 hour | On model update |
| Static content | 1 year | Version-based |

---

### 4. Performance Optimization

**API Response Time Optimization:**

**Parallel Queries:**
```typescript
// Bad: Sequential queries (slow)
const merchant = await getMerchant(merchantId);
const insights = await getInsights(merchantId);
const analytics = await getAnalytics(merchantId);

// Good: Parallel queries (fast)
const [merchant, insights, analytics] = await Promise.all([
  getMerchant(merchantId),
  getInsights(merchantId),
  getAnalytics(merchantId)
]);
```

**Pagination:**
```typescript
// Cursor-based pagination (efficient for large datasets)
async function getSearchRequests(cursor?: string, limit: number = 20) {
  let query = db.collection('search_requests')
    .orderBy('created_at', 'desc')
    .limit(limit);
  
  if (cursor) {
    const cursorDoc = await db.collection('search_requests').doc(cursor).get();
    query = query.startAfter(cursorDoc);
  }
  
  const snapshot = await query.get();
  
  return {
    data: snapshot.docs.map(doc => doc.data()),
    next_cursor: snapshot.docs[snapshot.docs.length - 1]?.id,
    has_more: snapshot.docs.length === limit
  };
}
```

**Database Query Batching:**
```typescript
// Bad: N+1 query problem
for (const request of requests) {
  const merchant = await getMerchant(request.merchant_id);
  request.merchant = merchant;
}

// Good: Batch query
const merchantIds = requests.map(r => r.merchant_id);
const merchants = await db.collection('merchants')
  .where('id', 'in', merchantIds)
  .get();

const merchantMap = new Map(merchants.docs.map(doc => [doc.id, doc.data()]));
requests.forEach(request => {
  request.merchant = merchantMap.get(request.merchant_id);
});
```

**Lazy Loading:**
```typescript
// Load only essential data initially
const searchResults = await getSearchResults(requestId);

// Load additional data on demand
const detailedMerchant = await getMerchantDetails(merchantId); // Only when user clicks
```

---

### 5. Asynchronous Processing

**Job Queue (Bull):**
```typescript
import Queue from 'bull';

// Create queues
const notificationQueue = new Queue('notifications', {
  redis: { host: 'localhost', port: 6379 }
});

const analyticsQueue = new Queue('analytics', {
  redis: { host: 'localhost', port: 6379 }
});

// Add jobs
await notificationQueue.add('send-push', {
  merchant_id: 'mer_xyz789',
  message: 'New search request',
  priority: 'high'
}, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 }
});

// Process jobs
notificationQueue.process('send-push', async (job) => {
  const { merchant_id, message } = job.data;
  await sendPushNotification(merchant_id, message);
});

// Monitor queue
notificationQueue.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

notificationQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});
```

**Background Tasks:**
```typescript
// Daily aggregation (runs at midnight)
cron.schedule('0 0 * * *', async () => {
  await aggregateDailyMetrics();
  await generateMerchantInsights();
  await cleanupExpiredData();
});

// ML model retraining (weekly on Sunday)
cron.schedule('0 2 * * 0', async () => {
  await retrainDemandForecastModel();
  await retrainPricingModel();
});
```

---

### 6. Database Sharding

**Geographic Sharding:**
```typescript
// Shard by location (region-based)
const shards = {
  'north': 'db-north.hyperlocal.ai',
  'south': 'db-south.hyperlocal.ai',
  'east': 'db-east.hyperlocal.ai',
  'west': 'db-west.hyperlocal.ai'
};

function getShardForLocation(lat: number, lng: number): string {
  // Determine region based on coordinates
  if (lat > 28) return 'north';
  if (lat < 15) return 'south';
  if (lng > 80) return 'east';
  return 'west';
}

async function saveMerchant(merchant: Merchant) {
  const shard = getShardForLocation(merchant.location.lat, merchant.location.lng);
  const db = connectToShard(shard);
  await db.collection('merchants').add(merchant);
}
```

---

### 7. CDN & Asset Optimization

**Image Optimization:**
```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/merchant-photo.jpg"
  width={400}
  height={300}
  alt="Store photo"
  loading="lazy"
  quality={75}
  placeholder="blur"
/>
```

**Code Splitting:**
```typescript
// Dynamic imports for large components
const MerchantDashboard = dynamic(() => import('./MerchantDashboard'), {
  loading: () => <Spinner />,
  ssr: false
});
```

**Bundle Optimization:**
```javascript
// next.config.js
module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10
          }
        }
      };
    }
    return config;
  }
};
```

---

### 8. Performance Monitoring

**Key Metrics:**
```typescript
// Track performance metrics
const metrics = {
  api_latency: {
    p50: 150,  // ms
    p95: 450,  // ms
    p99: 1200  // ms
  },
  database_query_time: {
    p50: 50,   // ms
    p95: 200,  // ms
    p99: 500   // ms
  },
  cache_hit_rate: 0.85,  // 85%
  error_rate: 0.001,     // 0.1%
  throughput: 1000       // requests/second
};
```

**Performance Budget:**
```typescript
// Set performance budgets
const budgets = {
  page_load_time: 2000,      // 2 seconds
  time_to_interactive: 3000, // 3 seconds
  first_contentful_paint: 1000, // 1 second
  api_response_time: 500,    // 500ms
  bundle_size: 200           // 200KB
};

// Alert if exceeded
if (metrics.api_latency.p95 > budgets.api_response_time) {
  alertTeam('API latency exceeded budget');
}
```

---

### 9. Capacity Planning

**Current Capacity (MVP):**
- 10K concurrent users
- 100K daily active users
- 500K searches per day
- 1M API requests per day

**Year 1 Target:**
- 100K concurrent users
- 1M daily active users
- 5M searches per day
- 10M API requests per day

**Scaling Plan:**
```typescript
const scalingPlan = {
  phase1: { // 0-10K users
    api_servers: 2,
    db_connections: 20,
    redis_memory: '1GB',
    ml_instances: 1
  },
  phase2: { // 10K-100K users
    api_servers: 10,
    db_connections: 100,
    redis_memory: '5GB',
    ml_instances: 3
  },
  phase3: { // 100K-1M users
    api_servers: 50,
    db_connections: 500,
    redis_memory: '20GB',
    ml_instances: 10,
    db_sharding: true
  }
};
```

---

## Deployment Architecture

### Infrastructure Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION ENVIRONMENT                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Vercel (Frontend + API Gateway)                   │    │
│  │  • Next.js application                             │    │
│  │  • Edge functions                                  │    │
│  │  • Global CDN                                      │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Railway (ML Service)                              │    │
│  │  • Python FastAPI                                  │    │
│  │  • Docker containers                               │    │
│  │  • Auto-scaling                                    │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Firebase    │  │  Supabase    │  │  Redis Cloud │    │
│  │  (Firestore) │  │  (PostgreSQL)│  │  (Cache)     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### 1. Environment Setup

**Environments:**
```
Development → Staging → Production
```

**Environment Variables:**
```bash
# .env.development
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000/api
FIREBASE_PROJECT_ID=hyperlocal-dev
DATABASE_URL=postgresql://localhost:5432/hyperlocal_dev
REDIS_URL=redis://localhost:6379
ML_SERVICE_URL=http://localhost:8000

# .env.staging
NODE_ENV=staging
NEXT_PUBLIC_API_URL=https://staging.hyperlocal.ai/api
FIREBASE_PROJECT_ID=hyperlocal-staging
DATABASE_URL=postgresql://staging-db.supabase.co:5432/hyperlocal
REDIS_URL=redis://staging-redis.cloud:6379
ML_SERVICE_URL=https://ml-staging.railway.app

# .env.production
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.hyperlocal.ai
FIREBASE_PROJECT_ID=hyperlocal-prod
DATABASE_URL=postgresql://prod-db.supabase.co:5432/hyperlocal
REDIS_URL=redis://prod-redis.cloud:6379
ML_SERVICE_URL=https://ml.hyperlocal.ai
```

---

### 2. CI/CD Pipeline

**GitHub Actions Workflow:**

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main, staging, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Next.js app
        run: |
          npm ci
          npm run build
      
      - name: Build ML service Docker image
        run: |
          cd ml-service
          docker build -t hyperlocal-ml:${{ github.sha }} .

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel (Staging)
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./
      
      - name: Deploy ML service to Railway (Staging)
        run: |
          railway up --service ml-service --environment staging

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./
      
      - name: Deploy ML service to Railway (Production)
        run: |
          railway up --service ml-service --environment production
      
      - name: Run smoke tests
        run: npm run test:smoke
        env:
          API_URL: https://api.hyperlocal.ai
      
      - name: Notify team
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

### 3. Database Migrations

**Prisma Migration Strategy:**

```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model DemandAnalytics {
  id              String   @id @default(uuid())
  date            DateTime
  hour            Int?
  merchantId      String   @map("merchant_id")
  product         String
  category        String?
  searchCount     Int      @default(0) @map("search_count")
  responseCount   Int      @default(0) @map("response_count")
  conversionCount Int      @default(0) @map("conversion_count")
  avgPrice        Decimal? @map("avg_price")
  createdAt       DateTime @default(now()) @map("created_at")

  @@unique([date, hour, merchantId, product])
  @@index([date, merchantId])
  @@index([product, date])
  @@map("demand_analytics")
}
```

**Migration Commands:**
```bash
# Create migration
npx prisma migrate dev --name add_demand_analytics

# Apply migrations to staging
npx prisma migrate deploy --preview-feature

# Apply migrations to production
npx prisma migrate deploy
```

**Migration Script:**
```typescript
// scripts/migrate.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log('Running migrations...');
    
    // Run custom data migrations if needed
    await backfillData();
    
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function backfillData() {
  // Example: Backfill missing data
  await prisma.$executeRaw`
    UPDATE merchants 
    SET response_rate = (
      SELECT COUNT(*) * 100.0 / NULLIF(COUNT(*), 0)
      FROM merchant_responses
      WHERE merchant_id = merchants.id
    )
    WHERE response_rate IS NULL
  `;
}

migrate();
```

---

### 4. Monitoring & Observability

**Monitoring Stack:**

**1. Application Monitoring (Sentry):**
```typescript
// sentry.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.authorization;
    }
    return event;
  }
});
```

**2. Performance Monitoring (LogRocket):**
```typescript
// logrocket.config.ts
import LogRocket from 'logrocket';

if (process.env.NODE_ENV === 'production') {
  LogRocket.init('hyperlocal/production', {
    network: {
      requestSanitizer: request => {
        // Sanitize sensitive data
        if (request.headers.authorization) {
          request.headers.authorization = '[REDACTED]';
        }
        return request;
      }
    }
  });
}
```

**3. Analytics (Mixpanel):**
```typescript
// analytics.ts
import mixpanel from 'mixpanel-browser';

mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN);

export const analytics = {
  track: (event: string, properties?: any) => {
    mixpanel.track(event, properties);
  },
  
  identify: (userId: string, traits?: any) => {
    mixpanel.identify(userId);
    if (traits) mixpanel.people.set(traits);
  },
  
  page: (name: string) => {
    mixpanel.track('Page View', { page: name });
  }
};

// Usage
analytics.track('Search Created', {
  query: 'Harpic lemon',
  radius: 1000,
  results_count: 5
});
```

**4. Infrastructure Monitoring (Prometheus + Grafana):**
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'api-server'
    static_configs:
      - targets: ['api.hyperlocal.ai:9090']
  
  - job_name: 'ml-service'
    static_configs:
      - targets: ['ml.hyperlocal.ai:9090']
  
  - job_name: 'postgres'
    static_configs:
      - targets: ['db.hyperlocal.ai:9187']
```

**Custom Metrics:**
```typescript
// metrics.ts
import { Counter, Histogram, Gauge } from 'prom-client';

export const searchCounter = new Counter({
  name: 'searches_total',
  help: 'Total number of searches',
  labelNames: ['status']
});

export const apiLatency = new Histogram({
  name: 'api_request_duration_seconds',
  help: 'API request duration',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of active users',
  labelNames: ['type']
});

// Usage
searchCounter.inc({ status: 'success' });
apiLatency.observe({ method: 'POST', route: '/api/search', status: '200' }, 0.5);
activeUsers.set({ type: 'customer' }, 1250);
```

---

### 5. Logging

**Structured Logging:**
```typescript
// logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'hyperlocal-api',
    environment: process.env.NODE_ENV
  },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Usage
logger.info('Search request received', {
  user_id: 'user_123',
  query: 'Harpic lemon',
  location: { lat: 28.6139, lng: 77.2090 }
});

logger.error('Database query failed', {
  error: error.message,
  stack: error.stack,
  query: 'SELECT * FROM merchants'
});
```

**Log Aggregation (ELK Stack):**
```yaml
# docker-compose.yml
version: '3'
services:
  elasticsearch:
    image: elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
    ports:
      - 9200:9200
  
  logstash:
    image: logstash:8.5.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - 5000:5000
  
  kibana:
    image: kibana:8.5.0
    ports:
      - 5601:5601
    depends_on:
      - elasticsearch
```

---

### 6. Backup & Disaster Recovery

**Backup Strategy:**

**Database Backups:**
```bash
# Automated daily backups
0 2 * * * pg_dump -h db.hyperlocal.ai -U admin hyperlocal | gzip > /backups/hyperlocal_$(date +\%Y\%m\%d).sql.gz

# Retention policy
# Daily backups: 7 days
# Weekly backups: 4 weeks
# Monthly backups: 12 months
```

**Firestore Backups:**
```typescript
// Automated Firestore exports
import { firestore } from 'firebase-admin';

async function backupFirestore() {
  const client = new firestore.v1.FirestoreAdminClient();
  
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const bucket = `gs://${projectId}-backups`;
  
  await client.exportDocuments({
    name: client.databasePath(projectId, '(default)'),
    outputUriPrefix: bucket,
    collectionIds: [] // Empty = all collections
  });
}

// Run daily
cron.schedule('0 3 * * *', backupFirestore);
```

**Disaster Recovery Plan:**
```
RTO (Recovery Time Objective): 4 hours
RPO (Recovery Point Objective): 24 hours

Recovery Steps:
1. Detect outage (automated monitoring)
2. Assess impact and root cause
3. Activate backup systems
4. Restore from latest backup
5. Verify data integrity
6. Resume operations
7. Post-mortem analysis
```

---

### 7. Rollback Strategy

**Deployment Rollback:**
```bash
# Vercel rollback
vercel rollback https://hyperlocal.ai

# Railway rollback
railway rollback --service ml-service

# Database rollback
npx prisma migrate resolve --rolled-back <migration_name>
```

**Feature Flags:**
```typescript
// feature-flags.ts
export const features = {
  ai_insights: process.env.FEATURE_AI_INSIGHTS === 'true',
  voice_search: process.env.FEATURE_VOICE_SEARCH === 'true',
  reservation_system: process.env.FEATURE_RESERVATIONS === 'true'
};

// Usage
if (features.ai_insights) {
  return <AIInsightsDashboard />;
} else {
  return <BasicDashboard />;
}
```

---

### 8. Health Checks

**API Health Endpoint:**
```typescript
// pages/api/health.ts
export default async function handler(req, res) {
  const checks = {
    api: 'ok',
    database: await checkDatabase(),
    redis: await checkRedis(),
    ml_service: await checkMLService(),
    firebase: await checkFirebase()
  };
  
  const allHealthy = Object.values(checks).every(status => status === 'ok');
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  });
}

async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return 'ok';
  } catch {
    return 'error';
  }
}
```

**Uptime Monitoring:**
```typescript
// External monitoring (UptimeRobot, Pingdom)
const endpoints = [
  'https://api.hyperlocal.ai/health',
  'https://ml.hyperlocal.ai/health',
  'https://hyperlocal.ai'
];

// Check every 5 minutes
// Alert if down for >2 minutes
```

---

## Monitoring & Observability

### Monitoring Dashboard

**Key Metrics to Track:**

```typescript
interface SystemMetrics {
  // Performance Metrics
  api_latency: {
    p50: number;
    p95: number;
    p99: number;
  };
  
  // Business Metrics
  daily_active_users: number;
  searches_per_day: number;
  merchant_response_rate: number;
  customer_conversion_rate: number;
  
  // System Health
  error_rate: number;
  uptime_percentage: number;
  database_connections: number;
  cache_hit_rate: number;
  
  // ML Metrics
  query_parsing_accuracy: number;
  demand_forecast_mape: number;
  model_inference_time: number;
}
```

---

### 1. Real-time Alerts

**Alert Configuration:**
```typescript
const alerts = [
  {
    name: 'High Error Rate',
    condition: 'error_rate > 1%',
    severity: 'critical',
    channels: ['slack', 'pagerduty', 'email']
  },
  {
    name: 'API Latency Spike',
    condition: 'api_latency.p95 > 2000ms',
    severity: 'warning',
    channels: ['slack']
  },
  {
    name: 'Low Merchant Response Rate',
    condition: 'merchant_response_rate < 50%',
    severity: 'warning',
    channels: ['slack', 'email']
  },
  {
    name: 'Database Connection Pool Exhausted',
    condition: 'database_connections > 90% of max',
    severity: 'critical',
    channels: ['slack', 'pagerduty']
  },
  {
    name: 'ML Model Accuracy Drop',
    condition: 'query_parsing_accuracy < 85%',
    severity: 'warning',
    channels: ['slack', 'email']
  }
];
```

**Slack Integration:**
```typescript
import { WebClient } from '@slack/web-api';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

async function sendAlert(alert: Alert) {
  await slack.chat.postMessage({
    channel: '#alerts',
    text: `🚨 ${alert.severity.toUpperCase()}: ${alert.name}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${alert.name}*\n${alert.description}`
        }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Severity:*\n${alert.severity}` },
          { type: 'mrkdwn', text: `*Time:*\n${new Date().toISOString()}` }
        ]
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View Dashboard' },
            url: 'https://dashboard.hyperlocal.ai'
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Acknowledge' },
            action_id: 'acknowledge_alert'
          }
        ]
      }
    ]
  });
}
```

---

### 2. Custom Dashboards

**Grafana Dashboard Configuration:**
```json
{
  "dashboard": {
    "title": "HyperLocal AI - System Overview",
    "panels": [
      {
        "title": "API Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(api_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Response Time (p95)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, api_request_duration_seconds_bucket)",
            "legendFormat": "p95"
          }
        ]
      },
      {
        "title": "Active Users",
        "type": "stat",
        "targets": [
          {
            "expr": "active_users{type='customer'}",
            "legendFormat": "Customers"
          },
          {
            "expr": "active_users{type='merchant'}",
            "legendFormat": "Merchants"
          }
        ]
      },
      {
        "title": "Search Success Rate",
        "type": "gauge",
        "targets": [
          {
            "expr": "searches_total{status='success'} / searches_total * 100"
          }
        ]
      }
    ]
  }
}
```

---

### 3. Business Intelligence Dashboard

**Merchant Analytics:**
```typescript
interface MerchantAnalytics {
  // Performance
  response_rate: number;
  avg_response_time: number;
  conversion_rate: number;
  
  // Engagement
  total_requests: number;
  total_responses: number;
  total_conversions: number;
  
  // Revenue
  estimated_revenue: number;
  revenue_opportunity: number;
  
  // Trends
  weekly_trend: 'up' | 'down' | 'stable';
  top_products: Array<{
    product: string;
    search_count: number;
    conversion_rate: number;
  }>;
  
  // Benchmarks
  area_avg_response_rate: number;
  percentile_rank: number;
}
```

**Admin Dashboard Queries:**
```typescript
// System-wide metrics
async function getSystemMetrics(period: 'day' | 'week' | 'month') {
  const metrics = await prisma.$queryRaw`
    SELECT 
      COUNT(DISTINCT customer_id) as total_customers,
      COUNT(DISTINCT merchant_id) as total_merchants,
      COUNT(*) as total_searches,
      AVG(CASE WHEN response_count > 0 THEN 1 ELSE 0 END) * 100 as response_rate,
      AVG(CASE WHEN conversion_count > 0 THEN 1 ELSE 0 END) * 100 as conversion_rate
    FROM search_requests
    WHERE created_at > NOW() - INTERVAL '1 ${period}'
  `;
  
  return metrics[0];
}

// Top performing merchants
async function getTopMerchants(limit: number = 10) {
  return await prisma.merchant.findMany({
    orderBy: [
      { metrics: { response_rate: 'desc' } },
      { metrics: { total_conversions: 'desc' } }
    ],
    take: limit,
    select: {
      id: true,
      business_name: true,
      location: true,
      metrics: true
    }
  });
}

// Trending products
async function getTrendingProducts(location: string, days: number = 7) {
  return await prisma.$queryRaw`
    SELECT 
      product,
      COUNT(*) as search_count,
      COUNT(*) - LAG(COUNT(*)) OVER (ORDER BY date) as growth
    FROM demand_analytics
    WHERE location_geohash LIKE ${location + '%'}
      AND date > NOW() - INTERVAL '${days} days'
    GROUP BY product, date
    ORDER BY growth DESC
    LIMIT 20
  `;
}
```

---

## Future Enhancements

### Phase 2 Features (Months 7-12)

**1. Voice Search**
```typescript
// Speech-to-text integration
import { SpeechClient } from '@google-cloud/speech';

async function transcribeAudio(audioBuffer: Buffer) {
  const client = new SpeechClient();
  
  const [response] = await client.recognize({
    audio: { content: audioBuffer.toString('base64') },
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: 'en-IN',
      alternativeLanguageCodes: ['hi-IN'],
      enableAutomaticPunctuation: true
    }
  });
  
  return response.results
    .map(result => result.alternatives[0].transcript)
    .join(' ');
}
```

**2. Image Search**
```typescript
// Visual product matching
import vision from '@google-cloud/vision';

async function searchByImage(imageBuffer: Buffer) {
  const client = new vision.ImageAnnotatorClient();
  
  const [result] = await client.labelDetection(imageBuffer);
  const labels = result.labelAnnotations;
  
  // Extract product information
  const productLabels = labels
    .filter(label => label.score > 0.8)
    .map(label => label.description);
  
  // Search for matching products
  return await searchProducts(productLabels.join(' '));
}
```

**3. WhatsApp Integration**
```typescript
// Twilio WhatsApp API
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendWhatsAppNotification(merchant: Merchant, request: SearchRequest) {
  await client.messages.create({
    from: 'whatsapp:+14155238886',
    to: `whatsapp:${merchant.phone}`,
    body: `New search request: ${request.query}\nCustomer is ${request.distance}m away.\nReply YES if available.`
  });
}

// Handle incoming WhatsApp messages
app.post('/webhooks/whatsapp', async (req, res) => {
  const { From, Body } = req.body;
  
  if (Body.toLowerCase() === 'yes') {
    await recordMerchantResponse(From, 'available');
  }
  
  res.status(200).send('OK');
});
```

**4. Multi-language Support**
```typescript
// i18n configuration
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: require('./locales/en.json') },
      hi: { translation: require('./locales/hi.json') },
      ta: { translation: require('./locales/ta.json') },
      te: { translation: require('./locales/te.json') }
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  });

// Usage
<Trans i18nKey="search.placeholder">
  Search for products near you
</Trans>
```

**5. Delivery Service Integration**
```typescript
// Partner with delivery services
interface DeliveryOption {
  provider: 'dunzo' | 'swiggy' | 'zomato';
  estimated_time: number; // minutes
  delivery_fee: number;
  available: boolean;
}

async function getDeliveryOptions(
  merchant: Merchant,
  customer: Customer
): Promise<DeliveryOption[]> {
  const distance = calculateDistance(merchant.location, customer.location);
  
  return [
    {
      provider: 'dunzo',
      estimated_time: Math.ceil(distance / 200) + 15, // 200m/min + 15min prep
      delivery_fee: distance < 2000 ? 30 : 50,
      available: distance < 5000
    }
  ];
}
```

**6. B2B Marketplace**
```typescript
// Bulk ordering for merchants
interface BulkOrder {
  merchant_id: string;
  supplier_id: string;
  products: Array<{
    product: string;
    quantity: number;
    unit_price: number;
  }>;
  total_amount: number;
  delivery_date: Date;
  status: 'pending' | 'confirmed' | 'delivered';
}

// AI-powered supplier recommendations
async function recommendSuppliers(merchant: Merchant) {
  const topProducts = await getTopSearchedProducts(merchant.id);
  
  const suppliers = await findSuppliers({
    products: topProducts,
    location: merchant.location,
    rating: { gte: 4.0 }
  });
  
  return suppliers.map(supplier => ({
    ...supplier,
    estimated_savings: calculateSavings(supplier, merchant.current_supplier)
  }));
}
```

---

### Phase 3 Features (Year 2)

**1. Predictive Inventory Management**
```typescript
// Automated reorder suggestions
async function generateReorderSuggestions(merchant_id: string) {
  const inventory = await getCurrentInventory(merchant_id);
  const forecast = await getDemandForecast(merchant_id, 14); // 2 weeks
  
  const suggestions = [];
  
  for (const item of inventory) {
    const predicted_demand = forecast[item.product] || 0;
    const current_stock = item.quantity;
    const reorder_point = item.reorder_point || predicted_demand * 0.3;
    
    if (current_stock < reorder_point) {
      suggestions.push({
        product: item.product,
        current_stock,
        predicted_demand,
        suggested_order_quantity: Math.ceil(predicted_demand * 1.2),
        urgency: current_stock < predicted_demand * 0.1 ? 'high' : 'medium'
      });
    }
  }
  
  return suggestions;
}
```

**2. Dynamic Pricing**
```typescript
// Real-time price optimization
async function optimizePrice(product: string, merchant_id: string) {
  const factors = await getPricingFactors(product, merchant_id);
  
  const optimal_price = calculateOptimalPrice({
    cost: factors.cost,
    demand_elasticity: factors.elasticity,
    competitor_prices: factors.market_prices,
    inventory_level: factors.stock_level,
    time_of_day: new Date().getHours(),
    day_of_week: new Date().getDay()
  });
  
  return {
    current_price: factors.current_price,
    optimal_price,
    expected_impact: {
      demand_change: calculateDemandChange(factors.current_price, optimal_price),
      revenue_change: calculateRevenueChange(factors.current_price, optimal_price)
    }
  };
}
```

**3. Customer Loyalty Program**
```typescript
interface LoyaltyProgram {
  customer_id: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  benefits: {
    discount_percentage: number;
    free_delivery: boolean;
    priority_support: boolean;
  };
}

// Earn points on purchases
async function awardPoints(customer_id: string, purchase_amount: number) {
  const points = Math.floor(purchase_amount / 10); // 1 point per ₹10
  
  await prisma.loyaltyProgram.update({
    where: { customer_id },
    data: {
      points: { increment: points }
    }
  });
  
  // Check for tier upgrade
  await checkTierUpgrade(customer_id);
}
```

---

## Appendix

### Technology Decision Matrix

| Requirement | Options Considered | Selected | Rationale |
|-------------|-------------------|----------|-----------|
| Frontend Framework | React, Vue, Angular | Next.js (React) | SSR/SSG, API routes, excellent DX |
| Backend Runtime | Node.js, Python, Go | Node.js + Python | Node for API, Python for ML |
| Database (Real-time) | Firestore, MongoDB, DynamoDB | Firestore | Real-time sync, offline support |
| Database (Analytics) | PostgreSQL, MySQL, MongoDB | PostgreSQL | Complex queries, geospatial |
| Caching | Redis, Memcached | Redis | Pub/sub, data structures |
| ML Framework | TensorFlow, PyTorch, scikit-learn | scikit-learn + Prophet | Production-ready, simpler |
| Hosting | AWS, GCP, Azure, Vercel | Vercel + Railway | Easy deployment, auto-scaling |

---

### Glossary

- **MAPE:** Mean Absolute Percentage Error (ML accuracy metric)
- **PWA:** Progressive Web App
- **SSR:** Server-Side Rendering
- **SSG:** Static Site Generation
- **JWT:** JSON Web Token
- **RBAC:** Role-Based Access Control
- **CDN:** Content Delivery Network
- **TTL:** Time To Live
- **RTO:** Recovery Time Objective
- **RPO:** Recovery Point Objective
- **NLP:** Natural Language Processing
- **API:** Application Programming Interface
- **REST:** Representational State Transfer
- **ACID:** Atomicity, Consistency, Isolation, Durability

---

### References

**Documentation:**
- Next.js: https://nextjs.org/docs
- Firebase: https://firebase.google.com/docs
- Prophet: https://facebook.github.io/prophet/
- PostgreSQL: https://www.postgresql.org/docs/
- Redis: https://redis.io/documentation

**Best Practices:**
- API Design: https://restfulapi.net/
- Security: https://owasp.org/
- Performance: https://web.dev/performance/
- Scalability: https://12factor.net/

---

**Document Version:** 1.0  
**Last Updated:** February 15, 2026  
**Next Review:** March 2026  
**Maintained By:** Engineering Team  
**Status:** Living Document

---

