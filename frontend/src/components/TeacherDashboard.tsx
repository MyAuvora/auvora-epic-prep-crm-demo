import { useState, useEffect } from 'react'
import { Users, Calendar, BookOpen, ClipboardCheck, Eye, CheckCircle, XCircle, AlertCircle, Menu } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AskAuvoraWidget } from './AskAuvoraWidget'
import { EventsCalendar } from './EventsCalendar'
import { DocumentManagement } from './DocumentManagement'
import { PhotoGallery } from './PhotoGallery'
import { MessagingPlatform } from './MessagingPlatform'
import { IncidentReporting } from './IncidentReporting'
import { HealthRecords } from './HealthRecords'
import { AttendanceTakingModal } from './AttendanceTakingModal'
import { AttendanceCalendarModal } from './AttendanceCalendarModal'
import { GradeBreakdownModal } from './GradeBreakdownModal'
import { TeacherGradebook } from './TeacherGradebook'
import { AnnouncementManagement } from './AnnouncementManagement'
import { DailyBibleVerse } from './DailyBibleVerse'
import { FullAccountView } from './FullAccountView'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Student {
  student_id: string
  first_name: string
  last_name: string
  grade: string
  session: string
  room: string
  attendance_present_count: number
  attendance_absent_count: number
  attendance_tardy_count: number
  overall_grade_flag: string
  ixl_status_flag: string
  overall_risk_flag: string
}

interface Room {
  room: string
  session: string
  student_count: number
  students: Student[]
}

interface TeacherData {
  staff: {
    staff_id: string
    first_name: string
    last_name: string
    role: string
    assigned_rooms: string[]
  }
  rooms: Room[]
}

interface TeacherDashboardProps {
  staffId: string
  searchNavigation?: { type: 'student' | 'family'; id: string } | null
  onClearSearch?: () => void
}

interface TimeOffRequest {
  id: string
  staff_id: string
  staff_name: string
  start_date: string
  end_date: string
  type: 'vacation' | 'sick' | 'personal' | 'bereavement' | 'other'
  reason: string
  status: 'pending' | 'approved' | 'denied'
  submitted_date: string
  reviewed_by?: string
  reviewed_date?: string
  admin_notes?: string
}

