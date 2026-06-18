import { useState, useEffect, useRef } from 'react'
import { Bell, X, AlertTriangle, UserPlus, DollarSign, FileWarning, Package, Calendar, CheckCircle, FileSignature } from 'lucide-react'

interface Notification {
  id: string
  type: 'enrollment' | 'payment' | 'incident' | 'inventory' | 'attendance' | 'event' | 'system' | 'permission_slip' | 'tour'
  title: string
  message: string
  timestamp: Date
  read: boolean
  priority: 'high' | 'medium' | 'low'
  actionUrl?: string
}

interface NotificationNavigation {
  view: string
  subView?: string
  eventId?: string
}

interface NotificationCenterProps {
  currentRole: 'owner' | 'admin' | 'coach' | 'parent'
  campusId?: string | null
  onNavigate?: (nav: NotificationNavigation) => void
}

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'enrollment',
    title: 'New Enrollment Application',
    message: 'The Garcia family submitted an enrollment application for 2 students.',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    read: false,
    priority: 'high'
  },
  {
    id: 'n2',
    type: 'payment',
    title: 'Overdue Payment Alert',
    message: '3 families have balances overdue by 30+ days.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: false,
    priority: 'high'
  },
  {
    id: 'n3',
    type: 'incident',
    title: 'Incident Report Filed',
    message: 'Coach Williams filed an incident report for a student in Room 3.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    read: false,
    priority: 'medium'
  },
  {
    id: 'n4',
    type: 'inventory',
    title: 'Low Inventory Warning',
    message: 'School T-Shirts (Size M) are running low — only 3 remaining.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    read: true,
    priority: 'low'
  },
  {
    id: 'n5',
    type: 'attendance',
    title: 'Attendance Concern',
    message: 'Jake Thompson has been absent 4 times this week.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
    read: true,
    priority: 'medium'
  },
  {
    id: 'n6',
    type: 'event',
    title: 'Event RSVP Deadline',
    message: 'Science Fair RSVP deadline is tomorrow — 12 families haven\'t responded.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    read: true,
    priority: 'low'
  },
  {
    id: 'n7',
    type: 'system',
    title: 'Re-Enrollment Reminder',
    message: 'Re-enrollment deadline is in 14 days. 8 families haven\'t started.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
    priority: 'medium'
  },
  {
    id: 'n8',
    type: 'permission_slip',
    title: 'Unsigned Permission Slips',
    message: 'Loading permission slip alerts...',
    timestamp: new Date(),
    read: false,
    priority: 'high'
  }
]

const PARENT_NOTIFICATIONS: Notification[] = [
  {
    id: 'pn1',
    type: 'event',
    title: 'Upcoming Event',
    message: 'Science Fair is next Friday — don\'t forget to RSVP!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: false,
    priority: 'medium'
  },
  {
    id: 'pn2',
    type: 'payment',
    title: 'Payment Confirmation',
    message: 'Your payment of $850.00 was received. Thank you!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
    priority: 'low'
  },
  {
    id: 'pn3',
    type: 'system',
    title: 'Progress Update Available',
    message: 'New report card is available for Emma in the Documents tab.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    read: true,
    priority: 'low'
  },
]

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'enrollment': return <UserPlus className="w-4 h-4 text-blue-600" />
    case 'payment': return <DollarSign className="w-4 h-4 text-green-600" />
    case 'incident': return <FileWarning className="w-4 h-4 text-red-600" />
    case 'inventory': return <Package className="w-4 h-4 text-orange-600" />
    case 'attendance': return <AlertTriangle className="w-4 h-4 text-yellow-600" />
    case 'event': return <Calendar className="w-4 h-4 text-purple-600" />
    case 'permission_slip': return <FileSignature className="w-4 h-4 text-indigo-600" />
    case 'tour': return <Calendar className="w-4 h-4 text-blue-600" />
    case 'system': return <Bell className="w-4 h-4 text-gray-600" />
  }
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getNavigationTarget(type: Notification['type'], currentRole: string): NotificationNavigation | null {
  if (currentRole === 'parent') {
    switch (type) {
      case 'event': return { view: 'events' }
      case 'payment': return { view: 'billing' }
      case 'system': return { view: 'home' }
      case 'permission_slip': return { view: 'events' }
      default: return { view: 'home' }
    }
  }
  if (currentRole === 'coach') {
    return null
  }
  switch (type) {
    case 'enrollment': return { view: 'admissions', subView: 'pipeline' }
    case 'payment': return { view: 'families-finance', subView: 'billing' }
    case 'incident': return { view: 'operations', subView: 'incidents' }
    case 'inventory': return { view: 'operations', subView: 'store' }
    case 'attendance': return { view: 'students' }
    case 'event': return { view: 'operations', subView: 'events' }
    case 'permission_slip': return { view: 'operations', subView: 'events' } // eventId added at call site
    case 'tour': return { view: 'admissions', subView: 'pipeline' }
    case 'system': return { view: 'dashboard' }
    default: return null
  }
}

