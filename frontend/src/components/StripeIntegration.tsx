import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { RefreshCw, Link2, Unlink, CreditCard, DollarSign, FileText, CheckCircle, AlertCircle, Settings, Shield } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface StripeConnection {
  connected: boolean
  account_name: string | null
  account_id: string | null
  connected_at: string | null
  mode: string
  settings: {
    auto_create_invoices: boolean
    send_payment_receipts: boolean
    default_currency: string
    payment_methods: string[]
    late_fee_enabled: boolean
    late_fee_percentage: number
    late_fee_grace_days: number
  }
}

interface StripeTransaction {
  transaction_id: string
  type: string
  family_id: string
  family_name: string
  amount: number
  description: string
  status: string
  created_at: string
  paid_at: string | null
}

interface StripeSummary {
  total_invoiced: number
  total_collected: number
  outstanding_balance: number
  pending_invoice_count: number
  recent_payments: StripeTransaction[]
  families_with_balance: number
}

export function StripeIntegration() {
  const [connection, setConnection] = useState<StripeConnection | null>(null)
  const [transactions, setTransactions] = useState<StripeTransaction[]>([])
  const [summary, setSummary] = useState<StripeSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetchConnectionStatus()
    fetchTransactions()
    fetchSummary()
  }, [])

  const fetchConnectionStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stripe/status`)
      if (response.ok) {
        const data = await response.json()
        setConnection(data)
      }
    } catch (error) {
      console.error('Error fetching Stripe status:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stripe/transactions`)
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error('Error fetching Stripe transactions:', error)
    }
  }

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stripe/summary`)
      if (response.ok) {
        const data = await response.json()
        setSummary(data)
      }
    } catch (error) {
      console.error('Error fetching Stripe summary:', error)
    }
  }

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const response = await fetch(`${API_URL}/api/stripe/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_name: 'EPIC Prep Academy', mode: 'live' })
      })
      if (response.ok) {
        const data = await response.json()
        setConnection(data.connection)
        setMessage({ type: 'success', message: 'Successfully connected to Stripe!' })
      }
    } catch (error) {
      setMessage({ type: 'error', message: 'Failed to connect to Stripe' })
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stripe/disconnect`, {
        method: 'POST'
      })
      if (response.ok) {
        setConnection(prev => prev ? { ...prev, connected: false, account_name: null, account_id: null, connected_at: null } : null)
        setMessage({ type: 'success', message: 'Disconnected from Stripe' })
      }
    } catch (error) {
      setMessage({ type: 'error', message: 'Failed to disconnect from Stripe' })
    }
  }

  const handleUpdateSettings = async (settings: Partial<StripeConnection['settings']>) => {
    try {
      const response = await fetch(`${API_URL}/api/stripe/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (response.ok) {
        fetchConnectionStatus()
        setMessage({ type: 'success', message: 'Settings updated' })
      }
    } catch (error) {
      setMessage({ type: 'error', message: 'Failed to update settings' })
    }
  }

  if (loading) {
    return <div className="p-6">Loading Stripe integration...</div>
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.message}
          <button onClick={() => setMessage(null)} className="ml-auto text-sm underline">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-[#635BFF]" />
              Stripe Payment Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            {connection?.connected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#635BFF] rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-800">Connected to Stripe</p>
                      <p className="text-sm text-green-600">{connection.account_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Shield className="w-3 h-3" />
                      <span className="uppercase">{connection.mode} mode</span>
                    </div>
                    <p className="text-sm">{connection.connected_at ? new Date(connection.connected_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-[#635BFF]/5 rounded-lg text-center">
                    <DollarSign className="w-6 h-6 text-[#635BFF] mx-auto mb-1" />
                    <p className="text-2xl font-bold text-[#635BFF]">${summary?.total_collected.toLocaleString() || '0'}</p>
                    <p className="text-xs text-gray-500">Total Collected</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg text-center">
                    <FileText className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-orange-600">{summary?.pending_invoice_count || 0}</p>
                    <p className="text-xs text-gray-500">Pending Invoices</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg text-center">
                    <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-red-600">${summary?.outstanding_balance.toLocaleString() || '0'}</p>
                    <p className="text-xs text-gray-500">Outstanding</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => { fetchTransactions(); fetchSummary(); setMessage({ type: 'success', message: 'Data refreshed' }) }}
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Data
                  </Button>
                  <Button
                    onClick={() => setShowSettings(!showSettings)}
                    variant="outline"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={handleDisconnect}
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Unlink className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                </div>

                {showSettings && (
                  <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                    <h4 className="font-semibold">Payment Settings</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={connection.settings.auto_create_invoices}
                          onChange={(e) => handleUpdateSettings({ auto_create_invoices: e.target.checked })}
                          className="rounded"
                        />
                        <span>Auto-create invoices for new billing records</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={connection.settings.send_payment_receipts}
                          onChange={(e) => handleUpdateSettings({ send_payment_receipts: e.target.checked })}
                          className="rounded"
                        />
                        <span>Send payment receipts to parents via email</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={connection.settings.late_fee_enabled}
                          onChange={(e) => handleUpdateSettings({ late_fee_enabled: e.target.checked })}
                          className="rounded"
                        />
                        <span>Enable late fees ({connection.settings.late_fee_percentage}% after {connection.settings.late_fee_grace_days} days)</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-[#635BFF]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-[#635BFF]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Connect to Stripe</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Accept tuition payments, create invoices, and manage billing through Stripe's secure payment platform.
                </p>
                <Button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="bg-[#635BFF] hover:bg-[#5851DB]"
                >
                  {connecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 mr-2" />
                      Connect to Stripe
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-4">
                  You'll be redirected to Stripe to authorize the connection
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {summary ? (
              <div className="space-y-4">
                <div className="p-3 bg-[#635BFF]/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-[#635BFF]" />
                    <span className="font-medium">Total Invoiced</span>
                  </div>
                  <p className="text-2xl font-bold text-[#635BFF]">${summary.total_invoiced.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Collected</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">${summary.total_collected.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="font-medium">Outstanding</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">${summary.outstanding_balance.toLocaleString()}</p>
                </div>
                <div className="border-t pt-3">
                  <p className="text-sm text-gray-600">Families with Balance</p>
                  <p className="text-xl font-bold text-gray-800">{summary.families_with_balance}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Loading payment summary...</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((txn) => (
                <div key={txn.transaction_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      txn.type === 'payment' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {txn.type === 'payment' ? <DollarSign className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{txn.type}: {txn.family_name}</p>
                      <p className="text-sm text-gray-500">{txn.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${txn.type === 'payment' ? 'text-green-600' : 'text-blue-600'}`}>
                      {txn.type === 'payment' ? '+' : ''}${txn.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(txn.created_at).toLocaleString()}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      txn.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {txn.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm">Connect to Stripe and process payments to see history here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
