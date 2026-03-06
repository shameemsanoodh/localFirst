import React from 'react'

interface MetricCardProps {
  icon: React.ReactNode
  iconColor: string
  iconBgColor: string
  value: number | string
  label: string
  subtitle?: string
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  iconColor,
  iconBgColor,
  value,
  label,
  subtitle
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div 
            className={`w-12 h-12 rounded-lg ${iconBgColor} flex items-center justify-center mb-4`}
          >
            <div className={iconColor}>
              {icon}
            </div>
          </div>
          
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {value}
          </div>
          
          <div className="text-sm text-gray-600">
            {label}
          </div>
          
          {subtitle && (
            <div className="text-xs text-gray-500 mt-1">
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MetricCard
