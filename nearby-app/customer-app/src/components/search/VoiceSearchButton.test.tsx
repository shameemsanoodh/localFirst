import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VoiceSearchButton } from './VoiceSearchButton';
import * as useVoiceSearchModule from '@/hooks/useVoiceSearch';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('VoiceSearchButton', () => {
  const mockOnTranscript = vi.fn();
  const mockStartRecording = vi.fn();
  const mockStopRecording = vi.fn();
  const mockChangeLanguage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders microphone button', () => {
    vi.spyOn(useVoiceSearchModule, 'useVoiceSearch').mockReturnValue({
      isSupported: true,
      isRecording: false,
      transcript: '',
      error: null,
      currentLanguage: 'en-IN',
      startRecording: mockStartRecording,
      stopRecording: mockStopRecording,
      changeLanguage: mockChangeLanguage,
      reset: vi.fn(),
    });

    render(<VoiceSearchButton onTranscript={mockOnTranscript} />);

    const button = screen.getByRole('button', { name: /start voice search/i });
    expect(button).toBeInTheDocument();
  });

  it('starts recording when clicked', () => {
    vi.spyOn(useVoiceSearchModule, 'useVoiceSearch').mockReturnValue({
      isSupported: true,
      isRecording: false,
      transcript: '',
      error: null,
      currentLanguage: 'en-IN',
      startRecording: mockStartRecording,
      stopRecording: mockStopRecording,
      changeLanguage: mockChangeLanguage,
      reset: vi.fn(),
    });

    render(<VoiceSearchButton onTranscript={mockOnTranscript} />);

    const button = screen.getByRole('button', { name: /start voice search/i });
    fireEvent.click(button);

    expect(mockStartRecording).toHaveBeenCalledTimes(1);
  });

  it('stops recording when clicked while recording', () => {
    vi.spyOn(useVoiceSearchModule, 'useVoiceSearch').mockReturnValue({
      isSupported: true,
      isRecording: true,
      transcript: '',
      error: null,
      currentLanguage: 'en-IN',
      startRecording: mockStartRecording,
      stopRecording: mockStopRecording,
      changeLanguage: mockChangeLanguage,
      reset: vi.fn(),
    });

    render(<VoiceSearchButton onTranscript={mockOnTranscript} />);

    const button = screen.getByRole('button', { name: /stop voice recording/i });
    fireEvent.click(button);

    expect(mockStopRecording).toHaveBeenCalledTimes(1);
  });

  it('shows recording indicator when recording', () => {
    vi.spyOn(useVoiceSearchModule, 'useVoiceSearch').mockReturnValue({
      isSupported: true,
      isRecording: true,
      transcript: '',
      error: null,
      currentLanguage: 'en-IN',
      startRecording: mockStartRecording,
      stopRecording: mockStopRecording,
      changeLanguage: mockChangeLanguage,
      reset: vi.fn(),
    });

    render(<VoiceSearchButton onTranscript={mockOnTranscript} />);

    expect(screen.getByText(/listening/i)).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    vi.spyOn(useVoiceSearchModule, 'useVoiceSearch').mockReturnValue({
      isSupported: true,
      isRecording: false,
      transcript: '',
      error: null,
      currentLanguage: 'en-IN',
      startRecording: mockStartRecording,
      stopRecording: mockStopRecording,
      changeLanguage: mockChangeLanguage,
      reset: vi.fn(),
    });

    render(<VoiceSearchButton onTranscript={mockOnTranscript} disabled />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('is disabled when voice search is not supported', () => {
    vi.spyOn(useVoiceSearchModule, 'useVoiceSearch').mockReturnValue({
      isSupported: false,
      isRecording: false,
      transcript: '',
      error: { code: 'not-supported', message: 'Not supported' },
      currentLanguage: 'en-IN',
      startRecording: mockStartRecording,
      stopRecording: mockStopRecording,
      changeLanguage: mockChangeLanguage,
      reset: vi.fn(),
    });

    render(<VoiceSearchButton onTranscript={mockOnTranscript} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('calls onTranscript when transcript is received', () => {
    const mockOnTranscriptCallback = vi.fn();
    
    vi.spyOn(useVoiceSearchModule, 'useVoiceSearch').mockImplementation((options) => {
      // Simulate transcript callback
      if (options?.onTranscript) {
        setTimeout(() => options.onTranscript!('test transcript'), 0);
      }
      
      return {
        isSupported: true,
        isRecording: false,
        transcript: 'test transcript',
        error: null,
        currentLanguage: 'en-IN',
        startRecording: mockStartRecording,
        stopRecording: mockStopRecording,
        changeLanguage: mockChangeLanguage,
        reset: vi.fn(),
      };
    });

    render(<VoiceSearchButton onTranscript={mockOnTranscriptCallback} />);

    waitFor(() => {
      expect(mockOnTranscriptCallback).toHaveBeenCalledWith('test transcript');
    });
  });

  it('has proper ARIA labels', () => {
    vi.spyOn(useVoiceSearchModule, 'useVoiceSearch').mockReturnValue({
      isSupported: true,
      isRecording: false,
      transcript: '',
      error: null,
      currentLanguage: 'en-IN',
      startRecording: mockStartRecording,
      stopRecording: mockStopRecording,
      changeLanguage: mockChangeLanguage,
      reset: vi.fn(),
    });

    render(<VoiceSearchButton onTranscript={mockOnTranscript} />);

    const button = screen.getByRole('button', { name: /start voice search/i });
    expect(button).toHaveAttribute('aria-label');
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('updates aria-pressed when recording', () => {
    vi.spyOn(useVoiceSearchModule, 'useVoiceSearch').mockReturnValue({
      isSupported: true,
      isRecording: true,
      transcript: '',
      error: null,
      currentLanguage: 'en-IN',
      startRecording: mockStartRecording,
      stopRecording: mockStopRecording,
      changeLanguage: mockChangeLanguage,
      reset: vi.fn(),
    });

    render(<VoiceSearchButton onTranscript={mockOnTranscript} />);

    const button = screen.getByRole('button', { name: /stop voice recording/i });
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });
});
