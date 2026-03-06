# NearBy – Technical Design

## Architecture

```
customer-app (CloudFront) ──┐
merchant-app (CloudFront) ──┤──→ API Gateway (ap-south-1) ──→ Lambda handlers
admin-app (CloudFront) ──┘                                      │
                                                                 ↓
                                                    ┌────────────┴────────────┐
                                                    │                         │
                                                DynamoDB tables          S3 (capabilities JSON, static)
                                                    │                         │
                                        Amazon Location Service    SNS + FCM (notifications)
```

## Admin App Design

### Tech Stack
- Vite + React + TypeScript + Tailwind CSS
- React Router v6
- Recharts (for analytics charts)
- Axios with admin JWT interceptor

### Route Structure
```
/login → AdminLogin
/ → Dashboard (KPIs)
/users → UserManagement
/merchants → MerchantManagement
/queries → QueriesSection
/locations → LocationClusters + radius config
/offers → OffersManagement
/notifications → NotificationSender
/analytics → AISearchAnalytics
```

### Sidebar
- Logo: "NearBy" with green dot, subtitle "Admin Panel"
- Nav items with icons (Lucide React)
- Bottom: admin email + Sign Out

### Color System (matches merchant-app green theme)
- Primary: #22C55E (green-500)
- Background: #F9FAFB
- Card: white, border 1px solid #E5E7EB, rounded-xl
- Danger: #EF4444
- Warning: #F59E0B

## Merchant App – Broadcast Real-Time Design

### Polling Strategy
- useEffect with setInterval(15000) on dashboard mount
- GET /merchant/broadcasts?since={lastFetchTimestamp}
- Merge new cards into existing list (dedup by broadcastId)
- Show "New request" toast when new cards arrive

### Broadcast Card States
```
PENDING → Show 3 action buttons (I Have It / Schedule / No Stock)
RESPONDED → Show "You responded: YES" strip + timestamp (no buttons)
EXPIRED → Show "Expired" badge in grey
```

## Customer App – Response Polling Design

### Search → Response Flow
```
POST /broadcasts → { broadcastId }
↓ (every 10s)
GET /broadcasts/{broadcastId}/responses → [
  { merchantId, shopName, responseType, price, distance }
]
```

### Response Card Types
- YES: green card, "In Stock", show price + distance + "Reserve" button
- ALTERNATIVE: amber card, "Available with delay", show schedule time
- NO: grey card, "Not Available"

## Database Schema Additions

### nearby-backend-prod-config
```json
{
  "configKey": "searchRadiusKm",
  "value": 3
}
{
  "configKey": "globalOffersEnabled",
  "value": true
}
```

### nearby-backend-prod-queries
```json
{
  "queryId": "uuid",
  "senderType": "user" | "merchant",
  "senderPhone": "9876543210",
  "message": "...",
  "status": "pending" | "reviewed",
  "createdAt": "ISO timestamp"
}
```

### nearby-backend-prod-analytics (updated)
```json
{
  "analyticsId": "uuid",
  "queryText": "...",
  "majorCategory": "...",
  "subCategory": "...",
  "capabilityId": "...",
  "matchCount": 3,
  "timestamp": "ISO",
  "city": "Bengaluru",
  "area": "Koramangala"
}
```

## Environment Variables

### admin-app
```
VITE_API_BASE_URL=https://4cwdqd7sz4.execute-api.ap-south-1.amazonaws.com/prod
VITE_APP_NAME=NearBy Admin
```

### merchant-app
```
VITE_API_BASE_URL=https://4cwdqd7sz4.execute-api.ap-south-1.amazonaws.com/prod
VITE_ADMIN_URL=https://<admin-cloudfront-id>.cloudfront.net
```

### customer-app
```
VITE_API_BASE_URL=https://4cwdqd7sz4.execute-api.ap-south-1.amazonaws.com/prod
VITE_MERCHANT_URL=https://<merchant-cloudfront-id>.cloudfront.net
```

## Deployment

Each app:
```bash
npm run build → dist/
aws s3 sync dist/ s3://{bucket}/ --delete
aws cloudfront create-invalidation --distribution-id {id} --paths "/*"
```

S3 buckets:
- nearby-admin-frontend
- nearby-merchant-frontend
- nearby-customer-frontend

All buckets: Block Public Access ON, served only via CloudFront OAC.
