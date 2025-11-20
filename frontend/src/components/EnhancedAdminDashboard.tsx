import { useState, useEffect } from 'react'
import { Users, DollarSign, Calendar, AlertTriangle, UserPlus, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StudentDetailsModal } from './StudentDetailsModal'
import { AskAuvoraWidget } from './AskAuvoraWidget'
import { EventsCalendar } from './EventsCalendar'
import { DocumentManagement } from './DocumentManagement'
import { StoreComponent } from './StoreComponent'
import { PhotoGallery } from './PhotoGallery'
import { MessagingPlatform } from './MessagingPlatform'
import { IncidentReporting } from './IncidentReporting'
import { HealthRecords } from './HealthRecords'
import { AdminRevenueReports } from './AdminRevenueReports'
import { CampusSwitcher } from './CampusSwitcher'
import { AddStudentModal } from './AddStudentModal'
import FinancialManagement from './FinancialManagement'
import AdmissionsPipeline from './AdmissionsPipeline'
import CommunicationAutomation from './CommunicationAutomation'
import StandardsGradebook from './StandardsGradebook'
import { IEP504Management } from './IEP504Management'
import { InterventionManagement } from './InterventionManagement'
import { AdvancedAnalyticsDashboard } from './AdvancedAnalyticsDashboard'
import { AnnouncementManagement } from './AnnouncementManagement'
import { StaffManagement } from './StaffManagement'

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

