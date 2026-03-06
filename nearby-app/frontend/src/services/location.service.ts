interface ReverseGeocodeResult {
  area: string;
  city: string;
  state: string;
  country: string;
  formattedAddress: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/dev';

export const locationService = {
  /**
   * Reverse geocode coordinates to get location name
   * Uses Amazon Location Service via backend endpoint
   */
  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
    try {
      const response = await fetch(`${API_URL}/location/reverse-geocode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lat, lng }),
      });

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();

      return {
        area: data.area || 'Current Location',
        city: data.city || 'Unknown City',
        state: data.state || '',
        country: data.country || 'India',
        formattedAddress: data.formattedAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      // Fallback to coordinates if geocoding fails
      return {
        area: 'Current Location',
        city: 'Unknown',
        state: '',
        country: 'India',
        formattedAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      };
    }
  },

  /**
   * Get current position using browser geolocation API
   */
  async getCurrentPosition(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  },

  /**
   * Get location with reverse geocoding
   */
  async getCurrentLocationWithAddress(): Promise<{
    lat: number;
    lng: number;
    area: string;
    city: string;
  }> {
    const coords = await this.getCurrentPosition();
    const address = await this.reverseGeocode(coords.lat, coords.lng);
    
    return {
      lat: coords.lat,
      lng: coords.lng,
      area: address.area,
      city: address.city
    };
  }
};
