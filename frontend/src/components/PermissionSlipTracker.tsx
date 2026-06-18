import { useState, useEffect, useCallback } from 'react'
import {
  FileSignature, AlertTriangle, CheckCircle, Clock, RefreshCw,
  ChevronDown, ChevronUp, Send, Users, Calendar, Bell
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface UnsignedStudent {
  workflow_id: string
  student_id: string
  student_name: string
  family_id: string
  family_name: string
}

interface PermissionSlipAlert {
  event_id: string
  event_title: string
  event_date: string
  event_type: string
  days_until: number
  total_enrolled: number
  signed_count: number
  unsigned_count: number
  unsigned_students: UnsignedStudent[]
  urgency: 'high' | 'medium' | 'low'
}

interface PermissionSlipTrackerProps {
  currentRole: 'owner' | 'admin' | 'coach'
  campusId?: string | null
  autoExpandEventId?: string | null
  onClearAutoExpand?: () => void
  onNavigateToAccount?: (type: 'student' | 'family', id: string) => void
}

export function PermissionSlipTracker({ currentRole, campusId, autoExpandEventId, onClearAutoExpand, onNavigateToAccount }: PermissionSlipTrackerProps) {
  const [alerts, setAlerts] = useState<PermissionSlipAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [sendingReminder, setSendingReminder] = useState<string | null>(null)
  const [sendingStudentReminder, setSendingStudentReminder] = useState<string | null>(null)

  const fetchAlerts = useCallback(async () => {
    try {
      const params = campusId ? `?campus_id=${campusId}` : ''
      const res = await fetch(`${API_URL}/api/permission-slip-alerts${params}`)
      if (res.ok) {
        setAlerts(await res.json())
      }
    } catch (err) {
      console.error('Failed to fetch permission slip alerts:', err)
    } finally {
      setLoading(false)
    }
  }, [campusId])

  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 60000)
    return () => clearInterval(interval)
  }, [fetchAlerts])

  useEffect(() => {
    if (autoExpandEventId && alerts.length > 0) {
      setExpandedEvents(new Set([autoExpandEventId]))
      if (onClearAutoExpand) onClearAutoExpand()
    }
  }, [autoExpandEventId, alerts, onClearAutoExpand])

  const sendReminder = async (eventId: string) => {
    setSendingReminder(eventId)
    try {
      await fetch(`${API_URL}/api/document-reminders/bulk?reminder_type=permission_slip&event_id=${eventId}`, {
        method: 'POST',
      })
    } catch (err) {
      console.error('Failed to send bulk reminders:', err)
    } finally {
      setSendingReminder(null)
    }
  }

  const sendStudentReminder = async (eventId: string, studentId: string, familyId: string) => {
    const key = `${eventId}_${studentId}`
    setSendingStudentReminder(key)
    try {
      await fetch(`${API_URL}/api/document-reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminder_type: 'permission_slip',
          family_id: familyId,
          student_id: studentId,
          event_id: eventId,
        }),
      })
    } catch (err) {
      console.error('Failed to send student reminder:', err)
    } finally {
      setSendingStudentReminder(null)
    }
  }

  const totalUnsigned = alerts.reduce((sum, a) => sum + a.unsigned_count, 0)
  const highUrgency = alerts.filter(a => a.urgency === 'high').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-2" />
        <span className="text-gray-500">Loading permission slip tracker...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
            <FileSignature className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Permission Slip Tracker</h2>
            <p className="text-sm text-gray-500">Monitor unsigned permission slips for upcoming field trips</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAlerts}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{alerts.length}</p>
              <p className="text-xs text-gray-500">Events Needing Slips</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            if (expandedEvents.size === alerts.length) {
              setExpandedEvents(new Set())
            } else {
              setExpandedEvents(new Set(alerts.map(a => a.event_id)))
            }
          }}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <FileSignature className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalUnsigned}</p>
              <p className="text-xs text-gray-500">Total Unsigned</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${highUrgency > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
              {highUrgency > 0 ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
            </div>
            <div>
              <p className="text-2xl font-bold">{highUrgency}</p>
              <p className="text-xs text-gray-500">Urgent (≤3 days)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <h3 className="text-lg font-semibold text-gray-700">All Clear!</h3>
            <p className="text-gray-500 mt-1">No upcoming events with unsigned permission slips.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => {
            const isExpanded = expandedEvents.has(alert.event_id)
            const progress = alert.total_enrolled > 0
              ? Math.round((alert.signed_count / alert.total_enrolled) * 100)
              : 0

            return (
              <Card key={alert.event_id} className={`border-l-4 ${
                alert.urgency === 'high' ? 'border-l-red-500' :
                alert.urgency === 'medium' ? 'border-l-amber-500' : 'border-l-blue-500'
              }`}>
                <CardContent className="p-0">
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setExpandedEvents(prev => {
                        const next = new Set(prev)
                        if (next.has(alert.event_id)) {
                          next.delete(alert.event_id)
                        } else {
                          next.add(alert.event_id)
                        }
                        return next
                      })
                    }}
                  >
                    <div className={`p-2 rounded-lg ${
                      alert.urgency === 'high' ? 'bg-red-100' :
                      alert.urgency === 'medium' ? 'bg-amber-100' : 'bg-blue-100'
                    }`}>
                      {alert.urgency === 'high' ? (
                        <AlertTriangle className={`w-5 h-5 ${
                          alert.urgency === 'high' ? 'text-red-600' : 'text-amber-600'
                        }`} />
                      ) : (
                        <Clock className="w-5 h-5 text-blue-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800">{alert.event_title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          alert.urgency === 'high' ? 'bg-red-100 text-red-700' :
                          alert.urgency === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {alert.days_until === 0 ? 'Today!' :
                           alert.days_until === 1 ? 'Tomorrow' :
                           `${alert.days_until} days`}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{alert.event_date} &middot; {alert.event_type}</p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                progress >= 80 ? 'bg-green-500' :
                                progress >= 50 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-600">{progress}%</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {alert.signed_count}/{alert.total_enrolled} signed &middot; <span className="text-red-600 font-medium">{alert.unsigned_count} pending</span>
                        </p>
                      </div>

                      {(currentRole === 'owner' || currentRole === 'admin') && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={sendingReminder === alert.event_id}
                          onClick={(e) => {
                            e.stopPropagation()
                            sendReminder(alert.event_id)
                          }}
                        >
                          {sendingReminder === alert.event_id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-1" />
                              Remind
                            </>
                          )}
                        </Button>
                      )}

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t px-4 py-4 bg-gray-50">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        Students with Unsigned Permission Slips ({alert.unsigned_count})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {alert.unsigned_students.map(student => (
                          <div
                            key={student.workflow_id}
                            className="flex items-center gap-3 bg-white rounded-lg border p-3"
                          >
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                              <FileSignature className="w-4 h-4 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (onNavigateToAccount) onNavigateToAccount('student', student.student_id)
                                }}
                                className="text-sm font-medium text-blue-700 hover:text-blue-900 hover:underline truncate block text-left"
                                title={`View ${student.student_name}'s account`}
                              >
                                {student.student_name}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (onNavigateToAccount) onNavigateToAccount('family', student.family_id)
                                }}
                                className="text-xs text-gray-500 hover:text-blue-600 hover:underline block text-left"
                                title={`View ${student.family_name}'s account`}
                              >
                                Family: {student.family_name}
                              </button>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                sendStudentReminder(alert.event_id, student.student_id, student.family_id)
                              }}
                              disabled={sendingStudentReminder === `${alert.event_id}_${student.student_id}`}
                              className="p-1.5 rounded-full hover:bg-amber-100 text-amber-600 transition-colors disabled:opacity-50"
                              title={`Send reminder to ${student.family_name}`}
                            >
                              {sendingStudentReminder === `${alert.event_id}_${student.student_id}` ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Bell className="w-4 h-4" />
                              )}
                            </button>
                            <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs font-medium rounded-full">Unsigned</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
