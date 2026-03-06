import React, { useState } from 'react';

interface Step1PhoneProps {
  onNext: (phone: string) => void;
}

export const Step1Phone: React.FC<Step1PhoneProps> = ({ onNext }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOTP = () => {
    // TODO: Integrate with Cognito/SNS for OTP
    if (phone.length === 10) {
      setOtpSent(true);
      // Simulate OTP send
      console.log('Sending OTP to:', phone);
    }
  };

  const handleVerifyOTP = () => {
    // TODO: Verify OTP
    if (otp.length === 6) {
      onNext(`+91${phone}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to NearBy! 🛍️
          </h1>
          <p className="text-gray-600">
            Get discovered by customers around you
          </p>
        </div>

        {!otpSent ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📱 Enter Mobile Number
              </label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 bg-gray-100 rounded-lg">
                  <span className="text-gray-700 font-medium">+91</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={10}
                />
              </div>
            </div>

            <button
              onClick={handleSendOTP}
              disabled={phone.length !== 10}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Continue →
            </button>

            <p className="text-center text-sm text-gray-500">
              1000+ shops near you are already live
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP sent to +91{phone}
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                maxLength={6}
              />
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={otp.length !== 6}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Verify & Continue →
            </button>

            <button
              onClick={() => setOtpSent(false)}
              className="w-full text-blue-600 py-2 text-sm hover:underline"
            >
              ← Change Number
            </button>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
          </div>
        </div>
        <p className="text-center text-xs text-gray-500 mt-2">Step 1 of 5</p>
      </div>
    </div>
  );
};
