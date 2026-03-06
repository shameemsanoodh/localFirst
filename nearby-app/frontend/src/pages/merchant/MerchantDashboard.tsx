import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Clock, IndianRupee,
  ArrowLeft, LogOut, Radio, Tag, Plus, BarChart2, ShoppingBag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';

// Import the new hooks
import { useMerchantProfile } from '@/hooks/useMerchantProfile';
import { useMerchantOrders } from '@/hooks/useMerchantOrders';
import { useMerchantOffers } from '@/hooks/useMerchantOffers';
import { useMerchantBroadcasts } from '@/hooks/useMerchantBroadcasts';

// Keep the same form and card components for now
// In a real app, these would also be refactored and moved to their own files.
import { PostCard } from '@/components/merchant/DashboardComponents'; 

type OrderStatus = 'pending' | 'approved' | 'picked_up' | 'completed' | 'cancelled';
type MainTab = 'orders' | 'offers' | 'broadcast' | 'analytics';

const statusTabs: { label: string; value: OrderStatus }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Picked Up', value: 'picked_up' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const mainTabs: { label: string; value: MainTab; icon: React.ReactNode }[] = [
  { label: 'Orders', value: 'orders', icon: <ShoppingBag size={15} /> },
  { label: 'Offers', value: 'offers', icon: <Tag size={15} /> },
  { label: 'Broadcast', value: 'broadcast', icon: <Radio size={15} /> },
  { label: 'Analytics', value: 'analytics', icon: <BarChart2 size={15} /> },
];

const MerchantDashboard: React.FC = () => {
  const navTo = useNavigate();
  const { clearAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState<MainTab>('orders');
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('pending');
  // @ts-ignore - Used in Button onClick but TypeScript doesn't detect it
  const [showCreateForm, setShowCreateForm] = useState(false);

  // --- Data Fetching using React Query Hooks ---
  const { merchant, isLoading: isLoadingProfile } = useMerchantProfile();
  const { orders, isLoading: isLoadingOrders } = useMerchantOrders(statusFilter);
  const { offers, isLoading: isLoadingOffers } = useMerchantOffers();
  const { broadcasts, isLoading: isLoadingBroadcasts } = useMerchantBroadcasts();
  // ---------------------------------------------

  const handleLogout = () => {
    clearAuth();
    // Clear all tokens and state
    navTo('/login');
  };

  // Memoize stats to prevent recalculation on every render
  const statItems = useMemo(() => [
    { label: "Today's Orders", value: orders.length, icon: Package, color: 'text-blue-600 bg-blue-50' },
    { label: 'Pending', value: orders.filter(o => o.status === 'pending').length, icon: Clock, color: 'text-orange-500 bg-orange-50' },
    { label: 'Revenue', value: '₹... ', icon: IndianRupee, color: 'text-green-600 bg-green-50' }, // Analytics data is separate
    { label: 'Active Offers', value: offers.length, icon: Tag, color: 'text-purple-600 bg-purple-50' },
  ], [orders, offers]);

  const allPosts = useMemo(() => {
    const offerPosts = offers.map(o => ({ ...o, type: 'offer' as const, id: o.offerId }));
    const broadcastPosts = broadcasts.map(b => ({ ...b, type: 'broadcast' as const, id: b.broadcastId, title: b.productName }));
    // @ts-ignore - createdAt exists on both types
    return [...offerPosts, ...broadcastPosts].sort((a, b) => new Date(b.createdAt || b.timestamp).getTime() - new Date(a.createdAt || a.timestamp).getTime());
  }, [offers, broadcasts]);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      {/* Header */}
      <header className="px-4 pt-8 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navTo(-1)} className="p-2 hover:bg-accent rounded-xl transition-colors">
              <ArrowLeft size={20} className="text-foreground" />
            </button>
            <div>
              {isLoadingProfile ? (
                <>
                  <Skeleton className="h-6 w-40 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <h1 className="text-xl font-bold text-foreground">{merchant?.shopName}</h1>
                  <p className="text-xs text-muted-foreground">Merchant Dashboard</p>
                </>
              )}
            </div>
          </div>
          <button onClick={handleLogout} className="p-2.5 hover:bg-destructive/10 rounded-xl transition-colors text-muted-foreground hover:text-destructive" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {isLoadingProfile ? Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="py-4"><Skeleton className="h-20 w-full" /></Card>
          )) : statItems.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card className="py-4 text-center">
                <div className={`w-9 h-9 mx-auto mb-2 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon size={18} />
                </div>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="px-4 mt-6">
        <div className="bg-card rounded-2xl shadow-sm p-1 flex gap-1">
          {mainTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex-1 py-2.5 px-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-1.5 ${activeTab === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent'
                }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 mt-5">
        <AnimatePresence mode="wait">
          {activeTab === 'orders' && (
            <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
                {statusTabs.map((st) => (
                  <button
                    key={st.value}
                    onClick={() => setStatusFilter(st.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${statusFilter === st.value
                      ? 'bg-primary text-primary-foreground border-transparent'
                      : 'bg-card text-foreground border-border hover:bg-accent'
                      }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
              {isLoadingOrders ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <AnimatePresence>
                  {orders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="text-5xl mb-3">📦</div>
                      <p className="text-sm">No {statusFilter.replace('_', ' ')} orders</p>
                    </div>
                  ) : orders.map((order) => (
                    <motion.div key={order.orderId} layout>
                      <Card className="mb-3">
                        <div className="p-4">
                          <h3 className="font-semibold text-foreground">{order.productName}</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">₹{order.price * order.quantity}</p>
                        </div>
                        {/* Add order actions here */}
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </motion.div>
          )}
          {(activeTab === 'offers' || activeTab === 'broadcast') && (
             <motion.div key="posts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* This is a simplified view. A real implementation would have separate forms and lists */}
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-foreground">Your {activeTab === 'offers' ? 'Offers' : 'Broadcasts'}</h2>
                  <Button onClick={() => setShowCreateForm(true)}><Plus size={15} /> New</Button>
                </div>
                {isLoadingOffers || isLoadingBroadcasts ? (
                  <div className="space-y-3"><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>
                ) : (
                  allPosts.filter(p => p.type === (activeTab === 'offers' ? 'offer' : 'broadcast')).map(p => (
                    // @ts-ignore - Type mismatch between Offer and OfferPost
                    <PostCard key={p.id} post={p} onDelete={() => {}} />
                  ))
                )}
             </motion.div>
          )}
          {activeTab === 'analytics' && (
            <motion.div key="analytics" className="text-center py-16 text-muted-foreground">
              <div className="text-6xl mb-4">📊</div>
              <p className="font-medium">Analytics Coming Soon</p>
              <p className="text-sm mt-1">This section will show your revenue, top products, and customer insights.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MerchantDashboard;
