/**
 * Extract coordinates from various Google Maps link formats
 * Supports:
 * - Standard links: https://www.google.com/maps/@12.9716,77.5946,15z
 * - Place links: https://www.google.com/maps/place/.../@12.9716,77.5946
 * - Shortened links: https://maps.app.goo.gl/xxxxx (requires fetch to resolve)
 * - Search links: https://www.google.com/maps/search/.../@12.9716,77.5946
 */

interface Coordinates {
  lat: number
  lng: number
}

/**
 * Extract coordinates from a Google Maps URL
 * @param url - The Google Maps URL (can be shortened or full)
 * @returns Promise<Coordinates | null> - The extracted coordinates or null if not found
 */
export async function extractMapCoordinates(url: string): Promise<Coordinates | null> {
  if (!url || !url.trim()) {
    return null
  }

  try {
    // Method 1: Direct coordinate extraction from URL
    // Matches patterns like @12.9716,77.5946 or @12.9716,77.5946,15z
    const directMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (directMatch) {
      return {
        lat: parseFloat(directMatch[1]),
        lng: parseFloat(directMatch[2])
      }
    }

    // Method 2: Extract from query parameters
    // Matches patterns like ?q=12.9716,77.5946 or &ll=12.9716,77.5946
    const queryMatch = url.match(/[?&](?:q|ll)=(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (queryMatch) {
      return {
        lat: parseFloat(queryMatch[1]),
        lng: parseFloat(queryMatch[2])
      }
    }

    // Method 3: Handle shortened URLs (maps.app.goo.gl)
    if (url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps')) {
      console.log('Shortened Google Maps link detected')
      
      // Shortened URLs are problematic - they timeout or get blocked
      // Best UX: Ask user to open the link and paste the full URL
      return {
        error: 'shortened-url',
        message: 'Shortened link detected',
        instruction: 'Please open this link in your browser, then copy and paste the full URL from the address bar'
      } as any
    }

    // Method 4: Extract from place ID or other formats
    // This is a fallback for other URL structures
    const placeMatch = url.match(/place\/[^/]+\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (placeMatch) {
      return {
        lat: parseFloat(placeMatch[1]),
        lng: parseFloat(placeMatch[2])
      }
    }

    console.warn('Could not extract coordinates from URL:', url)
    return null
  } catch (error) {
    console.error('Error extracting coordinates:', error)
    return null
  }
}

/**
 * Validate if coordinates are valid
 */
export function isValidCoordinates(coords: Coordinates | null): boolean {
  if (!coords) return false
  
  const { lat, lng } = coords
  
  // Latitude must be between -90 and 90
  // Longitude must be between -180 and 180
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(coords: Coordinates): string {
  return `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
}

/**
 * Generate a Google Maps link from coordinates
 */
export function generateMapLink(coords: Coordinates): string {
  return `https://www.google.com/maps/@${coords.lat},${coords.lng},15z`
}
