import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeaturedOfferBanner } from './FeaturedOfferBanner';
import type { FeaturedOffer } from '@/config/featuredOffers';

describe('FeaturedOfferBanner', () => {
  const mockActiveOffer: FeaturedOffer = {
    id: 'test-offer',
    title: 'Test Offer',
    description: 'Test description',
    promoCode: 'TEST123',
    discount: 50,
    validUntil: '2099-12-31T23:59:59Z',
    isActive: true,
    priority: 1,
  };

  const mockInactiveOffer: FeaturedOffer = {
    ...mockActiveOffer,
    isActive: false,
  };

  const mockExpiredOffer: FeaturedOffer = {
    ...mockActiveOffer,
    validUntil: '2020-01-01T00:00:00Z',
  };

  describe('Visibility Logic', () => {
    it('should render when offer is active and not expired', () => {
      const { container } = render(<FeaturedOfferBanner offer={mockActiveOffer} />);
      
      expect(container.firstChild).not.toBeNull();
      expect(screen.getByText('Test Offer')).toBeInTheDocument();
    });

    it('should not render when offer is inactive', () => {
      const { container } = render(<FeaturedOfferBanner offer={mockInactiveOffer} />);
      
      expect(container.firstChild).toBeNull();
    });

    it('should not render when offer is expired', () => {
      const { container } = render(<FeaturedOfferBanner offer={mockExpiredOffer} />);
      
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Content Display', () => {
    it('should display offer title', () => {
      render(<FeaturedOfferBanner offer={mockActiveOffer} />);
      
      expect(screen.getByText('Test Offer')).toBeInTheDocument();
    });

    it('should display offer description', () => {
      render(<FeaturedOfferBanner offer={mockActiveOffer} />);
      
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('should display promo code', () => {
      render(<FeaturedOfferBanner offer={mockActiveOffer} />);
      
      expect(screen.getByText('TEST123')).toBeInTheDocument();
    });

    it('should display validity period', () => {
      render(<FeaturedOfferBanner offer={mockActiveOffer} />);
      
      // Should contain "Valid till" text
      expect(screen.getByText(/Valid till/i)).toBeInTheDocument();
    });
  });

  describe('Legacy Props Support', () => {
    it('should work with legacy props when no offer object provided', () => {
      render(
        <FeaturedOfferBanner
          title="Legacy Title"
          description="Legacy Description"
          promoCode="LEGACY"
          validUntil="Dec 31"
          discount={25}
        />
      );
      
      expect(screen.getByText('Legacy Title')).toBeInTheDocument();
      expect(screen.getByText('Legacy Description')).toBeInTheDocument();
      expect(screen.getByText('LEGACY')).toBeInTheDocument();
    });

    it('should use default values when no props provided', () => {
      render(<FeaturedOfferBanner />);
      
      expect(screen.getByText('First Order Bonus!')).toBeInTheDocument();
      expect(screen.getByText('NEARBY50')).toBeInTheDocument();
    });
  });
});
