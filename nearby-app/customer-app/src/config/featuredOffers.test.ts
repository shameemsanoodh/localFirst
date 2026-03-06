import { describe, it, expect } from 'vitest';
import {
  getActiveFeaturedOffers,
  getFeaturedOfferById,
  isOfferExpired,
  formatValidityDate,
  type FeaturedOffer,
} from './featuredOffers';

describe('Featured Offers Configuration', () => {
  describe('getActiveFeaturedOffers', () => {
    it('should return only active and non-expired offers', () => {
      const activeOffers = getActiveFeaturedOffers();
      
      // All returned offers should be active
      activeOffers.forEach(offer => {
        expect(offer.isActive).toBe(true);
      });
      
      // All returned offers should not be expired
      activeOffers.forEach(offer => {
        expect(isOfferExpired(offer)).toBe(false);
      });
    });

    it('should sort offers by priority (highest first)', () => {
      const activeOffers = getActiveFeaturedOffers();
      
      // Check if sorted in descending order by priority
      for (let i = 0; i < activeOffers.length - 1; i++) {
        expect(activeOffers[i].priority).toBeGreaterThanOrEqual(activeOffers[i + 1].priority);
      }
    });

    it('should filter out inactive offers', () => {
      const activeOffers = getActiveFeaturedOffers();
      
      // No offer should have isActive = false
      const inactiveOffer = activeOffers.find(offer => !offer.isActive);
      expect(inactiveOffer).toBeUndefined();
    });
  });

  describe('getFeaturedOfferById', () => {
    it('should return offer with matching id', () => {
      const offer = getFeaturedOfferById('first-order-bonus');
      
      expect(offer).toBeDefined();
      expect(offer?.id).toBe('first-order-bonus');
    });

    it('should return undefined for non-existent id', () => {
      const offer = getFeaturedOfferById('non-existent-id');
      
      expect(offer).toBeUndefined();
    });
  });

  describe('isOfferExpired', () => {
    it('should return false for future dates', () => {
      const futureOffer: FeaturedOffer = {
        id: 'test',
        title: 'Test',
        description: 'Test',
        promoCode: 'TEST',
        discount: 10,
        validUntil: '2099-12-31T23:59:59Z',
        isActive: true,
        priority: 1,
      };
      
      expect(isOfferExpired(futureOffer)).toBe(false);
    });

    it('should return true for past dates', () => {
      const pastOffer: FeaturedOffer = {
        id: 'test',
        title: 'Test',
        description: 'Test',
        promoCode: 'TEST',
        discount: 10,
        validUntil: '2020-01-01T00:00:00Z',
        isActive: true,
        priority: 1,
      };
      
      expect(isOfferExpired(pastOffer)).toBe(true);
    });
  });

  describe('formatValidityDate', () => {
    it('should format date without year for current year', () => {
      const currentYear = new Date().getFullYear();
      const dateString = `${currentYear}-12-25T00:00:00Z`;
      
      const formatted = formatValidityDate(dateString);
      
      // Should be like "Dec 25" without year
      expect(formatted).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/);
      expect(formatted).not.toContain(currentYear.toString());
    });

    it('should format date with year for different year', () => {
      const nextYear = new Date().getFullYear() + 1;
      const dateString = `${nextYear}-01-15T00:00:00Z`;
      
      const formatted = formatValidityDate(dateString);
      
      // Should include the year
      expect(formatted).toContain(nextYear.toString());
    });
  });
});
