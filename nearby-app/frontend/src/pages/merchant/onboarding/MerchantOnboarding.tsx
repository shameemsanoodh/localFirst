import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Step1Phone } from './Step1Phone';
import { Step2BusinessType } from './Step2BusinessType';
import { Step3Subcategory } from './Step3Subcategory';
import { Step4Capabilities } from './Step4Capabilities';
import { Step5ShopDetails } from './Step5ShopDetails';
import { useMerchantAPI } from '../../../hooks/useMerchantAPI';

export const MerchantOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { registerMerchant, loading } = useMerchantAPI();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({
    owner_phone: '',
    major_category: '',
    sub_category: '',
    capabilities_enabled: [] as string[],
    shop_name: '',
    location: { lat: 0, lng: 0 },
    whatsapp: ''
  });

  const handleStep1Complete = (phone: string) => {
    setOnboardingData(prev => ({ ...prev, owner_phone: phone }));
    setCurrentStep(2);
  };

  const handleStep2Complete = (category: string) => {
    setOnboardingData(prev => ({ ...prev, major_category: category }));
    setCurrentStep(3);
  };

  const handleStep3Complete = (subcategory: string) => {
    setOnboardingData(prev => ({ ...prev, sub_category: subcategory }));
    setCurrentStep(4);
  };

  const handleStep4Complete = (capabilities: string[]) => {
    setOnboardingData(prev => ({ ...prev, capabilities_enabled: capabilities }));
    setCurrentStep(5);
  };

  const handleStep5Complete = async (data: {
    shop_name: string;
    location: { lat: number; lng: number };
    whatsapp?: string;
  }) => {
    const finalData = {
      ...onboardingData,
      ...data
    };

    try {
      const result = await registerMerchant(finalData);
      
      // Show success screen
      showSuccessScreen(result);
      
      // Navigate to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/merchant/dashboard', { 
          state: { shopId: result.shop_id, isNewMerchant: true }
        });
      }, 3000);
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Failed to register. Please try again.');
    }
  };

  const showSuccessScreen = (result: any) => {
    setCurrentStep(6); // Success screen
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your shop...</p>
        </div>
      </div>
    );
  }

  if (currentStep === 6) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Your shop is live on NearBy!
          </h1>
          <div className="space-y-2 text-left bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              ✓ Showing to customers within 2 km
            </p>
            <p className="text-sm text-green-800">
              ✓ You'll get notified when someone searches for your products
            </p>
          </div>
          <div className="animate-pulse text-blue-600">
            Redirecting to dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentStep === 1 && <Step1Phone onNext={handleStep1Complete} />}
      {currentStep === 2 && (
        <Step2BusinessType
          onNext={handleStep2Complete}
          onBack={() => setCurrentStep(1)}
        />
      )}
      {currentStep === 3 && (
        <Step3Subcategory
          majorCategory={onboardingData.major_category}
          onNext={handleStep3Complete}
          onBack={() => setCurrentStep(2)}
        />
      )}
      {currentStep === 4 && (
        <Step4Capabilities
          majorCategory={onboardingData.major_category}
          subcategory={onboardingData.sub_category}
          onNext={handleStep4Complete}
          onBack={() => setCurrentStep(3)}
        />
      )}
      {currentStep === 5 && (
        <Step5ShopDetails
          onComplete={handleStep5Complete}
          onBack={() => setCurrentStep(4)}
        />
      )}
    </>
  );
};
