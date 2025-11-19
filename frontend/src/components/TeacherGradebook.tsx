import { useState, useEffect } from 'react'
import { Plus, Save, Eye, EyeOff, Calendar, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Assignment {
  assignment_id: string
  campus_id: string
  teacher_id: string
  room: string
  subject: string
  assignment_type: string
  title: string
  description: string
  max_points: number
  due_date: string
  status: string
  created_date: string
}

interface GradeEntry {
  entry_id: string
  assignment_id: string
  student_id: string
  campus_id: string
  points_earned: number | null
  letter_grade: string | null
  percentage: number | null
  status: string
  comment: string | null
  submitted_date: string | null
  graded_date: string | null
  graded_by: string
}

interface Student {
  student_id: string
  first_name: string
  last_name: string
  grade: string
  room?: string
}

interface TeacherGradebookProps {
  staffId: string
  campusId: string
  room: string
}

export function TeacherGradebook({ staffId, campusId, room }: TeacherGradebookProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [gradeEntries, setGradeEntries] = useState<GradeEntry[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    subject: 'Math',
    assignment_type: 'Quiz',
    max_points: 100,
    due_date: new Date().toISOString().split('T')[0]
  })
  const [gradeInputs, setGradeInputs] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchAssignments()
    fetchStudents()
  }, [staffId, campusId, room])

  useEffect(() => {
    if (selectedAssignment) {
      fetchGradeEntries(selectedAssignment.assignment_id)
    }
  }, [selectedAssignment])

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/assignments?teacher_id=${staffId}&campus_id=${campusId}`)
      const data = await response.json()
      setAssignments(data.filter((a: Assignment) => a.room === room))
    } catch (error) {
      console.error('Error fetching assignments:', error)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/students?campus_id=${campusId}`)
      const data = await response.json()
      setStudents(data.filter((s: Student) => s.room === room))
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const fetchGradeEntries = async (assignmentId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/grade-entries?assignment_id=${assignmentId}`)
      const data = await response.json()
      setGradeEntries(data)
      
      const inputs: Record<string, string> = {}
      data.forEach((entry: GradeEntry) => {
        inputs[entry.student_id] = entry.points_earned?.toString() || ''
      })
      setGradeInputs(inputs)
    } catch (error) {
      console.error('Error fetching grade entries:', error)
    }
  }

  const handleCreateAssignment = async () => {
    try {
      const assignment: Assignment = {
        assignment_id: `assign_${Date.now()}`,
        campus_id: campusId,
        teacher_id: staffId,
        room: room,
        subject: newAssignment.subject,
        assignment_type: newAssignment.assignment_type,
        title: newAssignment.title,
        description: newAssignment.description,
        max_points: newAssignment.max_points,
        due_date: newAssignment.due_date,
        status: 'Draft',
        created_date: new Date().toISOString().split('T')[0]
      }

      await fetch(`${API_URL}/api/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignment)
      })

      const entries: GradeEntry[] = students.map(student => ({
        entry_id: `entry_${assignment.assignment_id}_${student.student_id}`,
        assignment_id: assignment.assignment_id,
        student_id: student.student_id,
        campus_id: campusId,
        points_earned: null,
        letter_grade: null,
        percentage: null,
        status: 'Missing',
        comment: null,
        submitted_date: null,
        graded_date: null,
        graded_by: staffId
      }))

      await fetch(`${API_URL}/api/grade-entries/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entries)
      })

      setIsCreateModalOpen(false)
      setNewAssignment({
        title: '',
        description: '',
        subject: 'Math',
        assignment_type: 'Quiz',
        max_points: 100,
        due_date: new Date().toISOString().split('T')[0]
      })
      fetchAssignments()
    } catch (error) {
      console.error('Error creating assignment:', error)
    }
  }

  const handleGradeChange = (studentId: string, value: string) => {
    setGradeInputs(prev => ({ ...prev, [studentId]: value }))
  }

  const calculateLetterGrade = (points: number, maxPoints: number): string => {
    const percentage = (points / maxPoints) * 100
    if (percentage >= 90) return 'A'
    if (percentage >= 80) return 'B'
    if (percentage >= 70) return 'C'
    if (percentage >= 60) return 'D'
    return 'F'
  }

  const handleSaveGrades = async () => {
    if (!selectedAssignment) return
    
    setIsSaving(true)
    try {
      const updates = students.map(student => {
        const points = parseInt(gradeInputs[student.student_id] || '0')
        const entry = gradeEntries.find(e => e.student_id === student.student_id)
        
        if (!entry) return null

        const letterGrade = points > 0 ? calculateLetterGrade(points, selectedAssignment.max_points) : null
        const percentage = points > 0 ? (points / selectedAssignment.max_points) * 100 : null

        return {
          ...entry,
          points_earned: points > 0 ? points : null,
          letter_grade: letterGrade,
          percentage: percentage,
          status: points > 0 ? 'Complete' : 'Missing',
          graded_date: new Date().toISOString().split('T')[0]
        }
      }).filter(Boolean)

      for (const update of updates) {
        if (update) {
          await fetch(`${API_URL}/api/grade-entries/${update.entry_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update)
        })
        }
      }

      alert('Grades saved successfully!')
      fetchGradeEntries(selectedAssignment.assignment_id)
    } catch (error) {
      console.error('Error saving grades:', error)
      alert('Error saving grades')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublishAssignment = async () => {
    if (!selectedAssignment) return

    try {
      await fetch(`${API_URL}/api/assignments/${selectedAssignment.assignment_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...selectedAssignment, status: 'Published' })
      })

      alert('Assignment published! Grades are now visible to parents.')
      fetchAssignments()
    } catch (error) {
      console.error('Error publishing assignment:', error)
    }
  }

  const publishedAssignments = assignments.filter(a => a.status === 'Published')
  const draftAssignments = assignments.filter(a => a.status === 'Draft')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gradebook</h2>
          <p className="text-gray-600">Manage assignments and grades for {room}</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  placeholder="e.g., Chapter 5 Quiz"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  placeholder="Assignment details..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Subject</Label>
                  <Select value={newAssignment.subject} onValueChange={(value) => setNewAssignment({ ...newAssignment, subject: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Math">Math</SelectItem>
                      <SelectItem value="ELA">ELA</SelectItem>
                      <SelectItem value="Science">Science</SelectItem>
                      <SelectItem value="Social Studies">Social Studies</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={newAssignment.assignment_type} onValueChange={(value) => setNewAssignment({ ...newAssignment, assignment_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Quiz">Quiz</SelectItem>
                      <SelectItem value="Test">Test</SelectItem>
                      <SelectItem value="Homework">Homework</SelectItem>
                      <SelectItem value="Project">Project</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max Points</Label>
                  <Input
                    type="number"
                    value={newAssignment.max_points}
                    onChange={(e) => setNewAssignment({ ...newAssignment, max_points: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={newAssignment.due_date}
                    onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleCreateAssignment} className="w-full bg-amber-600 hover:bg-amber-700">
                Create Assignment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <BookOpen className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
            <p className="text-xs text-gray-500">{publishedAssignments.length} published</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Assignments</CardTitle>
            <Eye className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftAssignments.length}</div>
            <p className="text-xs text-gray-500">Not yet published</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Calendar className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-gray-500">In this room</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {assignments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No assignments yet. Create one to get started!</p>
            ) : (
              assignments.map((assignment) => (
                <div
                  key={assignment.assignment_id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedAssignment?.assignment_id === assignment.assignment_id
                      ? 'border-amber-600 bg-amber-50'
                      : 'border-gray-200 hover:border-amber-300'
                  }`}
                  onClick={() => setSelectedAssignment(assignment)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                      <p className="text-sm text-gray-600">{assignment.subject} • {assignment.assignment_type}</p>
                      <p className="text-xs text-gray-500 mt-1">Due: {new Date(assignment.due_date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        assignment.status === 'Published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.status === 'Published' ? <Eye className="inline h-3 w-3 mr-1" /> : <EyeOff className="inline h-3 w-3 mr-1" />}
                        {assignment.status}
                      </span>
                      <span className="text-sm font-medium text-gray-700">{assignment.max_points} pts</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {selectedAssignment && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Grade Entry: {selectedAssignment.title}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Max Points: {selectedAssignment.max_points}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveGrades} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Grades'}
                </Button>
                {selectedAssignment.status === 'Draft' && (
                  <Button onClick={handlePublishAssignment} className="bg-amber-600 hover:bg-amber-700">
                    <Eye className="mr-2 h-4 w-4" />
                    Publish
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Letter</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => {
                    const entry = gradeEntries.find(e => e.student_id === student.student_id)
                    const currentPoints = parseInt(gradeInputs[student.student_id] || '0')
                    const letterGrade = currentPoints > 0 ? calculateLetterGrade(currentPoints, selectedAssignment.max_points) : '-'
                    
                    return (
                      <tr key={student.student_id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {student.first_name} {student.last_name}
                          </div>
                          <div className="text-xs text-gray-500">{student.grade}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Input
                            type="number"
                            min="0"
                            max={selectedAssignment.max_points}
                            value={gradeInputs[student.student_id] || ''}
                            onChange={(e) => handleGradeChange(student.student_id, e.target.value)}
                            className="w-20"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {currentPoints} / {selectedAssignment.max_points}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            letterGrade === 'A' ? 'bg-green-100 text-green-800' :
                            letterGrade === 'B' ? 'bg-blue-100 text-blue-800' :
                            letterGrade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                            letterGrade === 'D' ? 'bg-orange-100 text-orange-800' :
                            letterGrade === 'F' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {letterGrade}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            entry?.status === 'Complete' ? 'bg-green-100 text-green-800' :
                            entry?.status === 'Late' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {entry?.status || 'Missing'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
