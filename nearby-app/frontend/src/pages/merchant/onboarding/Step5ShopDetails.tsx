import React, { useState, useEffect } from 'react';

interface Step5ShopDetailsProps {
  onComplete: (data: {
    shop_name: string;
    location: { lat: number; lng: number };
    whatsapp?: string;
  }) => void;
  onBack: () => void;
}

export const Step5ShopDetails: React.FC<Step5ShopDetailsProps> = ({ onComplete, onBack }) => {
  const [shopName, setShopName] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  useEffect(() => {
    if (useCurrentLocation && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Could not get your location. Please enter manually.');
        }
      );
    }
  }, [useCurrentLocation]);

  const handleComplete = () => {
    if (shopName && location) {
      onComplete({
        shop_name: shopName,
        location,
        whatsapp: whatsapp || undefined
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Almost done! ✨
          </h2>
          <div className="h-1 w-20 bg-blue-600 rounded"></div>
        </div>

        <div className="space-y-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shop Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Sri Krishna Mobiles"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location <span className="text-red-500">*</span>
            </label>
            {!location ? (
              <button
                onClick={() => setUseCurrentLocation(true)}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                📍 Use My Current Location
              </button>
            ) : (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✓ Location captured: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
                <button
                  onClick={() => setLocation(null)}
                  className="text-sm text-blue-600 hover:underline mt-2"
                >
                  Change location
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp Number (Optional)
            </label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 bg-gray-100 rounded-lg">
                <span className="text-gray-700 font-medium">+91</span>
              </div>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={10}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Get instant notifications for customer queries
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            💡 You can add shop photos, timings, and other details later from your dashboard
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={handleComplete}
            disabled={!shopName || !location}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            Go Live! 🎉
          </button>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
          </div>
        </div>
        <p className="text-center text-xs text-gray-500 mt-2">Step 5 of 5</p>
      </div>
    </div>
  );
};
