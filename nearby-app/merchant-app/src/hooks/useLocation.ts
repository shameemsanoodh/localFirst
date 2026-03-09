import { useState, useEffect } from 'react';
import { useLocationStore } from '@/store/locationStore';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';

interface LocationError {
  code: number;
  message: string;
}

export const useLocation = () => {
  const { lat, lng, city, state, setLocation } = useLocationStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LocationError | null>(null);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by your browser',
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const newLat = position.coords.latitude;
        const newLng = position.coords.longitude;

        // Reverse geocode to get city and state
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${newLat}&lon=${newLng}&format=json`
          );
          const data = await response.json();
          
          setLocation(
            newLat,
            newLng,
            data.address?.city || data.address?.town || 'Unknown',
            data.address?.state || 'Unknown'
          );

          // Update user location in backend
          if (user?.userId) {
            await authService.updateLocation(user.userId, newLat, newLng);
          }
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
          setLocation(newLat, newLng, 'Unknown', 'Unknown');
        }

        setIsLoading(false);
      },
      (err) => {
        setError({
          code: err.code,
          message: err.message,
        });
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    if (!lat || !lng) {
      getCurrentLocation();
    }
  }, []);

  return {
    lat,
    lng,
    city,
    state,
    isLoading,
    error,
    getCurrentLocation,
  };
};
