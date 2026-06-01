import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, RefreshCw, Server, Mail, CreditCard, Database, Cloud, Brain, Shield } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface SystemStatusData {
  production_mode: boolean
  email_provider: string
  storage_provider: string
  stripe_configured: boolean
  quickbooks_configured: boolean
  clerk_configured: boolean
  ai_configured: boolean
}

function StatusBadge({ configured, label }: { configured: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
      configured ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
    }`}>
      {configured ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
      {label}
    </span>
  )
}

export function SystemStatus() {
  const [status, setStatus] = useState<SystemStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch(`${API_URL}/api/system/status`)
      if (!resp.ok) throw new Error('Failed to fetch system status')
      const data = await resp.json()
      setStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading system status...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-medium">Error loading system status</p>
        <p className="text-red-600 text-sm">{error}</p>
        <button onClick={fetchStatus} className="mt-2 text-sm text-red-600 underline">Retry</button>
      </div>
    )
  }

  if (!status) return null

  const services = [
    {
      name: 'Authentication (Clerk)',
      icon: Shield,
      configured: status.clerk_configured,
      description: status.clerk_configured
        ? 'API endpoints are protected with Clerk JWT verification'
        : 'Running in open mode — set CLERK_SECRET_KEY to enforce authentication',
      envVar: 'CLERK_SECRET_KEY',
    },
    {
      name: 'Email Service (SendGrid)',
      icon: Mail,
      configured: status.email_provider === 'sendgrid',
      description: status.email_provider === 'sendgrid'
        ? 'Emails are being sent via SendGrid'
        : 'Emails are logged only — set SENDGRID_API_KEY to send real emails',
      envVar: 'SENDGRID_API_KEY',
    },
    {
      name: 'Payment Processing (Stripe)',
      icon: CreditCard,
      configured: status.stripe_configured,
      description: status.stripe_configured
        ? 'Stripe is connected for real payment processing'
        : 'Payments are simulated — set STRIPE_SECRET_KEY to process real payments',
      envVar: 'STRIPE_SECRET_KEY',
    },
    {
      name: 'File Storage',
      icon: Cloud,
      configured: status.storage_provider === 's3',
      description: status.storage_provider === 's3'
        ? 'Files are stored in S3/cloud storage'
        : 'Files are stored locally — set S3_BUCKET and S3_ACCESS_KEY for cloud storage',
      envVar: 'S3_BUCKET',
    },
    {
      name: 'QuickBooks Integration',
      icon: Database,
      configured: status.quickbooks_configured,
      description: status.quickbooks_configured
        ? 'QuickBooks OAuth is configured for accounting sync'
        : 'QuickBooks not configured — set QUICKBOOKS_CLIENT_ID and QUICKBOOKS_CLIENT_SECRET',
      envVar: 'QUICKBOOKS_CLIENT_ID',
    },
    {
      name: 'AI Agent (OpenAI)',
      icon: Brain,
      configured: status.ai_configured,
      description: status.ai_configured
        ? 'Auvora AI agent is powered by GPT-4o'
        : 'AI agent disabled — set OPENAI_API_KEY to enable',
      envVar: 'OPENAI_API_KEY',
    },
  ]

  const configuredCount = services.filter(s => s.configured).length
  const totalCount = services.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Status</h2>
          <p className="text-gray-600 mt-1">
            Service configuration and operational status for the EPIC CRM platform.
          </p>
        </div>
        <button
          onClick={fetchStatus}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className={`rounded-lg p-4 border ${
        configuredCount === totalCount
          ? 'bg-green-50 border-green-200'
          : configuredCount >= totalCount / 2
          ? 'bg-yellow-50 border-yellow-200'
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center gap-3">
          <Server className={`h-6 w-6 ${
            configuredCount === totalCount ? 'text-green-600' : 'text-yellow-600'
          }`} />
          <div>
            <p className="font-medium text-gray-900">
              {configuredCount}/{totalCount} services configured
            </p>
            <p className="text-sm text-gray-600">
              {status.production_mode ? 'Running in production mode' : 'Running in demo mode — set PRODUCTION_MODE=true for production'}
            </p>
          </div>
        </div>
      </div>

      {/* Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => {
          const Icon = service.icon
          return (
            <div key={service.name} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  service.configured ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <Icon className={`h-5 w-5 ${
                    service.configured ? 'text-green-600' : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 text-sm">{service.name}</h3>
                    <StatusBadge
                      configured={service.configured}
                      label={service.configured ? 'Active' : 'Not Configured'}
                    />
                  </div>
                  <p className="text-sm text-gray-600">{service.description}</p>
                  {!service.configured && (
                    <p className="text-xs text-gray-400 mt-1 font-mono">
                      Required: {service.envVar}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Setup Instructions */}
      {configuredCount < totalCount && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Setup Guide</h3>
          <p className="text-sm text-blue-800 mb-3">
            To fully configure the CRM, set the following environment variables on the backend (Fly.io):
          </p>
          <div className="bg-white rounded-md p-3 font-mono text-xs text-gray-700 space-y-1">
            {services.filter(s => !s.configured).map(s => (
              <p key={s.envVar}>fly secrets set {s.envVar}=&lt;your-value&gt;</p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
