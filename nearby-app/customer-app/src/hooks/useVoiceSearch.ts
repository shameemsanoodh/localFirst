import { useState, useEffect, useRef, useCallback } from 'react';

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

export type VoiceSearchLanguage = 'en-IN' | 'hi-IN' | 'kn-IN';

export interface VoiceSearchError {
  code: string;
  message: string;
}

export interface UseVoiceSearchOptions {
  language?: VoiceSearchLanguage;
  onTranscript?: (transcript: string, confidence?: number) => void;
  onError?: (error: VoiceSearchError) => void;
}

export const useVoiceSearch = (options: UseVoiceSearchOptions = {}) => {
  const {
    language = 'en-IN',
    onTranscript,
    onError,
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState<number | undefined>(undefined);
  const [error, setError] = useState<VoiceSearchError | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<VoiceSearchLanguage>(language);

  const recognitionRef = useRef<any>(null);

  // Check browser compatibility
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      // Initialize recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = currentLanguage;
      recognition.maxAlternatives = 1;

      // Handle results
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[0][0].transcript;
        const confidenceScore = event.results[0][0].confidence;
        
        setTranscript(result);
        setConfidence(confidenceScore);
        setIsRecording(false);
        
        if (onTranscript) {
          onTranscript(result, confidenceScore);
        }
      };

      // Handle errors
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const errorObj = handleRecognitionError(event.error);
        setError(errorObj);
        setIsRecording(false);
        
        // Log error for debugging
        console.error('Voice recognition error:', event.error, errorObj);
        
        if (onError) {
          onError(errorObj);
        }
      };

      // Handle end
      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      const notSupportedError = {
        code: 'not-supported',
        message: 'Voice search is not supported in this browser. Please try Chrome, Edge, or Safari.',
      };
      setError(notSupportedError);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [currentLanguage, onTranscript, onError]);

  // Handle recognition errors
  const handleRecognitionError = (errorCode: string): VoiceSearchError => {
    switch (errorCode) {
      case 'not-allowed':
      case 'permission-denied':
        return {
          code: 'permission-denied',
          message: 'Microphone access denied. Please enable microphone permissions in your browser settings.',
        };
      case 'no-speech':
        return {
          code: 'no-speech',
          message: 'No speech detected. Please try again and speak clearly.',
        };
      case 'audio-capture':
        return {
          code: 'audio-capture',
          message: 'No microphone found. Please connect a microphone and try again.',
        };
      case 'network':
        return {
          code: 'network',
          message: 'Network error. Please check your internet connection and try again.',
        };
      case 'aborted':
        return {
          code: 'aborted',
          message: 'Voice search was cancelled.',
        };
      default:
        return {
          code: 'unknown',
          message: 'An error occurred during voice recognition. Please try again.',
        };
    }
  };

  // Start recording
  const startRecording = useCallback(() => {
    if (!isSupported) {
      const notSupportedError = {
        code: 'not-supported',
        message: 'Voice search is not supported in this browser.',
      };
      setError(notSupportedError);
      if (onError) {
        onError(notSupportedError);
      }
      return;
    }

    if (isRecording) {
      return;
    }

    setError(null);
    setTranscript('');
    setConfidence(undefined);
    setIsRecording(true);

    try {
      recognitionRef.current?.start();
    } catch (err) {
      const startError = {
        code: 'start-failed',
        message: 'Failed to start voice recognition. Please try again.',
      };
      setError(startError);
      setIsRecording(false);
      if (onError) {
        onError(startError);
      }
    }
  }, [isSupported, isRecording, onError]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Change language
  const changeLanguage = useCallback((newLanguage: VoiceSearchLanguage) => {
    setCurrentLanguage(newLanguage);
    if (recognitionRef.current) {
      recognitionRef.current.lang = newLanguage;
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setTranscript('');
    setConfidence(undefined);
    setError(null);
    setIsRecording(false);
  }, []);

  return {
    isSupported,
    isRecording,
    transcript,
    confidence,
    error,
    currentLanguage,
    startRecording,
    stopRecording,
    changeLanguage,
    reset,
  };
};
