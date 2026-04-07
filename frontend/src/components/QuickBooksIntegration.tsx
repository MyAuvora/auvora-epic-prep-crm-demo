import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { RefreshCw, Link2, Unlink, Users, FileText, CreditCard, CheckCircle, AlertCircle, Clock, Settings } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface QuickBooksConnection {
  connected: boolean
  company_name: string | null
  company_id: string | null
  connected_at: string | null
  last_sync: string | null
  configured: boolean
  settings: {
    auto_sync_invoices: boolean
    auto_sync_payments: boolean
    sync_frequency: string
  }
}

interface SyncRecord {
  sync_id: string
  type: string
  direction: string
  records_synced: number
  status: string
  timestamp: string
  details: string
}

interface ExportPreview {
  customers: {
    count: number
    sample: { name: string; balance: number }[]
  }
  invoices: {
    count: number
    total_amount: number
    sample: { number: string; amount: number; status: string }[]
  }
  payments: {
    count: number
    total_amount: number
  }
  summary: {
    total_invoiced: number
    total_payments: number
    total_outstanding: number
  }
}

export function QuickBooksIntegration() {
  const [connection, setConnection] = useState<QuickBooksConnection | null>(null)
  const [syncHistory, setSyncHistory] = useState<SyncRecord[]>([])
  const [exportPreview, setExportPreview] = useState<ExportPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    // Check for OAuth callback params in URL
    const urlParams = new URLSearchParams(window.location.search)
    const qbConnected = urlParams.get('qb_connected')
    const qbError = urlParams.get('qb_error')

    if (qbConnected === 'true') {
      setSyncMessage({ type: 'success', message: 'Successfully connected to QuickBooks!' })
      window.history.replaceState({}, '', window.location.pathname)
    } else if (qbError) {
      setSyncMessage({ type: 'error', message: `QuickBooks connection failed: ${qbError}` })
      window.history.replaceState({}, '', window.location.pathname)
    }

    fetchConnectionStatus()
    fetchSyncHistory()
    fetchExportPreview()
  }, [])

  const fetchConnectionStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/quickbooks/status`)
      if (response.ok) {
        const data = await response.json()
        setConnection(data)
      }
    } catch (error) {
      console.error('Error fetching QuickBooks status:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSyncHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/quickbooks/sync/history`)
      if (response.ok) {
        const data = await response.json()
        setSyncHistory(data)
      }
    } catch (error) {
      console.error('Error fetching sync history:', error)
    }
  }

  const fetchExportPreview = async () => {
    try {
      const response = await fetch(`${API_URL}/api/quickbooks/export/preview`)
      if (response.ok) {
        const data = await response.json()
        setExportPreview(data)
      }
    } catch (error) {
      console.error('Error fetching export preview:', error)
    }
  }

  const handleConnect = async () => {
    setConnecting(true)
    try {
      // Try OAuth flow first (GET returns auth_url)
      const response = await fetch(`${API_URL}/api/quickbooks/connect`)
      if (response.ok) {
        const data = await response.json()
        if (data.auth_url) {
          // Redirect to QuickBooks OAuth
          window.location.href = data.auth_url
          return
        }
      }
      // Fallback to POST for demo mode
      const postResponse = await fetch(`${API_URL}/api/quickbooks/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: 'EPIC Prep Academy' })
      })
      if (postResponse.ok) {
        const data = await postResponse.json()
        setConnection(data.connection)
        setSyncMessage({ type: 'success', message: 'Successfully connected to QuickBooks!' })
      }
    } catch (error) {
      setSyncMessage({ type: 'error', message: 'Failed to connect to QuickBooks' })
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      const response = await fetch(`${API_URL}/api/quickbooks/disconnect`, {
        method: 'POST'
      })
      if (response.ok) {
        setConnection(prev => prev ? { ...prev, connected: false, company_name: null, company_id: null, connected_at: null } : null)
        setSyncMessage({ type: 'success', message: 'Disconnected from QuickBooks' })
      }
    } catch (error) {
      setSyncMessage({ type: 'error', message: 'Failed to disconnect from QuickBooks' })
    }
  }

  const handleSync = async (type: 'all' | 'invoices' | 'payments' | 'customers') => {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const response = await fetch(`${API_URL}/api/quickbooks/sync/${type}`, {
        method: 'POST'
      })
      if (response.ok) {
        const data = await response.json()
        setSyncMessage({ type: 'success', message: data.message })
        fetchSyncHistory()
        fetchConnectionStatus()
      } else {
        const error = await response.json()
        setSyncMessage({ type: 'error', message: error.detail || 'Sync failed' })
      }
    } catch (error) {
      setSyncMessage({ type: 'error', message: 'Failed to sync with QuickBooks' })
    } finally {
      setSyncing(false)
    }
  }

  const handleUpdateSettings = async (settings: Partial<QuickBooksConnection['settings']>) => {
    try {
      const response = await fetch(`${API_URL}/api/quickbooks/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (response.ok) {
        fetchConnectionStatus()
        setSyncMessage({ type: 'success', message: 'Settings updated' })
      }
    } catch (error) {
      setSyncMessage({ type: 'error', message: 'Failed to update settings' })
    }
  }

  const getSyncTypeIcon = (type: string) => {
    switch (type) {
      case 'customers': return <Users className="w-4 h-4" />
      case 'invoices': return <FileText className="w-4 h-4" />
      case 'payments': return <CreditCard className="w-4 h-4" />
      default: return <RefreshCw className="w-4 h-4" />
    }
  }

  if (loading) {
    return <div className="p-6">Loading QuickBooks integration...</div>
  }

  return (
    <div className="space-y-6">
      {syncMessage && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          syncMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {syncMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {syncMessage.message}
          <button onClick={() => setSyncMessage(null)} className="ml-auto text-sm underline">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <img src="https://quickbooks.intuit.com/etc/designs/quickbooks/clientlibs/quickbooks-refresh/images/qb-logo.svg" alt="QuickBooks" className="h-6" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              QuickBooks Online Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            {connection?.connected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-800">Connected to QuickBooks</p>
                      <p className="text-sm text-green-600">{connection.company_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Connected since</p>
                    <p className="text-sm">{connection.connected_at ? new Date(connection.connected_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Button
                    onClick={() => handleSync('customers')}
                    disabled={syncing}
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <Users className="w-6 h-6 text-blue-600" />
                    <span>Sync Customers</span>
                    <span className="text-xs text-gray-500">{exportPreview?.customers.count || 0} families</span>
                  </Button>
                  <Button
                    onClick={() => handleSync('invoices')}
                    disabled={syncing}
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <FileText className="w-6 h-6 text-purple-600" />
                    <span>Sync Invoices</span>
                    <span className="text-xs text-gray-500">{exportPreview?.invoices.count || 0} invoices</span>
                  </Button>
                  <Button
                    onClick={() => handleSync('payments')}
                    disabled={syncing}
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <CreditCard className="w-6 h-6 text-green-600" />
                    <span>Sync Payments</span>
                    <span className="text-xs text-gray-500">{exportPreview?.payments.count || 0} payments</span>
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSync('all')}
                    disabled={syncing}
                    className="flex-1 bg-[#2CA01C] hover:bg-[#248a17]"
                  >
                    {syncing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync All Data to QuickBooks
                      </>
                    )}
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
                    <h4 className="font-semibold">Sync Settings</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={connection.settings.auto_sync_invoices}
                          onChange={(e) => handleUpdateSettings({ auto_sync_invoices: e.target.checked })}
                          className="rounded"
                        />
                        <span>Auto-sync invoices when created</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={connection.settings.auto_sync_payments}
                          onChange={(e) => handleUpdateSettings({ auto_sync_payments: e.target.checked })}
                          className="rounded"
                        />
                        <span>Auto-sync payments when recorded</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span>Sync frequency:</span>
                        <select
                          value={connection.settings.sync_frequency}
                          onChange={(e) => handleUpdateSettings({ sync_frequency: e.target.value })}
                          className="border rounded px-2 py-1"
                        >
                          <option value="realtime">Real-time</option>
                          <option value="hourly">Hourly</option>
                          <option value="daily">Daily</option>
                          <option value="manual">Manual only</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {connection.last_sync && (
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Last sync: {new Date(connection.last_sync).toLocaleString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Link2 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Connect to QuickBooks Online</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Sync your families, invoices, and payments with QuickBooks Online for seamless accounting integration.
                </p>
                <Button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="bg-[#2CA01C] hover:bg-[#248a17]"
                >
                  {connecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 mr-2" />
                      Connect to QuickBooks
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-4">
                  You'll be redirected to QuickBooks to authorize the connection
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {exportPreview ? (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Customers</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{exportPreview.customers.count}</p>
                  <p className="text-xs text-gray-500">families to sync</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span className="font-medium">Invoices</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{exportPreview.invoices.count}</p>
                  <p className="text-xs text-gray-500">${exportPreview.invoices.total_amount.toLocaleString()} total</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Payments</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{exportPreview.payments.count}</p>
                  <p className="text-xs text-gray-500">${exportPreview.payments.total_amount.toLocaleString()} received</p>
                </div>
                <div className="border-t pt-3">
                  <p className="text-sm text-gray-600">Outstanding Balance</p>
                  <p className="text-xl font-bold text-red-600">${exportPreview.summary.total_outstanding.toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Loading data summary...</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
        </CardHeader>
        <CardContent>
          {syncHistory.length > 0 ? (
            <div className="space-y-2">
              {syncHistory.map((record) => (
                <div key={record.sync_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      record.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {getSyncTypeIcon(record.type)}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{record.type.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-500">{record.details}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{record.records_synced} records</p>
                    <p className="text-xs text-gray-500">{new Date(record.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No sync history yet</p>
              <p className="text-sm">Connect to QuickBooks and sync your data to see history here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
