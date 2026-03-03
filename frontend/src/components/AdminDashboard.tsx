import { useState, useEffect } from 'react'
import { Users, DollarSign, Calendar, AlertTriangle, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface DashboardData {
  total_students: number
  morning_count: number
  afternoon_count: number
  total_families: number
  billing_summary: {
    green: number
    yellow: number
    red: number
    total_balance: number
  }
  attendance_today: {
    present: number
    absent: number
    tardy: number
  }
  alerts: {
    at_risk_students: number
    ixl_behind: number
    overdue_families: number
  }
}

interface Student {
  student_id: string
  first_name: string
  last_name: string
  grade: string
  session: string
  room: string
  family_id: string
  attendance_present_count: number
  attendance_absent_count: number
  attendance_tardy_count: number
  overall_grade_flag: string
  ixl_status_flag: string
  overall_risk_flag: string
}

interface Family {
  family_id: string
  family_name: string
  student_ids: string[]
  monthly_tuition_amount: number
  current_balance: number
  billing_status: string
  last_payment_date: string
}

export function AdminDashboard() {
  const [view, setView] = useState<'dashboard' | 'students' | 'families' | 'attendance' | 'ixl' | 'ask-auvora'>('dashboard')
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [families, setFamilies] = useState<Family[]>([])
  const [askAuvoraQuery, setAskAuvoraQuery] = useState('')
  const [askAuvoraResults, setAskAuvoraResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (view === 'dashboard') {
      fetchDashboardData()
    } else if (view === 'students') {
      fetchStudents()
    } else if (view === 'families') {
      fetchFamilies()
    }
  }, [view])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/dashboard/admin`)
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/students`)
      const data = await response.json()
      setStudents(data)
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const fetchFamilies = async () => {
    try {
      const response = await fetch(`${API_URL}/api/families`)
      const data = await response.json()
      setFamilies(data)
    } catch (error) {
      console.error('Error fetching families:', error)
    }
  }

  const handleAskAuvora = async () => {
    if (!askAuvoraQuery.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/ask-auvora?query=${encodeURIComponent(askAuvoraQuery)}`)
      const data = await response.json()
      setAskAuvoraResults(data)
    } catch (error) {
      console.error('Error querying Ask Auvora:', error)
    } finally {
      setLoading(false)
    }
  }

  const getBillingStatusColor = (status: string) => {
    switch (status) {
      case 'Green': return 'text-green-600 bg-green-100'
      case 'Yellow': return 'text-yellow-600 bg-yellow-100'
      case 'Red': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getRiskFlagColor = (flag: string) => {
    switch (flag) {
      case 'None': return 'text-green-600 bg-green-100'
      case 'Watch': return 'text-yellow-600 bg-yellow-100'
      case 'At risk': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 py-4">
            <button
              onClick={() => setView('dashboard')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'dashboard'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setView('students')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'students'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Students
            </button>
            <button
              onClick={() => setView('families')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'families'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Families & Billing
            </button>
            <button
              onClick={() => setView('ask-auvora')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'ask-auvora'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Ask Auvora
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'dashboard' && dashboardData && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.total_students}</div>
                  <p className="text-xs text-gray-500">
                    {dashboardData.morning_count} Morning / {dashboardData.afternoon_count} Afternoon
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Families</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.total_families}</div>
                  <p className="text-xs text-gray-500">Active families</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${dashboardData.billing_summary.total_balance.toFixed(2)}</div>
                  <p className="text-xs text-gray-500">
                    {dashboardData.billing_summary.red} families overdue
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Attendance Today</CardTitle>
                  <Calendar className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.attendance_today.present}</div>
                  <p className="text-xs text-gray-500">
                    {dashboardData.attendance_today.absent} absent / {dashboardData.attendance_today.tardy} tardy
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-l-4 border-red-500">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center">
                    <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                    At-Risk Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{dashboardData.alerts.at_risk_students}</div>
                  <p className="text-xs text-gray-500 mt-2">Require immediate attention</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-yellow-500">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                    IXL Behind
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">{dashboardData.alerts.ixl_behind}</div>
                  <p className="text-xs text-gray-500 mt-2">Need IXL support</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-orange-500">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center">
                    <DollarSign className="h-4 w-4 text-orange-500 mr-2" />
                    Overdue Families
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">{dashboardData.alerts.overdue_families}</div>
                  <p className="text-xs text-gray-500 mt-2">Payment follow-up needed</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Billing Status Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500">Current</div>
                    <div className="text-2xl font-bold text-green-600">{dashboardData.billing_summary.green}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500">Due Soon</div>
                    <div className="text-2xl font-bold text-yellow-600">{dashboardData.billing_summary.yellow}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500">Overdue</div>
                    <div className="text-2xl font-bold text-red-600">{dashboardData.billing_summary.red}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {view === 'students' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Students</h2>
            
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grades</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IXL</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student.student_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {student.first_name} {student.last_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.grade}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.session}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.room}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.attendance_present_count}P / {student.attendance_absent_count}A / {student.attendance_tardy_count}T
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              student.overall_grade_flag === 'On track' ? 'bg-green-100 text-green-800' :
                              student.overall_grade_flag === 'Needs attention' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {student.overall_grade_flag}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              student.ixl_status_flag === 'On track' ? 'bg-green-100 text-green-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {student.ixl_status_flag}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskFlagColor(student.overall_risk_flag)}`}>
                              {student.overall_risk_flag}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {view === 'families' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Families & Billing</h2>
            
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Family Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly Tuition</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Balance</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Payment</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {families.map((family) => (
                        <tr key={family.family_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{family.family_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {family.student_ids.length} student{family.student_ids.length !== 1 ? 's' : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${family.monthly_tuition_amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            ${family.current_balance.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBillingStatusColor(family.billing_status)}`}>
                              {family.billing_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {family.last_payment_date ? new Date(family.last_payment_date).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {view === 'ask-auvora' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Ask Auvora</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Search</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Ask a question... (e.g., 'Show me students with more than 3 absences')"
                    value={askAuvoraQuery}
                    onChange={(e) => setAskAuvoraQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAskAuvora()}
                    className="flex-1"
                  />
                  <Button onClick={handleAskAuvora} disabled={loading} className="bg-red-600 hover:bg-red-700">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>

                {askAuvoraResults && (
                  <div className="mt-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold">Results for: "{askAuvoraResults.query}"</h3>
                      <p className="text-sm text-gray-500">Found {askAuvoraResults.count} results</p>
                    </div>

                    {askAuvoraResults.result_type === 'students' && askAuvoraResults.results.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full border">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Grade</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Room</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Attendance</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Risk</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {askAuvoraResults.results.map((student: Student) => (
                              <tr key={student.student_id}>
                                <td className="px-4 py-2 text-sm">{student.first_name} {student.last_name}</td>
                                <td className="px-4 py-2 text-sm">{student.grade}</td>
                                <td className="px-4 py-2 text-sm">{student.room}</td>
                                <td className="px-4 py-2 text-sm">{student.attendance_present_count}P / {student.attendance_absent_count}A</td>
                                <td className="px-4 py-2">
                                  <span className={`px-2 py-1 text-xs rounded-full ${getRiskFlagColor(student.overall_risk_flag)}`}>
                                    {student.overall_risk_flag}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {askAuvoraResults.result_type === 'families' && askAuvoraResults.results.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full border">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Family</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Balance</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {askAuvoraResults.results.map((family: Family) => (
                              <tr key={family.family_id}>
                                <td className="px-4 py-2 text-sm">{family.family_name}</td>
                                <td className="px-4 py-2 text-sm font-medium">${family.current_balance.toFixed(2)}</td>
                                <td className="px-4 py-2">
                                  <span className={`px-2 py-1 text-xs rounded-full ${getBillingStatusColor(family.billing_status)}`}>
                                    {family.billing_status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {askAuvoraResults.count === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No results found for your query.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Example Queries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="justify-start text-left h-auto py-2"
                    onClick={() => {
                      setAskAuvoraQuery('Show me students with more than 3 absences')
                      setTimeout(handleAskAuvora, 100)
                    }}
                  >
                    Show me students with more than 3 absences
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start text-left h-auto py-2"
                    onClick={() => {
                      setAskAuvoraQuery('Show me all students who are not up to date with their monthly payments')
                      setTimeout(handleAskAuvora, 100)
                    }}
                  >
                    Show students not up to date with payments
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start text-left h-auto py-2"
                    onClick={() => {
                      setAskAuvoraQuery('Show me at-risk students')
                      setTimeout(handleAskAuvora, 100)
                    }}
                  >
                    Show me at-risk students
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start text-left h-auto py-2"
                    onClick={() => {
                      setAskAuvoraQuery('Show me families with a balance over 250')
                      setTimeout(handleAskAuvora, 100)
                    }}
                  >
                    Show families with balance over $250
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
