import { useState, useEffect } from 'react'
import { Users, Calendar, BookOpen, ClipboardCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AskAuvoraWidget } from './AskAuvoraWidget'
import { EventsCalendar } from './EventsCalendar'
import { DocumentManagement } from './DocumentManagement'
import { PhotoGallery } from './PhotoGallery'
import { MessagingPlatform } from './MessagingPlatform'
import { IncidentReporting } from './IncidentReporting'
import { HealthRecords } from './HealthRecords'
import { AttendanceTakingModal } from './AttendanceTakingModal'
import { TeacherGradebook } from './TeacherGradebook'

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
}

export function TeacherDashboard({ staffId }: TeacherDashboardProps) {
  const [view, setView] = useState<'rooms' | 'gradebook' | 'events' | 'documents' | 'photos' | 'messages' | 'incidents' | 'health'>('rooms')
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false)
  const [campusId, setCampusId] = useState<string>('')

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

  const handleAskAuvora = async (query: string) => {
    console.log('Teacher Ask Auvora query:', query)
  }

  const handleAttendanceSuccess = () => {
    fetchTeacherData()
  }

  if (!teacherData) {
    return <div className="p-8">Loading...</div>
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
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              My Rooms
            </button>
            <button
              onClick={() => setView('gradebook')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'gradebook'
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Gradebook
            </button>
            <button
              onClick={() => setView('events')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'events'
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setView('documents')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'documents'
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Documents
            </button>
            <button
              onClick={() => setView('photos')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'photos'
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Photos
            </button>
            <button
              onClick={() => setView('messages')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'messages'
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Messages
            </button>
            <button
              onClick={() => setView('incidents')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'incidents'
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Incidents
            </button>
            <button
              onClick={() => setView('health')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'health'
                  ? 'bg-amber-600 text-white'
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
              <p className="text-gray-600 mt-2">Teacher Dashboard</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Rooms</CardTitle>
              <Users className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teacherData.rooms.length}</div>
              <p className="text-xs text-gray-500">Assigned classrooms</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-amber-600" />
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
              <Calendar className="h-4 w-4 text-amber-600" />
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
                  selectedRoom === room ? 'ring-2 ring-amber-600' : 'hover:shadow-lg'
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
                    <BookOpen className="h-8 w-8 text-amber-600" />
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
                  className="bg-amber-600 hover:bg-amber-700"
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
                          <div className="text-sm font-medium text-gray-900">
                            {student.first_name} {student.last_name}
                          </div>
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
            <Button onClick={() => setView('rooms')} className="mt-4 bg-amber-600 hover:bg-amber-700">
              Go to My Rooms
            </Button>
          </div>
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
      <AskAuvoraWidget onSearch={handleAskAuvora} />

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
    </div>
  )
}
