import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { EnhancedHeroSection } from './EnhancedHeroSection';
import { useLocationStore } from '@/store/locationStore';
import { useAuthStore } from '@/store/authStore';
import { aiService } from '@/services/ai.service';
import { broadcastService } from '@/services/broadcast.service';

// Mock navigate function
const mockNavigate = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock stores
vi.mock('@/store/locationStore');
vi.mock('@/store/authStore');
vi.mock('@/services/ai.service');
vi.mock('@/services/broadcast.service');
vi.mock('@/services/location.service');

// Mock VoiceSearchButton
vi.mock('@/components/search/VoiceSearchButton', () => ({
  VoiceSearchButton: ({ onTranscript, disabled }: any) => (
    <button
      data-testid="voice-search-button"
      onClick={() => onTranscript('test voice query')}
      disabled={disabled}
    >
      Voice Search
    </button>
  ),
}));

// Mock ImageSearchButton
vi.mock('@/components/search/ImageSearchButton', () => ({
  ImageSearchButton: ({ onImageSelected, disabled }: any) => (
    <button
      data-testid="image-search-button"
      onClick={() => {
        const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        onImageSelected('data:image/jpeg;base64,test', mockFile);
      }}
      disabled={disabled}
    >
      Image Search
    </button>
  ),
}));

describe('EnhancedHeroSection - Voice Search Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock location store
    vi.mocked(useLocationStore).mockReturnValue({
      lat: 12.9716,
      lng: 77.5946,
      city: 'Bengaluru',
      area: 'Koramangala',
      setLocation: vi.fn(),
    } as any);

    // Mock auth store
    vi.mocked(useAuthStore).mockReturnValue({
      user: { userId: 'test-user-123' },
    } as any);

    // Mock AI service
    vi.mocked(aiService.detectCategory).mockResolvedValue({
      category: 'Groceries',
      broadcast_message: 'Broadcasting to nearby grocery shops',
    } as any);

    vi.mocked(aiService.saveLocalDemand).mockResolvedValue({} as any);

    // Mock broadcast service
    vi.mocked(broadcastService.createCategoryFiltered).mockResolvedValue({
      broadcast: { broadcastId: 'test-broadcast-123' },
      matchedShopsCount: 5,
    } as any);
  });

  it('renders VoiceSearchButton in search bar', () => {
    render(
      <BrowserRouter>
        <EnhancedHeroSection />
      </BrowserRouter>
    );

    expect(screen.getByTestId('voice-search-button')).toBeInTheDocument();
  });

  it('disables VoiceSearchButton when location is not set', () => {
    vi.mocked(useLocationStore).mockReturnValue({
      lat: null,
      lng: null,
      city: '',
      area: '',
      setLocation: vi.fn(),
    } as any);

    render(
      <BrowserRouter>
        <EnhancedHeroSection />
      </BrowserRouter>
    );

    const voiceButton = screen.getByTestId('voice-search-button');
    expect(voiceButton).toBeDisabled();
  });

  it('disables VoiceSearchButton when searching', async () => {
    render(
      <BrowserRouter>
        <EnhancedHeroSection />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search for products/i);
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.change(searchInput, { target: { value: 'milk' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      const voiceButton = screen.getByTestId('voice-search-button');
      expect(voiceButton).toBeDisabled();
    });
  });

  it('fills search input with voice transcript', async () => {
    render(
      <BrowserRouter>
        <EnhancedHeroSection />
      </BrowserRouter>
    );

    const voiceButton = screen.getByTestId('voice-search-button');
    fireEvent.click(voiceButton);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search for products/i) as HTMLInputElement;
      expect(searchInput.value).toBe('test voice query');
    });
  });

  it('automatically triggers search after voice input', async () => {
    render(
      <BrowserRouter>
        <EnhancedHeroSection />
      </BrowserRouter>
    );

    const voiceButton = screen.getByTestId('voice-search-button');
    fireEvent.click(voiceButton);

    // Wait for the transcript to be set
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search for products/i) as HTMLInputElement;
      expect(searchInput.value).toBe('test voice query');
    });

    // Wait for the delayed search trigger (500ms delay + processing time)
    await waitFor(
      () => {
        expect(aiService.detectCategory).toHaveBeenCalledWith('test voice query');
      },
      { timeout: 2000 }
    );
  });

  it('shows loading state during voice search processing', async () => {
    render(
      <BrowserRouter>
        <EnhancedHeroSection />
      </BrowserRouter>
    );

    const voiceButton = screen.getByTestId('voice-search-button');
    fireEvent.click(voiceButton);

    await waitFor(() => {
      expect(screen.getByText(/analyzing your search/i)).toBeInTheDocument();
    });
  });

  it('navigates to radar page after successful voice search', async () => {
    render(
      <BrowserRouter>
        <EnhancedHeroSection />
      </BrowserRouter>
    );

    const voiceButton = screen.getByTestId('voice-search-button');
    fireEvent.click(voiceButton);

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('/broadcast/radar/test-broadcast-123');
      },
      { timeout: 3000 }
    );
  });

  it('handles voice search with location enabled', async () => {
    render(
      <BrowserRouter>
        <EnhancedHeroSection />
      </BrowserRouter>
    );

    const voiceButton = screen.getByTestId('voice-search-button');
    fireEvent.click(voiceButton);

    // Wait for transcript first
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search for products/i) as HTMLInputElement;
      expect(searchInput.value).toBe('test voice query');
    });

    // Then wait for the search to be triggered
    await waitFor(
      () => {
        expect(aiService.detectCategory).toHaveBeenCalledWith('test voice query');
      },
      { timeout: 2000 }
    );

    // Finally check broadcast was created
    await waitFor(() => {
      expect(broadcastService.createCategoryFiltered).toHaveBeenCalledWith({
        query: 'test voice query',
        detectedCategory: 'Groceries',
        userLat: 12.9716,
        userLng: 77.5946,
        radius: 3,
        locality: 'Koramangala',
      });
    });
  });
});

