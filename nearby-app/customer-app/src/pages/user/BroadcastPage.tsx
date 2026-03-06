import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Navigation, Phone } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface MerchantResponse {
  id: string
  name: string
  distance: string
  price: number
  response: 'accept' | 'reject' | 'schedule'
  scheduledTime?: string
  notes?: string
}

const BroadcastPage: React.FC = () => {
  const navigate = useNavigate()
  const [isSearching, setIsSearching] = useState(true)
  const [timeLeft, setTimeLeft] = useState(30)
  const [responses, setResponses] = useState<MerchantResponse[]>([])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsSearching(false)
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Simulate merchant responses
    setTimeout(() => {
      setResponses([
        {
          id: '1',
          name: 'Fresh Mart',
          distance: '1.2 km',
          price: 38,
          response: 'accept',
          notes: 'Available now',
        },
        {
          id: '2',
          name: 'Green Grocers',
          distance: '2.5 km',
          price: 40,
          response: 'accept',
          notes: 'Fresh stock just arrived',
        },
      ])
    }, 3000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">
            {isSearching ? 'Finding Nearby Merchants...' : 'Merchant Responses'}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div
              key="searching"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              {/* Radar Animation */}
              <div className="relative w-64 h-64 mx-auto mb-8">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 bg-blue-600 rounded-full z-10"></div>
                </div>
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 border-4 border-blue-600 rounded-full"
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.6,
                      ease: 'easeOut',
                    }}
                  />
                ))}
              </div>

              <p className="text-gray-600 mb-2">Searching within 5 km...</p>
              <p className="text-2xl font-bold text-blue-600">{timeLeft}s remaining</p>

              <Button
                variant="secondary"
                className="mt-8"
                onClick={() => navigate(-1)}
              >
                Cancel Search
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <p className="text-center text-gray-600 mb-6">
                {responses.length} merchants responded
              </p>

              {responses.map((merchant, index) => (
                <motion.div
                  key={merchant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{merchant.name}</h3>
                        <p className="text-sm text-gray-600">{merchant.distance}</p>
                      </div>
                      <span className="text-xl font-bold text-green-600">
                        ₹{merchant.price}/kg
                      </span>
                    </div>

                    {merchant.notes && (
                      <p className="text-sm text-gray-600 mb-4">"{merchant.notes}"</p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(merchant.name)}`, '_blank')}
                      >
                        <Navigation size={16} className="mr-2" />
                        Navigate
                      </Button>
                      <Button
                        variant="primary"
                        className="flex-1"
                        onClick={() => {
                          const phoneNum = (merchant as any).phone
                          if (phoneNum) window.open(`tel:${phoneNum}`)
                          else alert('Phone number not available')
                        }}
                      >
                        <Phone size={16} className="mr-2" />
                        Call
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default BroadcastPage
