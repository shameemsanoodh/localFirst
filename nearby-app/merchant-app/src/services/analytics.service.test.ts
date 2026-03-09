import { describe, it, expect, beforeEach, vi } from 'vitest';
import { analyticsService } from './analytics.service';

// Mock fetch
global.fetch = vi.fn();

describe('AnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  describe('trackVoiceSearchInitiated', () => {
    it('should track voice search initiated event', async () => {
      await analyticsService.trackVoiceSearchInitiated({
        userId: 'user123',
        language: 'en-IN',
        location: { lat: 12.9716, lng: 77.5946, area: 'Koramangala', city: 'Bengaluru' },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/track'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('voice_search_initiated'),
        })
      );
    });

    it('should include session ID in tracking', async () => {
      await analyticsService.trackVoiceSearchInitiated({
        language: 'en-IN',
      });

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      
      expect(body.sessionId).toBeDefined();
      expect(body.sessionId).toMatch(/^session_/);
    });
  });

  describe('trackVoiceSearchCompleted', () => {
    it('should track voice search completed event with transcript', async () => {
      await analyticsService.trackVoiceSearchCompleted({
        userId: 'user123',
        language: 'en-IN',
        transcript: 'I need milk',
        location: { lat: 12.9716, lng: 77.5946 },
      });

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      
      expect(body.eventType).toBe('voice_search_completed');
      expect(body.metadata.transcript).toBe('I need milk');
      expect(body.metadata.searchMethod).toBe('voice');
    });

    it('should track voice search completed event with confidence score', async () => {
      await analyticsService.trackVoiceSearchCompleted({
        userId: 'user123',
        language: 'en-IN',
        transcript: 'I need milk',
        confidence: 0.95,
        location: { lat: 12.9716, lng: 77.5946 },
      });

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      
      expect(body.eventType).toBe('voice_search_completed');
      expect(body.metadata.transcript).toBe('I need milk');
      expect(body.metadata.confidence).toBe(0.95);
      expect(body.metadata.searchMethod).toBe('voice');
    });
  });

  describe('trackVoiceSearchFailed', () => {
    it('should track voice search failure with error details', async () => {
      await analyticsService.trackVoiceSearchFailed({
        userId: 'user123',
        language: 'en-IN',
        errorCode: 'permission-denied',
        errorMessage: 'Microphone access denied',
      });

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      
      expect(body.eventType).toBe('voice_search_failed');
      expect(body.metadata.errorCode).toBe('permission-denied');
      expect(body.metadata.errorMessage).toBe('Microphone access denied');
    });
  });

  describe('trackTextSearch', () => {
    it('should track text search for comparison', async () => {
      await analyticsService.trackTextSearch({
        userId: 'user123',
        query: 'milk',
        location: { lat: 12.9716, lng: 77.5946 },
      });

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      
      expect(body.eventType).toBe('text_search_initiated');
      expect(body.metadata.searchMethod).toBe('text');
      expect(body.metadata.query).toBe('milk');
    });
  });

  describe('local analytics storage', () => {
    it('should store events locally', async () => {
      await analyticsService.trackVoiceSearchInitiated({
        language: 'en-IN',
      });

      const stored = localStorage.getItem('analytics_events');
      expect(stored).toBeDefined();
      
      const events = JSON.parse(stored!);
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('voice_search_initiated');
    });

    it('should limit local storage to 100 events', async () => {
      // Add 105 events
      for (let i = 0; i < 105; i++) {
        await analyticsService.trackVoiceSearchInitiated({
          language: 'en-IN',
        });
      }

      const stored = localStorage.getItem('analytics_events');
      const events = JSON.parse(stored!);
      
      expect(events).toHaveLength(100);
    });
  });

  describe('getLocalAnalyticsSummary', () => {
    it('should return analytics summary', async () => {
      // Track some events
      await analyticsService.trackVoiceSearchInitiated({ language: 'en-IN' });
      await analyticsService.trackVoiceSearchCompleted({ 
        language: 'en-IN', 
        transcript: 'test' 
      });
      await analyticsService.trackTextSearch({ query: 'test' });

      const summary = analyticsService.getLocalAnalyticsSummary();
      
      expect(summary.totalEvents).toBe(3);
      expect(summary.voiceSearches).toBe(1);
      expect(summary.textSearches).toBe(1);
      expect(summary.voiceSearchSuccessRate).toBe(100);
    });

    it('should calculate accuracy metrics from confidence scores', async () => {
      // Track voice searches with different confidence scores
      await analyticsService.trackVoiceSearchCompleted({ 
        language: 'en-IN', 
        transcript: 'high confidence',
        confidence: 0.95
      });
      await analyticsService.trackVoiceSearchCompleted({ 
        language: 'en-IN', 
        transcript: 'medium confidence',
        confidence: 0.65
      });
      await analyticsService.trackVoiceSearchCompleted({ 
        language: 'en-IN', 
        transcript: 'low confidence',
        confidence: 0.35
      });

      const summary = analyticsService.getLocalAnalyticsSummary();
      
      expect(summary.voiceSearchAccuracy.totalWithConfidence).toBe(3);
      expect(summary.voiceSearchAccuracy.highConfidenceCount).toBe(1);
      expect(summary.voiceSearchAccuracy.mediumConfidenceCount).toBe(1);
      expect(summary.voiceSearchAccuracy.lowConfidenceCount).toBe(1);
      expect(summary.voiceSearchAccuracy.averageConfidence).toBeCloseTo(0.65, 2);
    });

    it('should handle events without confidence scores', async () => {
      await analyticsService.trackVoiceSearchCompleted({ 
        language: 'en-IN', 
        transcript: 'no confidence'
      });

      const summary = analyticsService.getLocalAnalyticsSummary();
      
      expect(summary.voiceSearchAccuracy.totalWithConfidence).toBe(0);
      expect(summary.voiceSearchAccuracy.averageConfidence).toBe(0);
    });

    it('should handle empty analytics', () => {
      const summary = analyticsService.getLocalAnalyticsSummary();
      
      expect(summary.totalEvents).toBe(0);
      expect(summary.voiceSearches).toBe(0);
      expect(summary.textSearches).toBe(0);
      expect(summary.voiceSearchSuccessRate).toBe(0);
      expect(summary.voiceSearchAccuracy.totalWithConfidence).toBe(0);
      expect(summary.voiceSearchAccuracy.averageConfidence).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should not throw error if fetch fails', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await expect(
        analyticsService.trackVoiceSearchInitiated({ language: 'en-IN' })
      ).resolves.not.toThrow();
    });

    it('should not throw error if localStorage is full', async () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      await expect(
        analyticsService.trackVoiceSearchInitiated({ language: 'en-IN' })
      ).resolves.not.toThrow();

      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('session management', () => {
    it('should reuse existing session ID', async () => {
      await analyticsService.trackVoiceSearchInitiated({ language: 'en-IN' });
      const firstCall = (global.fetch as any).mock.calls[0];
      const firstBody = JSON.parse(firstCall[1].body);
      const firstSessionId = firstBody.sessionId;

      await analyticsService.trackVoiceSearchCompleted({ 
        language: 'en-IN', 
        transcript: 'test' 
      });
      const secondCall = (global.fetch as any).mock.calls[1];
      const secondBody = JSON.parse(secondCall[1].body);
      const secondSessionId = secondBody.sessionId;

      expect(firstSessionId).toBe(secondSessionId);
    });
  });

  describe('error analytics', () => {
    describe('getErrorAnalyticsSummary', () => {
      it('should return error analytics summary', async () => {
        // Track various error types
        await analyticsService.trackVoiceSearchFailed({
          language: 'en-IN',
          errorCode: 'permission-denied',
          errorMessage: 'Microphone access denied',
        });
        await analyticsService.trackVoiceSearchFailed({
          language: 'en-IN',
          errorCode: 'network',
          errorMessage: 'Network error',
        });
        await analyticsService.trackVoiceSearchFailed({
          language: 'en-IN',
          errorCode: 'permission-denied',
          errorMessage: 'Microphone access denied',
        });

        const summary = analyticsService.getErrorAnalyticsSummary();
        
        expect(summary.totalErrors).toBe(3);
        expect(summary.errorsByType['permission-denied']).toBe(2);
        expect(summary.errorsByType['network']).toBe(1);
        expect(summary.mostCommonError).toBe('permission-denied');
      });

      it('should categorize errors correctly', async () => {
        // Permission errors
        await analyticsService.trackVoiceSearchFailed({
          language: 'en-IN',
          errorCode: 'permission-denied',
          errorMessage: 'Microphone access denied',
        });
        await analyticsService.trackVoiceSearchFailed({
          language: 'en-IN',
          errorCode: 'not-allowed',
          errorMessage: 'Not allowed',
        });

        // Technical errors
        await analyticsService.trackVoiceSearchFailed({
          language: 'en-IN',
          errorCode: 'audio-capture',
          errorMessage: 'No microphone found',
        });
        await analyticsService.trackVoiceSearchFailed({
          language: 'en-IN',
          errorCode: 'not-supported',
          errorMessage: 'Not supported',
        });

        // Network errors
        await analyticsService.trackVoiceSearchFailed({
          language: 'en-IN',
          errorCode: 'network',
          errorMessage: 'Network error',
        });

        // User action errors
        await analyticsService.trackVoiceSearchFailed({
          language: 'en-IN',
          errorCode: 'no-speech',
          errorMessage: 'No speech detected',
        });
        await analyticsService.trackVoiceSearchFailed({
          language: 'en-IN',
          errorCode: 'aborted',
          errorMessage: 'Aborted',
        });

        // Unknown errors
        await analyticsService.trackVoiceSearchFailed({
          language: 'en-IN',
          errorCode: 'unknown',
          errorMessage: 'Unknown error',
        });

        const summary = analyticsService.getErrorAnalyticsSummary();
        
        expect(summary.errorsByCategory.permission).toBe(2);
        expect(summary.errorsByCategory.technical).toBe(2);
        expect(summary.errorsByCategory.network).toBe(1);
        expect(summary.errorsByCategory.userAction).toBe(2);
        expect(summary.errorsByCategory.unknown).toBe(1);
      });

      it('should calculate error rate correctly', async () => {
        // Track successful searches
        await analyticsService.trackVoiceSearchInitiated({ language: 'en-IN' });
        await analyticsService.trackVoiceSearchCompleted({ 
          language: 'en-IN', 
          transcript: 'test' 
        });
        
        // Track failed searches
        await analyticsService.trackVoiceSearchFailed({
          language: 'en-IN',
          errorCode: 'permission-denied',
          errorMessage: 'Microphone access denied',
        });

        const summary = analyticsService.getErrorAnalyticsSummary();
        
        // 1 error out of 3 total events (initiated, completed, failed)
        expect(summary.errorRate).toBeCloseTo(33.33, 1);
      });

      it('should return recent errors in reverse chronological order', async () => {
        // Track errors with slight delays to ensure different timestamps
        await analyticsService.trackVoiceSearchFailed({
          language: 'en-IN',
          errorCode: 'error1',
          errorMessage: 'First error',
        });
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        await analyticsService.trackVoiceSearchFailed({
          language: 'en-IN',
          errorCode: 'error2',
          errorMessage: 'Second error',
        });

        const summary = analyticsService.getErrorAnalyticsSummary();
        
        expect(summary.recentErrors).toHaveLength(2);
        expect(summary.recentErrors[0].errorCode).toBe('error2'); // Most recent first
        expect(summary.recentErrors[1].errorCode).toBe('error1');
      });

      it('should limit recent errors to 10', async () => {
        // Track 15 errors
        for (let i = 0; i < 15; i++) {
          await analyticsService.trackVoiceSearchFailed({
            language: 'en-IN',
            errorCode: `error${i}`,
            errorMessage: `Error ${i}`,
          });
        }

        const summary = analyticsService.getErrorAnalyticsSummary();
        
        expect(summary.recentErrors).toHaveLength(10);
        // Should have the 10 most recent errors
        expect(summary.recentErrors[0].errorCode).toBe('error14');
        expect(summary.recentErrors[9].errorCode).toBe('error5');
      });

      it('should handle empty error analytics', () => {
        const summary = analyticsService.getErrorAnalyticsSummary();
        
        expect(summary.totalErrors).toBe(0);
        expect(summary.errorsByType).toEqual({});
        expect(summary.errorRate).toBe(0);
        expect(summary.mostCommonError).toBeNull();
        expect(summary.recentErrors).toEqual([]);
      });
    });

    it('should include error analytics in getLocalAnalyticsSummary', async () => {
      // Track some events including errors
      await analyticsService.trackVoiceSearchInitiated({ language: 'en-IN' });
      await analyticsService.trackVoiceSearchFailed({
        language: 'en-IN',
        errorCode: 'permission-denied',
        errorMessage: 'Microphone access denied',
      });

      const summary = analyticsService.getLocalAnalyticsSummary();
      
      expect(summary.errors).toBeDefined();
      expect(summary.errors.totalErrors).toBe(1);
      expect(summary.errors.errorsByType['permission-denied']).toBe(1);
      expect(summary.errors.errorsByCategory.permission).toBe(1);
      expect(summary.errors.mostCommonError).toBe('permission-denied');
    });
  });
});
