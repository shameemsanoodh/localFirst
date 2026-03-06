# Featured Offer Banner Component

## Overview

The `FeaturedOfferBanner` component displays promotional offers on the Offers page. It supports dynamic configuration, visibility toggling, and automatic expiry handling.

## Features

- ✅ Dynamic offer configuration
- ✅ Visibility toggle (active/inactive)
- ✅ Automatic expiry handling
- ✅ Priority-based sorting
- ✅ Responsive design
- ✅ Gradient background with animations
- ✅ Multiple banner support
- ✅ Backward compatible with legacy props

## Configuration

All featured offers are managed in `src/config/featuredOffers.ts`:

```typescript
export const featuredOffers: FeaturedOffer[] = [
  {
    id: 'first-order-bonus',
    title: 'First Order Bonus!',
    description: 'Get ₹50 off on your first purchase from any shop',
    promoCode: 'NEARBY50',
    discount: 50,
    validUntil: '2026-12-31T23:59:59Z',
    isActive: true,
    priority: 1,
  },
];
```

## Usage

### Using Config (Recommended)

```typescript
import { FeaturedOfferBanner } from '@/components/offers/FeaturedOfferBanner';
import { getActiveFeaturedOffers } from '@/config/featuredOffers';

const activeFeaturedOffers = getActiveFeaturedOffers();

{activeFeaturedOffers.map((offer) => (
  <FeaturedOfferBanner key={offer.id} offer={offer} />
))}
```

### Using Legacy Props

```typescript
<FeaturedOfferBanner
  title="First Order Bonus!"
  description="Get ₹50 off on your first purchase"
  promoCode="NEARBY50"
  validUntil="Dec 31"
  discount={50}
/>
```

## Configuration Functions

### `getActiveFeaturedOffers()`
Returns only active, non-expired offers sorted by priority (highest first).

```typescript
const activeOffers = getActiveFeaturedOffers();
// Returns: FeaturedOffer[]
```

### `getFeaturedOfferById(id: string)`
Get a specific offer by its ID.

```typescript
const offer = getFeaturedOfferById('first-order-bonus');
// Returns: FeaturedOffer | undefined
```

### `isOfferExpired(offer: FeaturedOffer)`
Check if an offer has expired.

```typescript
const expired = isOfferExpired(offer);
// Returns: boolean
```

### `formatValidityDate(isoDate: string)`
Format date for display (e.g., "Dec 31" or "Jan 15, 2027").

```typescript
const formatted = formatValidityDate('2026-12-31T23:59:59Z');
// Returns: "Jan 1, 2027"
```

## Managing Offers

### Add New Offer

1. Open `src/config/featuredOffers.ts`
2. Add to the `featuredOffers` array:

```typescript
{
  id: 'weekend-special',
  title: 'Weekend Special!',
  description: 'Extra 20% off on all electronics',
  promoCode: 'WEEKEND20',
  discount: 20,
  validUntil: '2026-12-15T23:59:59Z',
  isActive: true,
  priority: 2,
}
```

### Toggle Visibility

Change the `isActive` flag:

```typescript
isActive: false  // Banner will not appear
isActive: true   // Banner will appear (if not expired)
```

### Set Expiry Date

Update the `validUntil` field with an ISO date string:

```typescript
validUntil: '2026-12-31T23:59:59Z'  // Expires Dec 31, 2026
```

### Set Priority

Higher priority offers appear first:

```typescript
priority: 1  // Highest priority (shows first)
priority: 2  // Lower priority (shows second)
```

## Visibility Rules

A banner will only display if:
1. `isActive` is `true`
2. Current date is before `validUntil`
3. Offer exists in the config

## Testing

Run the manual test script:

```bash
cd frontend
npx tsx src/config/featuredOffers.manual-test.ts
```

## Component Props

```typescript
interface FeaturedOfferBannerProps {
  offer?: FeaturedOffer;
  // Legacy props (optional)
  title?: string;
  description?: string;
  promoCode?: string;
  validUntil?: string;
  discount?: number;
}
```

## Styling

The banner uses:
- Gradient background: `from-blue-500 via-blue-600 to-purple-700`
- Rounded corners: `rounded-2xl`
- Shadow: `shadow-lg`
- Responsive padding
- Animated entrance
- Shine effect animation

## Examples

### Single Banner
```typescript
const activeOffers = getActiveFeaturedOffers();
{activeOffers.length > 0 && (
  <FeaturedOfferBanner offer={activeOffers[0]} />
)}
```

### Multiple Banners
```typescript
const activeOffers = getActiveFeaturedOffers();
{activeOffers.map((offer) => (
  <FeaturedOfferBanner key={offer.id} offer={offer} />
))}
```

### Conditional Display
```typescript
const offer = getFeaturedOfferById('first-order-bonus');
{offer && !isOfferExpired(offer) && (
  <FeaturedOfferBanner offer={offer} />
)}
```

## Implementation Details

- **Task:** 1.3 - Add Banner Data Management
- **Spec:** AI-Powered Multimodal Search
- **Phase:** 1 - Featured Offer Banner
- **Status:** ✅ Complete

## Related Files

- `src/config/featuredOffers.ts` - Configuration
- `src/components/offers/FeaturedOfferBanner.tsx` - Component
- `src/pages/user/Offers.tsx` - Usage example
- `src/config/featuredOffers.test.ts` - Unit tests
- `src/components/offers/FeaturedOfferBanner.test.tsx` - Component tests

## Browser Support

- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Mobile browsers: ✅

## Dependencies

- `lucide-react`: For Percent and Clock icons
- `react`: For hooks (useState, useEffect)
- Tailwind CSS: For styling
