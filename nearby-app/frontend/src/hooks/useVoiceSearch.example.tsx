/**
 * Example usage of useVoiceSearch hook
 * 
 * This file demonstrates how to integrate voice search functionality
 * into your React components.
 */

import React from 'react';
import { useVoiceSearch } from './useVoiceSearch';

export const VoiceSearchExample: React.FC = () => {
  const {
    isSupported,
    isRecording,
    transcript,
    error,
    currentLanguage,
    startRecording,
    stopRecording,
    changeLanguage,
    reset,
  } = useVoiceSearch({
    language: 'en-IN',
    onTranscript: (text) => {
      console.log('Transcript received:', text);
      // Handle the transcript (e.g., fill search input, trigger search)
    },
    onError: (err) => {
      console.error('Voice search error:', err);
      // Handle errors (e.g., show error message to user)
    },
  });

  // Check if voice search is supported
  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-100 text-yellow-800 rounded">
        Voice search is not supported in your browser.
        Please use Chrome, Edge, or Safari.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Voice Search Demo</h2>

      {/* Language Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => changeLanguage('en-IN')}
          className={`px-4 py-2 rounded ${
            currentLanguage === 'en-IN'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200'
          }`}
        >
          English
        </button>
        <button
          onClick={() => changeLanguage('hi-IN')}
          className={`px-4 py-2 rounded ${
            currentLanguage === 'hi-IN'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200'
          }`}
        >
          हिंदी
        </button>
        <button
          onClick={() => changeLanguage('kn-IN')}
          className={`px-4 py-2 rounded ${
            currentLanguage === 'kn-IN'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200'
          }`}
        >
          ಕನ್ನಡ
        </button>
      </div>

      {/* Recording Controls */}
      <div className="flex gap-2">
        <button
          onClick={startRecording}
          disabled={isRecording}
          className={`px-6 py-3 rounded-lg font-semibold ${
            isRecording
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isRecording ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              Listening...
            </span>
          ) : (
            '🎤 Start Recording'
          )}
        </button>

        {isRecording && (
          <button
            onClick={stopRecording}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
          >
            Stop
          </button>
        )}

        {transcript && (
          <button
            onClick={reset}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700"
          >
            Reset
          </button>
        )}
      </div>

      {/* Transcript Display */}
      {transcript && (
        <div className="p-4 bg-green-100 border border-green-300 rounded">
          <p className="text-sm text-green-700 font-semibold mb-1">
            Transcript:
          </p>
          <p className="text-lg text-green-900">{transcript}</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-300 rounded">
          <p className="text-sm text-red-700 font-semibold mb-1">
            Error ({error.code}):
          </p>
          <p className="text-red-900">{error.message}</p>
        </div>
      )}

      {/* Status Info */}
      <div className="p-4 bg-gray-100 rounded text-sm">
        <p>
          <strong>Status:</strong>{' '}
          {isRecording ? 'Recording' : 'Ready'}
        </p>
        <p>
          <strong>Language:</strong> {currentLanguage}
        </p>
        <p>
          <strong>Browser Support:</strong>{' '}
          {isSupported ? '✅ Supported' : '❌ Not Supported'}
        </p>
      </div>
    </div>
  );
};

/**
 * Simple integration example for search bar
 */
export const SearchBarWithVoice: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const { isRecording, startRecording } = useVoiceSearch({
    onTranscript: (text) => {
      // Fill the search input with the transcript
      setSearchQuery(text);
      // Optionally trigger search automatically
      handleSearch(text);
    },
    onError: (err) => {
      alert(err.message);
    },
  });

  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
    // Implement your search logic here
  };

  return (
    <div className="flex items-center gap-2 p-2 border rounded-lg">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search for products..."
        className="flex-1 px-4 py-2 outline-none"
      />
      
      <button
        onClick={startRecording}
        className={`p-2 rounded ${
          isRecording
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-gray-200 hover:bg-gray-300'
        }`}
        title="Voice search"
      >
        🎤
      </button>
      
      <button
        onClick={() => handleSearch(searchQuery)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Search
      </button>
    </div>
  );
};
