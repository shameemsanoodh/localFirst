/**
 * Analytics Service
 * Tracks user interactions and search behavior
 */

interface VoiceSearchAnalytics {
  eventType: 'voice_search_initiated' | 'voice_search_completed' | 'voice_search_failed';
  timestamp: string;
  userId?: string;
  sessionId: string;
  language?: string;
  transcript?: string;
  confidence?: number;
  errorCode?: string;
  errorMessage?: string;
  searchMethod: 'voice' | 'text';
  location?: {
    lat: number;
    lng: number;
    area?: string;
    city?: string;
  };
}

interface ImageSearchAnalytics {
  eventType: 'image_search_initiated' | 'image_search_completed' | 'image_search_failed';
  timestamp: string;
  userId?: string;
  sessionId: string;
  fileSize?: number;
  fileType?: string;
  errorCode?: string;
  errorMessage?: string;
  searchMethod: 'image';
  location?: {
    lat: number;
    lng: number;
    area?: string;
    city?: string;
  };
}

interface AnalyticsEvent {
  eventId: string;
  eventType: string;
  timestamp: string;
  userId?: string;
  sessionId: string;
  metadata: Record<string, any>;
}

class AnalyticsService {
  private sessionId: string;
  private apiUrl: string;

  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    this.sessionId = this.getOrCreateSessionId();
  }

  /**
   * Get or create a session ID for tracking user sessions
   */
  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    
    return sessionId;
  }

  /**
   * Generate a unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Track voice search initiated event
   */
  async trackVoiceSearchInitiated(data: {
    userId?: string;
    language: string;
    location?: { lat: number; lng: number; area?: string; city?: string };
  }): Promise<void> {
    const event: VoiceSearchAnalytics = {
      eventType: 'voice_search_initiated',
      timestamp: new Date().toISOString(),
      userId: data.userId,
      sessionId: this.sessionId,
      language: data.language,
      searchMethod: 'voice',
      location: data.location,
    };

    await this.sendAnalytics(event);
  }

  /**
   * Track voice search completed event
   */
  async trackVoiceSearchCompleted(data: {
    userId?: string;
    language: string;
    transcript: string;
    confidence?: number;
    location?: { lat: number; lng: number; area?: string; city?: string };
  }): Promise<void> {
    const event: VoiceSearchAnalytics = {
      eventType: 'voice_search_completed',
      timestamp: new Date().toISOString(),
      userId: data.userId,
      sessionId: this.sessionId,
      language: data.language,
      transcript: data.transcript,
      confidence: data.confidence,
      searchMethod: 'voice',
      location: data.location,
    };

    await this.sendAnalytics(event);
  }

  /**
   * Track voice search failed event
   */
  async trackVoiceSearchFailed(data: {
    userId?: string;
    language: string;
    errorCode: string;
    errorMessage: string;
    location?: { lat: number; lng: number; area?: string; city?: string };
  }): Promise<void> {
    const event: VoiceSearchAnalytics = {
      eventType: 'voice_search_failed',
      timestamp: new Date().toISOString(),
      userId: data.userId,
      sessionId: this.sessionId,
      language: data.language,
      errorCode: data.errorCode,
      errorMessage: data.errorMessage,
      searchMethod: 'voice',
      location: data.location,
    };

    await this.sendAnalytics(event);
  }

  /**
   * Track text search for comparison
   */
  async trackTextSearch(data: {
    userId?: string;
    query: string;
    location?: { lat: number; lng: number; area?: string; city?: string };
  }): Promise<void> {
    const event = {
      eventType: 'text_search_initiated',
      timestamp: new Date().toISOString(),
      userId: data.userId,
      sessionId: this.sessionId,
      searchMethod: 'text',
      query: data.query,
      location: data.location,
    };

    await this.sendAnalytics(event);
  }

  /**
   * Track image search initiated event
   */
  async trackImageSearchInitiated(data: {
    userId?: string;
    location?: { lat: number; lng: number; area?: string; city?: string };
  }): Promise<void> {
    const event: ImageSearchAnalytics = {
      eventType: 'image_search_initiated',
      timestamp: new Date().toISOString(),
      userId: data.userId,
      sessionId: this.sessionId,
      searchMethod: 'image',
      location: data.location,
    };

    await this.sendAnalytics(event);
  }

  /**
   * Track image search completed event
   */
  async trackImageSearchCompleted(data: {
    userId?: string;
    fileSize: number;
    fileType: string;
    location?: { lat: number; lng: number; area?: string; city?: string };
  }): Promise<void> {
    const event: ImageSearchAnalytics = {
      eventType: 'image_search_completed',
      timestamp: new Date().toISOString(),
      userId: data.userId,
      sessionId: this.sessionId,
      fileSize: data.fileSize,
      fileType: data.fileType,
      searchMethod: 'image',
      location: data.location,
    };

    await this.sendAnalytics(event);
  }

  /**
   * Track image search failed event
   */
  async trackImageSearchFailed(data: {
    userId?: string;
    errorCode: string;
    errorMessage: string;
    location?: { lat: number; lng: number; area?: string; city?: string };
  }): Promise<void> {
    const event: ImageSearchAnalytics = {
      eventType: 'image_search_failed',
      timestamp: new Date().toISOString(),
      userId: data.userId,
      sessionId: this.sessionId,
      errorCode: data.errorCode,
      errorMessage: data.errorMessage,
      searchMethod: 'image',
      location: data.location,
    };

    await this.sendAnalytics(event);
  }

  /**
   * Send analytics data to backend
   */
  private async sendAnalytics(event: VoiceSearchAnalytics | ImageSearchAnalytics | any): Promise<void> {
    try {
      const analyticsEvent: AnalyticsEvent = {
        eventId: this.generateEventId(),
        eventType: event.eventType,
        timestamp: event.timestamp,
        userId: event.userId,
        sessionId: event.sessionId,
        metadata: {
          ...event,
        },
      };

      // Send to backend (non-blocking)
      fetch(`${this.apiUrl}/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analyticsEvent),
        // Use keepalive to ensure request completes even if page unloads
        keepalive: true,
      }).catch((error) => {
        // Silently fail - don't disrupt user experience
        console.debug('Analytics tracking failed:', error);
      });

      // Also store locally for offline support and debugging
      this.storeLocalAnalytics(analyticsEvent);
    } catch (error) {
      // Silently fail - analytics should never break the app
      console.debug('Analytics error:', error);
    }
  }

  /**
   * Store analytics locally for offline support
   */
  private storeLocalAnalytics(event: AnalyticsEvent): void {
    try {
      const key = 'analytics_events';
      const stored = localStorage.getItem(key);
      const events = stored ? JSON.parse(stored) : [];
      
      // Keep only last 100 events
      events.push(event);
      if (events.length > 100) {
        events.shift();
      }
      
      localStorage.setItem(key, JSON.stringify(events));
    } catch (error) {
      // Ignore storage errors
      console.debug('Local analytics storage failed:', error);
    }
  }

  /**
   * Get error analytics summary
   */
  getErrorAnalyticsSummary(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsByCategory: {
      permission: number;
      technical: number;
      network: number;
      userAction: number;
      unknown: number;
    };
    errorRate: number;
    mostCommonError: string | null;
    recentErrors: Array<{
      timestamp: string;
      errorCode: string;
      errorMessage: string;
      language?: string;
    }>;
  } {
    try {
      const stored = localStorage.getItem('analytics_events');
      const events: AnalyticsEvent[] = stored ? JSON.parse(stored) : [];
      
      const failedEvents = events.filter(e => e.eventType === 'voice_search_failed');
      const totalSearches = events.filter(
        e => e.eventType === 'voice_search_initiated' || 
            e.eventType === 'voice_search_completed' ||
            e.eventType === 'voice_search_failed'
      ).length;
      
      // Count errors by type
      const errorsByType: Record<string, number> = {};
      failedEvents.forEach(event => {
        const errorCode = event.metadata.errorCode || 'unknown';
        errorsByType[errorCode] = (errorsByType[errorCode] || 0) + 1;
      });
      
      // Categorize errors
      const errorsByCategory = {
        permission: 0,
        technical: 0,
        network: 0,
        userAction: 0,
        unknown: 0,
      };
      
      failedEvents.forEach(event => {
        const errorCode = event.metadata.errorCode || 'unknown';
        
        if (errorCode === 'permission-denied' || errorCode === 'not-allowed') {
          errorsByCategory.permission++;
        } else if (errorCode === 'audio-capture' || errorCode === 'start-failed' || errorCode === 'not-supported') {
          errorsByCategory.technical++;
        } else if (errorCode === 'network') {
          errorsByCategory.network++;
        } else if (errorCode === 'no-speech' || errorCode === 'aborted') {
          errorsByCategory.userAction++;
        } else {
          errorsByCategory.unknown++;
        }
      });
      
      // Find most common error
      let mostCommonError: string | null = null;
      let maxCount = 0;
      Object.entries(errorsByType).forEach(([errorCode, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostCommonError = errorCode;
        }
      });
      
      // Get recent errors (last 10)
      const recentErrors = failedEvents
        .slice(-10)
        .reverse()
        .map(event => ({
          timestamp: event.timestamp,
          errorCode: event.metadata.errorCode || 'unknown',
          errorMessage: event.metadata.errorMessage || 'Unknown error',
          language: event.metadata.language,
        }));
      
      return {
        totalErrors: failedEvents.length,
        errorsByType,
        errorsByCategory,
        errorRate: totalSearches > 0 ? (failedEvents.length / totalSearches) * 100 : 0,
        mostCommonError,
        recentErrors,
      };
    } catch (error) {
      return {
        totalErrors: 0,
        errorsByType: {},
        errorsByCategory: {
          permission: 0,
          technical: 0,
          network: 0,
          userAction: 0,
          unknown: 0,
        },
        errorRate: 0,
        mostCommonError: null,
        recentErrors: [],
      };
    }
  }

  /**
   * Get analytics summary for debugging
   */
  getLocalAnalyticsSummary(): {
    totalEvents: number;
    voiceSearches: number;
    textSearches: number;
    voiceSearchSuccessRate: number;
    voiceSearchAccuracy: {
      averageConfidence: number;
      highConfidenceCount: number;
      mediumConfidenceCount: number;
      lowConfidenceCount: number;
      totalWithConfidence: number;
    };
    errors: {
      totalErrors: number;
      errorsByType: Record<string, number>;
      errorsByCategory: {
        permission: number;
        technical: number;
        network: number;
        userAction: number;
        unknown: number;
      };
      errorRate: number;
      mostCommonError: string | null;
    };
  } {
    try {
      const stored = localStorage.getItem('analytics_events');
      const events: AnalyticsEvent[] = stored ? JSON.parse(stored) : [];
      
      const voiceInitiated = events.filter(e => e.eventType === 'voice_search_initiated').length;
      const voiceCompleted = events.filter(e => e.eventType === 'voice_search_completed').length;
      const textSearches = events.filter(e => e.eventType === 'text_search_initiated').length;
      
      // Calculate accuracy metrics
      const completedWithConfidence = events.filter(
        e => e.eventType === 'voice_search_completed' && 
             e.metadata.confidence !== undefined
      );
      
      const confidenceScores = completedWithConfidence.map(e => e.metadata.confidence);
      const averageConfidence = confidenceScores.length > 0
        ? confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length
        : 0;
      
      const highConfidenceCount = confidenceScores.filter(score => score >= 0.8).length;
      const mediumConfidenceCount = confidenceScores.filter(score => score >= 0.5 && score < 0.8).length;
      const lowConfidenceCount = confidenceScores.filter(score => score < 0.5).length;
      
      // Get error analytics
      const errorAnalytics = this.getErrorAnalyticsSummary();
      
      return {
        totalEvents: events.length,
        voiceSearches: voiceInitiated,
        textSearches,
        voiceSearchSuccessRate: voiceInitiated > 0 ? (voiceCompleted / voiceInitiated) * 100 : 0,
        voiceSearchAccuracy: {
          averageConfidence,
          highConfidenceCount,
          mediumConfidenceCount,
          lowConfidenceCount,
          totalWithConfidence: completedWithConfidence.length,
        },
        errors: {
          totalErrors: errorAnalytics.totalErrors,
          errorsByType: errorAnalytics.errorsByType,
          errorsByCategory: errorAnalytics.errorsByCategory,
          errorRate: errorAnalytics.errorRate,
          mostCommonError: errorAnalytics.mostCommonError,
        },
      };
    } catch (error) {
      return {
        totalEvents: 0,
        voiceSearches: 0,
        textSearches: 0,
        voiceSearchSuccessRate: 0,
        voiceSearchAccuracy: {
          averageConfidence: 0,
          highConfidenceCount: 0,
          mediumConfidenceCount: 0,
          lowConfidenceCount: 0,
          totalWithConfidence: 0,
        },
        errors: {
          totalErrors: 0,
          errorsByType: {},
          errorsByCategory: {
            permission: 0,
            technical: 0,
            network: 0,
            userAction: 0,
            unknown: 0,
          },
          errorRate: 0,
          mostCommonError: null,
        },
      };
    }
  }
}

export const analyticsService = new AnalyticsService();
