'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon, UserGroupIcon, PhoneIcon, EnvelopeIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/components/auth'
import withAuth from '@/components/auth/withAuth'

interface Lead {
  id: number
  name: string
  email: string
  phone: string
  message: string
  status: string
  source: string
  lead_score: number
  property_address: string
  created_at: string
}

function AgentsPage() {
  const { accessToken } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    if (!accessToken) {
      setLeads([])
      setLoading(false)
      return
    }
    try {
      const response = await fetch('/api/portal/leads/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      if (!response.ok) {
        throw new Error(`Failed to fetch leads (${response.status})`)
      }
      const data = await response.json()
      setLeads(Array.isArray(data) ? data : (data.leads || []))
      setError(null)
    } catch (error) {
      console.error('Error fetching leads:', error)
      setError('Failed to load leads.')
      setLeads([])
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-stone-100 text-stone-700'
      case 'contacted': return 'bg-amber-100 text-amber-700'
      case 'qualified': return 'bg-emerald-100 text-emerald-700'
      case 'converted': return 'bg-purple-100 text-purple-800'
      default: return 'bg-stone-100 text-stone-800'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600'
    if (score >= 70) return 'text-amber-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900 mx-auto"></div>
          <p className="mt-4 text-stone-500">Loading leads...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-stone-500 hover:text-stone-900">
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-stone-900">Agent Dashboard</h1>
                <p className="text-stone-500">Manage your leads and track performance</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-stone-900">{leads.length}</div>
                <div className="text-sm text-stone-500">Total Leads</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-stone-900" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-stone-900">{leads.length}</div>
                <div className="text-sm text-stone-500">Total Leads</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-stone-900">
                  {leads.filter(lead => lead.status === 'new').length}
                </div>
                <div className="text-sm text-stone-500">New Leads</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PhoneIcon className="h-8 w-8 text-amber-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-stone-900">
                  {leads.filter(lead => lead.status === 'contacted').length}
                </div>
                <div className="text-sm text-stone-500">Contacted</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EnvelopeIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-stone-900">
                  {Math.round(leads.reduce((sum, lead) => sum + lead.lead_score, 0) / leads.length) || 0}
                </div>
                <div className="text-sm text-stone-500">Avg. Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="card">
          <div className="px-6 py-4 border-b border-stone-200">
            <h3 className="text-lg font-medium text-stone-900">Recent Leads</h3>
          </div>

          {leads.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-stone-400" />
              <h3 className="mt-2 text-sm font-medium text-stone-900">No leads yet</h3>
              <p className="mt-1 text-sm text-stone-500">
                Leads will appear here when customers contact you through the website.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      Property Interest
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-stone-200">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-stone-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-stone-900">{lead.name}</div>
                          <div className="text-sm text-stone-500">{lead.email}</div>
                          {lead.phone && (
                            <div className="text-sm text-stone-500">{lead.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-stone-900">
                          {lead.property_address || 'General inquiry'}
                        </div>
                        {lead.message && (
                          <div className="text-sm text-stone-500 mt-1 max-w-xs truncate">
                            {lead.message}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${getScoreColor(lead.lead_score)}`}>
                          {lead.lead_score}/100
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                        {lead.source}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-stone-900 hover:text-primary-900">
                            Contact
                          </button>
                          <button className="text-stone-500 hover:text-stone-900">
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="text-lg font-medium text-stone-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="btn-primary w-full">
                Export Leads
              </button>
              <button className="btn-secondary w-full">
                Send Follow-up
              </button>
              <Link href="/properties" className="btn-secondary w-full text-center block">
                View Properties
              </Link>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-medium text-stone-900 mb-4">Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-stone-500">Conversion Rate</span>
                <span className="text-sm font-medium text-stone-900">12.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-stone-500">Avg Response Time</span>
                <span className="text-sm font-medium text-stone-900">2.3 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-stone-500">This Month</span>
                <span className="text-sm font-medium text-stone-900">{leads.length} leads</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-medium text-stone-900 mb-4">Recent Activity</h3>
            <div className="space-y-2 text-sm text-stone-500">
              <div>• New lead from John Smith</div>
              <div>• Sarah Johnson contacted</div>
              <div>• Property inquiry for 123 Main St</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default withAuth(AgentsPage, { redirectTo: '/' })