export function NotificationCenter({ currentRole, campusId, onNavigate }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(
    currentRole === 'parent' ? PARENT_NOTIFICATIONS : DEMO_NOTIFICATIONS
  )

  useEffect(() => {
    async function fetchPermissionSlipAlerts() {
      try {
        // Parent-side alerts are handled by ParentPermissionSlipAlert with the real familyId
        if (currentRole === 'parent') {
          setNotifications(prev => prev.filter(n => n.type !== 'permission_slip'))
          return
        }
        const res = await fetch(`${API_URL}/api/permission-slip-alerts`)
        if (!res.ok) return
        const alerts = await res.json()
        if (alerts.length === 0) {
          setNotifications(prev => prev.filter(n => n.type !== 'permission_slip'))
          return
        }

        const permNotifications: Notification[] = alerts.map((alert: any, idx: number) => ({
          id: `perm_${alert.event_id}_${idx}`,
          type: 'permission_slip' as const,
          title: `Unsigned Permission Slips: ${alert.event_title}`,
          message: `${alert.unsigned_count} of ${alert.total_enrolled} student(s) have not signed permission slips for ${alert.event_title} (${alert.event_date}). ${alert.days_until} day(s) remaining.`,
          timestamp: new Date(),
          read: false,
          priority: alert.urgency === 'high' ? 'high' as const : alert.urgency === 'medium' ? 'medium' as const : 'low' as const,
        }))

        setNotifications(prev => [
          ...permNotifications,
          ...prev.filter(n => n.type !== 'permission_slip'),
        ])
      } catch (err) {
        setNotifications(prev => prev.filter(n => n.type !== 'permission_slip'))
      }
    }
    fetchPermissionSlipAlerts()

    async function fetchCRMNotifications() {
      try {
        const role = currentRole === 'owner' ? 'owner' : currentRole === 'admin' ? 'admin' : null
        if (!role) return
        const params = new URLSearchParams({ role })
        if (campusId) params.append('campus_id', campusId)
        const res = await fetch(`${API_URL}/api/crm-notifications?${params}`)
        if (!res.ok) return
        const crmNotifs = await res.json()
        if (crmNotifs.length === 0) {
          setNotifications(prev => prev.filter(n => n.type !== 'tour'))
          return
        }

        const tourNotifications: Notification[] = crmNotifs.map((n: { notification_id: string; title: string; message: string; created_at: string; read: boolean; notification_type: string }) => ({
          id: n.notification_id,
          type: 'tour' as const,
          title: n.title,
          message: n.message,
          timestamp: new Date(n.created_at),
          read: n.read,
          priority: 'high' as const,
        }))

        setNotifications(prev => [
          ...tourNotifications,
          ...prev.filter(n => n.type !== 'tour'),
        ])
      } catch {
        // CRM notifications are optional
      }
    }
    fetchCRMNotifications()
    const interval = setInterval(fetchCRMNotifications, 30000)
    return () => clearInterval(interval)
  }, [currentRole, campusId])
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    if (id.startsWith('notif_')) {
      fetch(`${API_URL}/api/crm-notifications/${id}/read`, { method: 'PUT' }).catch(() => {})
    }
  }

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    notifications.filter(n => n.id.startsWith('notif_') && !n.read).forEach(n => {
      fetch(`${API_URL}/api/crm-notifications/${n.id}/read`, { method: 'PUT' }).catch(() => {})
    })
  }

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
        style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
      >
        <Bell className="w-5 h-5 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl z-50 max-h-[70vh] flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => {
                      markAsRead(notification.id)
                      const target = getNavigationTarget(notification.type, currentRole)
                      if (target && onNavigate) {
                        if (notification.type === 'permission_slip' && notification.id.startsWith('perm_')) {
                          const eventId = notification.id.split('_').slice(1, -1).join('_')
                          target.eventId = eventId
                        }
                        onNavigate(target)
                        setIsOpen(false)
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notification.priority === 'high' ? 'bg-red-100' :
                        notification.priority === 'medium' ? 'bg-yellow-100' : 'bg-gray-100'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium truncate ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </p>
                          <button
                            onClick={(e) => { e.stopPropagation(); dismissNotification(notification.id) }}
                            className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">{getTimeAgo(notification.timestamp)}</span>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-200 text-center">
                <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                  View All Notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
