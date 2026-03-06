import React, { useState, useEffect } from 'react';
import { getCategoryTemplate } from '../../../config/categoryTemplates';
import { useMerchantAPI } from '../../../hooks/useMerchantAPI';

interface Step4CapabilitiesProps {
  majorCategory: string;
  subcategory: string;
  onNext: (capabilities: string[]) => void;
  onBack: () => void;
}

interface Capability {
  id: string;
  label: string;
  description: string;
  group?: string;
}

export const Step4Capabilities: React.FC<Step4CapabilitiesProps> = ({
  majorCategory,
  subcategory,
  onNext,
  onBack
}) => {
  const template = getCategoryTemplate(majorCategory);
  const { getCapabilities } = useMerchantAPI();
  
  const [selected, setSelected] = useState<Set<string>>(
    new Set(template?.recommended_capabilities || [])
  );
  const [allCapabilities, setAllCapabilities] = useState<Capability[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // Load capabilities from backend
    getCapabilities().then((data) => {
      // Filter capabilities for this subcategory
      const categoryData = data.find(
        (cat: any) => cat.major_category === majorCategory && cat.sub_category === subcategory
      );
      if (categoryData) {
        setAllCapabilities(categoryData.capabilities || []);
      }
    });
  }, [majorCategory, subcategory]);

  const toggleCapability = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const handleContinue = () => {
    onNext(Array.from(selected));
  };

  // Group capabilities by group
  const groupedCapabilities = allCapabilities.reduce((acc, cap) => {
    const group = cap.group || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(cap);
    return acc;
  }, {} as Record<string, Capability[]>);

  const displayGroups = showAll 
    ? Object.keys(groupedCapabilities)
    : Object.keys(groupedCapabilities).slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            What do you have in your shop?
          </h2>
          <p className="text-gray-600 text-sm">(Select all that apply)</p>
          <div className="h-1 w-20 bg-blue-600 rounded mt-4"></div>
        </div>

        <div className="space-y-6 mb-8">
          {displayGroups.map((group) => (
            <div key={group}>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">{group}</h3>
              <div className="flex flex-wrap gap-3">
                {groupedCapabilities[group].map((cap) => (
                  <button
                    key={cap.id}
                    onClick={() => toggleCapability(cap.id)}
                    className={`px-4 py-2 rounded-full border-2 transition-all ${
                      selected.has(cap.id)
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300 text-gray-700 hover:border-blue-400'
                    }`}
                  >
                    {selected.has(cap.id) && '✓ '}
                    {cap.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {!showAll && Object.keys(groupedCapabilities).length > 3 && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors mb-6"
          >
            + Show More Products
          </button>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Select all products you sell. This helps us match you with the right customer queries.
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
            onClick={handleContinue}
            disabled={selected.size === 0}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Continue → ({selected.size} selected)
          </button>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
          </div>
        </div>
        <p className="text-center text-xs text-gray-500 mt-2">Step 4 of 5</p>
      </div>
    </div>
  );
};
