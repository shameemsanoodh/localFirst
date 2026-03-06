import React, { useState } from 'react';
import { getCategoryTemplate } from '../../../config/categoryTemplates';

interface Step3SubcategoryProps {
  majorCategory: string;
  onNext: (subcategory: string) => void;
  onBack: () => void;
}

export const Step3Subcategory: React.FC<Step3SubcategoryProps> = ({
  majorCategory,
  onNext,
  onBack
}) => {
  const template = getCategoryTemplate(majorCategory);
  const [selected, setSelected] = useState(template?.default_subcategory || '');

  const handleContinue = () => {
    if (selected) {
      onNext(selected);
    }
  };

  if (!template) {
    return <div>Error: Category template not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{template.icon}</span>
            <h2 className="text-2xl font-bold text-gray-900">
              {majorCategory}
            </h2>
          </div>
          <div className="h-1 w-20 bg-blue-600 rounded"></div>
          <p className="text-gray-600 mt-4">What specifically do you sell?</p>
        </div>

        <div className="space-y-3 mb-8">
          {template.subcategories.map((subcat) => (
            <label
              key={subcat}
              className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selected === subcat
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <input
                type="radio"
                name="subcategory"
                value={subcat}
                checked={selected === subcat}
                onChange={(e) => setSelected(e.target.value)}
                className="w-5 h-5 text-blue-600"
              />
              <span className="ml-3 text-gray-900 font-medium">{subcat}</span>
            </label>
          ))}
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
            disabled={!selected}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Continue →
          </button>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
          </div>
        </div>
        <p className="text-center text-xs text-gray-500 mt-2">Step 3 of 5</p>
      </div>
    </div>
  );
};
