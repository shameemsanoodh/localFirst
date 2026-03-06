# NearBy - Local Commerce Broadcasting Platform

> A hyperlocal marketplace PWA connecting users with nearby merchants through real-time broadcasting

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://reactjs.org/)
[![AWS Lambda](https://img.shields.io/badge/AWS-Lambda-orange)](https://aws.amazon.com/lambda/)
[![Serverless](https://img.shields.io/badge/Serverless-Framework-red)](https://www.serverless.com/)

## 🚀 Quick Start

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
npm install
npm run build
serverless offline
```

## 📖 Documentation

- **[PROJECT_COMPLETE.md](./PROJECT_COMPLETE.md)** - Complete project overview
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Deployment instructions
- **[FRONTEND_COMPLETE.md](./FRONTEND_COMPLETE.md)** - Frontend details
- **[requirements.md](../requirements.md)** - Original requirements
- **[design.md](../design.md)** - System design

## 🏗️ Architecture

```
Frontend (React PWA) → API Gateway → Lambda Functions → DynamoDB
                    ↓
                WebSocket → Real-time Updates
```

## ✨ Features

- 🎯 Real-time broadcast system with radar animation
- 📍 Geolocation-based merchant discovery
- 🎨 Swiggy/Zomato-style polished UI
- 🔐 JWT authentication with role-based access
- 📱 Progressive Web App (PWA)
- 🌐 WebSocket real-time communication
- 🎭 Three.js 3D animations
- 💳 Ready for payment integration

## 🛠️ Tech Stack

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS + Framer Motion
- Three.js + React Three Fiber
- Zustand + React Query
- React Router DOM

**Backend:**
- AWS Lambda (Node.js 20)
- API Gateway (REST + WebSocket)
- DynamoDB
- S3 + CloudFront
- Cognito + SNS

## 📦 Project Structure

```
nearby-app/
├── frontend/          # React PWA
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── store/
│   │   └── types/
│   └── package.json
├── backend/           # AWS Lambda
│   ├── src/
│   │   ├── auth/
│   │   ├── broadcasts/
│   │   ├── categories/
│   │   ├── offers/
│   │   └── shared/
│   ├── serverless.yml
│   └── package.json
└── infrastructure/    # IaC (Future)
```

## 🎯 User Roles

- **User**: Browse, search, broadcast requests, reserve offers
- **Merchant**: Manage shop, respond to broadcasts, create offers
- **Admin**: Platform management, user/merchant approval, analytics

## 🔐 Environment Variables

**Frontend (.env):**
```env
VITE_API_BASE_URL=https://your-api-url
VITE_WS_BASE_URL=wss://your-ws-url
```

**Backend (.env):**
```env
JWT_SECRET=your-secret-key
COGNITO_USER_POOL_ID=your-pool-id
COGNITO_CLIENT_ID=your-client-id
AWS_REGION=us-east-1
```

## 🚀 Deployment

### Frontend
```bash
cd frontend
npm run build
# Deploy to Vercel, Netlify, or S3+CloudFront
```

### Backend
```bash
cd backend
serverless deploy --stage prod
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## 💰 Cost Estimate

**Development**: ~$12.50/month  
**Production (Medium Traffic)**: ~$125/month

## 🧪 Testing

```bash
# Frontend
cd frontend
npm run test

# Backend
cd backend
npm run test
```

## 📊 Status

- ✅ Frontend: Complete (10 pages, 13 components)
- ✅ Backend: Complete (8 Lambda functions)
- ✅ Authentication: Complete
- ✅ Real-time: Complete (WebSocket)
- ✅ Geolocation: Complete
- ✅ Documentation: Complete

## 🤝 Contributing

This is a complete production-ready project. Feel free to fork and customize for your needs.

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Inspired by Swiggy, Zomato, and Blinkit
- Built with modern web technologies
- Designed for scalability and performance

---

**Built with ❤️ using React, TypeScript, and AWS**
