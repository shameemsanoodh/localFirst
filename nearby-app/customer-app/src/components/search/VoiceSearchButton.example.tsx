import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { VoiceSearchButton } from './VoiceSearchButton';

/**
 * Example 1: Basic Usage
 * Simple integration with a search input
 */
export function BasicExample() {
  const [query, setQuery] = useState('');

  const handleVoiceTranscript = (transcript: string) => {
    setQuery(transcript);
    console.log('Voice transcript:', transcript);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Basic Voice Search</h2>
      <div className="flex items-center gap-3 px-5 py-4 bg-white rounded-lg border border-gray-200">
        <Search size={20} className="text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for products..."
          className="flex-1 outline-none"
        />
        <VoiceSearchButton onTranscript={handleVoiceTranscript} />
      </div>
    </div>
  );
}

/**
 * Example 2: With Auto-Search
 * Automatically triggers search when voice input is received
 */
export function AutoSearchExample() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const handleSearch = async (searchQuery: string) => {
    setIsSearching(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setResults([
        `Result 1 for "${searchQuery}"`,
        `Result 2 for "${searchQuery}"`,
        `Result 3 for "${searchQuery}"`,
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    setQuery(transcript);
    handleSearch(transcript);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Auto-Search on Voice Input</h2>
      <div className="flex items-center gap-3 px-5 py-4 bg-white rounded-lg border border-gray-200 mb-4">
        <Search size={20} className="text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for products..."
          className="flex-1 outline-none"
        />
        <VoiceSearchButton 
          onTranscript={handleVoiceTranscript}
          disabled={isSearching}
        />
        {isSearching && <Loader2 size={20} className="animate-spin text-blue-500" />}
      </div>

      {results.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold mb-2">Search Results:</h3>
          <ul className="space-y-2">
            {results.map((result, index) => (
              <li key={index} className="text-gray-700">{result}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Example 3: Integrated Search Bar (Like Hero Section)
 * Full-featured search bar with location and voice search
 */
export function IntegratedSearchExample() {
  const [query, setQuery] = useState('');
  const [location] = useState('Koramangala, Bengaluru');
  const [isSearching, setIsSearching] = useState(false);

  const handleVoiceTranscript = (transcript: string) => {
    setQuery(transcript);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      console.log('Searching for:', query, 'in', location);
      // Implement your search logic here
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Integrated Search Bar</h2>
      <form onSubmit={handleSearch}>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Location Section */}
            <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200">
              <div className="flex items-center gap-3 px-5 py-4">
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-0.5">Location</div>
                  <div className="text-sm font-semibold text-gray-900">{location}</div>
                </div>
              </div>
            </div>

            {/* Search Section */}
            <div className="flex-1 flex items-center gap-3 px-5 py-4">
              <Search size={20} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for products, shops, categories..."
                className="flex-1 text-gray-700 outline-none placeholder-gray-400"
                disabled={isSearching}
              />
              <VoiceSearchButton 
                onTranscript={handleVoiceTranscript}
                disabled={isSearching}
              />
              <button
                type="submit"
                disabled={isSearching || !query.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSearching ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Searching</span>
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

/**
 * Example 4: Custom Styling
 * VoiceSearchButton with custom styling
 */
export function CustomStyledExample() {
  const [query, setQuery] = useState('');

  const handleVoiceTranscript = (transcript: string) => {
    setQuery(transcript);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Custom Styled Voice Button</h2>
      <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
        <Search size={20} className="text-white" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for products..."
          className="flex-1 bg-transparent text-white placeholder-white/70 outline-none"
        />
        <VoiceSearchButton 
          onTranscript={handleVoiceTranscript}
          className="text-white hover:bg-white/20"
        />
      </div>
    </div>
  );
}

/**
 * Example 5: With Transcript History
 * Shows history of voice transcripts
 */
export function TranscriptHistoryExample() {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const handleVoiceTranscript = (transcript: string) => {
    setQuery(transcript);
    setHistory((prev) => [transcript, ...prev].slice(0, 5)); // Keep last 5
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Voice Search with History</h2>
      <div className="flex items-center gap-3 px-5 py-4 bg-white rounded-lg border border-gray-200 mb-4">
        <Search size={20} className="text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for products..."
          className="flex-1 outline-none"
        />
        <VoiceSearchButton onTranscript={handleVoiceTranscript} />
      </div>

      {history.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Voice Searches:</h3>
          <ul className="space-y-1">
            {history.map((item, index) => (
              <li 
                key={index} 
                className="text-sm text-gray-600 cursor-pointer hover:text-blue-600"
                onClick={() => setQuery(item)}
              >
                {index + 1}. {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Demo Component - Shows all examples
 */
export function VoiceSearchButtonDemo() {
  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto space-y-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            VoiceSearchButton Examples
          </h1>
          <p className="text-gray-600">
            Click the microphone icon and speak to test voice search
          </p>
        </div>

        <BasicExample />
        <AutoSearchExample />
        <IntegratedSearchExample />
        <CustomStyledExample />
        <TranscriptHistoryExample />
      </div>
    </div>
  );
}
