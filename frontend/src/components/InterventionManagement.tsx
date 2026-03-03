import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { TrendingUp, Activity, Target, AlertTriangle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface InterventionPlan {
  intervention_id: string
  student_id: string
  campus_id: string
  tier: string
  area: string
  concern_description: string
  intervention_strategy: string
  frequency: string
  duration_weeks: number
  start_date: string
  end_date: string | null
  status: string
  assigned_staff: string
  progress_monitoring_method: string
  success_criteria: string
  notes: string
}

interface InterventionProgress {
  progress_id: string
  intervention_id: string
  date: string
  score: number
  notes: string
  observer: string
}

interface Student {
  student_id: string
  first_name: string
  last_name: string
  grade: string
}

interface InterventionDetail {
  intervention: InterventionPlan
  student: Student
  progress: InterventionProgress[]
}

export function InterventionManagement() {
  const [interventions, setInterventions] = useState<InterventionPlan[]>([])
  const [selectedIntervention, setSelectedIntervention] = useState<InterventionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterTier, setFilterTier] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    fetchInterventions()
  }, [])

  const fetchInterventions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/interventions`)
      const data = await response.json()
      setInterventions(data)
    } catch (error) {
      console.error('Error fetching interventions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInterventionDetails = async (interventionId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/interventions/${interventionId}`)
      const data = await response.json()
      setSelectedIntervention(data)
    } catch (error) {
      console.error('Error fetching intervention details:', error)
    }
  }

  const filteredInterventions = interventions.filter(intervention => {
    if (filterTier !== 'all' && intervention.tier !== filterTier) return false
    if (filterStatus !== 'all' && intervention.status !== filterStatus) return false
    return true
  })

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Tier 1': return 'bg-green-100 text-green-800'
      case 'Tier 2': return 'bg-yellow-100 text-yellow-800'
      case 'Tier 3': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-blue-100 text-blue-800'
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'Discontinued': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const prepareChartData = (progress: InterventionProgress[]) => {
    return progress.map(p => ({
      date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: p.score
    }))
  }

  if (loading) {
    return <div className="p-6">Loading interventions...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">RTI Intervention Management</h1>
          <p className="text-gray-600">Track and monitor Response to Intervention plans</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Interventions</p>
                <p className="text-2xl font-bold">{interventions.length}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tier 2</p>
                <p className="text-2xl font-bold">{interventions.filter(i => i.tier === 'Tier 2').length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tier 3</p>
                <p className="text-2xl font-bold">{interventions.filter(i => i.tier === 'Tier 3').length}</p>
              </div>
              <Target className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold">{interventions.filter(i => i.status === 'Active').length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="all">All Tiers</option>
          <option value="Tier 1">Tier 1</option>
          <option value="Tier 2">Tier 2</option>
          <option value="Tier 3">Tier 3</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="all">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="Discontinued">Discontinued</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Intervention Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredInterventions.map(intervention => (
                <div
                  key={intervention.intervention_id}
                  onClick={() => fetchInterventionDetails(intervention.intervention_id)}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">Student ID: {intervention.student_id}</h3>
                      <p className="text-sm text-gray-600">{intervention.area}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(intervention.tier)}`}>
                        {intervention.tier}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(intervention.status)}`}>
                        {intervention.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{intervention.concern_description}</p>
                  <div className="text-xs text-gray-600">
                    <p>Strategy: {intervention.intervention_strategy}</p>
                    <p>Frequency: {intervention.frequency} | Duration: {intervention.duration_weeks} weeks</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedIntervention && (
          <Card>
            <CardHeader>
              <CardTitle>Intervention Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Student Information</h3>
                <p className="text-lg">{selectedIntervention.student.first_name} {selectedIntervention.student.last_name}</p>
                <p className="text-sm text-gray-600">Grade {selectedIntervention.student.grade}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Intervention Details</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Tier:</span> {selectedIntervention.intervention.tier}</p>
                  <p><span className="font-medium">Area:</span> {selectedIntervention.intervention.area}</p>
                  <p><span className="font-medium">Status:</span> {selectedIntervention.intervention.status}</p>
                  <p><span className="font-medium">Start Date:</span> {new Date(selectedIntervention.intervention.start_date).toLocaleDateString()}</p>
                  <p><span className="font-medium">Duration:</span> {selectedIntervention.intervention.duration_weeks} weeks</p>
                  <p><span className="font-medium">Frequency:</span> {selectedIntervention.intervention.frequency}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Concern</h3>
                <p className="text-sm text-gray-700">{selectedIntervention.intervention.concern_description}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Strategy</h3>
                <p className="text-sm text-gray-700">{selectedIntervention.intervention.intervention_strategy}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Success Criteria</h3>
                <p className="text-sm text-gray-700">{selectedIntervention.intervention.success_criteria}</p>
              </div>

              {selectedIntervention.progress.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Progress Monitoring ({selectedIntervention.progress.length} data points)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={prepareChartData(selectedIntervention.progress)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {selectedIntervention.progress.slice(-3).reverse().map(p => (
                      <div key={p.progress_id} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{new Date(p.date).toLocaleDateString()}</span>
                          <span className="font-bold text-blue-600">{p.score}</span>
                        </div>
                        {p.notes && <p className="text-gray-600 text-xs mt-1">{p.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
