import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { CheckCircle, AlertCircle, DollarSign, Smartphone, Loader2 } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface PaymentProviders {
  stripe: { connected: boolean }
  paypal: { connected: boolean; venmo_enabled: boolean }
  square: { connected: boolean; cashapp_enabled: boolean }
}

interface VenmoCashAppPaymentProps {
  familyId: string
  familyName: string
  currentBalance: number
  onPaymentComplete?: () => void
}

export function VenmoCashAppPayment({
  familyId,
  familyName,
  currentBalance,
  onPaymentComplete,
}: VenmoCashAppPaymentProps) {
  const [providers, setProviders] = useState<PaymentProviders | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [amount, setAmount] = useState(currentBalance > 0 ? currentBalance.toFixed(2) : '')
  const [paymentResult, setPaymentResult] = useState<{
    type: 'success' | 'error' | 'pending'
    text: string
  } | null>(null)

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      const resp = await fetch(`${API_URL}/api/payments/providers`)
      setProviders(await resp.json())
    } catch (error) {
      console.error('Error fetching payment providers:', error)
    } finally {
      setLoading(false)
    }
  }

  const payWithVenmo = async () => {
    setProcessing(true)
    setPaymentResult(null)
    try {
      const resp = await fetch(`${API_URL}/api/paypal/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_id: familyId,
          amount: parseFloat(amount),
          description: `Tuition Payment - ${familyName}`,
          funding_source: 'venmo',
        }),
      })
      const data = await resp.json()

      if (!resp.ok) {
        setPaymentResult({ type: 'error', text: data.detail || 'Failed to create Venmo order' })
        return
      }

      if (data.approve_url) {
        setPaymentResult({
          type: 'pending',
          text: 'Redirecting to Venmo for approval...',
        })
        window.open(data.approve_url, '_blank')
      } else {
        // For server-side captured orders, try to capture immediately
        const captureResp = await fetch(`${API_URL}/api/paypal/capture-order/${data.order_id}`, {
          method: 'POST',
        })
        const captureData = await captureResp.json()

        if (captureData.success) {
          setPaymentResult({ type: 'success', text: captureData.message })
          if (onPaymentComplete) onPaymentComplete()
        } else {
          setPaymentResult({
            type: 'pending',
            text: 'Payment created. Complete approval in Venmo app to finish.',
          })
        }
      }
    } catch {
      setPaymentResult({ type: 'error', text: 'Failed to process Venmo payment' })
    } finally {
      setProcessing(false)
    }
  }

  const payWithPayPal = async () => {
    setProcessing(true)
    setPaymentResult(null)
    try {
      const resp = await fetch(`${API_URL}/api/paypal/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_id: familyId,
          amount: parseFloat(amount),
          description: `Tuition Payment - ${familyName}`,
          funding_source: 'paypal',
        }),
      })
      const data = await resp.json()

      if (!resp.ok) {
        setPaymentResult({ type: 'error', text: data.detail || 'Failed to create PayPal order' })
        return
      }

      if (data.approve_url) {
        setPaymentResult({
          type: 'pending',
          text: 'Redirecting to PayPal for approval...',
        })
        window.open(data.approve_url, '_blank')
      }
    } catch {
      setPaymentResult({ type: 'error', text: 'Failed to process PayPal payment' })
    } finally {
      setProcessing(false)
    }
  }

  const payWithCashApp = async () => {
    setProcessing(true)
    setPaymentResult(null)
    try {
      // Cash App Pay requires the Square Web Payments SDK to generate a source_id (nonce)
      // For now, create a pending payment that the admin can confirm
      const resp = await fetch(`${API_URL}/api/square/create-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_id: familyId,
          amount: parseFloat(amount),
          source_id: 'EXTERNAL',
          description: `Tuition Payment - ${familyName}`,
        }),
      })
      const data = await resp.json()

      if (!resp.ok) {
        setPaymentResult({ type: 'error', text: data.detail || 'Failed to process Cash App payment' })
        return
      }

      if (data.success) {
        setPaymentResult({ type: 'success', text: data.message })
        if (onPaymentComplete) onPaymentComplete()
      } else {
        setPaymentResult({
          type: 'pending',
          text: data.message || 'Payment is being processed...',
        })
      }
    } catch {
      setPaymentResult({ type: 'error', text: 'Failed to process Cash App payment' })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    )
  }

  const venmoAvailable = providers?.paypal?.connected && providers?.paypal?.venmo_enabled
  const cashAppAvailable = providers?.square?.connected && providers?.square?.cashapp_enabled
  const paypalAvailable = providers?.paypal?.connected

  if (!venmoAvailable && !cashAppAvailable && !paypalAvailable) {
    return null
  }

  const parsedAmount = parseFloat(amount)
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5 text-blue-600" />
          Pay Tuition
        </CardTitle>
        {currentBalance > 0 && (
          <p className="text-sm text-gray-500">
            Current balance: <span className="font-semibold text-red-600">${currentBalance.toFixed(2)}</span>
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {paymentResult && (
          <div className={`p-3 rounded-lg border text-sm ${
            paymentResult.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : paymentResult.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
            <div className="flex items-center gap-2">
              {paymentResult.type === 'success' ? (
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
              ) : paymentResult.type === 'error' ? (
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
              ) : (
                <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
              )}
              <span>{paymentResult.text}</span>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="payment-amount">Payment Amount ($)</Label>
          <Input
            id="payment-amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {venmoAvailable && (
            <Button
              onClick={payWithVenmo}
              disabled={processing || !isValidAmount}
              className="bg-[#008CFF] hover:bg-[#0070CC] text-white h-12 text-base font-semibold"
            >
              {processing ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <DollarSign className="h-5 w-5 mr-2" />
              )}
              Pay with Venmo
            </Button>
          )}

          {cashAppAvailable && (
            <Button
              onClick={payWithCashApp}
              disabled={processing || !isValidAmount}
              className="bg-[#00D632] hover:bg-[#00B82B] text-white h-12 text-base font-semibold"
            >
              {processing ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Smartphone className="h-5 w-5 mr-2" />
              )}
              Pay with Cash App
            </Button>
          )}

          {paypalAvailable && (
            <Button
              onClick={payWithPayPal}
              disabled={processing || !isValidAmount}
              className="bg-[#FFC439] hover:bg-[#F0B72A] text-[#253B80] h-12 text-base font-semibold"
            >
              {processing ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <DollarSign className="h-5 w-5 mr-2" />
              )}
              Pay with PayPal
            </Button>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center">
          Payments are processed securely. You will be redirected to complete the payment.
        </p>
      </CardContent>
    </Card>
  )
}
