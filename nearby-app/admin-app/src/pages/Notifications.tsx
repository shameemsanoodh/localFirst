import React, { useState } from 'react'
import { Bell, Send, Loader2 } from 'lucide-react'
import Layout from '../components/Layout'
import { apiService } from '../services/api.service'

const Notifications: React.FC = () => {
  const [sending, setSending] = useState(false)
  const [notification, setNotification] = useState({
    audience: 'all_users' as 'all_users' | 'all_merchants' | 'city',
    city: '',
    title: '',
    message: '',
  })

  const handleSend = async () => {
    if (!notification.title || !notification.message) {
      alert('Please fill in title and message')
      return
    }

    if (notification.audience === 'city' && !notification.city) {
      alert('Please specify a city')
      return
    }

    if (notification.message.length > 160) {
      alert('Message must be 160 characters or less')
      return
    }

    setSending(true)
    try {
      await apiService.sendNotification(notification)
      alert('Notification sent successfully!')
      setNotification({
        audience: 'all_users',
        city: '',
        title: '',
        message: '',
      })
    } catch (error) {
      console.error('Failed to send notification:', error)
      alert('Failed to send notification')
    } finally {
      setSending(false)
    }
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">Send broadcast notifications to users and merchants</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Bell size={24} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Send Notification</h2>
              <p className="text-sm text-gray-500">Broadcast message via push notification</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Audience</label>
              <select
                value={notification.audience}
                onChange={(e) => setNotification({ ...notification, audience: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-600"
              >
                <option value="all_users">All Users</option>
                <option value="all_merchants">All Merchants</option>
                <option value="city">Specific City</option>
              </select>
            </div>

            {notification.audience === 'city' && (
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">City</label>
                <input
                  type="text"
                  value={notification.city}
                  onChange={(e) => setNotification({ ...notification, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="e.g., Bengaluru"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Title</label>
              <input
                type="text"
                value={notification.title}
                onChange={(e) => setNotification({ ...notification, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Notification title"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center justify-between">
                <span>Message</span>
                <span className={`text-xs ${notification.message.length > 160 ? 'text-red-600' : 'text-gray-500'}`}>
                  {notification.message.length}/160
                </span>
              </label>
              <textarea
                value={notification.message}
                onChange={(e) => setNotification({ ...notification, message: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-600"
                rows={4}
                placeholder="Notification message (max 160 characters)"
                maxLength={160}
              />
            </div>

            <button
              onClick={handleSend}
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
              Send Notification
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Notifications
