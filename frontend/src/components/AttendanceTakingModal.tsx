import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Student {
  student_id: string
  first_name: string
  last_name: string
  grade: string
  session: string
}

interface AttendanceTakingModalProps {
  isOpen: boolean
  onClose: () => void
  students: Student[]
  roomName: string
  session: string
  onSuccess: () => void
}

type AttendanceStatus = 'Present' | 'Absent' | 'Tardy'

export function AttendanceTakingModal({ 
  isOpen, 
  onClose, 
  students, 
  roomName, 
  session,
  onSuccess 
}: AttendanceTakingModalProps) {
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>(() => {
    const initialMap: Record<string, AttendanceStatus> = {}
    students.forEach(student => {
      initialMap[student.student_id] = 'Present'
    })
    return initialMap
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: status
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const attendanceList = students.map(student => ({
        student_id: student.student_id,
        status: attendanceMap[student.student_id],
        session: session
      }))

      const response = await fetch(`${API_URL}/api/attendance/take`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceList),
      })

      if (!response.ok) {
        throw new Error('Failed to submit attendance')
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error submitting attendance:', error)
      alert('Failed to submit attendance. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusButtonClass = (currentStatus: AttendanceStatus, buttonStatus: AttendanceStatus) => {
    const isSelected = currentStatus === buttonStatus
    const baseClass = "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors"
    
    if (buttonStatus === 'Present') {
      return `${baseClass} ${isSelected ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-green-100'}`
    } else if (buttonStatus === 'Absent') {
      return `${baseClass} ${isSelected ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-red-100'}`
    } else {
      return `${baseClass} ${isSelected ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-yellow-100'}`
    }
  }

  const presentCount = Object.values(attendanceMap).filter(s => s === 'Present').length
  const absentCount = Object.values(attendanceMap).filter(s => s === 'Absent').length
  const tardyCount = Object.values(attendanceMap).filter(s => s === 'Tardy').length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[80vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Take Attendance - {roomName} ({session})
          </DialogTitle>
          <div className="flex gap-4 mt-2 text-sm">
            <span className="text-green-600 font-medium">Present: {presentCount}</span>
            <span className="text-red-600 font-medium">Absent: {absentCount}</span>
            <span className="text-yellow-600 font-medium">Tardy: {tardyCount}</span>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {students.map((student) => (
            <div key={student.student_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {student.first_name} {student.last_name}
                </div>
                <div className="text-sm text-gray-500">Grade {student.grade}</div>
              </div>
              
              <div className="flex gap-2 w-80">
                <button
                  onClick={() => handleStatusChange(student.student_id, 'Present')}
                  className={getStatusButtonClass(attendanceMap[student.student_id], 'Present')}
                >
                  <CheckCircle className="inline-block mr-1 h-4 w-4" />
                  Present
                </button>
                <button
                  onClick={() => handleStatusChange(student.student_id, 'Absent')}
                  className={getStatusButtonClass(attendanceMap[student.student_id], 'Absent')}
                >
                  <XCircle className="inline-block mr-1 h-4 w-4" />
                  Absent
                </button>
                <button
                  onClick={() => handleStatusChange(student.student_id, 'Tardy')}
                  className={getStatusButtonClass(attendanceMap[student.student_id], 'Tardy')}
                >
                  <Clock className="inline-block mr-1 h-4 w-4" />
                  Tardy
                </button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Attendance'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
