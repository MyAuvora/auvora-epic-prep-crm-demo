import { useState, useEffect } from 'react'
import { Users, DollarSign, Calendar, AlertTriangle, UserPlus, Download, Eye, MessageSquare, FileWarning, Menu, Link, Copy, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StudentDetailsModal } from './StudentDetailsModal'
import { AskAuvoraWidget } from './AskAuvoraWidget'
import { EventsCalendar } from './EventsCalendar'
import { DocumentManagement } from './DocumentManagement'
import { PhotoGallery } from './PhotoGallery'
import { MessagingPlatform } from './MessagingPlatform'
import { IncidentReporting } from './IncidentReporting'
import { HealthRecords } from './HealthRecords'
import { AdminRevenueReports } from './AdminRevenueReports'
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
import { SUFSScholarshipManagement } from './SUFSScholarshipManagement'
import { SUFSPaymentQueue } from './SUFSPaymentQueue'
import { FullAccountView } from './FullAccountView'
import { DailyBibleVerse } from './DailyBibleVerse'
import { AdminEnrollmentSubmissions } from './EnrollmentSubmissions'
import { LearningProgressImport } from './LearningProgressImport'
import { FeeProductManagement } from './FeeProductManagement'
import { QuickBooksIntegration } from './QuickBooksIntegration'
import { StripeIntegration } from './StripeIntegration'
import UserManagement from './UserManagement'
import { ProCareImport } from './ProCareImport'

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

interface EnhancedAdminDashboardProps {
  searchNavigation?: { type: 'student' | 'family'; id: string } | null
  onClearSearch?: () => void
  selectedCampusId?: string | null
  currentRole?: 'owner' | 'admin' | 'coach' | 'parent'
}

