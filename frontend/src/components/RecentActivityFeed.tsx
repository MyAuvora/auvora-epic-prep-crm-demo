import { useState } from 'react'
import { DollarSign, UserPlus, FileWarning, Calendar, MessageSquare, CheckCircle, Archive, Clock, Package, TrendingUp } from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'payment' | 'enrollment' | 'incident' | 'event' | 'message' | 'attendance' | 'archive' | 'purchase' | 'milestone'
  title: string
  description: string
  timestamp: Date
  actor?: string
}

const DEMO_ACTIVITIES: ActivityItem[] = [
  {
    id: 'a1',
    type: 'payment',
    title: 'Payment Received',
    description: 'Johnson Family paid $1,200.00 — balance now current.',
    timestamp: new Date(Date.now() - 1000 * 60 * 12),
    actor: 'System'
  },
  {
    id: 'a2',
    type: 'enrollment',
    title: 'New Enrollment Submitted',
    description: 'The Garcia family submitted an enrollment application for Maria (Grade 4) and Carlos (Grade 7).',
    timestamp: new Date(Date.now() - 1000 * 60 * 35),
    actor: 'Garcia Family'
  },
  {
    id: 'a3',
    type: 'attendance',
    title: 'Attendance Logged',
    description: 'Morning session attendance completed — 45 present, 3 absent, 1 tardy.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5),
    actor: 'Coach Williams'
  },
  {
    id: 'a4',
    type: 'incident',
    title: 'Incident Report Filed',
    description: 'Behavioral incident reported in Room 3 — awaiting admin review.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    actor: 'Coach Davis'
  },
  {
    id: 'a5',
    type: 'message',
    title: 'Parent Message',
    description: 'Mrs. Thompson asked about early dismissal policy for next week.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    actor: 'Thompson Family'
  },
  {
    id: 'a6',
    type: 'purchase',
    title: 'Store Purchase',
    description: 'Martinez family purchased 2x School Polo Shirts ($45.00).',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    actor: 'Martinez Family'
  },
  {
    id: 'a7',
    type: 'event',
    title: 'Event Created',
    description: 'Spring Science Fair added to calendar for May 30th.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    actor: 'Admin'
  },
  {
    id: 'a8',
    type: 'milestone',
    title: 'Student Achievement',
    description: 'Emma Wilson completed all IXL skills for the quarter — 100% mastery!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
    actor: 'System'
  },
  {
    id: 'a9',
    type: 'payment',
    title: 'Payment Received',
    description: 'Smith Family paid $900.00 via Venmo.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 7),
    actor: 'System'
  },
  {
    id: 'a10',
    type: 'archive',
    title: 'Account Archived',
    description: 'Rodriguez family account archived — family withdrew.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    actor: 'Owner'
  }
]

function getActivityIcon(type: ActivityItem['type']) {
  switch (type) {
    case 'payment': return <DollarSign className="w-4 h-4 text-green-600" />
    case 'enrollment': return <UserPlus className="w-4 h-4 text-blue-600" />
    case 'incident': return <FileWarning className="w-4 h-4 text-red-600" />
    case 'event': return <Calendar className="w-4 h-4 text-purple-600" />
    case 'message': return <MessageSquare className="w-4 h-4 text-indigo-600" />
    case 'attendance': return <CheckCircle className="w-4 h-4 text-teal-600" />
    case 'archive': return <Archive className="w-4 h-4 text-gray-600" />
    case 'purchase': return <Package className="w-4 h-4 text-orange-600" />
    case 'milestone': return <TrendingUp className="w-4 h-4 text-yellow-600" />
  }
}

function getActivityBgColor(type: ActivityItem['type']) {
  switch (type) {
    case 'payment': return 'bg-green-100'
    case 'enrollment': return 'bg-blue-100'
    case 'incident': return 'bg-red-100'
    case 'event': return 'bg-purple-100'
    case 'message': return 'bg-indigo-100'
    case 'attendance': return 'bg-teal-100'
    case 'archive': return 'bg-gray-100'
    case 'purchase': return 'bg-orange-100'
    case 'milestone': return 'bg-yellow-100'
  }
}

function formatTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 60) return `${diffMins} min ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface RecentActivityFeedProps {
  maxItems?: number
}

export function RecentActivityFeed({ maxItems = 8 }: RecentActivityFeedProps) {
  const [filter, setFilter] = useState<'all' | 'payments' | 'enrollment' | 'incidents'>('all')

  const filtered = DEMO_ACTIVITIES.filter(a => {
    if (filter === 'all') return true
    if (filter === 'payments') return a.type === 'payment'
    if (filter === 'enrollment') return a.type === 'enrollment'
    if (filter === 'incidents') return a.type === 'incident'
    return true
  }).slice(0, maxItems)

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Today's Activity</h3>
        </div>
        <div className="flex gap-1">
          {(['all', 'payments', 'enrollment', 'incidents'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                filter === f
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Clock className="w-6 h-6 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No activity to show</p>
          </div>
        ) : (
          filtered.map((activity) => (
            <div key={activity.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityBgColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatTime(activity.timestamp)}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{activity.description}</p>
                  {activity.actor && (
                    <p className="text-xs text-gray-400 mt-1">by {activity.actor}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
