import React, { useState, useEffect } from 'react'
import { Loader2, MessageSquare, X, CheckCircle, Trash2 } from 'lucide-react'
import Layout from '../components/Layout'
import { apiService, Query } from '../services/api.service'

const Queries: React.FC = () => {
  const [queries, setQueries] = useState<Query[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadQueries()
  }, [])

  const loadQueries = async () => {
    try {
      const data = await apiService.getQueries()
      setQueries(data)
    } catch (error) {
      console.error('Failed to load queries:', error)
      setQueries([
        {
          queryId: 'Q001',
          senderType: 'user',
          senderPhone: '9876543210',
          message: 'Can you add support for booking services in advance?',
          status: 'pending',
          createdAt: '2026-03-05T10:30:00Z',
        },
        {
          queryId: 'Q002',
          senderType: 'merchant',
          senderPhone: '9876543211',
          message: 'Need a feature to manage inventory directly from the app',
          status: 'pending',
          createdAt: '2026-03-04T14:20:00Z',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleMarkReviewed = async (queryId: string) => {
    try {
      await apiService.markQueryReviewed(queryId)
      setQueries(prev => prev.map(q => q.queryId === queryId ? { ...q, status: 'reviewed' as const } : q))
    } catch (error) {
      console.error('Failed to mark query as reviewed:', error)
    }
  }

  const handleDelete = async (queryId: string) => {
    if (!confirm('Are you sure you want to delete this query?')) return
    try {
      await apiService.deleteQuery(queryId)
      setQueries(prev => prev.filter(q => q.queryId !== queryId))
      setShowModal(false)
    } catch (error) {
      console.error('Failed to delete query:', error)
    }
  }

  const viewFullMessage = (query: Query) => {
    setSelectedQuery(query)
    setShowModal(true)
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
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Feature Queries</h1>
          <p className="text-sm text-gray-500 mt-1">User and merchant feature requests</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sender</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Message</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {queries.map((query) => (
                <tr key={query.queryId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        query.senderType === 'user'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {query.senderType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{query.senderPhone}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => viewFullMessage(query)}
                      className="text-sm text-gray-600 hover:text-green-600 text-left max-w-md truncate block"
                    >
                      {query.message.substring(0, 100)}
                      {query.message.length > 100 && '...'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(query.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        query.status === 'reviewed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {query.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {query.status === 'pending' && (
                        <button
                          onClick={() => handleMarkReviewed(query.queryId)}
                          className="px-3 py-1 text-xs font-semibold text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <CheckCircle size={14} />
                          Mark Reviewed
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(query.queryId)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} className="text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {queries.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No queries found</p>
          </div>
        )}

        {/* Full Message Modal */}
        {showModal && selectedQuery && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Query Details</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    From {selectedQuery.senderType} - {selectedQuery.senderPhone}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-600 uppercase mb-2 block">
                    Message
                  </label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedQuery.message}</p>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Submitted: {new Date(selectedQuery.createdAt).toLocaleString()}</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedQuery.status === 'reviewed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {selectedQuery.status}
                  </span>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-3">
                {selectedQuery.status === 'pending' && (
                  <button
                    onClick={() => {
                      handleMarkReviewed(selectedQuery.queryId)
                      setShowModal(false)
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Mark as Reviewed
                  </button>
                )}
                <button
                  onClick={() => handleDelete(selectedQuery.queryId)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Queries
