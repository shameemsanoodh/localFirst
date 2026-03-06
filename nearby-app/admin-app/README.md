# NearBy Admin Dashboard

Complete admin dashboard for managing the NearBy platform with real-time analytics, location insights, and user management.

## Features

### 1. Dashboard
- Real-time platform metrics
- User growth charts
- Merchant category distribution
- Auto-refresh every 30 seconds

### 2. Location Analytics
- Area-wise merchant and user distribution
- Top categories by location
- Broadcast activity by area
- Interactive charts

### 3. Search Analytics
- Most searched keywords
- Search trends (up/down/stable)
- Category-wise search volume
- Top trending searches

### 4. Merchant Management
- View all merchants
- Search and filter by category
- Suspend/Activate merchants
- Delete merchants
- View merchant details (location, contact, category)

### 5. User Management
- View all users
- Search by name or phone
- Suspend/Activate users
- Delete users
- View user location

### 6. Broadcast Management
- Monitor all broadcasts
- View broadcast details
- Delete inappropriate broadcasts
- See response counts

## Tech Stack

- React 18 + TypeScript
- Vite for build
- Tailwind CSS for styling
- Framer Motion for animations
- Recharts for data visualization
- Zustand for state management
- React Router for navigation

## Getting Started

### Installation

```bash
cd admin-app
npm install
```

### Development

```bash
npm run dev
```

The app will run on `http://localhost:5174`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Login Credentials

For demo/development:
- Username: `admin`
- Password: `admin123`

## Environment Variables

Create `.env` file:
```
VITE_API_BASE_URL=http://localhost:3000/dev
```

For production (`.env.production`):
```
VITE_API_BASE_URL=https://4cwdqd7sz4.execute-api.ap-south-1.amazonaws.com/prod
```

## API Endpoints

The admin dashboard connects to these backend endpoints:

- `GET /admin/stats` - Dashboard statistics
- `GET /admin/merchants` - List all merchants
- `POST /admin/merchants/:id/suspend` - Suspend merchant
- `POST /admin/merchants/:id/activate` - Activate merchant
- `DELETE /admin/merchants/:id` - Delete merchant
- `GET /admin/users` - List all users
- `POST /admin/users/:id/suspend` - Suspend user
- `POST /admin/users/:id/activate` - Activate user
- `DELETE /admin/users/:id` - Delete user
- `GET /admin/broadcasts` - List all broadcasts
- `DELETE /admin/broadcasts/:id` - Delete broadcast
- `GET /admin/analytics/location` - Location insights
- `GET /admin/analytics/search` - Search trends

## Features in Detail

### Real-time Updates
- Dashboard auto-refreshes every 30 seconds
- Manual refresh button available
- Optimistic UI updates for actions

### Mobile Responsive
- Collapsible sidebar on mobile
- Touch-friendly interface
- Optimized charts for small screens

### Data Visualization
- Bar charts for user growth
- Pie charts for category distribution
- Area comparison charts
- Trend indicators

### User Actions
- Suspend/Activate users and merchants
- Delete accounts
- Search and filter
- View detailed information

## Project Structure

```
admin-app/
├── src/
│   ├── components/
│   │   └── Layout.tsx          # Main layout with sidebar
│   ├── pages/
│   │   ├── Login.tsx           # Admin login
│   │   ├── Dashboard.tsx       # Main dashboard
│   │   ├── LocationAnalytics.tsx
│   │   ├── SearchAnalytics.tsx
│   │   ├── Merchants.tsx       # Merchant management
│   │   ├── Users.tsx           # User management
│   │   └── Broadcasts.tsx      # Broadcast monitoring
│   ├── services/
│   │   └── api.service.ts      # API calls
│   ├── store/
│   │   └── authStore.ts        # Auth state management
│   ├── App.tsx                 # Main app with routing
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Design System

### Colors
- Primary: Blue (#3B82F6)
- Success: Green (#10B981)
- Warning: Orange (#F59E0B)
- Danger: Red (#EF4444)
- Purple: #8B5CF6

### Typography
- System fonts for optimal performance
- Font weights: 400 (normal), 600 (semibold), 700 (bold)

### Components
- Rounded corners (12px for cards, 8px for buttons)
- Consistent spacing (4px grid)
- Hover states on all interactive elements
- Smooth transitions (200-300ms)

## Future Enhancements

- [ ] Real-time WebSocket updates
- [ ] Export data to CSV/PDF
- [ ] Advanced filtering and sorting
- [ ] Bulk actions
- [ ] Email notifications
- [ ] Activity logs
- [ ] Role-based access control
- [ ] Dark mode
- [ ] Multi-language support

## Support

For issues or questions, contact the development team.
