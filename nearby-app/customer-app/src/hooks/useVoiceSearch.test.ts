import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useVoiceSearch } from './useVoiceSearch';

// Mock SpeechRecognition
class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = 'en-IN';
  maxAlternatives = 1;
  onresult: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onend: (() => void) | null = null;

  start() {
    // Simulate successful start
  }

  stop() {
    if (this.onend) {
      this.onend();
    }
  }

  abort() {
    if (this.onend) {
      this.onend();
    }
  }

  // Helper methods for testing
  simulateResult(transcript: string) {
    if (this.onresult) {
      this.onresult({
        results: [
          [
            {
              transcript,
              confidence: 0.95,
            },
          ],
        ],
        resultIndex: 0,
      });
    }
  }

  simulateError(error: string) {
    if (this.onerror) {
      this.onerror({
        error,
        message: `Error: ${error}`,
      });
    }
  }
}

describe('useVoiceSearch', () => {
  let mockRecognition: MockSpeechRecognition;

  beforeEach(() => {
    // Reset mocks
    mockRecognition = new MockSpeechRecognition();
    
    // Mock window.SpeechRecognition
    (window as any).SpeechRecognition = vi.fn(() => mockRecognition);
    (window as any).webkitSpeechRecognition = undefined;
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useVoiceSearch());

    expect(result.current.isSupported).toBe(true);
    expect(result.current.isRecording).toBe(false);
    expect(result.current.transcript).toBe('');
    expect(result.current.error).toBe(null);
    expect(result.current.currentLanguage).toBe('en-IN');
  });

  it('should detect browser support', () => {
    const { result } = renderHook(() => useVoiceSearch());
    expect(result.current.isSupported).toBe(true);
  });

  it('should detect lack of browser support', () => {
    // Remove SpeechRecognition
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;

    const { result } = renderHook(() => useVoiceSearch());

    expect(result.current.isSupported).toBe(false);
    expect(result.current.error).toEqual({
      code: 'not-supported',
      message: expect.stringContaining('not supported'),
    });
  });

  it('should start recording', () => {
    const { result } = renderHook(() => useVoiceSearch());

    act(() => {
      result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('should stop recording', async () => {
    const { result } = renderHook(() => useVoiceSearch());

    act(() => {
      result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(true);

    act(() => {
      result.current.stopRecording();
    });

    await waitFor(() => {
      expect(result.current.isRecording).toBe(false);
    });
  });

  it('should handle successful speech recognition', async () => {
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useVoiceSearch({ onTranscript }));

    act(() => {
      result.current.startRecording();
    });

    act(() => {
      mockRecognition.simulateResult('I need milk');
    });

    await waitFor(() => {
      expect(result.current.transcript).toBe('I need milk');
      expect(result.current.isRecording).toBe(false);
      expect(onTranscript).toHaveBeenCalledWith('I need milk');
    });
  });

  it('should handle permission denied error', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useVoiceSearch({ onError }));

    act(() => {
      result.current.startRecording();
    });

    act(() => {
      mockRecognition.simulateError('not-allowed');
    });

    await waitFor(() => {
      expect(result.current.error).toEqual({
        code: 'permission-denied',
        message: expect.stringContaining('Microphone access denied'),
      });
      expect(result.current.isRecording).toBe(false);
      expect(onError).toHaveBeenCalled();
    });
  });

  it('should handle no speech detected error', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useVoiceSearch({ onError }));

    act(() => {
      result.current.startRecording();
    });

    act(() => {
      mockRecognition.simulateError('no-speech');
    });

    await waitFor(() => {
      expect(result.current.error).toEqual({
        code: 'no-speech',
        message: expect.stringContaining('No speech detected'),
      });
      expect(onError).toHaveBeenCalled();
    });
  });

  it('should handle network error', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useVoiceSearch({ onError }));

    act(() => {
      result.current.startRecording();
    });

    act(() => {
      mockRecognition.simulateError('network');
    });

    await waitFor(() => {
      expect(result.current.error).toEqual({
        code: 'network',
        message: expect.stringContaining('Network error'),
      });
      expect(onError).toHaveBeenCalled();
    });
  });

  it('should change language', () => {
    const { result } = renderHook(() => useVoiceSearch());

    expect(result.current.currentLanguage).toBe('en-IN');

    act(() => {
      result.current.changeLanguage('hi-IN');
    });

    expect(result.current.currentLanguage).toBe('hi-IN');
    expect(mockRecognition.lang).toBe('hi-IN');
  });

  it('should support multiple languages', () => {
    const { result } = renderHook(() => useVoiceSearch({ language: 'kn-IN' }));

    expect(result.current.currentLanguage).toBe('kn-IN');
  });

  it('should reset state', async () => {
    const { result } = renderHook(() => useVoiceSearch());

    act(() => {
      result.current.startRecording();
    });

    act(() => {
      mockRecognition.simulateResult('test transcript');
    });

    await waitFor(() => {
      expect(result.current.transcript).toBe('test transcript');
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.transcript).toBe('');
    expect(result.current.error).toBe(null);
    expect(result.current.isRecording).toBe(false);
  });

  it('should not start recording if already recording', () => {
    const { result } = renderHook(() => useVoiceSearch());

    act(() => {
      result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(true);

    // Try to start again
    act(() => {
      result.current.startRecording();
    });

    // Should still be recording (no change)
    expect(result.current.isRecording).toBe(true);
  });

  it('should not start recording if not supported', () => {
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;

    const onError = vi.fn();
    const { result } = renderHook(() => useVoiceSearch({ onError }));

    act(() => {
      result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(false);
    expect(onError).toHaveBeenCalledWith({
      code: 'not-supported',
      message: expect.stringContaining('not supported'),
    });
  });

  it('should handle audio capture error', async () => {
    const { result } = renderHook(() => useVoiceSearch());

    act(() => {
      result.current.startRecording();
    });

    act(() => {
      mockRecognition.simulateError('audio-capture');
    });

    await waitFor(() => {
      expect(result.current.error).toEqual({
        code: 'audio-capture',
        message: expect.stringContaining('No microphone found'),
      });
    });
  });

  it('should handle aborted error', async () => {
    const { result } = renderHook(() => useVoiceSearch());

    act(() => {
      result.current.startRecording();
    });

    act(() => {
      mockRecognition.simulateError('aborted');
    });

    await waitFor(() => {
      expect(result.current.error).toEqual({
        code: 'aborted',
        message: expect.stringContaining('cancelled'),
      });
    });
  });

  it('should handle unknown error', async () => {
    const { result } = renderHook(() => useVoiceSearch());

    act(() => {
      result.current.startRecording();
    });

    act(() => {
      mockRecognition.simulateError('unknown-error');
    });

    await waitFor(() => {
      expect(result.current.error).toEqual({
        code: 'unknown',
        message: expect.stringContaining('An error occurred'),
      });
    });
  });

  it('should cleanup on unmount', () => {
    const abortSpy = vi.spyOn(mockRecognition, 'abort');
    const { unmount } = renderHook(() => useVoiceSearch());

    unmount();

    expect(abortSpy).toHaveBeenCalled();
  });

  it('should use webkit prefix if available', () => {
    delete (window as any).SpeechRecognition;
    (window as any).webkitSpeechRecognition = vi.fn(() => mockRecognition);

    const { result } = renderHook(() => useVoiceSearch());

    expect(result.current.isSupported).toBe(true);
  });
});
