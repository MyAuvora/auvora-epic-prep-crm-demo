import { useState } from 'react'
import { Clock, User, Filter, Download, Search, Shield } from 'lucide-react'

interface AuditEntry {
  id: string
  timestamp: Date
  actor: string
  actorRole: 'owner' | 'admin' | 'coach' | 'system'
  action: string
  entity: string
  entityType: 'student' | 'family' | 'payment' | 'event' | 'incident' | 'staff' | 'settings' | 'inventory'
  details: string
  campus?: string
}

const DEMO_AUDIT_LOG: AuditEntry[] = [
  {
    id: 'al1',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    actor: 'Patrick Metzger',
    actorRole: 'owner',
    action: 'Updated',
    entity: 'Thompson Family',
    entityType: 'family',
    details: 'Changed billing status from "Overdue" to "Current"',
    campus: 'Pace'
  },
  {
    id: 'al2',
    timestamp: new Date(Date.now() - 1000 * 60 * 20),
    actor: 'Sarah Johnson',
    actorRole: 'admin',
    action: 'Approved',
    entity: 'Incident #IR-2024-015',
    entityType: 'incident',
    details: 'Reviewed and approved incident report for Jake S.',
    campus: 'Pace'
  },
  {
    id: 'al3',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    actor: 'Coach Williams',
    actorRole: 'coach',
    action: 'Logged',
    entity: 'Morning Attendance',
    entityType: 'student',
    details: 'Marked 45 present, 3 absent, 1 tardy for AM session',
    campus: 'Pace'
  },
  {
    id: 'al4',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    actor: 'System',
    actorRole: 'system',
    action: 'Processed',
    entity: 'Auto-Payment $850.00',
    entityType: 'payment',
    details: 'Auto-charged card on file for Johnson Family monthly tuition',
    campus: 'Pace'
  },
  {
    id: 'al5',
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    actor: 'Patrick Metzger',
    actorRole: 'owner',
    action: 'Archived',
    entity: 'Rodriguez Family',
    entityType: 'family',
    details: 'Family withdrew — archived all student records',
    campus: 'Navarre'
  },
  {
    id: 'al6',
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    actor: 'Sarah Johnson',
    actorRole: 'admin',
    action: 'Created',
    entity: 'Spring Science Fair',
    entityType: 'event',
    details: 'Added new event for May 30, 2026 with 50 seat capacity',
    campus: 'Pace'
  },
  {
    id: 'al7',
    timestamp: new Date(Date.now() - 1000 * 60 * 150),
    actor: 'Patrick Metzger',
    actorRole: 'owner',
    action: 'Modified',
    entity: 'Tuition Rates',
    entityType: 'settings',
    details: 'Updated Grade 9-12 monthly tuition from $850 to $900',
  },
  {
    id: 'al8',
    timestamp: new Date(Date.now() - 1000 * 60 * 180),
    actor: 'System',
    actorRole: 'system',
    action: 'Alert',
    entity: 'School T-Shirt (M)',
    entityType: 'inventory',
    details: 'Stock fell below threshold (3 remaining, threshold: 10)',
    campus: 'Pace'
  },
  {
    id: 'al9',
    timestamp: new Date(Date.now() - 1000 * 60 * 240),
    actor: 'Coach Davis',
    actorRole: 'coach',
    action: 'Filed',
    entity: 'Incident Report',
    entityType: 'incident',
    details: 'Behavioral incident in Room 3 — verbal warning issued',
    campus: 'Pace'
  },
  {
    id: 'al10',
    timestamp: new Date(Date.now() - 1000 * 60 * 300),
    actor: 'Patrick Metzger',
    actorRole: 'owner',
    action: 'Added',
    entity: 'New Staff Member',
    entityType: 'staff',
    details: 'Added Maria Santos as Coach — assigned to Navarre campus',
    campus: 'Navarre'
  },
  {
    id: 'al11',
    timestamp: new Date(Date.now() - 1000 * 60 * 360),
    actor: 'Sarah Johnson',
    actorRole: 'admin',
    action: 'Enrolled',
    entity: 'Garcia Family',
    entityType: 'family',
    details: 'Approved enrollment for Maria (Grade 4) and Carlos (Grade 7)',
    campus: 'Pace'
  },
  {
    id: 'al12',
    timestamp: new Date(Date.now() - 1000 * 60 * 420),
    actor: 'System',
    actorRole: 'system',
    action: 'Sent',
    entity: 'Payment Reminders',
    entityType: 'payment',
    details: 'Auto-sent 5 payment reminder emails to overdue families',
  }
]

