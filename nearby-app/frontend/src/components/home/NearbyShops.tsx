import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { Badge } from '../ui/Badge';

// This should be replaced with the actual Merchant type from your types folder
interface Merchant {
  merchantId: string;
  name: string;
  distance: string;
  logoUrl?: string;
  category?: string; // Assuming a primary category string
}

interface NearbyShopsProps {
  merchants: Merchant[];
  isLoading: boolean;
}

const ShopCardSkeleton = () => (
  <Card className="flex-shrink-0 w-full">
    <CardHeader className="p-0">
      <Skeleton className="h-24 w-full rounded-t-lg rounded-b-none" />
    </CardHeader>
    <CardContent className="p-3 space-y-2">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </CardContent>
  </Card>
);

export const NearbyShops: React.FC<NearbyShopsProps> = ({ merchants, isLoading }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {isLoading && (
        Array.from({ length: 4 }).map((_, i) => <ShopCardSkeleton key={i} />)
      )}
      {!isLoading && merchants.map((merchant) => (
        <Card key={merchant.merchantId} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
          <CardHeader className="p-0 relative h-24 bg-muted group-hover:opacity-90 transition-opacity">
            {merchant.logoUrl ? (
              <img src={merchant.logoUrl} alt={merchant.name} className="h-full w-full object-contain p-4" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-muted-foreground bg-muted">
                {merchant.name.charAt(0)}
              </div>
            )}
          </CardHeader>
          <CardContent className="p-3">
            <h3 className="font-semibold text-sm truncate text-foreground">{merchant.name}</h3>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              {merchant.category && <Badge variant="secondary" className="text-xs">{merchant.category}</Badge>}
              <div className="flex items-center gap-1">
                <MapPin size={12} />
                <span>{merchant.distance} km</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