export function EnhancedAdminDashboard() {
  const [view, setView] = useState<'dashboard' | 'students' | 'families-finance' | 'admissions' | 'academics' | 'student-support' | 'communications' | 'operations' | 'documents' | 'analytics'>('dashboard')
  const [subView, setSubView] = useState<string>('main')
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [families, setFamilies] = useState<Family[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [drillDownView, setDrillDownView] = useState<'at-risk' | 'ixl-behind' | 'overdue' | null>(null)
  const [askAuvoraResults, setAskAuvoraResults] = useState<any>(null)
  const [selectedCampusId, setSelectedCampusId] = useState<string | null>(null)
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)

  useEffect(() => {
    if (view === 'dashboard') {
      fetchDashboardData()
    } else if (view === 'students') {
      fetchStudents()
    } else if (view === 'families-finance') {
      fetchFamilies()
    }
  }, [view, selectedCampusId])

  useEffect(() => {
    if (view === 'students') {
      fetchStudents()
    }
  }, [selectedCampusId])

  const fetchDashboardData = async () => {
    try {
      const url = selectedCampusId 
        ? `${API_URL}/api/dashboard/admin?campus_id=${selectedCampusId}`
        : `${API_URL}/api/dashboard/admin`
      const response = await fetch(url)
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  const fetchStudents = async (filter?: string) => {
    try {
      let url = `${API_URL}/api/students`
      const params = new URLSearchParams()
      
      if (selectedCampusId) {
        params.append('campus_id', selectedCampusId)
      }
      
      if (filter) {
        const filterParams = new URLSearchParams(filter)
        filterParams.forEach((value, key) => params.append(key, value))
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      const response = await fetch(url)
      const data = await response.json()
      setStudents(data)
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const fetchFamilies = async (filter?: string) => {
    try {
      const url = filter ? `${API_URL}/api/families?${filter}` : `${API_URL}/api/families`
      const response = await fetch(url)
      const data = await response.json()
      setFamilies(data)
    } catch (error) {
      console.error('Error fetching families:', error)
    }
  }

  const handleCardClick = (type: 'at-risk' | 'ixl-behind' | 'overdue') => {
    setDrillDownView(type)
    setView('students')
    
    if (type === 'at-risk') {
      fetchStudents('risk_flag=At risk')
    } else if (type === 'ixl-behind') {
      fetchStudents('ixl_status=Needs attention')
    } else if (type === 'overdue') {
      setView('families-finance')
      fetchFamilies('billing_status=Red')
    }
  }

  const handleOutstandingBalanceClick = () => {
    setView('families-finance')
    fetchFamilies('billing_status=Red')
  }

  const handleAskAuvora = async (query: string) => {
    try {
      const response = await fetch(`${API_URL}/api/ask-auvora?query=${encodeURIComponent(query)}`)
      const data = await response.json()
      setAskAuvoraResults(data)
      
      if (data.result_type === 'students') {
        setView('students')
        setStudents(data.results)
      } else if (data.result_type === 'families') {
        setView('families-finance')
        setFamilies(data.results)
      }
    } catch (error) {
      console.error('Error querying Ask Auvora:', error)
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
              onClick={() => {
                setView('dashboard')
                setSubView('main')
                setDrillDownView(null)
                setAskAuvoraResults(null)
              }}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'dashboard'
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                setView('students')
                setSubView('main')
                setDrillDownView(null)
                setAskAuvoraResults(null)
                fetchStudents()
              }}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'students'
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Students
            </button>
            <button
              onClick={() => {
                setView('families-finance')
                setSubView('families')
                setDrillDownView(null)
                setAskAuvoraResults(null)
                fetchFamilies()
              }}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'families-finance'
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Families & Finance
            </button>
            <button
              onClick={() => {
                setView('admissions')
                setSubView('main')
              }}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'admissions'
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Admissions
            </button>
            <button
              onClick={() => {
                setView('academics')
                setSubView('standards')
              }}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'academics'
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Academics
            </button>
            <button
              onClick={() => {
                setView('student-support')
                setSubView('iep')
              }}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'student-support'
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Student Support
            </button>
            <button
              onClick={() => {
                setView('communications')
                setSubView('messages')
              }}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'communications'
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Communications
            </button>
            <button
              onClick={() => {
                setView('operations')
                setSubView('events')
              }}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'operations'
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Operations
            </button>
            <button
              onClick={() => {
                setView('documents')
                setSubView('library')
              }}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'documents'
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Documents & Forms
            </button>
            <button
              onClick={() => {
                setView('analytics')
                setSubView('at-risk')
              }}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'analytics'
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'dashboard' && dashboardData && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
              <CampusSwitcher onCampusChange={setSelectedCampusId} selectedCampusId={selectedCampusId} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.total_students}</div>
                  <p className="text-xs text-gray-500">
                    {dashboardData.morning_count} Morning / {dashboardData.afternoon_count} Afternoon
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Families</CardTitle>
                  <Users className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.total_families}</div>
                  <p className="text-xs text-gray-500">Active families</p>
                </CardContent>
              </Card>

              <Card 
                className="hover:shadow-lg transition-shadow cursor-pointer hover:border-amber-600"
                onClick={handleOutstandingBalanceClick}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                  <DollarSign className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${dashboardData.billing_summary.total_balance.toFixed(2)}</div>
                  <p className="text-xs text-gray-500">
                    {dashboardData.billing_summary.red} families overdue
                  </p>
                  <p className="text-xs text-amber-600 mt-1 font-medium">Click to view details →</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Attendance Today</CardTitle>
                  <Calendar className="h-4 w-4 text-amber-600" />
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
              <Card 
                className="border-l-4 border-red-500 hover:shadow-lg transition-shadow cursor-pointer hover:border-red-600"
                onClick={() => handleCardClick('at-risk')}
              >
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center">
                    <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                    At-Risk Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{dashboardData.alerts.at_risk_students}</div>
                  <p className="text-xs text-gray-500 mt-2">Require immediate attention</p>
                  <p className="text-xs text-red-600 mt-1 font-medium">Click to view students →</p>
                </CardContent>
              </Card>

              <Card 
                className="border-l-4 border-yellow-500 hover:shadow-lg transition-shadow cursor-pointer hover:border-yellow-600"
                onClick={() => handleCardClick('ixl-behind')}
              >
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                    IXL Behind
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">{dashboardData.alerts.ixl_behind}</div>
                  <p className="text-xs text-gray-500 mt-2">Need IXL support</p>
                  <p className="text-xs text-yellow-600 mt-1 font-medium">Click to view students →</p>
                </CardContent>
              </Card>

              <Card 
                className="border-l-4 border-orange-500 hover:shadow-lg transition-shadow cursor-pointer hover:border-orange-600"
                onClick={() => handleCardClick('overdue')}
              >
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center">
                    <DollarSign className="h-4 w-4 text-orange-500 mr-2" />
                    Overdue Families
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">{dashboardData.alerts.overdue_families}</div>
                  <p className="text-xs text-gray-500 mt-2">Payment follow-up needed</p>
                  <p className="text-xs text-orange-600 mt-1 font-medium">Click to view families →</p>
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
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Students</h2>
                {drillDownView && (
                  <p className="text-sm text-gray-600 mt-1">
                    Showing: {drillDownView === 'at-risk' ? 'At-Risk Students' : 'Students Behind in IXL'}
                  </p>
                )}
                {askAuvoraResults && (
                  <p className="text-sm text-gray-600 mt-1">
                    Results for: "{askAuvoraResults.query}" ({askAuvoraResults.count} found)
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <CampusSwitcher 
                  selectedCampusId={selectedCampusId}
                  onCampusChange={setSelectedCampusId}
                />
                <Button
                  onClick={() => setShowAddStudentModal(true)}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Student
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const campusParam = selectedCampusId ? `?campus_id=${selectedCampusId}` : '';
                    window.open(`${API_URL}/api/students/export/csv${campusParam}`, '_blank');
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                {(drillDownView || askAuvoraResults) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDrillDownView(null)
                      setAskAuvoraResults(null)
                      fetchStudents()
                    }}
                  >
                    Show All Students
                  </Button>
                )}
              </div>
            </div>
            
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
                        <tr 
                          key={student.student_id} 
                          className="hover:bg-amber-50 cursor-pointer transition-colors"
                          onClick={() => setSelectedStudentId(student.student_id)}
                        >
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

        {view === 'families-finance' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Families & Billing</h2>
                {drillDownView === 'overdue' && (
                  <p className="text-sm text-gray-600 mt-1">
                    Showing: Overdue Families
                  </p>
                )}
                {askAuvoraResults && (
                  <p className="text-sm text-gray-600 mt-1">
                    Results for: "{askAuvoraResults.query}" ({askAuvoraResults.count} found)
                  </p>
                )}
              </div>
              {(drillDownView || askAuvoraResults) && (
                <button
                  onClick={() => {
                    setDrillDownView(null)
                    setAskAuvoraResults(null)
                    fetchFamilies()
                  }}
                  className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md"
                >
                  Show All Families
                </button>
              )}
            </div>
            
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
                        <tr key={family.family_id} className="hover:bg-amber-50 cursor-pointer transition-colors">
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

        {view === 'families-finance' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">Families & Finance</h2>
              <CampusSwitcher onCampusChange={setSelectedCampusId} selectedCampusId={selectedCampusId} />
            </div>
            <Tabs value={subView} onValueChange={setSubView} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="families">Families</TabsTrigger>
                <TabsTrigger value="billing">Billing & Invoicing</TabsTrigger>
                <TabsTrigger value="revenue">Revenue & Reconciliation</TabsTrigger>
                <TabsTrigger value="store">Store / POS</TabsTrigger>
              </TabsList>
              <TabsContent value="families" className="mt-6">
                {families.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>All Families</CardTitle>
                    </CardHeader>
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
                              <tr key={family.family_id} className="hover:bg-amber-50 cursor-pointer transition-colors">
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
                )}
              </TabsContent>
              <TabsContent value="billing" className="mt-6">
                <FinancialManagement selectedCampusId={selectedCampusId} />
              </TabsContent>
              <TabsContent value="revenue" className="mt-6">
                <AdminRevenueReports role="admin" />
              </TabsContent>
              <TabsContent value="store" className="mt-6">
                <StoreComponent role="admin" />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {view === 'admissions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">Admissions</h2>
              <CampusSwitcher onCampusChange={setSelectedCampusId} selectedCampusId={selectedCampusId} />
            </div>
            <AdmissionsPipeline selectedCampusId={selectedCampusId} />
          </div>
        )}

        {view === 'academics' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">Academics</h2>
              <CampusSwitcher onCampusChange={setSelectedCampusId} selectedCampusId={selectedCampusId} />
            </div>
            <Tabs value={subView} onValueChange={setSubView} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="standards">Standards & Gradebook</TabsTrigger>
                <TabsTrigger value="assessments">Assessments & Progress</TabsTrigger>
              </TabsList>
              <TabsContent value="standards" className="mt-6">
                <StandardsGradebook selectedCampusId={selectedCampusId} />
              </TabsContent>
              <TabsContent value="assessments" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Assessments & Progress Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500">Assessment tracking and progress reports coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {view === 'student-support' && (
          <div className="space-y-6">
            <Tabs value={subView} onValueChange={setSubView} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="iep">IEP / 504 Plans</TabsTrigger>
                <TabsTrigger value="interventions">Interventions</TabsTrigger>
              </TabsList>
              <TabsContent value="iep" className="mt-6">
                <IEP504Management />
              </TabsContent>
              <TabsContent value="interventions" className="mt-6">
                <InterventionManagement />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {view === 'communications' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">Communications</h2>
              <CampusSwitcher onCampusChange={setSelectedCampusId} selectedCampusId={selectedCampusId} />
            </div>
            <Tabs value={subView} onValueChange={setSubView} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="messages">Direct Messages</TabsTrigger>
                <TabsTrigger value="broadcasts">Broadcasts & Automation</TabsTrigger>
                <TabsTrigger value="announcements">Announcements</TabsTrigger>
              </TabsList>
              <TabsContent value="messages" className="mt-6">
                <MessagingPlatform role="admin" userId="admin_1" userType="Staff" />
              </TabsContent>
              <TabsContent value="broadcasts" className="mt-6">
                <CommunicationAutomation selectedCampusId={selectedCampusId} />
              </TabsContent>
              <TabsContent value="announcements" className="mt-6">
                <AnnouncementManagement role="admin" userId="admin_1" campusId={selectedCampusId || ''} />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {view === 'operations' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">Operations</h2>
              <CampusSwitcher onCampusChange={setSelectedCampusId} selectedCampusId={selectedCampusId} />
            </div>
            <Tabs value={subView} onValueChange={setSubView} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="events">Events Calendar</TabsTrigger>
                <TabsTrigger value="incidents">Incidents</TabsTrigger>
                <TabsTrigger value="health">Health Records</TabsTrigger>
                <TabsTrigger value="staff">Staff Management</TabsTrigger>
              </TabsList>
              <TabsContent value="events" className="mt-6">
                <EventsCalendar role="admin" />
              </TabsContent>
              <TabsContent value="incidents" className="mt-6">
                <IncidentReporting role="admin" />
              </TabsContent>
              <TabsContent value="health" className="mt-6">
                <HealthRecords role="admin" />
              </TabsContent>
              <TabsContent value="staff" className="mt-6">
                <StaffManagement campusId={selectedCampusId || undefined} />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {view === 'documents' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">Documents & Forms</h2>
              <CampusSwitcher onCampusChange={setSelectedCampusId} selectedCampusId={selectedCampusId} />
            </div>
            <Tabs value={subView} onValueChange={setSubView} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="library">Document Library</TabsTrigger>
                <TabsTrigger value="photos">Photos</TabsTrigger>
              </TabsList>
              <TabsContent value="library" className="mt-6">
                <DocumentManagement role="admin" />
              </TabsContent>
              <TabsContent value="photos" className="mt-6">
                <PhotoGallery role="admin" />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {view === 'analytics' && (
          <div className="space-y-6">
            <AdvancedAnalyticsDashboard />
          </div>
        )}
      </div>

      {/* Student Details Modal */}
      {selectedStudentId && (
        <StudentDetailsModal
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}

      {/* Add Student Modal */}
      <AddStudentModal
        open={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        onStudentAdded={() => {
          setShowAddStudentModal(false)
          fetchStudents()
        }}
        selectedCampusId={selectedCampusId}
      />

      {/* Ask Auvora Widget */}
      <AskAuvoraWidget onSearch={handleAskAuvora} />
    </div>
  )
}