describe('EnhancedHeroSection - Image Search Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock location store
    vi.mocked(useLocationStore).mockReturnValue({
      lat: 12.9716,
      lng: 77.5946,
      city: 'Bengaluru',
      area: 'Koramangala',
      setLocation: vi.fn(),
    } as any);

    // Mock auth store
    vi.mocked(useAuthStore).mockReturnValue({
      user: { userId: 'test-user-123' },
    } as any);

    // Mock AI service for image analysis
    vi.mocked(aiService.analyzeImage).mockResolvedValue({
      products: [
        {
          name: 'Fresh Tomatoes',
          category: 'Groceries',
          confidence: 0.95,
          description: 'Red ripe tomatoes',
        },
      ],
      primaryProduct: {
        name: 'Fresh Tomatoes',
        category: 'Groceries',
      },
      searchQuery: 'tomatoes',
      processingTime: 2.3,
    } as any);

    vi.mocked(aiService.saveLocalDemand).mockResolvedValue({} as any);

    // Mock broadcast service
    vi.mocked(broadcastService.createCategoryFiltered).mockResolvedValue({
      broadcast: { broadcastId: 'test-broadcast-456' },
      matchedShopsCount: 8,
    } as any);
  });

  it('renders ImageSearchButton in search bar', () => {
    render(
      <BrowserRouter>
        <EnhancedHeroSection />
      </BrowserRouter>
    );

    expect(screen.getByTestId('image-search-button')).toBeInTheDocument();
  });

  it('disables ImageSearchButton when location is not set', () => {
    vi.mocked(useLocationStore).mockReturnValue({
      lat: null,
      lng: null,
      city: '',
      area: '',
      setLocation: vi.fn(),
    } as any);

    render(
      <BrowserRouter>
        <EnhancedHeroSection />
      </BrowserRouter>
    );

    const imageButton = screen.getByTestId('image-search-button');
    expect(imageButton).toBeDisabled();
  });

  it('disables ImageSearchButton when searching', async () => {
    render(
      <BrowserRouter>
        <EnhancedHeroSection />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search for products/i);
    const searchButton = screen.getByRole('button', { name: /^search$/i });

    fireEvent.change(searchInput, { target: { value: 'milk' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      const imageButton = screen.getByTestId('image-search-button');
      expect(imageButton).toBeDisabled();
    });
  });

  it('calls AI service to analyze image when image is selected', async () => {
    render(
      <BrowserRouter>
        <EnhancedHeroSection />
      </BrowserRouter>
    );

    const imageButton = screen.getByTestId('image-search-button');
    fireEvent.click(imageButton);

    await waitFor(() => {
      expect(aiService.analyzeImage).toHaveBeenCalled();
    });
  });

  it('fills search input with detected product name', async () => {
    render(
      <BrowserRouter>
        <EnhancedHeroSection />
      </BrowserRouter>
    );

    const imageButton = screen.getByTestId('image-search-button');
    fireEvent.click(imageButton);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search for products/i) as HTMLInputElement;
      expect(searchInput.value).toBe('Fresh Tomatoes');
    });
  });

  it('shows AI analysis progress during image processing', async () => {
    render(
      <BrowserRouter>
        <EnhancedHeroSection />
      </BrowserRouter>
    );

    const imageButton = screen.getByTestId('image-search-button');
    fireEvent.click(imageButton);

    await waitFor(() => {
      expect(screen.getByText(/analyzing image with ai/i)).toBeInTheDocument();
    });
  });

  it('shows detected product and category', async () => {
    render(
      <BrowserRouter>
        <EnhancedHeroSection />
      </BrowserRouter>
    );

    const imageButton = screen.getByTestId('image-search-button');
    fireEvent.click(imageButton);

    await waitFor(() => {
      expect(screen.getByText(/detected: fresh tomatoes \(groceries\)/i)).toBeInTheDocument();
    });
  });

  it('creates broadcast with detected category', async () => {
    render(
      <BrowserRouter>
        <EnhancedHeroSection />
      </BrowserRouter>
    );

    const imageButton = screen.getByTestId('image-search-button');
    fireEvent.click(imageButton);

    await waitFor(() => {
      expect(broadcastService.createCategoryFiltered).toHaveBeenCalledWith({
        query: 'tomatoes',
        detectedCategory: 'Groceries',
        userLat: 12.9716,
        userLng: 77.5946,
        radius: 3,
        locality: 'Koramangala',
      });
    });
  });

  it('saves image analysis to local demand database', async () => {
    render(
      <BrowserRouter>
        <EnhancedHeroSection />
      </BrowserRouter>
    );

    const imageButton = screen.getByTestId('image-search-button');
    fireEvent.click(imageButton);

    await waitFor(() => {
      expect(aiService.saveLocalDemand).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'Fresh Tomatoes',
          detected_category: 'Groceries',
          locality: 'Koramangala',
          user_id: 'test-user-123',
        })
      );
    });
  });

  it('navigates to radar page after successful image search', async () => {
    render(
      <BrowserRouter>
        <EnhancedHeroSection />
      </BrowserRouter>
    );

    const imageButton = screen.getByTestId('image-search-button');
    fireEvent.click(imageButton);

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('/broadcast/radar/test-broadcast-456');
      },
      { timeout: 3000 }
    );
  });

  it('stores broadcast data with image analysis in localStorage', async () => {
    render(
      <BrowserRouter>
        <EnhancedHeroSection />
      </BrowserRouter>
    );

    const imageButton = screen.getByTestId('image-search-button');
    fireEvent.click(imageButton);

    await waitFor(
      () => {
        const broadcastData = localStorage.getItem('broadcast_test-broadcast-456');
        expect(broadcastData).toBeTruthy();
        expect(broadcastData).toContain('imageAnalysis');
      },
      { timeout: 3000 }
    );
  });

  it('handles image analysis error gracefully', async () => {
    vi.mocked(aiService.analyzeImage).mockRejectedValue(new Error('AI service unavailable'));

    render(
      <BrowserRouter>
        <EnhancedHeroSection />
      </BrowserRouter>
    );

    const imageButton = screen.getByTestId('image-search-button');
    fireEvent.click(imageButton);

    await waitFor(() => {
      expect(screen.getByText(/ai service unavailable/i)).toBeInTheDocument();
    });
  });

  it('shows error when no shops found for detected category', async () => {
    vi.mocked(broadcastService.createCategoryFiltered).mockResolvedValue({
      broadcast: { broadcastId: 'test-broadcast-789' },
      matchedShopsCount: 0,
    } as any);

    render(
      <BrowserRouter>
        <EnhancedHeroSection />
      </BrowserRouter>
    );

    const imageButton = screen.getByTestId('image-search-button');
    fireEvent.click(imageButton);

    await waitFor(
      () => {
        expect(screen.getByText(/no groceries shops found within 3km/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('requires location to be set before image search', async () => {
    vi.mocked(useLocationStore).mockReturnValue({
      lat: null,
      lng: null,
      city: '',
      area: '',
      setLocation: vi.fn(),
    } as any);

    render(
      <BrowserRouter>
        <EnhancedHeroSection />
      </BrowserRouter>
    );

    const imageButton = screen.getByTestId('image-search-button');
    expect(imageButton).toBeDisabled();
  });

  it('shows broadcast message with matched shops count', async () => {
    render(
      <BrowserRouter>
        <EnhancedHeroSection />
      </BrowserRouter>
    );

    const imageButton = screen.getByTestId('image-search-button');
    fireEvent.click(imageButton);

    await waitFor(
      () => {
        expect(screen.getByText(/broadcasting to 8 nearby groceries shops/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
