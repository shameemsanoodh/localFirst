import React, { useState, useEffect } from 'react'
import { Loader2, MapPin, Save } from 'lucide-react'
import Layout from '../components/Layout'
import { apiService, Config } from '../services/api.service'

const Locations: React.FC = () => {
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [radius, setRadius] = useState(3)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const data = await apiService.getConfig()
      setConfig(data)
      setRadius(data.searchRadiusKm)
    } catch (error) {
      console.error('Failed to load config:', error)
      setConfig({ searchRadiusKm: 3, globalOffersEnabled: true })
      setRadius(3)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiService.updateConfig({ searchRadiusKm: radius })
      setConfig(prev => prev ? { ...prev, searchRadiusKm: radius, lastUpdated: new Date().toISOString() } : null)
      alert('Search radius updated successfully!')
    } catch (error) {
      console.error('Failed to update config:', error)
      alert('Failed to update search radius')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 size={48} className="animate-spin text-green-600" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Location Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure search radius and location clusters</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <MapPin size={24} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Search Radius</h2>
              <p className="text-sm text-gray-500">Global radius for merchant matching</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-700 mb-3 block">
              Radius: {radius} km
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>1 km</span>
              <span>10 km</span>
              <span>20 km</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900">
              <strong>Current radius:</strong> {config?.searchRadiusKm} km
            </p>
            {config?.lastUpdated && (
              <p className="text-xs text-blue-700 mt-1">
                Last updated: {new Date(config.lastUpdated).toLocaleString()}
              </p>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving || radius === config?.searchRadiusKm}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </Layout>
  )
}

export default Locations