function EnrollmentLinkButton() {
  const [copied, setCopied] = useState(false);
  const enrollmentUrl = `${window.location.origin}${window.location.pathname}#/enroll`;

  const handleCopy = () => {
    navigator.clipboard.writeText(enrollmentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
        <Link className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <span className="text-sm text-blue-800 truncate max-w-xs">{enrollmentUrl}</span>
      </div>
      <Button
        onClick={handleCopy}
        variant={copied ? "default" : "outline"}
        className={copied ? "bg-green-600 hover:bg-green-700" : "border-blue-300 text-blue-700 hover:bg-blue-50"}
      >
        {copied ? (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 mr-2" />
            Copy Enrollment Link
          </>
        )}
      </Button>
    </div>
  );
}

export function EnhancedAdminDashboard({ searchNavigation, onClearSearch, selectedCampusId = null, currentRole = 'owner' }: EnhancedAdminDashboardProps) {
  const [view, setView] = useState<'dashboard' | 'students' | 'families-finance' | 'admissions' | 'academics' | 'student-support' | 'communications' | 'operations' | 'documents' | 'analytics' | 'settings'>('dashboard')
  const [subView, setSubView] = useState<string>('main')
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [families, setFamilies] = useState<Family[]>([])
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
    const [drillDownView, setDrillDownView] = useState<'at-risk' | 'ixl-behind' | 'overdue' | null>(null)
    const [accountView, setAccountView] = useState<{ type: 'family' | 'student'; id: string } | null>(null)
  const [askAuvoraResults, setAskAuvoraResults] = useState<any>(null)
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [unreadMessageCount, setUnreadMessageCount] = useState(0)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Handle search navigation from header
  useEffect(() => {
    if (searchNavigation) {
      setAccountView({ type: searchNavigation.type, id: searchNavigation.id })
      if (onClearSearch) onClearSearch()
    }
  }, [searchNavigation, onClearSearch])

  useEffect(() => {
    if (view === 'dashboard') {
      fetchDashboardData()
    } else if (view === 'students') {
      fetchStudents()
    } else if (view === 'families-finance') {
      fetchFamilies()
    }
    fetchUnreadMessages()
  }, [view, selectedCampusId])


  const fetchWithRetry = async (url: string, retries = 3, delay = 1000): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
        const response = await fetch(url, { signal: controller.signal })
        clearTimeout(timeoutId)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        return response
      } catch (error) {
        if (i === retries - 1) throw error
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
      }
    }
    throw new Error('Max retries exceeded')
  }

  const fetchDashboardData = async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const url = selectedCampusId 
        ? `${API_URL}/api/dashboard/admin?campus_id=${selectedCampusId}`
        : `${API_URL}/api/dashboard/admin`
      const response = await fetchWithRetry(url)
      const data = await response.json()
      setDashboardData(data)
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setLoadError('Unable to connect to the server. The server may be starting up.')
      setIsLoading(false)
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

  const fetchUnreadMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/messages`)
      const messages = await response.json()
      const unread = messages.filter(
        (msg: { recipient_id: string; read?: boolean }) => 
          msg.recipient_id === 'admin_1' && !msg.read
      ).length
      setUnreadMessageCount(unread)
    } catch (error) {
      console.error('Error fetching unread messages:', error)
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

    // If viewing a full account, show the FullAccountView instead
    if (accountView) {
      return (
        <FullAccountView
          type={accountView.type}
          id={accountView.id}
          onBack={() => setAccountView(null)}
          onStudentClick={(studentId) => setAccountView({ type: 'student', id: studentId })}
          onFamilyClick={(familyId) => setAccountView({ type: 'family', id: familyId })}
        />
      );
    }

                const navItems = [
                  { id: 'dashboard', label: 'Dashboard', subView: 'main' },
                  { id: 'students', label: 'Students', subView: 'main', action: fetchStudents },
                  { id: 'families-finance', label: 'Families & Finance', subView: 'families', action: fetchFamilies },
                  { id: 'admissions', label: 'Admissions', subView: 'pipeline' },
                  { id: 'academics', label: 'Academics', subView: 'standards' },
                  { id: 'student-support', label: 'Student Support', subView: 'iep' },
                  { id: 'communications', label: 'Communications', subView: 'messages', badge: unreadMessageCount > 0 ? unreadMessageCount : undefined },
                  { id: 'operations', label: 'Operations', subView: 'events' },
                  { id: 'documents', label: 'Documents & Forms', subView: 'library' },
                  { id: 'analytics', label: 'Analytics', subView: 'at-risk' },
                  { id: 'settings', label: 'Settings', subView: 'users' },
                ]

        const handleNavClick = (item: typeof navItems[0]) => {
          setView(item.id as typeof view)
          setSubView(item.subView)
          setDrillDownView(null)
          setAskAuvoraResults(null)
          if (item.action) item.action()
          setMobileMenuOpen(false)
        }

        const currentNavLabel = navItems.find(item => item.id === view)?.label || 'Dashboard'

        return (
          <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
              {/* Mobile hamburger menu */}
              <div className="md:hidden py-2">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md text-white"
                  style={{ background: 'linear-gradient(to right, #1e3a5f, #dc3545)' }}
                >
                  <span className="flex items-center gap-2">
                    <Menu className="h-5 w-5" />
                    {currentNavLabel}
                  </span>
                  {unreadMessageCount > 0 && (
                    <span className="bg-white text-red-600 text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                    </span>
                  )}
                </button>
            
                {/* Mobile dropdown menu */}
                {mobileMenuOpen && (
                  <div className="absolute left-0 right-0 mt-1 mx-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    {navItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item)}
                        className={`w-full px-4 py-3 text-left text-sm font-medium flex items-center justify-between border-b border-gray-100 last:border-b-0 ${
                          view === item.id
                            ? 'text-white'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        style={view === item.id ? { background: 'linear-gradient(to right, #1e3a5f, #dc3545)' } : {}}
                      >
                        {item.label}
                            {item.badge != null && item.badge > 0 && (
                              <span className="text-white text-xs rounded-full h-5 w-5 flex items-center justify-center" style={{ background: 'linear-gradient(to right, #1e3a5f, #dc3545)' }}>
                                {item.badge > 9 ? '9+' : item.badge}
                              </span>
                            )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Desktop navigation */}
              <nav className="hidden md:flex space-x-2 lg:space-x-4 xl:space-x-6 py-4 overflow-x-auto scrollbar-hide">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item)}
                    className={`px-2 lg:px-3 py-2 text-xs lg:text-sm font-medium rounded-md whitespace-nowrap relative ${
                      view === item.id
                        ? 'text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    style={view === item.id ? { background: 'linear-gradient(to right, #1e3a5f, #dc3545)' } : {}}
                  >
                    {item.label}
                    {item.badge != null && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center" style={{ background: 'linear-gradient(to right, #1e3a5f, #dc3545)' }}>
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'dashboard' && isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Loading dashboard...</p>
            <p className="text-gray-400 text-sm mt-2">This may take a moment if the server is waking up</p>
          </div>
        )}
        
        {view === 'dashboard' && loadError && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-red-100 rounded-full p-4 mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-gray-900 text-lg font-medium mb-2">Connection Error</p>
            <p className="text-gray-600 text-center max-w-md mb-4">{loadError}</p>
            <button
              onClick={fetchDashboardData}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        )}
        
        {view === 'dashboard' && dashboardData && !isLoading && (
          <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
                        </div>

                        <DailyBibleVerse />
            
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
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

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Families</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.total_families}</div>
                  <p className="text-xs text-gray-500">Active families</p>
                </CardContent>
              </Card>

              <Card 
                className="hover:shadow-lg transition-shadow cursor-pointer hover:border-red-600"
                onClick={handleOutstandingBalanceClick}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${dashboardData.billing_summary.total_balance.toFixed(2)}</div>
                  <p className="text-xs text-gray-500">
                    {dashboardData.billing_summary.red} families overdue
                  </p>
                  <p className="text-xs text-blue-600 mt-1 font-medium">Click to view details →</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
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
                <Button
                  onClick={() => setShowAddStudentModal(true)}
                  className="bg-red-600 hover:bg-red-700"
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
                            <div className="overflow-x-auto max-h-[600px]">
                              <table className="w-full">
                                <thead className="bg-gray-50 border-b sticky top-0 z-10">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Grade</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Session</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Room</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Attendance</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Grades</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">IXL</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Risk</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {students.length === 0 ? (
                                    <tr>
                                      <td colSpan={9} className="px-6 py-12 text-center">
                                        <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                        <p className="text-gray-500 text-lg font-medium">No students found</p>
                                        <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or add a new student</p>
                                      </td>
                                    </tr>
                                  ) : students.map((student) => (
                                    <tr 
                                      key={student.student_id} 
                                      className="hover:bg-blue-50 transition-colors group"
                                    >
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                          onClick={() => setAccountView({ type: 'student', id: student.student_id })}
                                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                        >
                                          {student.first_name} {student.last_name}
                                        </button>
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
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setAccountView({ type: 'student', id: student.student_id })
                                            }}
                                            className="p-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                            title="View Profile"
                                          >
                                            <Eye className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setView('communications')
                                              setSubView('messages')
                                            }}
                                            className="p-1.5 rounded-md bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                            title="Send Message"
                                          >
                                            <MessageSquare className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setView('student-support')
                                              setSubView('incidents')
                                            }}
                                            className="p-1.5 rounded-md bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                                            title="Log Incident"
                                          >
                                            <FileWarning className="w-4 h-4" />
                                          </button>
                                        </div>
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
            </div>
                        <Tabs value={subView} onValueChange={setSubView} className="w-full">
                          <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="families">Family Accounts</TabsTrigger>
                            <TabsTrigger value="scholarships">Scholarships</TabsTrigger>
                            <TabsTrigger value="billing">Payments & Invoices</TabsTrigger>
                            <TabsTrigger value="store">Store / POS</TabsTrigger>
                            <TabsTrigger value="reports">Reports</TabsTrigger>
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
                                                            <tr key={family.family_id} className="hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => setAccountView({ type: 'family', id: family.family_id })}>
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
                            <TabsContent value="scholarships" className="mt-6">
                              {/* Simplified Scholarships Section - SUFS and EPIC Scholarships */}
                              <div className="space-y-6">
                                {/* Quick Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                                    <CardContent className="p-6">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="text-sm font-medium text-green-700">Step Up (SUFS)</p>
                                          <p className="text-2xl font-bold text-green-800">Active Scholarships</p>
                                        </div>
                                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                          <DollarSign className="w-6 h-6 text-white" />
                                        </div>
                                      </div>
                                      <p className="text-xs text-green-600 mt-2">State-funded scholarship program</p>
                                    </CardContent>
                                  </Card>
                                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                                    <CardContent className="p-6">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="text-sm font-medium text-purple-700">EPIC Scholarships</p>
                                          <p className="text-2xl font-bold text-purple-800">School Awards</p>
                                        </div>
                                        <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                                          <Users className="w-6 h-6 text-white" />
                                        </div>
                                      </div>
                                      <p className="text-xs text-purple-600 mt-2">For families needing financial assistance</p>
                                    </CardContent>
                                  </Card>
                                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                                    <CardContent className="p-6">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="text-sm font-medium text-blue-700">Out-of-Pocket</p>
                                          <p className="text-2xl font-bold text-blue-800">Direct Payments</p>
                                        </div>
                                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                          <Calendar className="w-6 h-6 text-white" />
                                        </div>
                                      </div>
                                      <p className="text-xs text-blue-600 mt-2">Family-paid tuition</p>
                                    </CardContent>
                                  </Card>
                                </div>
                  
                                {/* Scholarship Management Tabs */}
                                <Tabs defaultValue="sufs" className="w-full">
                                  <TabsList className="grid w-full grid-cols-3 mb-4">
                                    <TabsTrigger value="sufs">Step Up (SUFS)</TabsTrigger>
                                    <TabsTrigger value="epic">EPIC Scholarships</TabsTrigger>
                                    <TabsTrigger value="queue">Payment Queue</TabsTrigger>
                                  </TabsList>
                                  <TabsContent value="sufs">
                                    <SUFSScholarshipManagement campusId={selectedCampusId} />
                                  </TabsContent>
                                  <TabsContent value="epic">
                                    {/* EPIC Scholarship Management */}
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                          <Users className="w-5 h-5 text-purple-600" />
                                          EPIC Scholarship Awards
                                        </CardTitle>
                                        <p className="text-sm text-gray-500">
                                          Track scholarships awarded by EPIC Prep Academy for families needing financial assistance. 
                                          These awards are tracked for tax purposes.
                                        </p>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                                          <h4 className="font-semibold text-purple-900 mb-2">About EPIC Scholarships</h4>
                                          <ul className="text-sm text-purple-800 space-y-1">
                                            <li>• Awarded to families who cannot pay full tuition out-of-pocket</li>
                                            <li>• Amount varies based on family need and available funds</li>
                                            <li>• All awards are tracked for tax reporting purposes</li>
                                            <li>• Can be combined with Step Up (SUFS) scholarships</li>
                                          </ul>
                                        </div>
                                        <div className="text-center py-8 text-gray-500">
                                          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                          <p className="font-medium">No EPIC Scholarships awarded yet</p>
                                          <p className="text-sm">When you award an EPIC Scholarship, it will appear here for tracking.</p>
                                          <p className="text-xs mt-2 text-gray-400">
                                            To award an EPIC Scholarship, edit a student's funding source to "EPIC Scholarship" when adding or editing their record.
                                          </p>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </TabsContent>
                                  <TabsContent value="queue">
                                    <SUFSPaymentQueue campusId={selectedCampusId} />
                                  </TabsContent>
                                </Tabs>
                              </div>
                            </TabsContent>
                            <TabsContent value="billing" className="mt-6">
                              <FinancialManagement selectedCampusId={selectedCampusId} />
                            </TabsContent>
                            <TabsContent value="store" className="mt-6">
                              <FeeProductManagement campusId={selectedCampusId} />
                            </TabsContent>
                            <TabsContent value="reports" className="mt-6">
                              {/* Consolidated Reports Section */}
                              <Tabs defaultValue="revenue" className="w-full">
                                <TabsList className={`grid w-full mb-4 ${currentRole === 'owner' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                  <TabsTrigger value="revenue">Revenue Reports</TabsTrigger>
                                  <TabsTrigger value="stripe">Stripe</TabsTrigger>
                                  {currentRole === 'owner' && (
                                    <TabsTrigger value="quickbooks">QuickBooks</TabsTrigger>
                                  )}
                                </TabsList>
                                <TabsContent value="revenue">
                                  <AdminRevenueReports role="admin" />
                                </TabsContent>
                                <TabsContent value="stripe">
                                  <StripeIntegration />
                                </TabsContent>
                                {currentRole === 'owner' && (
                                  <TabsContent value="quickbooks">
                                    <QuickBooksIntegration />
                                  </TabsContent>
                                )}
                              </Tabs>
                            </TabsContent>
            </Tabs>
          </div>
        )}

                {view === 'admissions' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-3xl font-bold text-gray-900">Admissions</h2>
                      <EnrollmentLinkButton />
                    </div>
                    <Tabs value={subView} onValueChange={setSubView} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pipeline">Admissions Pipeline</TabsTrigger>
                        <TabsTrigger value="enrollments">Enrollment Applications</TabsTrigger>
                      </TabsList>
                      <TabsContent value="pipeline" className="mt-6">
                        <AdmissionsPipeline selectedCampusId={selectedCampusId} />
                      </TabsContent>
                      <TabsContent value="enrollments" className="mt-6">
                        <AdminEnrollmentSubmissions />
                      </TabsContent>
                    </Tabs>
                  </div>
                )}

        {view === 'academics' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">Academics</h2>
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
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Learning Progress Import</CardTitle>
                    <LearningProgressImport />
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Import student progress data from IXL (K-8) and Acellus (9-12) to keep learning records up to date.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-[#0A2463]">IXL (K-8)</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Import skills mastered, time spent, and proficiency scores for elementary and middle school students.
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-semibold text-green-800">Acellus (9-12)</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Import course progress, grades, and completion status for high school students.
                        </p>
                      </div>
                    </div>
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

              {view === 'settings' && (
                <div className="space-y-6">
                  <UserManagement />
                  {currentRole === 'owner' && (
                    <ProCareImport />
                  )}
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
      <AskAuvoraWidget userRole={currentRole || 'admin'} />
    </div>
  )
}
