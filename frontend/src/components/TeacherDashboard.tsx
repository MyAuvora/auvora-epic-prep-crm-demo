import { useState, useEffect } from 'react'
import { Users, Calendar, BookOpen, ClipboardCheck, Eye } from 'lucide-react'
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

export function TeacherDashboard({ staffId, searchNavigation: _searchNavigation, onClearSearch: _onClearSearch }: TeacherDashboardProps) {
  // Note: searchNavigation and onClearSearch are passed for consistency but not used in Teacher dashboard
  // Teachers use the student list in their rooms instead of global search navigation
  void _searchNavigation
  void _onClearSearch
  const [view, setView] = useState<'rooms' | 'gradebook' | 'announcements' | 'events' | 'documents' | 'photos' | 'messages' | 'incidents' | 'health'>('rooms')
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false)
  const [campusId, setCampusId] = useState<string>('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false)
  const [isAttendanceCalendarOpen, setIsAttendanceCalendarOpen] = useState(false)
  const [isGradeBreakdownOpen, setIsGradeBreakdownOpen] = useState(false)
  const [accountView, setAccountView] = useState<{ type: 'family' | 'student'; id: string } | null>(null)

  useEffect(() => {
    fetchTeacherData()
  }, [staffId])

  const fetchTeacherData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/dashboard/teacher/${staffId}`)
      const data = await response.json()
      setTeacherData(data)
      if (data.rooms.length > 0) {
        setSelectedRoom(data.rooms[0])
      }
      
      const staffResponse = await fetch(`${API_URL}/api/staff/${staffId}`)
      const staffData = await staffResponse.json()
      if (staffData.campus_ids && staffData.campus_ids.length > 0) {
        setCampusId(staffData.campus_ids[0])
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error)
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

  if (!teacherData) {
    return <div className="p-8">Loading...</div>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 py-4">
            <button
              onClick={() => setView('rooms')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'rooms'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              My Rooms
            </button>
            <button
              onClick={() => setView('gradebook')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'gradebook'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Gradebook
            </button>
            <button
              onClick={() => setView('announcements')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'announcements'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Announcements
            </button>
            <button
              onClick={() => setView('events')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'events'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setView('documents')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'documents'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Documents
            </button>
            <button
              onClick={() => setView('photos')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'photos'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Photos
            </button>
            <button
              onClick={() => setView('messages')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'messages'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Messages
            </button>
            <button
              onClick={() => setView('incidents')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'incidents'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Incidents
            </button>
            <button
              onClick={() => setView('health')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'health'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Health Records
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            role="teacher" 
            userId={staffId} 
            campusId={campusId} 
          />
        )}

        {view === 'events' && (
          <EventsCalendar role="teacher" userId={staffId} />
        )}

        {view === 'documents' && (
          <DocumentManagement role="teacher" userId={staffId} />
        )}

        {view === 'photos' && (
          <PhotoGallery role="teacher" userId={staffId} />
        )}

        {view === 'messages' && (
          <MessagingPlatform role="teacher" userId={staffId} userType="Staff" />
        )}

        {view === 'incidents' && (
          <IncidentReporting role="teacher" userId={staffId} />
        )}

        {view === 'health' && (
          <HealthRecords role="teacher" userId={staffId} />
        )}
      </div>

      {/* Ask Auvora Widget */}
      <AskAuvoraWidget />

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