function formatTimestamp(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

function getActionColor(action: string): string {
  switch (action.toLowerCase()) {
    case 'created':
    case 'added':
    case 'enrolled': return 'text-green-700 bg-green-100'
    case 'updated':
    case 'modified': return 'text-blue-700 bg-blue-100'
    case 'archived':
    case 'deleted': return 'text-red-700 bg-red-100'
    case 'approved': return 'text-emerald-700 bg-emerald-100'
    case 'logged':
    case 'filed': return 'text-purple-700 bg-purple-100'
    case 'processed':
    case 'sent': return 'text-indigo-700 bg-indigo-100'
    case 'alert': return 'text-orange-700 bg-orange-100'
    default: return 'text-gray-700 bg-gray-100'
  }
}

function getRoleBadge(role: AuditEntry['actorRole']): string {
  switch (role) {
    case 'owner': return 'bg-red-100 text-red-700'
    case 'admin': return 'bg-blue-100 text-blue-700'
    case 'coach': return 'bg-purple-100 text-purple-700'
    case 'system': return 'bg-gray-100 text-gray-700'
  }
}

export function AuditLog() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'owner' | 'admin' | 'coach' | 'system'>('all')
  const [filterType, setFilterType] = useState<'all' | AuditEntry['entityType']>('all')

  const filtered = DEMO_AUDIT_LOG.filter(entry => {
    if (filterRole !== 'all' && entry.actorRole !== filterRole) return false
    if (filterType !== 'all' && entry.entityType !== filterType) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        entry.actor.toLowerCase().includes(q) ||
        entry.entity.toLowerCase().includes(q) ||
        entry.details.toLowerCase().includes(q) ||
        entry.action.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Audit Log</h2>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search audit log..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs text-gray-500">Role:</span>
            </div>
            {(['all', 'owner', 'admin', 'coach', 'system'] as const).map(role => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                  filterRole === role
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {role === 'all' ? 'All' : role === 'admin' ? 'Center Mgr' : role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
            <span className="text-gray-300">|</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">Type:</span>
            </div>
            {(['all', 'student', 'family', 'payment', 'event', 'incident', 'staff', 'settings', 'inventory'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                  filterType === type
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No audit entries found</p>
            </div>
          ) : (
            filtered.map((entry) => (
              <div key={entry.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-1.5">
                      <span className="text-sm font-medium text-gray-900">{entry.actor}</span>
                      <span className={`px-1.5 py-0.5 text-xs rounded font-medium ${getRoleBadge(entry.actorRole)}`}>
                        {entry.actorRole === 'admin' ? 'CM' : entry.actorRole === 'system' ? 'SYS' : entry.actorRole.charAt(0).toUpperCase() + entry.actorRole.slice(1)}
                      </span>
                      <span className={`px-1.5 py-0.5 text-xs rounded font-medium ${getActionColor(entry.action)}`}>
                        {entry.action}
                      </span>
                      <span className="text-sm text-gray-700 font-medium">{entry.entity}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{entry.details}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">{formatTimestamp(entry.timestamp)}</span>
                      {entry.campus && (
                        <span className="text-xs text-gray-400">• {entry.campus}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-center">
          <p className="text-xs text-gray-500">Showing {filtered.length} of {DEMO_AUDIT_LOG.length} entries</p>
        </div>
      </div>
    </div>
  )
}
