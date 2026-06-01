import { useState, useEffect, useCallback } from 'react'
import {
  Bot, Play, RefreshCw, Clock, CheckCircle, XCircle,
  AlertTriangle, Settings, ChevronDown, ChevronUp, Zap, Mail,
  BarChart3, UserCheck, CalendarClock, Package, Cake
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface AutonomousTask {
  task_id: string
  task_type: string
  name: string
  description: string
  enabled: boolean
  schedule_cron: string | null
  schedule_interval_minutes: number | null
  config_json: string
  last_run: string | null
  next_run: string | null
  created_at: string | null
}

interface TaskLog {
  log_id: string
  task_id: string
  task_type: string
  task_name: string
  status: string
  started_at: string | null
  completed_at: string | null
  result_summary: string
  details_json: string
  items_processed: number
  errors: string | null
}

interface SchedulerStatus {
  scheduler_running: boolean
  active_jobs: number
  jobs: { job_id: string; next_run: string | null }[]
}

const TASK_ICONS: Record<string, typeof Bot> = {
  payment_reminders: Mail,
  weekly_summary: BarChart3,
  at_risk_flagging: UserCheck,
  re_enrollment_reminders: CalendarClock,
  low_inventory_alerts: Package,
  birthday_messages: Cake,
}

function formatSchedule(task: AutonomousTask): string {
  if (task.schedule_cron) {
    const parts = task.schedule_cron.split(' ')
    if (parts.length >= 5) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const hour = parts[1]
      const dow = parts[4]
      if (dow !== '*') {
        const dayNum = parseInt(dow)
        const dayName = dayNames[dayNum] || dow
        return `${dayName} at ${hour}:${parts[0].padStart(2, '0')}`
      }
      return `Daily at ${hour}:${parts[0].padStart(2, '0')}`
    }
    return task.schedule_cron
  }
  if (task.schedule_interval_minutes) {
    const mins = task.schedule_interval_minutes
    if (mins >= 1440) return `Every ${Math.round(mins / 1440)} day(s)`
    if (mins >= 60) return `Every ${Math.round(mins / 60)} hour(s)`
    return `Every ${mins} min`
  }
  return 'Not scheduled'
}

