import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Loader2, MapPin } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { getAllMajorCategories, getCategoryTemplate } from '../config/categoryTemplates'
import { extractMapCoordinates, isValidCoordinates, formatCoordinates } from '../utils/extractMapCoordinates'

interface OnboardingState {
  phone: string
  shopName: string
  ownerName: string
  email: string
  description: string
  address: string
  majorCategory: string
  subCategory: string
  capabilities: string[]
  location: { lat: number; lng: number; mapLink?: string }
  timing: { openHour: number; closeHour: number }
  whatsapp: string
  passcode: string
  passcodeConfirm: string
  merchantId?: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://4cwdqd7sz4.execute-api.ap-south-1.amazonaws.com/prod'

const STEP_LABELS = ['Shop Details', 'Category', 'Subcategory', 'Capabilities', 'Location & Timings', 'Passcode', 'Processing', 'Success']

const MerchantOnboarding: React.FC = () => {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [extractingLocation, setExtractingLocation] = useState(false)

  const [state, setState] = useState<OnboardingState>({
    phone: localStorage.getItem('signup-phone') || '',
    shopName: '',
    ownerName: '',
    email: '',
    description: '',
    address: '',
    majorCategory: '',
    subCategory: '',
    capabilities: [],
    location: { lat: 0, lng: 0 },
    timing: { openHour: 9, closeHour: 21 },
    whatsapp: '',
    passcode: '',
    passcodeConfirm: ''
  })

  // Show loading if no phone (will redirect)
  if (!state.phone) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF8F5' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: '#22C55E' }} />
      </div>
    )
  }

  const totalSteps = 8

  useEffect(() => {
    if (!state.phone) {
      console.log('No phone found, redirecting to signup')
      navigate('/signup')
    } else {
      console.log('Phone found:', state.phone, 'Current step:', currentStep)
    }
  }, [state.phone, navigate])

  const updateState = (updates: Partial<OnboardingState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  const handleMapLinkChange = async (link: string) => {
    updateState({ location: { ...state.location, mapLink: link } })

    if (!link.trim()) {
      updateState({ location: { lat: 0, lng: 0, mapLink: '' } })
      setError('')
      return
    }

    setExtractingLocation(true)
    setError('')

    try {
      const coords = await extractMapCoordinates(link)

      // Check if it's a shortened URL that needs manual resolution
      if (coords && (coords as any).error === 'shortened-url') {
        setError('🔗 Shortened link detected! Please:\n1. Open the link in your browser\n2. Copy the full URL from the address bar\n3. Paste it here')
        updateState({ location: { lat: 0, lng: 0, mapLink: link } })
      } else if (coords && isValidCoordinates(coords)) {
        updateState({
          location: {
            lat: coords.lat,
            lng: coords.lng,
            mapLink: link
          }
        })
        console.log('Extracted coordinates:', formatCoordinates(coords))
      } else {
        setError('Could not extract coordinates. Try: 1) Opening the link and copying the full URL, or 2) Using "Share" → "Copy link" from Google Maps')
        updateState({ location: { lat: 0, lng: 0, mapLink: link } })
      }
    } catch (err) {
      console.error('Error extracting coordinates:', err)
      setError('Failed to extract location. Please check the link and try again.')
      updateState({ location: { lat: 0, lng: 0, mapLink: link } })
    } finally {
      setExtractingLocation(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1: return state.shopName.length >= 2 && state.ownerName.length >= 2 && state.email.includes('@') && state.description.length >= 10 && state.address.length >= 5
      case 2: return state.majorCategory !== ''
      case 3: return state.subCategory !== ''
      case 4: return state.capabilities.length > 0
      case 5: return state.location.lat !== 0 && state.location.lng !== 0
      case 6: return state.passcode.length === 6 && state.passcode === state.passcodeConfirm
      default: return true
    }
  }

  const handleNext = () => {
    if (canProceed()) {
      if (currentStep === 6) {
        handleSubmit()
      } else {
        setCurrentStep(prev => prev + 1)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    setCurrentStep(7) // Processing step

    try {
      const formatTime = (hour: number) => {
        const h = Math.floor(hour)
        const m = (hour % 1) * 60
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      }

      const response = await fetch(`${API_BASE_URL}/merchants/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: state.phone,
          email: state.email,
          passcode: state.passcode,
          shopName: state.shopName,
          ownerName: state.ownerName,
          description: state.description,
          address: state.address,
          majorCategory: state.majorCategory,
          subCategory: state.subCategory,
          capabilities: state.capabilities,
          capabilitiesEnabled: state.capabilities,
          location: state.location,
          timing: state.timing,
          openTime: formatTime(state.timing.openHour),
          closeTime: formatTime(state.timing.closeHour),
          whatsapp: state.whatsapp || state.phone,
          onboardingCompleted: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Signup failed:', errorData)
        throw new Error(errorData.error || errorData.details || 'Signup failed')
      }

      const data = await response.json()
      updateState({ merchantId: data.merchantId })

      localStorage.setItem('auth-token', data.token)
      localStorage.setItem('merchant-data', JSON.stringify(data.merchant))
      localStorage.removeItem('signup-phone')

      setAuth(data.merchant, ['merchant'], data.token)
      setCurrentStep(8) // Success step

      // Auto-redirect after 3 seconds
      setTimeout(() => navigate('/'), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
      setCurrentStep(6) // Back to passcode step
    } finally {
      setLoading(false)
    }
  }

  const majorCategories = getAllMajorCategories()
  const categoryTemplate = state.majorCategory ? getCategoryTemplate(state.majorCategory) : null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAF8F5' }}>
      {/* Progress bar */}
      <div className="w-full h-1" style={{ background: '#E5E3DF' }}>
        <motion.div
          className="h-full"
          style={{ background: '#1A1A1A' }}
          animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <button
          onClick={currentStep > 1 && currentStep < 7 ? handleBack : () => navigate('/login')}
          className="text-sm font-semibold"
          style={{ color: '#9A9895' }}
        >
          {currentStep > 1 && currentStep < 7 ? '← Back' : '← Sign in'}
        </button>
        <p className="text-xs font-semibold" style={{ color: '#6B6B6B' }}>
          {STEP_LABELS[currentStep - 1]}
        </p>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col px-6 max-w-sm mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >

            {/* Step 1: Shop Details */}
            {currentStep === 1 && (
              <div className="py-6">
                <h1 className="text-4xl font-bold mb-2" style={{ color: '#1A1A1A' }}>
                  Shop Details
                </h1>
                <p className="mb-8" style={{ color: '#6B6B6B' }}>
                  Tell us about your business
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#6B6B6B' }}>
                      SHOP NAME *
                    </label>
                    <input
                      type="text"
                      placeholder="Ram Mobile Centre"
                      value={state.shopName}
                      onChange={e => updateState({ shopName: e.target.value })}
                      className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none"
                      style={{ background: '#EFEFEB', color: '#1A1A1A' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#6B6B6B' }}>
                      OWNER NAME *
                    </label>
                    <input
                      type="text"
                      placeholder="Ram Kumar"
                      value={state.ownerName}
                      onChange={e => updateState({ ownerName: e.target.value })}
                      className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none"
                      style={{ background: '#EFEFEB', color: '#1A1A1A' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#6B6B6B' }}>
                      EMAIL *
                    </label>
                    <input
                      type="email"
                      placeholder="ram@example.com"
                      value={state.email}
                      onChange={e => updateState({ email: e.target.value })}
                      className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none"
                      style={{ background: '#EFEFEB', color: '#1A1A1A' }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#6B6B6B' }}>
                      SHOP DESCRIPTION *
                    </label>
                    <textarea
                      placeholder="Describe what you sell..."
                      value={state.description}
                      onChange={e => updateState({ description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none resize-none"
                      style={{ background: '#EFEFEB', color: '#1A1A1A' }}
                    />
                    <p className="text-xs mt-1" style={{ color: '#9A9895' }}>
                      {state.description.length}/200 (min 10)
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#6B6B6B' }}>
                      SHOP ADDRESS *
                    </label>
                    <textarea
                      placeholder="123 Main St, Bangalore"
                      value={state.address}
                      onChange={e => updateState({ address: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none resize-none"
                      style={{ background: '#EFEFEB', color: '#1A1A1A' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Major Category */}
            {currentStep === 2 && (
              <div className="py-6">
                <h1 className="text-4xl font-bold mb-2" style={{ color: '#1A1A1A' }}>
                  Business<br />Category
                </h1>
                <p className="mb-8" style={{ color: '#6B6B6B' }}>
                  What type of business do you run?
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {majorCategories.map(cat => {
                    const selected = state.majorCategory === cat.name
                    return (
                      <motion.button
                        key={cat.name}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          updateState({ majorCategory: cat.name, subCategory: '', capabilities: [] })
                        }}
                        className="p-4 rounded-2xl text-left transition-all"
                        style={{
                          background: selected ? '#22C55E' : '#FFFFFF',
                          color: selected ? '#FFFFFF' : '#1A1A1A',
                          border: '1px solid',
                          borderColor: selected ? '#22C55E' : '#E5E3DF'
                        }}
                      >
                        <div className="text-2xl mb-2">{cat.icon}</div>
                        <div className="text-sm font-semibold">{cat.name}</div>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Subcategory */}
            {currentStep === 3 && categoryTemplate && (
              <div className="py-6">
                <h1 className="text-4xl font-bold mb-2" style={{ color: '#1A1A1A' }}>
                  What specifically<br />do you sell?
                </h1>
                <p className="mb-8" style={{ color: '#6B6B6B' }}>
                  Choose your subcategory
                </p>

                <div className="space-y-2">
                  {categoryTemplate.subcategories.map(sub => {
                    const selected = state.subCategory === sub
                    return (
                      <motion.button
                        key={sub}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => updateState({ subCategory: sub })}
                        className="w-full p-4 rounded-2xl text-left flex items-center gap-3 transition-all"
                        style={{
                          background: selected ? '#1A1A1A' : '#FFFFFF',
                          color: selected ? '#FFFFFF' : '#1A1A1A',
                          border: '1px solid',
                          borderColor: selected ? '#1A1A1A' : '#E5E3DF'
                        }}
                      >
                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                          style={{ borderColor: selected ? '#22C55E' : '#9A9895' }}>
                          {selected && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#22C55E' }} />}
                        </div>
                        <span className="font-semibold text-sm">{sub}</span>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Capabilities */}
            {currentStep === 4 && categoryTemplate && (
              <div className="py-6">
                <h1 className="text-4xl font-bold mb-2" style={{ color: '#1A1A1A' }}>
                  What do you<br />have in stock?
                </h1>
                <p className="mb-8" style={{ color: '#6B6B6B' }}>
                  Select all that apply
                </p>

                <div className="flex flex-wrap gap-2">
                  {categoryTemplate.recommended_capabilities.map(capId => {
                    const selected = state.capabilities.includes(capId)
                    const label = capId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                    return (
                      <motion.button
                        key={capId}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          updateState({
                            capabilities: selected
                              ? state.capabilities.filter(c => c !== capId)
                              : [...state.capabilities, capId]
                          })
                        }}
                        className="px-4 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2"
                        style={{
                          background: selected ? '#22C55E' : '#FFFFFF',
                          color: selected ? '#FFFFFF' : '#1A1A1A',
                          border: '1px solid',
                          borderColor: selected ? '#22C55E' : '#E5E3DF'
                        }}
                      >
                        {selected && <Check size={14} />}
                        {label}
                      </motion.button>
                    )
                  })}
                </div>

                {state.capabilities.length > 0 && (
                  <p className="text-xs text-center mt-6" style={{ color: '#6B6B6B' }}>
                    {state.capabilities.length} selected ✓
                  </p>
                )}
              </div>
            )}

            {/* Step 5: Location & Timings */}
            {currentStep === 5 && (
              <div className="py-6">
                <h1 className="text-4xl font-bold mb-2" style={{ color: '#1A1A1A' }}>
                  Location &<br />Hours
                </h1>
                <p className="mb-8" style={{ color: '#6B6B6B' }}>
                  Help customers find you
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#6B6B6B' }}>
                      GOOGLE MAPS LINK *
                    </label>
                    <textarea
                      placeholder="Paste your Google Maps link here..."
                      value={state.location.mapLink || ''}
                      onChange={e => handleMapLinkChange(e.target.value)}
                      rows={3}
                      disabled={extractingLocation}
                      className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none resize-none"
                      style={{
                        background: state.location.lat !== 0 ? '#F0FBF4' : '#EFEFEB',
                        color: '#1A1A1A',
                        border: '1px solid',
                        borderColor: state.location.lat !== 0 ? '#22C55E' : '#E5E3DF',
                        opacity: extractingLocation ? 0.6 : 1
                      }}
                    />
                    {extractingLocation && (
                      <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: '#6B6B6B' }}>
                        <Loader2 size={12} className="animate-spin" /> Extracting location...
                      </div>
                    )}
                    {state.location.lat !== 0 && !extractingLocation && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-xs" style={{ color: '#22C55E' }}>
                          <MapPin size={12} /> Location found ✓
                        </div>
                        <div className="text-xs" style={{ color: '#6B6B6B' }}>
                          {formatCoordinates(state.location)}
                        </div>
                      </div>
                    )}
                    {state.location.lat === 0 && !extractingLocation && state.location.mapLink && (
                      <div className="mt-3 p-3 rounded-xl text-xs" style={{ background: '#FFF9E6', border: '1px solid #FFD700' }}>
                        <div className="font-semibold mb-2" style={{ color: '#B8860B' }}>
                          💡 How to get your location link:
                        </div>
                        <ol className="space-y-1 ml-4" style={{ color: '#6B6B6B', listStyleType: 'decimal' }}>
                          <li>Open Google Maps on your phone or computer</li>
                          <li>Search for your shop or long-press on the map</li>
                          <li>Tap "Share" → "Copy link"</li>
                          <li>Paste the full link here</li>
                        </ol>
                        <div className="mt-2 text-xs" style={{ color: '#B8860B' }}>
                          ✓ Works with: maps.google.com, goo.gl, maps.app.goo.gl
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold mb-3 block" style={{ color: '#6B6B6B' }}>
                      SHOP TIMINGS
                    </label>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm" style={{ color: '#6B6B6B' }}>Opening time</span>
                          <span className="text-sm font-bold" style={{ color: '#1A1A1A' }}>
                            {Math.floor(state.timing.openHour)}:00 {state.timing.openHour < 12 ? 'AM' : 'PM'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="23"
                          value={state.timing.openHour}
                          onChange={e => updateState({ timing: { ...state.timing, openHour: parseInt(e.target.value) } })}
                          className="w-full"
                          style={{ accentColor: '#22C55E' }}
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm" style={{ color: '#6B6B6B' }}>Closing time</span>
                          <span className="text-sm font-bold" style={{ color: '#1A1A1A' }}>
                            {Math.floor(state.timing.closeHour)}:00 {state.timing.closeHour < 12 ? 'AM' : 'PM'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="23"
                          value={state.timing.closeHour}
                          onChange={e => updateState({ timing: { ...state.timing, closeHour: parseInt(e.target.value) } })}
                          className="w-full"
                          style={{ accentColor: '#22C55E' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#6B6B6B' }}>
                      WHATSAPP (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={state.whatsapp}
                      onChange={e => updateState({ whatsapp: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none"
                      style={{ background: '#EFEFEB', color: '#1A1A1A' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Passcode */}
            {currentStep === 6 && (
              <div className="py-6">
                <h1 className="text-4xl font-bold mb-2" style={{ color: '#1A1A1A' }}>
                  Set Your<br />Passcode
                </h1>
                <p className="mb-8" style={{ color: '#6B6B6B' }}>
                  Create a 6-digit passcode to secure your account
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#6B6B6B' }}>
                      6-DIGIT PASSCODE *
                    </label>
                    <input
                      type="password"
                      placeholder="••••••"
                      value={state.passcode}
                      onChange={e => updateState({ passcode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none"
                      style={{
                        background: '#EFEFEB',
                        color: '#1A1A1A',
                        letterSpacing: '0.3em'
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#6B6B6B' }}>
                      CONFIRM PASSCODE *
                    </label>
                    <input
                      type="password"
                      placeholder="••••••"
                      value={state.passcodeConfirm}
                      onChange={e => updateState({ passcodeConfirm: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none"
                      style={{
                        background: '#EFEFEB',
                        color: '#1A1A1A',
                        letterSpacing: '0.3em',
                        border: '1px solid',
                        borderColor: state.passcode && state.passcodeConfirm && state.passcode !== state.passcodeConfirm ? '#FF5454' : '#E5E3DF'
                      }}
                    />
                    {state.passcode && state.passcodeConfirm && state.passcode !== state.passcodeConfirm && (
                      <p className="text-xs mt-1" style={{ color: '#CC2222' }}>
                        Passcodes don't match
                      </p>
                    )}
                    {state.passcode && state.passcodeConfirm && state.passcode === state.passcodeConfirm && (
                      <p className="text-xs mt-1" style={{ color: '#22C55E' }}>
                        ✓ Passcodes match
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-2xl" style={{ background: '#FFF9E6' }}>
                  <p className="text-xs" style={{ color: '#6B6B6B' }}>
                    💡 You'll use this passcode with your Merchant ID to login
                  </p>
                </div>
              </div>
            )}

            {/* Step 7: Processing */}
            {currentStep === 7 && (
              <div className="flex-1 flex flex-col items-center justify-center py-20">
                <Loader2 size={48} className="animate-spin mb-4" style={{ color: '#22C55E' }} />
                <h2 className="text-2xl font-bold mb-2" style={{ color: '#1A1A1A' }}>
                  Creating your shop...
                </h2>
                <p style={{ color: '#6B6B6B' }}>This will only take a moment</p>
              </div>
            )}

            {/* Step 8: Success */}
            {currentStep === 8 && (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-20 h-20 rounded-full mb-6 flex items-center justify-center"
                  style={{ background: '#22C55E' }}
                >
                  <Check size={40} style={{ color: '#FFFFFF' }} />
                </motion.div>

                <h2 className="text-3xl font-bold mb-2" style={{ color: '#1A1A1A' }}>
                  Your shop is live!
                </h2>
                <p className="mb-8" style={{ color: '#6B6B6B' }}>
                  Welcome to NearBy
                </p>

                <div className="w-full p-6 rounded-2xl mb-6" style={{ background: '#FFFFFF', border: '1px solid #E5E3DF' }}>
                  <p className="text-xs font-semibold mb-3" style={{ color: '#6B6B6B' }}>
                    YOUR MERCHANT ID
                  </p>
                  <p className="text-4xl font-bold mb-6" style={{ color: '#22C55E' }}>
                    {state.merchantId}
                  </p>
                  <p className="text-xs mb-4" style={{ color: '#6B6B6B' }}>
                    Save this ID - you'll need it to login
                  </p>
                  <div className="text-left space-y-2 pt-4" style={{ borderTop: '1px solid #E5E3DF' }}>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#6B6B6B' }}>Merchant ID:</span>
                      <span className="font-semibold" style={{ color: '#1A1A1A' }}>{state.merchantId}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#6B6B6B' }}>Email:</span>
                      <span className="font-semibold" style={{ color: '#1A1A1A' }}>{state.email}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#6B6B6B' }}>Passcode:</span>
                      <span className="font-semibold" style={{ color: '#1A1A1A' }}>••••••</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs" style={{ color: '#9A9895' }}>
                  Redirecting to dashboard in 3 seconds...
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Error message */}
      {error && currentStep < 7 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 mb-4 p-3 rounded-xl text-sm"
          style={{ background: '#FFF4F4', color: '#CC2222' }}
        >
          {error}
        </motion.div>
      )}

      {/* Navigation buttons */}
      {currentStep > 0 && currentStep < 7 && (
        <div className="px-6 pb-10 pt-4 max-w-sm mx-auto w-full">
          <motion.button
            onClick={handleNext}
            disabled={!canProceed() || loading}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
            style={{
              background: canProceed() && !loading ? '#22C55E' : '#CFCDC9',
              color: canProceed() && !loading ? '#FFFFFF' : '#9A9895'
            }}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                {currentStep === 6 ? 'Launch My Shop' : 'Next'}
                {currentStep < 6 && <ArrowRight size={18} />}
              </>
            )}
          </motion.button>

          {currentStep === 1 && (
            <p className="text-center text-xs mt-4" style={{ color: '#9A9895' }}>
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="font-bold underline" style={{ color: '#1A1A1A' }}>
                Sign in
              </button>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default MerchantOnboarding
