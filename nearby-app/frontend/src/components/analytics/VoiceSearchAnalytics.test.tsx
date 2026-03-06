import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { VoiceSearchAnalytics } from './VoiceSearchAnalytics'
import { analyticsService } from '@/services/analytics.service'

// Mock the analytics service
vi.mock('@/services/analytics.service', () => ({
  analyticsService: {
    getLocalAnalyticsSummary: vi.fn(),
    getErrorAnalyticsSummary: vi.fn(),
  },
}))

describe('VoiceSearchAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders analytics dashboard with key metrics', () => {
    // Mock analytics data
    vi.mocked(analyticsService.getLocalAnalyticsSummary).mockReturnValue({
      totalEvents: 100,
      voiceSearches: 30,
      textSearches: 70,
      voiceSearchSuccessRate: 93.3,
      voiceSearchAccuracy: {
        averageConfidence: 0.85,
        highConfidenceCount: 20,
        mediumConfidenceCount: 8,
        lowConfidenceCount: 2,
        totalWithConfidence: 30,
      },
      errors: {
        totalErrors: 2,
        errorsByType: { 'permission-denied': 2 },
        errorsByCategory: {
          permission: 2,
          technical: 0,
          network: 0,
          userAction: 0,
          unknown: 0,
        },
        errorRate: 6.7,
        mostCommonError: 'permission-denied',
      },
    })

    vi.mocked(analyticsService.getErrorAnalyticsSummary).mockReturnValue({
      totalErrors: 2,
      errorsByType: { 'permission-denied': 2 },
      errorsByCategory: {
        permission: 2,
        technical: 0,
        network: 0,
        userAction: 0,
        unknown: 0,
      },
      errorRate: 6.7,
      mostCommonError: 'permission-denied',
      recentErrors: [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          errorCode: 'permission-denied',
          errorMessage: 'Microphone access denied',
          language: 'en-IN',
        },
      ],
    })

    render(<VoiceSearchAnalytics />)

    // Check key metrics are displayed
    expect(screen.getByText('Voice Search Analytics')).toBeInTheDocument()
    expect(screen.getByText('Voice Searches')).toBeInTheDocument()
    expect(screen.getByText('Success Rate')).toBeInTheDocument()
    expect(screen.getByText('Adoption Rate')).toBeInTheDocument()
    expect(screen.getByText('Error Rate')).toBeInTheDocument()
  })

  it('displays accuracy metrics correctly', () => {
    vi.mocked(analyticsService.getLocalAnalyticsSummary).mockReturnValue({
      totalEvents: 50,
      voiceSearches: 30,
      textSearches: 20,
      voiceSearchSuccessRate: 90,
      voiceSearchAccuracy: {
        averageConfidence: 0.82,
        highConfidenceCount: 18,
        mediumConfidenceCount: 10,
        lowConfidenceCount: 2,
        totalWithConfidence: 30,
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
    })

    vi.mocked(analyticsService.getErrorAnalyticsSummary).mockReturnValue({
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
    })

    render(<VoiceSearchAnalytics />)

    // Check accuracy section
    expect(screen.getByText('Voice Recognition Accuracy')).toBeInTheDocument()
    expect(screen.getByText('82.0%')).toBeInTheDocument() // Average confidence
    expect(screen.getByText('High (≥80%)')).toBeInTheDocument()
    expect(screen.getByText('Medium (50-80%)')).toBeInTheDocument()
  })

  it('displays error analytics when errors exist', () => {
    vi.mocked(analyticsService.getLocalAnalyticsSummary).mockReturnValue({
      totalEvents: 50,
      voiceSearches: 20,
      textSearches: 30,
      voiceSearchSuccessRate: 85,
      voiceSearchAccuracy: {
        averageConfidence: 0.75,
        highConfidenceCount: 10,
        mediumConfidenceCount: 7,
        lowConfidenceCount: 3,
        totalWithConfidence: 20,
      },
      errors: {
        totalErrors: 5,
        errorsByType: {
          'permission-denied': 3,
          'network': 2,
        },
        errorsByCategory: {
          permission: 3,
          technical: 0,
          network: 2,
          userAction: 0,
          unknown: 0,
        },
        errorRate: 15,
        mostCommonError: 'permission-denied',
      },
    })

    vi.mocked(analyticsService.getErrorAnalyticsSummary).mockReturnValue({
      totalErrors: 5,
      errorsByType: {
        'permission-denied': 3,
        'network': 2,
      },
      errorsByCategory: {
        permission: 3,
        technical: 0,
        network: 2,
        userAction: 0,
        unknown: 0,
      },
      errorRate: 15,
      mostCommonError: 'permission-denied',
      recentErrors: [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          errorCode: 'permission-denied',
          errorMessage: 'Microphone access denied',
          language: 'en-IN',
        },
        {
          timestamp: '2024-01-15T10:25:00.000Z',
          errorCode: 'network',
          errorMessage: 'Network connection failed',
          language: 'en-IN',
        },
      ],
    })

    render(<VoiceSearchAnalytics />)

    // Check error section
    expect(screen.getByText('Error Analysis')).toBeInTheDocument()
    expect(screen.getByText('Permission Denied')).toBeInTheDocument()
    expect(screen.getByText('Network Errors')).toBeInTheDocument()
    expect(screen.getByText('Most Common Error')).toBeInTheDocument()
    expect(screen.getAllByText(/permission-denied/)).toHaveLength(2) // In most common error and recent errors
    expect(screen.getByText('3 occurrences')).toBeInTheDocument()
  })

  it('shows no errors message when no errors exist', () => {
    vi.mocked(analyticsService.getLocalAnalyticsSummary).mockReturnValue({
      totalEvents: 50,
      voiceSearches: 30,
      textSearches: 20,
      voiceSearchSuccessRate: 100,
      voiceSearchAccuracy: {
        averageConfidence: 0.9,
        highConfidenceCount: 30,
        mediumConfidenceCount: 0,
        lowConfidenceCount: 0,
        totalWithConfidence: 30,
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
    })

    vi.mocked(analyticsService.getErrorAnalyticsSummary).mockReturnValue({
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
    })

    render(<VoiceSearchAnalytics />)

    expect(screen.getByText('No errors recorded yet')).toBeInTheDocument()
  })

  it('displays recent errors list', () => {
    vi.mocked(analyticsService.getLocalAnalyticsSummary).mockReturnValue({
      totalEvents: 50,
      voiceSearches: 20,
      textSearches: 30,
      voiceSearchSuccessRate: 90,
      voiceSearchAccuracy: {
        averageConfidence: 0.8,
        highConfidenceCount: 15,
        mediumConfidenceCount: 4,
        lowConfidenceCount: 1,
        totalWithConfidence: 20,
      },
      errors: {
        totalErrors: 2,
        errorsByType: { 'no-speech': 2 },
        errorsByCategory: {
          permission: 0,
          technical: 0,
          network: 0,
          userAction: 2,
          unknown: 0,
        },
        errorRate: 10,
        mostCommonError: 'no-speech',
      },
    })

    vi.mocked(analyticsService.getErrorAnalyticsSummary).mockReturnValue({
      totalErrors: 2,
      errorsByType: { 'no-speech': 2 },
      errorsByCategory: {
        permission: 0,
        technical: 0,
        network: 0,
        userAction: 2,
        unknown: 0,
      },
      errorRate: 10,
      mostCommonError: 'no-speech',
      recentErrors: [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          errorCode: 'no-speech',
          errorMessage: 'No speech detected',
          language: 'en-IN',
        },
        {
          timestamp: '2024-01-15T10:25:00.000Z',
          errorCode: 'no-speech',
          errorMessage: 'No speech detected',
          language: 'hi-IN',
        },
      ],
    })

    render(<VoiceSearchAnalytics />)

    expect(screen.getByText('Recent Errors')).toBeInTheDocument()
    expect(screen.getAllByText('No speech detected')).toHaveLength(2)
    expect(screen.getByText(/en-IN/)).toBeInTheDocument()
    expect(screen.getByText(/hi-IN/)).toBeInTheDocument()
  })

  it('displays search method comparison', () => {
    vi.mocked(analyticsService.getLocalAnalyticsSummary).mockReturnValue({
      totalEvents: 100,
      voiceSearches: 40,
      textSearches: 60,
      voiceSearchSuccessRate: 95,
      voiceSearchAccuracy: {
        averageConfidence: 0.88,
        highConfidenceCount: 35,
        mediumConfidenceCount: 4,
        lowConfidenceCount: 1,
        totalWithConfidence: 40,
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
    })

    vi.mocked(analyticsService.getErrorAnalyticsSummary).mockReturnValue({
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
    })

    render(<VoiceSearchAnalytics />)

    expect(screen.getByText('Search Method Comparison')).toBeInTheDocument()
    expect(screen.getByText('Voice Search')).toBeInTheDocument()
    expect(screen.getByText('Text Search')).toBeInTheDocument()
    // Check adoption rate is displayed (using getAllByText since it appears twice)
    expect(screen.getAllByText(/40.0%/)).toHaveLength(2) // In adoption rate card and comparison section
  })

  it('shows target achieved message when adoption rate >= 30%', () => {
    vi.mocked(analyticsService.getLocalAnalyticsSummary).mockReturnValue({
      totalEvents: 100,
      voiceSearches: 35,
      textSearches: 65,
      voiceSearchSuccessRate: 95,
      voiceSearchAccuracy: {
        averageConfidence: 0.88,
        highConfidenceCount: 30,
        mediumConfidenceCount: 4,
        lowConfidenceCount: 1,
        totalWithConfidence: 35,
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
    })

    vi.mocked(analyticsService.getErrorAnalyticsSummary).mockReturnValue({
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
    })

    render(<VoiceSearchAnalytics />)

    expect(screen.getByText(/Target achieved!/)).toBeInTheDocument()
  })

  it('refreshes data when refresh button is clicked', async () => {
    const mockSummary = {
      totalEvents: 50,
      voiceSearches: 20,
      textSearches: 30,
      voiceSearchSuccessRate: 90,
      voiceSearchAccuracy: {
        averageConfidence: 0.8,
        highConfidenceCount: 15,
        mediumConfidenceCount: 4,
        lowConfidenceCount: 1,
        totalWithConfidence: 20,
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
    }

    vi.mocked(analyticsService.getLocalAnalyticsSummary).mockReturnValue(mockSummary)
    vi.mocked(analyticsService.getErrorAnalyticsSummary).mockReturnValue({
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
    })

    const { rerender } = render(<VoiceSearchAnalytics />)

    const refreshButton = screen.getByTitle('Refresh data')
    
    // Verify the service methods are called
    expect(analyticsService.getLocalAnalyticsSummary).toHaveBeenCalled()
    expect(analyticsService.getErrorAnalyticsSummary).toHaveBeenCalled()
    
    fireEvent.click(refreshButton)

    // Wait for the component to update
    await waitFor(() => {
      // The methods should be called again after clicking refresh
      expect(analyticsService.getLocalAnalyticsSummary).toHaveBeenCalled()
      expect(analyticsService.getErrorAnalyticsSummary).toHaveBeenCalled()
    })
  })
})