function formatTimeAgo(isoStr: string | null): string {
  if (!isoStr) return 'Never'
  const d = new Date(isoStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

export function AutonomousTaskManager() {
  const [tasks, setTasks] = useState<AutonomousTask[]>([])
  const [logs, setLogs] = useState<TaskLog[]>([])
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'tasks' | 'logs'>('tasks')
  const [runningTask, setRunningTask] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')

  const fetchAll = useCallback(async () => {
    try {
      const [tasksRes, logsRes, statusRes] = await Promise.all([
        fetch(`${API_URL}/api/autonomous-tasks`),
        fetch(`${API_URL}/api/autonomous-task-logs?limit=100`),
        fetch(`${API_URL}/api/autonomous-tasks/status`),
      ])
      if (tasksRes.ok) setTasks(await tasksRes.json())
      if (logsRes.ok) setLogs(await logsRes.json())
      if (statusRes.ok) setSchedulerStatus(await statusRes.json())
    } catch (err) {
      console.error('Failed to fetch autonomous tasks:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 30000)
    return () => clearInterval(interval)
  }, [fetchAll])

  const toggleTask = async (taskId: string, enabled: boolean) => {
    try {
      await fetch(`${API_URL}/api/autonomous-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })
      fetchAll()
    } catch (err) {
      console.error('Failed to toggle task:', err)
    }
  }

  const runNow = async (taskId: string) => {
    setRunningTask(taskId)
    try {
      await fetch(`${API_URL}/api/autonomous-tasks/${taskId}/run`, { method: 'POST' })
      setTimeout(fetchAll, 1500)
    } catch (err) {
      console.error('Failed to run task:', err)
    } finally {
      setTimeout(() => setRunningTask(null), 2000)
    }
  }

  const getTaskLogs = (taskId: string) => logs.filter(l => l.task_id === taskId)

  const completedCount = logs.filter(l => l.status === 'completed').length
  const failedCount = logs.filter(l => l.status === 'failed').length
  const enabledCount = tasks.filter(t => t.enabled).length

  const filteredLogs = filterType === 'all' ? logs : logs.filter(l => l.task_type === filterType)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-2" />
        <span className="text-gray-500">Loading autonomous tasks...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Autonomous AI Agent</h2>
            <p className="text-sm text-gray-500">Background tasks that run without anyone logged in</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
            schedulerStatus?.scheduler_running
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              schedulerStatus?.scheduler_running ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`} />
            {schedulerStatus?.scheduler_running ? 'Running' : 'Stopped'}
          </div>
          <Button variant="outline" size="sm" onClick={fetchAll}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{enabledCount}</p>
              <p className="text-xs text-gray-500">Active Tasks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedCount}</p>
              <p className="text-xs text-gray-500">Completed Runs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{failedCount}</p>
              <p className="text-xs text-gray-500">Failed Runs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{schedulerStatus?.active_jobs || 0}</p>
              <p className="text-xs text-gray-500">Scheduled Jobs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'tasks' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('tasks')}
        >
          <Settings className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          Task Configuration
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'logs' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('logs')}
        >
          <Clock className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          Execution Log ({logs.length})
        </button>
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="space-y-3">
          {tasks.map(task => {
            const Icon = TASK_ICONS[task.task_type] || Bot
            const taskLogs = getTaskLogs(task.task_id)
            const lastLog = taskLogs[0]
            const isExpanded = expandedTask === task.task_id
            const isRunning = runningTask === task.task_id

            return (
              <Card key={task.task_id} className={`transition-all ${!task.enabled ? 'opacity-60' : ''}`}>
                <CardContent className="p-0">
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 rounded-t-lg"
                    onClick={() => setExpandedTask(isExpanded ? null : task.task_id)}
                  >
                    <div className={`p-2.5 rounded-lg ${task.enabled ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gray-300'}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800">{task.name}</h3>
                        {lastLog && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            lastLog.status === 'completed' ? 'bg-green-100 text-green-700' :
                            lastLog.status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {lastLog.status === 'completed' ? 'Last run: OK' :
                             lastLog.status === 'failed' ? 'Last run: Failed' : 'Running...'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">{task.description}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Schedule</p>
                        <p className="text-sm font-medium text-gray-600">{formatSchedule(task)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Last Run</p>
                        <p className="text-sm font-medium text-gray-600">{formatTimeAgo(task.last_run)}</p>
                      </div>
                      <button
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          task.enabled ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleTask(task.task_id, !task.enabled)
                        }}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          task.enabled ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isRunning}
                        onClick={(e) => {
                          e.stopPropagation()
                          runNow(task.task_id)
                        }}
                      >
                        {isRunning ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t px-4 py-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Configuration</h4>
                          <div className="bg-white rounded-lg border p-3 text-sm">
                            <pre className="whitespace-pre-wrap text-gray-600 font-mono text-xs">
                              {JSON.stringify(JSON.parse(task.config_json || '{}'), null, 2)}
                            </pre>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Runs ({taskLogs.length})</h4>
                          {taskLogs.length === 0 ? (
                            <p className="text-sm text-gray-400">No runs yet</p>
                          ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {taskLogs.slice(0, 5).map(log => (
                                <div key={log.log_id} className="bg-white rounded-lg border p-2.5 text-sm">
                                  <div className="flex items-center justify-between">
                                    <span className={`flex items-center gap-1 text-xs font-medium ${
                                      log.status === 'completed' ? 'text-green-600' :
                                      log.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                                    }`}>
                                      {log.status === 'completed' ? <CheckCircle className="w-3 h-3" /> :
                                       log.status === 'failed' ? <XCircle className="w-3 h-3" /> :
                                       <RefreshCw className="w-3 h-3 animate-spin" />}
                                      {log.status}
                                    </span>
                                    <span className="text-xs text-gray-400">{formatTimeAgo(log.started_at)}</span>
                                  </div>
                                  <p className="text-xs text-gray-600 mt-1">{log.result_summary}</p>
                                  {log.items_processed > 0 && (
                                    <p className="text-xs text-gray-400 mt-0.5">{log.items_processed} item(s) processed</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <button
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterType === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              onClick={() => setFilterType('all')}
            >
              All
            </button>
            {Array.from(new Set(logs.map(l => l.task_type))).map(type => (
              <button
                key={type}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterType === type ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                onClick={() => setFilterType(type)}
              >
                {type.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No execution logs yet</p>
              <p className="text-sm">Tasks will log their activity here as they run</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map(log => {
                const isExpanded = expandedLog === log.log_id
                let details = null
                try {
                  details = JSON.parse(log.details_json || '{}')
                } catch {
                  details = {}
                }

                return (
                  <Card key={log.log_id}>
                    <CardContent className="p-0">
                      <div
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => setExpandedLog(isExpanded ? null : log.log_id)}
                      >
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          log.status === 'completed' ? 'bg-green-500' :
                          log.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-800">{log.task_name}</span>
                            <span className={`px-1.5 py-0.5 rounded text-xs ${
                              log.status === 'completed' ? 'bg-green-50 text-green-600' :
                              log.status === 'failed' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
                            }`}>{log.status}</span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{log.result_summary}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-gray-400">{formatTimeAgo(log.started_at)}</p>
                          {log.items_processed > 0 && (
                            <p className="text-xs text-gray-500">{log.items_processed} items</p>
                          )}
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>

                      {isExpanded && (
                        <div className="border-t px-4 py-3 bg-gray-50">
                          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                              <span className="text-gray-400 text-xs">Started</span>
                              <p className="text-gray-700">{log.started_at ? new Date(log.started_at).toLocaleString() : '-'}</p>
                            </div>
                            <div>
                              <span className="text-gray-400 text-xs">Completed</span>
                              <p className="text-gray-700">{log.completed_at ? new Date(log.completed_at).toLocaleString() : '-'}</p>
                            </div>
                          </div>
                          {log.errors && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                              <p className="text-sm text-red-700 flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4" /> {log.errors}
                              </p>
                            </div>
                          )}
                          {details && Object.keys(details).length > 0 && (
                            <div>
                              <p className="text-xs text-gray-400 mb-1">Details</p>
                              <pre className="bg-white border rounded-lg p-3 text-xs font-mono text-gray-600 whitespace-pre-wrap max-h-60 overflow-y-auto">
                                {JSON.stringify(details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
