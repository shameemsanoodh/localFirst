import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Mic, TrendingUp, AlertCircle, CheckCircle, Activity,
  BarChart3, PieChart, Clock, Zap, RefreshCw
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { analyticsService } from '@/services/analytics.service'

interface VoiceSearchAnalyticsProps {
  className?: string
}

export const VoiceSearchAnalytics: React.FC<VoiceSearchAnalyticsProps> = ({ className = '' }) => {
  const [summary, setSummary] = useState(analyticsService.getLocalAnalyticsSummary())
  const [errorAnalytics, setErrorAnalytics] = useState(analyticsService.getErrorAnalyticsSummary())
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const refreshData = () => {
    setSummary(analyticsService.getLocalAnalyticsSummary())
    setErrorAnalytics(analyticsService.getErrorAnalyticsSummary())
    setLastRefresh(new Date())
  }

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshData, 30000)
    return () => clearInterval(interval)
  }, [])

  const successRate = summary.voiceSearchSuccessRate
  const errorRate = summary.errors.errorRate
  const totalSearches = summary.voiceSearches + summary.textSearches
  const voiceAdoptionRate = totalSearches > 0 ? (summary.voiceSearches / totalSearches) * 100 : 0

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 rounded-xl">
            <Mic size={20} className="text-purple-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Voice Search Analytics</h2>
            <p className="text-xs text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <button
          onClick={refreshData}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          title="Refresh data"
        >
          <RefreshCw size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500 rounded-xl">
                <Activity size={18} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">{summary.voiceSearches}</p>
                <p className="text-xs text-blue-700">Voice Searches</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-500 rounded-xl">
                <CheckCircle size={18} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-900">{successRate.toFixed(1)}%</p>
                <p className="text-xs text-green-700">Success Rate</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500 rounded-xl">
                <TrendingUp size={18} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-900">{voiceAdoptionRate.toFixed(1)}%</p>
                <p className="text-xs text-purple-700">Adoption Rate</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className={`bg-gradient-to-br ${errorRate > 10 ? 'from-red-50 to-red-100 border-red-200' : 'from-yellow-50 to-yellow-100 border-yellow-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 ${errorRate > 10 ? 'bg-red-500' : 'bg-yellow-500'} rounded-xl`}>
                <AlertCircle size={18} className="text-white" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${errorRate > 10 ? 'text-red-900' : 'text-yellow-900'}`}>
                  {errorRate.toFixed(1)}%
                </p>
                <p className={`text-xs ${errorRate > 10 ? 'text-red-700' : 'text-yellow-700'}`}>Error Rate</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Accuracy Metrics */}
      <Card className="bg-white mb-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Zap size={18} className="text-orange-500" />
          Voice Recognition Accuracy
        </h3>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-gray-700">Average Confidence</span>
              <span className="text-sm font-semibold text-gray-900">
                {(summary.voiceSearchAccuracy.averageConfidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-500"
                style={{ width: `${summary.voiceSearchAccuracy.averageConfidence * 100}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <p className="text-xl font-bold text-green-600">
                {summary.voiceSearchAccuracy.highConfidenceCount}
              </p>
              <p className="text-xs text-gray-600 mt-1">High (≥80%)</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-xl">
              <p className="text-xl font-bold text-yellow-600">
                {summary.voiceSearchAccuracy.mediumConfidenceCount}
              </p>
              <p className="text-xs text-gray-600 mt-1">Medium (50-80%)</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-xl">
              <p className="text-xl font-bold text-red-600">
                {summary.voiceSearchAccuracy.lowConfidenceCount}
              </p>
              <p className="text-xs text-gray-600 mt-1">Low (&lt;50%)</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Error Analytics */}
      <Card className="bg-white mb-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle size={18} className="text-red-500" />
          Error Analysis
        </h3>

        {summary.errors.totalErrors === 0 ? (
          <div className="text-center py-8">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No errors recorded yet</p>
          </div>
        ) : (
          <>
            {/* Error Categories */}
            <div className="space-y-3 mb-4">
              {[
                { label: 'Permission Denied', count: errorAnalytics.errorsByCategory.permission, color: 'bg-red-500', icon: '🔒' },
                { label: 'Technical Issues', count: errorAnalytics.errorsByCategory.technical, color: 'bg-orange-500', icon: '⚙️' },
                { label: 'Network Errors', count: errorAnalytics.errorsByCategory.network, color: 'bg-blue-500', icon: '🌐' },
                { label: 'User Actions', count: errorAnalytics.errorsByCategory.userAction, color: 'bg-yellow-500', icon: '👤' },
                { label: 'Unknown', count: errorAnalytics.errorsByCategory.unknown, color: 'bg-gray-500', icon: '❓' },
              ].filter(item => item.count > 0).map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-700 flex items-center gap-2">
                      <span>{item.icon}</span>
                      {item.label}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${(item.count / summary.errors.totalErrors) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Most Common Error */}
            {errorAnalytics.mostCommonError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-red-700 mb-1">Most Common Error</p>
                <p className="text-sm text-red-900 font-medium">{errorAnalytics.mostCommonError}</p>
                <p className="text-xs text-red-600 mt-1">
                  {errorAnalytics.errorsByType[errorAnalytics.mostCommonError]} occurrences
                </p>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Recent Errors */}
      {errorAnalytics.recentErrors.length > 0 && (
        <Card className="bg-white">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-gray-500" />
            Recent Errors
          </h3>
          <div className="space-y-2">
            {errorAnalytics.recentErrors.slice(0, 5).map((error, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{error.errorMessage}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {new Date(error.timestamp).toLocaleString()}
                    </span>
                    {error.language && (
                      <span className="text-xs text-gray-400">• {error.language}</span>
                    )}
                  </div>
                </div>
                <span className="text-xs font-mono text-gray-500 bg-white px-2 py-1 rounded">
                  {error.errorCode}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Usage Comparison */}
      <Card className="bg-white mt-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-nearby-500" />
          Search Method Comparison
        </h3>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-gray-700 flex items-center gap-2">
                <Mic size={14} className="text-purple-500" />
                Voice Search
              </span>
              <span className="text-sm font-semibold text-gray-900">{summary.voiceSearches}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${voiceAdoptionRate}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-gray-700 flex items-center gap-2">
                <BarChart3 size={14} className="text-blue-500" />
                Text Search
              </span>
              <span className="text-sm font-semibold text-gray-900">{summary.textSearches}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${100 - voiceAdoptionRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
          <p className="text-xs text-gray-600">
            <span className="font-semibold text-gray-900">{voiceAdoptionRate.toFixed(1)}%</span> of users
            are using voice search
            {voiceAdoptionRate >= 30 ? (
              <span className="text-green-600 font-medium"> ✓ Target achieved!</span>
            ) : (
              <span className="text-orange-600"> (Target: 30%)</span>
            )}
          </p>
        </div>
      </Card>
    </div>
  )
}
