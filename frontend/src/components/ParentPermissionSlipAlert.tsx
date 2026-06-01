import { useState, useEffect } from 'react'
import { FileSignature, AlertTriangle, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface PermissionSlipAlert {
  event_id: string
  event_title: string
  event_date: string
  days_until: number
  unsigned_count: number
  student_names: string[]
  urgency: 'high' | 'medium' | 'low'
}

interface ParentPermissionSlipAlertProps {
  familyId: string
  onNavigateToEvents?: () => void
}

export function ParentPermissionSlipAlert({ familyId, onNavigateToEvents }: ParentPermissionSlipAlertProps) {
  const [alerts, setAlerts] = useState<PermissionSlipAlert[]>([])
  const [dismissed, setDismissed] = useState<string[]>([])

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch(`${API_URL}/api/permission-slip-alerts?family_id=${familyId}`)
        if (res.ok) {
          setAlerts(await res.json())
        }
      } catch (err) {
        // silently fail
      }
    }
    fetchAlerts()
  }, [familyId])

  const visibleAlerts = alerts.filter(a => !dismissed.includes(a.event_id))

  if (visibleAlerts.length === 0) return null

  return (
    <div className="space-y-3 mb-6">
      {visibleAlerts.map(alert => (
        <div
          key={alert.event_id}
          className={`relative rounded-lg border-l-4 p-4 ${
            alert.urgency === 'high'
              ? 'border-l-red-500 bg-red-50'
              : alert.urgency === 'medium'
              ? 'border-l-amber-500 bg-amber-50'
              : 'border-l-blue-500 bg-blue-50'
          }`}
        >
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            onClick={() => setDismissed(prev => [...prev, alert.event_id])}
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${
              alert.urgency === 'high' ? 'bg-red-100' :
              alert.urgency === 'medium' ? 'bg-amber-100' : 'bg-blue-100'
            }`}>
              {alert.urgency === 'high' ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : (
                <FileSignature className="w-5 h-5 text-amber-600" />
              )}
            </div>
            <div className="flex-1">
              <h4 className={`font-semibold ${
                alert.urgency === 'high' ? 'text-red-800' :
                alert.urgency === 'medium' ? 'text-amber-800' : 'text-blue-800'
              }`}>
                Permission Slip Required: {alert.event_title}
              </h4>
              <p className={`text-sm mt-1 ${
                alert.urgency === 'high' ? 'text-red-700' :
                alert.urgency === 'medium' ? 'text-amber-700' : 'text-blue-700'
              }`}>
                {alert.student_names.join(', ')} {alert.unsigned_count === 1 ? 'needs' : 'need'} a signed permission slip.
                {' '}
                {alert.days_until === 0 ? (
                  <strong>The event is today!</strong>
                ) : alert.days_until === 1 ? (
                  <strong>The event is tomorrow!</strong>
                ) : (
                  <span>{alert.days_until} days until the event ({alert.event_date}).</span>
                )}
              </p>
              {onNavigateToEvents && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={onNavigateToEvents}
                >
                  Go to Events <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