export function TeacherDashboard({ staffId, searchNavigation: _searchNavigation, onClearSearch: _onClearSearch }: TeacherDashboardProps) {
  // Note: searchNavigation and onClearSearch are passed for consistency but not used in Teacher dashboard
  // Teachers use the student list in their rooms instead of global search navigation
  void _searchNavigation
  void _onClearSearch
  const [view, setView] = useState<'rooms' | 'gradebook' | 'announcements' | 'events' | 'documents' | 'photos' | 'messages' | 'incidents' | 'health' | 'timeoff'>('rooms')
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false)
  const [campusId, setCampusId] = useState<string>('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false)
  const [isAttendanceCalendarOpen, setIsAttendanceCalendarOpen] = useState(false)
  const [isGradeBreakdownOpen, setIsGradeBreakdownOpen] = useState(false)
  const [accountView, setAccountView] = useState<{ type: 'family' | 'student'; id: string } | null>(null)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showTimeOffRequestModal, setShowTimeOffRequestModal] = useState(false)
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([
    { id: '1', staff_id: 'current_user', staff_name: 'Current User', start_date: '2026-03-10', end_date: '2026-03-12', type: 'vacation', reason: 'Family vacation', status: 'pending', submitted_date: '2026-02-25' },
    { id: '2', staff_id: 'current_user', staff_name: 'Current User', start_date: '2026-02-15', end_date: '2026-02-15', type: 'sick', reason: 'Doctor appointment', status: 'approved', submitted_date: '2026-02-10', reviewed_by: 'Sarah Mitchell', reviewed_date: '2026-02-11' },
  ])
  const [newTimeOffRequest, setNewTimeOffRequest] = useState({
    start_date: '',
    end_date: '',
    type: 'vacation' as TimeOffRequest['type'],
    reason: ''
  })

  useEffect(() => {
    fetchTeacherData()
    fetchUnreadMessages()
  }, [staffId])

  const fetchTeacherData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/dashboard/teacher/${staffId}`)
      if (!response.ok) {
        console.error('Teacher data not found')
        return
      }
      const data = await response.json()
      if (!data.staff) {
        console.error('Invalid teacher data response')
        return
      }
      setTeacherData(data)
      if (data.rooms && data.rooms.length > 0) {
        setSelectedRoom(data.rooms[0])
      }
      
      const staffResponse = await fetch(`${API_URL}/api/staff/${staffId}`)
      if (staffResponse.ok) {
        const staffData = await staffResponse.json()
        if (staffData.campus_ids && staffData.campus_ids.length > 0) {
          setCampusId(staffData.campus_ids[0])
        }
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error)
    }
  }

  const fetchUnreadMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/messages`)
      const messages = await response.json()
      const unread = messages.filter(
        (msg: { recipient_id: string; read?: boolean }) => 
          msg.recipient_id === staffId && !msg.read
      ).length
      setUnreadMessageCount(unread)
    } catch (error) {
      console.error('Error fetching unread messages:', error)
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

  const handleAttendanceSuccess = () => {
    fetchTeacherData()
  }

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student)
    setIsStudentModalOpen(true)
  }

  const handleViewAttendance = () => {
    setIsStudentModalOpen(false)
    setIsAttendanceCalendarOpen(true)
  }

  const handleViewGrades = () => {
    setIsStudentModalOpen(false)
    setIsGradeBreakdownOpen(true)
  }

  const getSubjectForGradeBreakdown = () => {
    return 'Math'
  }

  const handleViewFullAccount = (studentId: string) => {
    setIsStudentModalOpen(false)
    setAccountView({ type: 'student', id: studentId })
  }

  const handleSubmitTimeOffRequest = () => {
    const newRequest: TimeOffRequest = {
      id: `tor_${Date.now()}`,
      staff_id: staffId,
      staff_name: teacherData?.staff ? `${teacherData.staff.first_name} ${teacherData.staff.last_name}` : 'Current User',
      start_date: newTimeOffRequest.start_date,
      end_date: newTimeOffRequest.end_date,
      type: newTimeOffRequest.type,
      reason: newTimeOffRequest.reason,
      status: 'pending',
      submitted_date: new Date().toISOString().split('T')[0]
    }
    setTimeOffRequests([newRequest, ...timeOffRequests])
    setShowTimeOffRequestModal(false)
    setNewTimeOffRequest({ start_date: '', end_date: '', type: 'vacation', reason: '' })
  }

  const getTimeOffTypeBadge = (type: TimeOffRequest['type']) => {
    switch (type) {
      case 'vacation': return 'bg-blue-100 text-blue-800'
      case 'sick': return 'bg-orange-100 text-orange-800'
      case 'personal': return 'bg-purple-100 text-purple-800'
      case 'bereavement': return 'bg-gray-100 text-gray-800'
      case 'other': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTimeOffStatusBadge = (status: TimeOffRequest['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'denied': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!teacherData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Coach Dashboard</h2>
          <p className="text-gray-600 mb-4">No staff account is linked to this profile yet.</p>
          <p className="text-sm text-gray-500">Please contact your school administrator to set up your coach account.</p>
        </div>
      </div>
    )
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

  const teacherNavItems = [
    { id: 'rooms', label: 'My Rooms' },
    { id: 'gradebook', label: 'Gradebook' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'events', label: 'Events' },
    { id: 'documents', label: 'Documents' },
    { id: 'photos', label: 'Photos' },
    { id: 'messages', label: 'Messages', badge: unreadMessageCount > 0 ? unreadMessageCount : undefined },
    { id: 'incidents', label: 'Incidents' },
    { id: 'health', label: 'Health Records' },
    { id: 'timeoff', label: 'Time Off' },
  ]

  const handleTeacherNavClick = (itemId: string) => {
    setView(itemId as typeof view)
    setMobileMenuOpen(false)
  }

  const currentTeacherNavLabel = teacherNavItems.find(item => item.id === view)?.label || 'My Rooms'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          {/* Mobile hamburger menu */}
          <div className="md:hidden py-2 relative">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md text-white"
              style={{ background: 'linear-gradient(to right, #1e3a5f, #dc3545)' }}
            >
              <span className="flex items-center gap-2">
                <Menu className="h-5 w-5" />
                {currentTeacherNavLabel}
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
                {teacherNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTeacherNavClick(item.id)}
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
          <nav className="hidden md:flex space-x-4 lg:space-x-8 py-4">
            {teacherNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTeacherNavClick(item.id)}
                className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap relative ${
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

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {view === 'rooms' && (
          <>
                        <div className="mb-8">
                          <h2 className="text-3xl font-bold text-gray-900">
                            Welcome, {teacherData.staff.first_name} {teacherData.staff.last_name}
                          </h2>
                          <p className="text-gray-600 mt-2">Coach Dashboard</p>
                        </div>

                        <div className="mb-8">
                          <DailyBibleVerse />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Rooms</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teacherData.rooms.length}</div>
              <p className="text-xs text-gray-500">Assigned classrooms</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teacherData.rooms.reduce((sum, room) => sum + room.student_count, 0)}
              </div>
              <p className="text-xs text-gray-500">Across all rooms</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">At-Risk Students</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {teacherData.rooms.reduce((sum, room) => 
                  sum + room.students.filter(s => s.overall_risk_flag === 'At risk').length, 0
                )}
              </div>
              <p className="text-xs text-gray-500">Need attention</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">My Rooms</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teacherData.rooms.map((room, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-all ${
                  selectedRoom === room ? 'ring-2 ring-red-600' : 'hover:shadow-lg'
                }`}
                onClick={() => setSelectedRoom(room)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{room.room}</CardTitle>
                  <p className="text-sm text-gray-500">{room.session}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">{room.student_count}</div>
                      <p className="text-xs text-gray-500">Students</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {selectedRoom && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    {selectedRoom.room} - {selectedRoom.session}
                  </CardTitle>
                  <p className="text-sm text-gray-500">{selectedRoom.student_count} students</p>
                </div>
                <Button 
                  onClick={() => setIsAttendanceModalOpen(true)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Take Attendance
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grades</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IXL Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Flag</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedRoom.students.map((student) => (
                      <tr key={student.student_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleStudentClick(student)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            {student.first_name} {student.last_name}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.grade}
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
        )}
          </>
        )}

        {view === 'gradebook' && selectedRoom && (
          <TeacherGradebook 
            staffId={staffId} 
            campusId={campusId}
            room={selectedRoom.room}
          />
        )}

        {view === 'gradebook' && !selectedRoom && (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Room Selected</h3>
            <p className="mt-1 text-sm text-gray-500">Please select a room from the "My Rooms" tab to access the gradebook.</p>
            <Button onClick={() => setView('rooms')} className="mt-4 bg-red-600 hover:bg-red-700">
              Go to My Rooms
            </Button>
          </div>
        )}

        {view === 'announcements' && (
          <AnnouncementManagement 
            role="coach" 
            userId={staffId} 
            campusId={campusId} 
          />
        )}

        {view === 'events' && (
          <EventsCalendar role="coach" userId={staffId} />
        )}

        {view === 'documents' && (
          <DocumentManagement role="coach" userId={staffId} />
        )}

        {view === 'photos' && (
          <PhotoGallery role="coach" userId={staffId} />
        )}

        {view === 'messages' && (
          <MessagingPlatform role="coach" userId={staffId} userType="Staff" />
        )}

        {view === 'incidents' && (
          <IncidentReporting role="coach" userId={staffId} />
        )}

        {view === 'health' && (
          <HealthRecords role="coach" userId={staffId} />
        )}

        {view === 'timeoff' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">My Time Off Requests</h2>
                <p className="text-gray-600">Submit and track your time off requests</p>
              </div>
              <Button onClick={() => setShowTimeOffRequestModal(true)} className="bg-red-600 hover:bg-red-700">
                <Calendar className="w-4 h-4 mr-2" />
                Request Time Off
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">{timeOffRequests.filter(r => r.status === 'pending').length}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Approved</p>
                      <p className="text-2xl font-bold text-green-600">{timeOffRequests.filter(r => r.status === 'approved').length}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Denied</p>
                      <p className="text-2xl font-bold text-red-600">{timeOffRequests.filter(r => r.status === 'denied').length}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>My Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {timeOffRequests.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No time off requests yet. Click "Request Time Off" to submit your first request.</p>
                ) : (
                  <div className="space-y-4">
                    {timeOffRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTimeOffTypeBadge(request.type)}`}>
                                {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getTimeOffStatusBadge(request.status)}`}>
                                {request.status === 'pending' && <AlertCircle className="w-3 h-3" />}
                                {request.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                                {request.status === 'denied' && <XCircle className="w-3 h-3" />}
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </span>
                            </div>
                            <p className="font-medium">{request.start_date} - {request.end_date}</p>
                            <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                            <p className="text-xs text-gray-400 mt-2">Submitted: {request.submitted_date}</p>
                          </div>
                          {request.reviewed_by && (
                            <div className="text-right text-sm">
                              <p className="text-gray-500">Reviewed by</p>
                              <p className="font-medium">{request.reviewed_by}</p>
                              <p className="text-xs text-gray-400">{request.reviewed_date}</p>
                              {request.admin_notes && (
                                <p className="text-xs text-gray-600 mt-1 italic">"{request.admin_notes}"</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Time Off Request Modal */}
      <Dialog open={showTimeOffRequestModal} onOpenChange={setShowTimeOffRequestModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Time Off</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={newTimeOffRequest.start_date}
                  onChange={(e) => setNewTimeOffRequest({ ...newTimeOffRequest, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={newTimeOffRequest.end_date}
                  onChange={(e) => setNewTimeOffRequest({ ...newTimeOffRequest, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={newTimeOffRequest.type}
                onChange={(e) => setNewTimeOffRequest({ ...newTimeOffRequest, type: e.target.value as TimeOffRequest['type'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="vacation">Vacation</option>
                <option value="sick">Sick</option>
                <option value="personal">Personal</option>
                <option value="bereavement">Bereavement</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <textarea
                value={newTimeOffRequest.reason}
                onChange={(e) => setNewTimeOffRequest({ ...newTimeOffRequest, reason: e.target.value })}
                rows={3}
                placeholder="Please provide a brief reason for your time off request..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowTimeOffRequestModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitTimeOffRequest} 
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={!newTimeOffRequest.start_date || !newTimeOffRequest.end_date || !newTimeOffRequest.reason}
              >
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ask Auvora Widget */}
      <AskAuvoraWidget userRole="coach" />

      {/* Attendance Taking Modal */}
      {selectedRoom && (
        <AttendanceTakingModal
          isOpen={isAttendanceModalOpen}
          onClose={() => setIsAttendanceModalOpen(false)}
          students={selectedRoom.students}
          roomName={selectedRoom.room}
          session={selectedRoom.session}
          onSuccess={handleAttendanceSuccess}
        />
      )}

      {/* Student Quick View Modal */}
      {selectedStudent && (
        <Dialog open={isStudentModalOpen} onOpenChange={(open) => !open && setIsStudentModalOpen(false)}>
          <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-xl max-h-[80vh] overflow-y-auto p-4">
            <DialogHeader>
              <DialogTitle className="text-lg">
                {selectedStudent.first_name} {selectedStudent.last_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600 text-xs">Grade</p>
                  <p className="font-medium">{selectedStudent.grade}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs">Room</p>
                  <p className="font-medium">{selectedStudent.room} - {selectedStudent.session}</p>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-gray-600 text-xs mb-2">Attendance Summary</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-green-50 p-2 rounded">
                    <p className="text-xs text-gray-600">Present</p>
                    <p className="font-bold text-green-700">{selectedStudent.attendance_present_count}</p>
                  </div>
                  <div className="bg-red-50 p-2 rounded">
                    <p className="text-xs text-gray-600">Absent</p>
                    <p className="font-bold text-red-700">{selectedStudent.attendance_absent_count}</p>
                  </div>
                  <div className="bg-yellow-50 p-2 rounded">
                    <p className="text-xs text-gray-600">Tardy</p>
                    <p className="font-bold text-yellow-700">{selectedStudent.attendance_tardy_count}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-gray-600 text-xs mb-2">Academic Status</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-600">Grade Status</p>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      selectedStudent.overall_grade_flag === 'On track' ? 'bg-green-100 text-green-800' :
                      selectedStudent.overall_grade_flag === 'Needs attention' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedStudent.overall_grade_flag}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">IXL Status</p>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      selectedStudent.ixl_status_flag === 'On track' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedStudent.ixl_status_flag}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-gray-600 text-xs mb-2">Risk Assessment</p>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getRiskFlagColor(selectedStudent.overall_risk_flag)}`}>
                  {selectedStudent.overall_risk_flag}
                </span>
              </div>

              <div className="border-t pt-3 flex gap-2">
                <Button
                  onClick={handleViewAttendance}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                >
                  <Calendar className="mr-1 h-3 w-3" />
                  View Attendance Calendar
                </Button>
                <Button
                  onClick={handleViewGrades}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                >
                  <BookOpen className="mr-1 h-3 w-3" />
                  View Grade Breakdown
                </Button>
              </div>

              <div className="border-t pt-3">
                <Button
                  onClick={() => handleViewFullAccount(selectedStudent.student_id)}
                  className="w-full bg-[#0A2463] hover:bg-[#0A2463]/90"
                  size="sm"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Full Student & Family Account
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Attendance Calendar Modal */}
      {selectedStudent && (
        <AttendanceCalendarModal
          isOpen={isAttendanceCalendarOpen}
          onClose={() => {
            setIsAttendanceCalendarOpen(false)
            setIsStudentModalOpen(true)
          }}
          studentId={selectedStudent.student_id}
          studentName={`${selectedStudent.first_name} ${selectedStudent.last_name}`}
        />
      )}

      {/* Grade Breakdown Modal */}
      {selectedStudent && (
        <GradeBreakdownModal
          isOpen={isGradeBreakdownOpen}
          onClose={() => {
            setIsGradeBreakdownOpen(false)
            setIsStudentModalOpen(true)
          }}
          studentId={selectedStudent.student_id}
          subject={getSubjectForGradeBreakdown()}
          overallGrade={selectedStudent.overall_grade_flag}
        />
      )}
    </div>
  )
}
