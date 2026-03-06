import React, { useState } from 'react';
import { getAllMajorCategories } from '../../../config/categoryTemplates';

interface Step2BusinessTypeProps {
  onNext: (category: string) => void;
  onBack: () => void;
}

export const Step2BusinessType: React.FC<Step2BusinessTypeProps> = ({ onNext, onBack }) => {
  const [selected, setSelected] = useState<string>('');
  const [showAll, setShowAll] = useState(false);
  
  const categories = getAllMajorCategories();
  const displayCategories = showAll ? categories : categories.slice(0, 10);

  const handleSelect = (category: string) => {
    setSelected(category);
    // Auto-advance after selection
    setTimeout(() => onNext(category), 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            What kind of shop do you run?
          </h2>
          <div className="h-1 w-20 bg-blue-600 rounded"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {displayCategories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => handleSelect(cat.name)}
              className={`p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                selected === cat.name
                  ? 'border-blue-600 bg-blue-50 shadow-lg scale-105'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="text-4xl mb-2">{cat.icon}</div>
              <div className="text-sm font-medium text-gray-900 text-center">
                {cat.name.split(',')[0]}
              </div>
            </button>
          ))}
        </div>

        {!showAll && categories.length > 10 && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            ➕ More Categories...
          </button>
        )}

        <div className="flex gap-4 mt-8">
          <button
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ← Back
          </button>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
          </div>
        </div>
        <p className="text-center text-xs text-gray-500 mt-2">Step 2 of 5</p>
      </div>
    </div>
  );
};
