import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { FileText, Users, Target, Calendar, AlertCircle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface IEP504Plan {
  plan_id: string
  student_id: string
  campus_id: string
  plan_type: string
  status: string
  start_date: string
  end_date: string
  case_manager: string
  disability_category: string | null
  meeting_date: string
  next_review_date: string
  parent_consent_date: string | null
  notes: string
  student_name?: string
  student_grade?: string
}

interface Accommodation {
  accommodation_id: string
  plan_id: string
  type: string
  description: string
  frequency: string
  responsible_staff: string
  implementation_notes: string
}

interface IEPGoal {
  goal_id: string
  plan_id: string
  area: string
  goal_description: string
  baseline: string
  target: string
  target_date: string
  status: string
  progress_percentage: number
  last_updated: string
}

interface Student {
  student_id: string
  first_name: string
  last_name: string
  grade: string
}

interface PlanDetail {
  plan: IEP504Plan
  student: Student
  accommodations: Accommodation[]
  goals: IEPGoal[]
}

export function IEP504Management() {
  const [plans, setPlans] = useState<IEP504Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<PlanDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_URL}/api/iep-504-plans`)
      const data = await response.json()
      setPlans(data)
    } catch (error) {
      console.error('Error fetching IEP/504 plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPlanDetails = async (planId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/iep-504-plans/${planId}`)
      const data = await response.json()
      setSelectedPlan(data)
    } catch (error) {
      console.error('Error fetching plan details:', error)
    }
  }

  const filteredPlans = plans.filter(plan => {
    if (filterStatus !== 'all' && plan.status !== filterStatus) return false
    if (filterType !== 'all' && plan.plan_type !== filterType) return false
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Under Review': return 'bg-yellow-100 text-yellow-800'
      case 'Expired': return 'bg-red-100 text-red-800'
      case 'Draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case 'Achieved': return 'bg-green-100 text-green-800'
      case 'In Progress': return 'bg-blue-100 text-blue-800'
      case 'Not Started': return 'bg-gray-100 text-gray-800'
      case 'Discontinued': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="p-6">Loading IEP/504 plans...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">IEP/504 Management</h1>
          <p className="text-gray-600">Manage individualized education plans and 504 accommodations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Plans</p>
                <p className="text-2xl font-bold">{plans.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Plans</p>
                <p className="text-2xl font-bold">{plans.filter(p => p.status === 'Active').length}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">IEP Plans</p>
                <p className="text-2xl font-bold">{plans.filter(p => p.plan_type === 'IEP').length}</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">504 Plans</p>
                <p className="text-2xl font-bold">{plans.filter(p => p.plan_type === 'Section 504').length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="all">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Under Review">Under Review</option>
          <option value="Expired">Expired</option>
          <option value="Draft">Draft</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="all">All Types</option>
          <option value="IEP">IEP</option>
          <option value="Section 504">Section 504</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Plans Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredPlans.map(plan => (
                <div
                  key={plan.plan_id}
                  onClick={() => fetchPlanDetails(plan.plan_id)}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{plan.student_name || `Student ${plan.student_id}`}</h3>
                      <p className="text-sm text-gray-600">{plan.plan_type} {plan.student_grade ? `• Grade ${plan.student_grade}` : ''}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                      {plan.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Review: {new Date(plan.next_review_date).toLocaleDateString()}</span>
                    </div>
                    {plan.disability_category && (
                      <div className="text-xs">
                        {plan.disability_category}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedPlan && (
          <Card>
            <CardHeader>
              <CardTitle>Plan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Student Information</h3>
                <p className="text-lg">{selectedPlan.student.first_name} {selectedPlan.student.last_name}</p>
                <p className="text-sm text-gray-600">Grade {selectedPlan.student.grade}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Plan Information</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Type:</span> {selectedPlan.plan.plan_type}</p>
                  <p><span className="font-medium">Status:</span> {selectedPlan.plan.status}</p>
                  <p><span className="font-medium">Start Date:</span> {new Date(selectedPlan.plan.start_date).toLocaleDateString()}</p>
                  <p><span className="font-medium">End Date:</span> {new Date(selectedPlan.plan.end_date).toLocaleDateString()}</p>
                  <p><span className="font-medium">Next Review:</span> {new Date(selectedPlan.plan.next_review_date).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Accommodations ({selectedPlan.accommodations.length})</h3>
                <div className="space-y-2">
                  {selectedPlan.accommodations.map(acc => (
                    <div key={acc.accommodation_id} className="p-3 bg-blue-50 rounded-lg">
                      <p className="font-medium text-sm">{acc.type}</p>
                      <p className="text-sm text-gray-700">{acc.description}</p>
                      <p className="text-xs text-gray-600 mt-1">Frequency: {acc.frequency}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPlan.goals.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">IEP Goals ({selectedPlan.goals.length})</h3>
                  <div className="space-y-3">
                    {selectedPlan.goals.map(goal => (
                      <div key={goal.goal_id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium text-sm">{goal.area}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGoalStatusColor(goal.status)}`}>
                            {goal.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{goal.goal_description}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${goal.progress_percentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{goal.progress_percentage}%</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          <p>Baseline: {goal.baseline}</p>
                          <p>Target: {goal.target}</p>
                        </div>
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
