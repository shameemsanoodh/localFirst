import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, AlertCircle, X } from 'lucide-react';
import { useVoiceSearch, VoiceSearchLanguage } from '@/hooks/useVoiceSearch';
import { analyticsService } from '@/services/analytics.service';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';

export interface VoiceSearchButtonProps {
  onTranscript: (transcript: string) => void;
  disabled?: boolean;
  className?: string;
}

export const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({
  onTranscript,
  disabled = false,
  className = '',
}) => {
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showErrorTooltip, setShowErrorTooltip] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<VoiceSearchLanguage>('en-IN');

  const { user } = useAuthStore();
  const { lat, lng, area, city } = useLocationStore();

  const {
    isSupported,
    isRecording,
    error,
    startRecording,
    stopRecording,
    changeLanguage,
  } = useVoiceSearch({
    language: selectedLanguage,
    onTranscript: (transcript, confidence) => {
      // Track successful voice search completion with confidence score
      analyticsService.trackVoiceSearchCompleted({
        userId: user?.userId,
        language: selectedLanguage,
        transcript,
        confidence,
        location: lat && lng ? { lat, lng, area, city } : undefined,
      });

      onTranscript(transcript);
      setShowErrorTooltip(false);
    },
    onError: (err) => {
      // Track voice search failure
      analyticsService.trackVoiceSearchFailed({
        userId: user?.userId,
        language: selectedLanguage,
        errorCode: err.code,
        errorMessage: err.message,
        location: lat && lng ? { lat, lng, area, city } : undefined,
      });

      if (err.code === 'permission-denied') {
        setShowPermissionModal(true);
      } else {
        setShowErrorTooltip(true);
        setTimeout(() => setShowErrorTooltip(false), 5000);
      }
    },
  });

  const handleClick = () => {
    if (disabled) return;

    if (!isSupported) {
      setShowErrorTooltip(true);
      setTimeout(() => setShowErrorTooltip(false), 5000);
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      // Track voice search initiated
      analyticsService.trackVoiceSearchInitiated({
        userId: user?.userId,
        language: selectedLanguage,
        location: lat && lng ? { lat, lng, area, city } : undefined,
      });

      startRecording();
    }
  };

  const handleLanguageChange = (lang: VoiceSearchLanguage) => {
    setSelectedLanguage(lang);
    changeLanguage(lang);
  };

  const getLanguageLabel = (lang: VoiceSearchLanguage) => {
    switch (lang) {
      case 'en-IN':
        return 'English';
      case 'hi-IN':
        return 'हिंदी';
      case 'kn-IN':
        return 'ಕನ್ನಡ';
      default:
        return 'English';
    }
  };

  return (
    <div className="relative">
      {/* Voice Search Button */}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || !isSupported}
        className={`relative p-2 rounded-lg transition-all duration-200 ${
          isRecording
            ? 'bg-red-50 text-red-600 hover:bg-red-100'
            : 'text-gray-400 hover:text-nearby-500 hover:bg-gray-50'
        } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        aria-label={isRecording ? 'Stop voice recording' : 'Start voice search'}
        aria-pressed={isRecording}
        title={
          !isSupported
            ? 'Voice search not supported in this browser'
            : isRecording
            ? 'Click to stop recording'
            : 'Click to start voice search'
        }
      >
        {isRecording ? (
          <div className="relative">
            <Mic size={20} className="relative z-10" />
            {/* Pulsing animation */}
            <motion.div
              className="absolute inset-0 bg-red-500 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>
        ) : (
          <Mic size={20} />
        )}

        {/* Recording indicator dot */}
        {isRecording && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </button>

      {/* Error Tooltip */}
      <AnimatePresence>
        {showErrorTooltip && error && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-64 bg-red-50 border border-red-200 rounded-lg shadow-lg p-3 z-50"
          >
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-red-700 mb-1">
                  Voice Search Error
                </p>
                <p className="text-xs text-red-600">{error.message}</p>
              </div>
              <button
                onClick={() => setShowErrorTooltip(false)}
                className="text-red-400 hover:text-red-600"
                aria-label="Close error message"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording Status Tooltip */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <motion.div
                  className="w-2 h-2 bg-red-500 rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.7, 1],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                  }}
                />
                <span className="text-xs font-semibold text-gray-700">
                  Listening...
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              Speak clearly into your microphone
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Language:</span>
              <div className="flex gap-1">
                {(['en-IN', 'hi-IN', 'kn-IN'] as VoiceSearchLanguage[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      selectedLanguage === lang
                        ? 'bg-nearby-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    aria-label={`Switch to ${getLanguageLabel(lang)}`}
                  >
                    {getLanguageLabel(lang)}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permission Request Modal */}
      <AnimatePresence>
        {showPermissionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
            onClick={() => setShowPermissionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-red-50 rounded-full">
                  <MicOff size={24} className="text-red-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Microphone Access Required
                  </h3>
                  <p className="text-sm text-gray-600">
                    To use voice search, please enable microphone access in your browser
                    settings.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-xs font-semibold text-blue-900 mb-2">
                  How to enable microphone access:
                </p>
                <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Click the lock icon in your browser's address bar</li>
                  <li>Find "Microphone" in the permissions list</li>
                  <li>Change the setting to "Allow"</li>
                  <li>Refresh the page and try again</li>
                </ol>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPermissionModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowPermissionModal(false);
                    // Try again after user has potentially changed permissions
                    setTimeout(() => startRecording(), 500);
                  }}
                  className="flex-1 px-4 py-2.5 bg-nearby-500 hover:bg-nearby-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
