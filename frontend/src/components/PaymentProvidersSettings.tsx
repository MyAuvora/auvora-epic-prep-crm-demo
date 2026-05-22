import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { CheckCircle, AlertCircle, Link2, Unlink, DollarSign, Smartphone } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface ProviderStatus {
  connected: boolean
  account_name?: string
  mode?: string
  configured?: boolean
  venmo_enabled?: boolean
  cashapp_enabled?: boolean
  location_id?: string
}

export function PaymentProvidersSettings() {
  const [paypalStatus, setPaypalStatus] = useState<ProviderStatus | null>(null)
  const [squareStatus, setSquareStatus] = useState<ProviderStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // PayPal form
  const [ppClientId, setPpClientId] = useState('')
  const [ppClientSecret, setPpClientSecret] = useState('')
  const [ppMode, setPpMode] = useState('sandbox')

  // Square form
  const [sqAccessToken, setSqAccessToken] = useState('')
  const [sqApplicationId, setSqApplicationId] = useState('')
  const [sqLocationId, setSqLocationId] = useState('')
  const [sqMode, setSqMode] = useState('sandbox')

  useEffect(() => {
    fetchStatuses()
  }, [])

  const fetchStatuses = async () => {
    try {
      const [ppResp, sqResp] = await Promise.all([
        fetch(`${API_URL}/api/paypal/status`),
        fetch(`${API_URL}/api/square/status`),
      ])
      setPaypalStatus(await ppResp.json())
      setSquareStatus(await sqResp.json())
    } catch (error) {
      console.error('Error fetching payment provider statuses:', error)
    } finally {
      setLoading(false)
    }
  }

  const connectPayPal = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const resp = await fetch(`${API_URL}/api/paypal/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: ppClientId,
          client_secret: ppClientSecret,
          mode: ppMode,
          venmo_enabled: true,
        }),
      })
      const data = await resp.json()
      if (resp.ok && data.success) {
        setMessage({ type: 'success', text: data.message })
        setPpClientId('')
        setPpClientSecret('')
        fetchStatuses()
      } else {
        setMessage({ type: 'error', text: data.detail || 'Connection failed' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to connect to PayPal' })
    } finally {
      setSaving(false)
    }
  }

  const disconnectPayPal = async () => {
    setSaving(true)
    try {
      await fetch(`${API_URL}/api/paypal/disconnect`, { method: 'POST' })
      setMessage({ type: 'success', text: 'PayPal disconnected' })
      fetchStatuses()
    } catch {
      setMessage({ type: 'error', text: 'Failed to disconnect' })
    } finally {
      setSaving(false)
    }
  }

  const connectSquare = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const resp = await fetch(`${API_URL}/api/square/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: sqAccessToken,
          application_id: sqApplicationId,
          location_id: sqLocationId,
          mode: sqMode,
          cashapp_enabled: true,
        }),
      })
      const data = await resp.json()
      if (resp.ok && data.success) {
        setMessage({ type: 'success', text: data.message })
        setSqAccessToken('')
        setSqApplicationId('')
        setSqLocationId('')
        fetchStatuses()
      } else {
        setMessage({ type: 'error', text: data.detail || 'Connection failed' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to connect to Square' })
    } finally {
      setSaving(false)
    }
  }

  const disconnectSquare = async () => {
    setSaving(true)
    try {
      await fetch(`${API_URL}/api/square/disconnect`, { method: 'POST' })
      setMessage({ type: 'success', text: 'Square disconnected' })
      fetchStatuses()
    } catch {
      setMessage({ type: 'error', text: 'Failed to disconnect' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Payment Providers</h2>
        <p className="text-sm text-gray-500 mt-1">
          Connect Venmo and Cash App to accept payments from parents automatically.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* PayPal / Venmo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">PayPal / Venmo</CardTitle>
                <p className="text-sm text-gray-500">Accept payments via Venmo and PayPal</p>
              </div>
            </div>
            {paypalStatus?.connected ? (
              <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                <CheckCircle className="h-4 w-4" /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm text-gray-400">
                <AlertCircle className="h-4 w-4" /> Not connected
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {paypalStatus?.connected ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Account:</span>{' '}
                    <span className="font-medium">{paypalStatus.account_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Mode:</span>{' '}
                    <span className="font-medium capitalize">{paypalStatus.mode}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Venmo:</span>{' '}
                    <span className="font-medium text-green-600">Enabled</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={disconnectPayPal} disabled={saving}>
                <Unlink className="h-4 w-4 mr-2" /> Disconnect PayPal
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-2">Setup Instructions:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to <a href="https://developer.paypal.com" target="_blank" rel="noreferrer" className="underline">developer.paypal.com</a></li>
                  <li>Create or select your app under "Apps & Credentials"</li>
                  <li>Switch to <strong>Live</strong> mode (not Sandbox) for production</li>
                  <li>Copy the <strong>Client ID</strong> and <strong>Secret</strong> below</li>
                </ol>
              </div>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="pp-client-id">Client ID</Label>
                  <Input id="pp-client-id" placeholder="PayPal Client ID" value={ppClientId} onChange={(e) => setPpClientId(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="pp-secret">Client Secret</Label>
                  <Input id="pp-secret" type="password" placeholder="PayPal Client Secret" value={ppClientSecret} onChange={(e) => setPpClientSecret(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="pp-mode">Mode</Label>
                  <Select value={ppMode} onValueChange={setPpMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                      <SelectItem value="live">Live (Production)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={connectPayPal} disabled={saving || !ppClientId || !ppClientSecret}>
                  <Link2 className="h-4 w-4 mr-2" /> Connect PayPal / Venmo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Square / Cash App Pay */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Square / Cash App Pay</CardTitle>
                <p className="text-sm text-gray-500">Accept payments via Cash App</p>
              </div>
            </div>
            {squareStatus?.connected ? (
              <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                <CheckCircle className="h-4 w-4" /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm text-gray-400">
                <AlertCircle className="h-4 w-4" /> Not connected
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {squareStatus?.connected ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Account:</span>{' '}
                    <span className="font-medium">{squareStatus.account_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Mode:</span>{' '}
                    <span className="font-medium capitalize">{squareStatus.mode}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Cash App Pay:</span>{' '}
                    <span className="font-medium text-green-600">Enabled</span>
                  </div>
                  {squareStatus.location_id && (
                    <div>
                      <span className="text-gray-500">Location:</span>{' '}
                      <span className="font-medium">{squareStatus.location_id}</span>
                    </div>
                  )}
                </div>
              </div>
              <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={disconnectSquare} disabled={saving}>
                <Unlink className="h-4 w-4 mr-2" /> Disconnect Square
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                <p className="font-medium mb-2">Setup Instructions:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to <a href="https://developer.squareup.com" target="_blank" rel="noreferrer" className="underline">developer.squareup.com</a></li>
                  <li>Create an application</li>
                  <li>Switch to <strong>Production</strong> mode for live payments</li>
                  <li>Copy the <strong>Application ID</strong>, <strong>Access Token</strong>, and <strong>Location ID</strong></li>
                </ol>
              </div>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="sq-app-id">Application ID</Label>
                  <Input id="sq-app-id" placeholder="Square Application ID" value={sqApplicationId} onChange={(e) => setSqApplicationId(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="sq-token">Access Token</Label>
                  <Input id="sq-token" type="password" placeholder="Square Access Token" value={sqAccessToken} onChange={(e) => setSqAccessToken(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="sq-location">Location ID (optional — auto-detected if blank)</Label>
                  <Input id="sq-location" placeholder="Square Location ID" value={sqLocationId} onChange={(e) => setSqLocationId(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="sq-mode">Mode</Label>
                  <Select value={sqMode} onValueChange={setSqMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                      <SelectItem value="production">Production (Live)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="bg-green-600 hover:bg-green-700" onClick={connectSquare} disabled={saving || !sqAccessToken || !sqApplicationId}>
                  <Link2 className="h-4 w-4 mr-2" /> Connect Square / Cash App Pay
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
