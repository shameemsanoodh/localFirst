/**
 * Feature Flags Configuration
 * 
 * Controls which features are enabled/disabled in the app.
 * Can be overridden by environment variables or remote config.
 */

export interface FeatureFlags {
  // Multimodal Search Features
  voiceSearch: boolean;
  imageSearch: boolean;
  featuredBanner: boolean;
  
  // Search Features
  aiCategoryDetection: boolean;
  localDemandTracking: boolean;
  searchHistory: boolean;
  
  // Analytics
  voiceSearchAnalytics: boolean;
  imageSearchAnalytics: boolean;
  
  // Experimental
  barcodeScanning: boolean;
  multiProductImageSearch: boolean;
  offlineVoiceSearch: boolean;
}

// Default feature flags
const defaultFlags: FeatureFlags = {
  // Multimodal Search - All enabled by default
  voiceSearch: true,
  imageSearch: true,
  featuredBanner: true,
  
  // Search Features
  aiCategoryDetection: true,
  localDemandTracking: true,
  searchHistory: true,
  
  // Analytics
  voiceSearchAnalytics: true,
  imageSearchAnalytics: true,
  
  // Experimental - Disabled by default
  barcodeScanning: false,
  multiProductImageSearch: false,
  offlineVoiceSearch: false,
};

/**
 * Get feature flags from environment variables
 */
function getEnvFlags(): Partial<FeatureFlags> {
  const envFlags: Partial<FeatureFlags> = {};
  
  // Check environment variables
  if (import.meta.env.VITE_FEATURE_VOICE_SEARCH !== undefined) {
    envFlags.voiceSearch = import.meta.env.VITE_FEATURE_VOICE_SEARCH === 'true';
  }
  
  if (import.meta.env.VITE_FEATURE_IMAGE_SEARCH !== undefined) {
    envFlags.imageSearch = import.meta.env.VITE_FEATURE_IMAGE_SEARCH === 'true';
  }
  
  if (import.meta.env.VITE_FEATURE_BANNER !== undefined) {
    envFlags.featuredBanner = import.meta.env.VITE_FEATURE_BANNER === 'true';
  }
  
  if (import.meta.env.VITE_FEATURE_AI_DETECTION !== undefined) {
    envFlags.aiCategoryDetection = import.meta.env.VITE_FEATURE_AI_DETECTION === 'true';
  }
  
  if (import.meta.env.VITE_FEATURE_BARCODE !== undefined) {
    envFlags.barcodeScanning = import.meta.env.VITE_FEATURE_BARCODE === 'true';
  }
  
  return envFlags;
}

/**
 * Get feature flags from localStorage (for testing/debugging)
 */
function getLocalFlags(): Partial<FeatureFlags> {
  try {
    const stored = localStorage.getItem('featureFlags');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to parse feature flags from localStorage:', error);
  }
  return {};
}

/**
 * Merge feature flags with priority: localStorage > env > defaults
 */
function mergeFlags(): FeatureFlags {
  const envFlags = getEnvFlags();
  const localFlags = getLocalFlags();
  
  return {
    ...defaultFlags,
    ...envFlags,
    ...localFlags,
  };
}

// Export merged feature flags
export const featureFlags: FeatureFlags = mergeFlags();

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return featureFlags[feature] === true;
}

/**
 * Enable a feature (for testing/debugging)
 */
export function enableFeature(feature: keyof FeatureFlags): void {
  const currentFlags = getLocalFlags();
  const updatedFlags = {
    ...currentFlags,
    [feature]: true,
  };
  localStorage.setItem('featureFlags', JSON.stringify(updatedFlags));
  console.log(`Feature "${feature}" enabled. Reload page to apply.`);
}

/**
 * Disable a feature (for testing/debugging)
 */
export function disableFeature(feature: keyof FeatureFlags): void {
  const currentFlags = getLocalFlags();
  const updatedFlags = {
    ...currentFlags,
    [feature]: false,
  };
  localStorage.setItem('featureFlags', JSON.stringify(updatedFlags));
  console.log(`Feature "${feature}" disabled. Reload page to apply.`);
}

/**
 * Reset all feature flags to defaults
 */
export function resetFeatureFlags(): void {
  localStorage.removeItem('featureFlags');
  console.log('Feature flags reset to defaults. Reload page to apply.');
}

/**
 * Log current feature flags (for debugging)
 */
export function logFeatureFlags(): void {
  console.table(featureFlags);
}

// Expose to window for debugging in development
if (import.meta.env.DEV) {
  (window as any).featureFlags = {
    current: featureFlags,
    enable: enableFeature,
    disable: disableFeature,
    reset: resetFeatureFlags,
    log: logFeatureFlags,
  };
  
  console.log('Feature flags available in console: window.featureFlags');
}

export default featureFlags;
