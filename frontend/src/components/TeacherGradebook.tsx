import { useState, useEffect } from 'react'
import { Plus, Save, Eye, EyeOff, BookOpen, Filter, AlertTriangle, MessageSquare, BarChart3, Users, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LearningProgressImport } from './LearningProgressImport'

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
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [subjectFilter, setSubjectFilter] = useState<string>('All')
  const [showComments, setShowComments] = useState(false)

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
        const comments: Record<string, string> = {}
        data.forEach((entry: GradeEntry) => {
          inputs[entry.student_id] = entry.points_earned?.toString() || ''
          comments[entry.student_id] = entry.comment || ''
        })
        setGradeInputs(inputs)
        setCommentInputs(comments)
      } catch (error) {
        console.error('Error fetching grade entries:', error)
      }
    }

    const handleCommentChange = (studentId: string, value: string) => {
      setCommentInputs(prev => ({ ...prev, [studentId]: value }))
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
          const comment = commentInputs[student.student_id] || null
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
            graded_date: new Date().toISOString().split('T')[0],
            comment: comment
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
  
    // Filter assignments by subject
    const filteredAssignments = subjectFilter === 'All' 
      ? assignments 
      : assignments.filter(a => a.subject === subjectFilter)

    // Calculate class average for selected assignment
    const calculateClassAverage = () => {
      if (!selectedAssignment || gradeEntries.length === 0) return null
      const gradedEntries = gradeEntries.filter(e => e.points_earned !== null && e.points_earned > 0)
      if (gradedEntries.length === 0) return null
      const totalPoints = gradedEntries.reduce((sum, e) => sum + (e.points_earned || 0), 0)
      return Math.round((totalPoints / gradedEntries.length / selectedAssignment.max_points) * 100)
    }

    // Calculate grade distribution for selected assignment
    const calculateGradeDistribution = () => {
      if (!selectedAssignment) return { A: 0, B: 0, C: 0, D: 0, F: 0, Missing: 0 }
      const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0, Missing: 0 }
      students.forEach(student => {
        const points = parseInt(gradeInputs[student.student_id] || '0')
        if (points === 0) {
          distribution.Missing++
        } else {
          const letter = calculateLetterGrade(points, selectedAssignment.max_points)
          distribution[letter as keyof typeof distribution]++
        }
      })
      return distribution
    }

    // Count missing work across all assignments
    const getMissingWorkCount = () => {
      return gradeEntries.filter(e => e.status === 'Missing' || e.points_earned === null || e.points_earned === 0).length
    }

    const classAverage = calculateClassAverage()
    const gradeDistribution = calculateGradeDistribution()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gradebook</h2>
          <p className="text-gray-600">Manage assignments and grades for {room}</p>
        </div>
        <div className="flex gap-2">
          <LearningProgressImport />
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="mr-2 h-4 w-4" />
                Create Assignment
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-xl max-h-[80vh] overflow-y-auto p-4">
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
              <Button onClick={handleCreateAssignment} className="w-full bg-red-600 hover:bg-red-700">
                Create Assignment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
                  <BookOpen className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{assignments.length}</div>
                  <p className="text-xs text-gray-500">{publishedAssignments.length} published</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Students</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{students.length}</div>
                  <p className="text-xs text-gray-500">In this room</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Class Average</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {classAverage !== null ? `${classAverage}%` : '--'}
                  </div>
                  <p className="text-xs text-gray-500">
                    {selectedAssignment ? 'Selected assignment' : 'Select an assignment'}
                  </p>
                </CardContent>
              </Card>

              <Card className={getMissingWorkCount() > 0 ? 'border-amber-300 bg-amber-50' : ''}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Missing Work</CardTitle>
                  <AlertTriangle className={`h-4 w-4 ${getMissingWorkCount() > 0 ? 'text-amber-600' : 'text-gray-400'}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getMissingWorkCount() > 0 ? 'text-amber-600' : ''}`}>
                    {selectedAssignment ? getMissingWorkCount() : '--'}
                  </div>
                  <p className="text-xs text-gray-500">
                    {selectedAssignment ? 'Students need to submit' : 'Select an assignment'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Assignments</CardTitle>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Filter by subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Subjects</SelectItem>
                        <SelectItem value="Math">Math</SelectItem>
                        <SelectItem value="ELA">ELA</SelectItem>
                        <SelectItem value="Science">Science</SelectItem>
                        <SelectItem value="Social Studies">Social Studies</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredAssignments.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      {assignments.length === 0 ? 'No assignments yet. Create one to get started!' : 'No assignments match the selected filter.'}
                    </p>
                  ) : (
                    filteredAssignments.map((assignment) => (
                <div
                  key={assignment.assignment_id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedAssignment?.assignment_id === assignment.assignment_id
                      ? 'border-red-600 bg-amber-50'
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
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                      <CardTitle>Grade Entry: {selectedAssignment.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Max Points: {selectedAssignment.max_points}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowComments(!showComments)}
                        className={showComments ? 'bg-blue-50 border-blue-300' : ''}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        {showComments ? 'Hide Comments' : 'Show Comments'}
                      </Button>
                      <Button onClick={handleSaveGrades} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? 'Saving...' : 'Save Grades'}
                      </Button>
                      {selectedAssignment.status === 'Draft' && (
                        <Button onClick={handlePublishAssignment} className="bg-red-600 hover:bg-red-700">
                          <Eye className="mr-2 h-4 w-4" />
                          Publish
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Grade Distribution */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Grade Distribution</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <div className="flex items-center gap-1 px-3 py-1 bg-green-100 rounded-full">
                        <span className="text-xs font-medium text-green-800">A: {gradeDistribution.A}</span>
                      </div>
                      <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 rounded-full">
                        <span className="text-xs font-medium text-blue-800">B: {gradeDistribution.B}</span>
                      </div>
                      <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 rounded-full">
                        <span className="text-xs font-medium text-yellow-800">C: {gradeDistribution.C}</span>
                      </div>
                      <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 rounded-full">
                        <span className="text-xs font-medium text-orange-800">D: {gradeDistribution.D}</span>
                      </div>
                      <div className="flex items-center gap-1 px-3 py-1 bg-red-100 rounded-full">
                        <span className="text-xs font-medium text-red-800">F: {gradeDistribution.F}</span>
                      </div>
                      <div className="flex items-center gap-1 px-3 py-1 bg-gray-200 rounded-full">
                        <span className="text-xs font-medium text-gray-700">Missing: {gradeDistribution.Missing}</span>
                      </div>
                    </div>
                  </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Letter</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                {showComments && (
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comment</th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {students.map((student) => {
                                const entry = gradeEntries.find(e => e.student_id === student.student_id)
                                const currentPoints = parseInt(gradeInputs[student.student_id] || '0')
                                const letterGrade = currentPoints > 0 ? calculateLetterGrade(currentPoints, selectedAssignment.max_points) : '-'
                                const isMissing = currentPoints === 0
                    
                                return (
                                  <tr key={student.student_id} className={isMissing ? 'bg-amber-50' : ''}>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="flex items-center gap-2">
                                        {isMissing && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                                        <div>
                                          <div className="text-sm font-medium text-gray-900">
                                            {student.first_name} {student.last_name}
                                          </div>
                                          <div className="text-xs text-gray-500">{student.grade}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
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
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {currentPoints} / {selectedAssignment.max_points}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
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
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        entry?.status === 'Complete' ? 'bg-green-100 text-green-800' :
                                        entry?.status === 'Late' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-amber-100 text-amber-800'
                                      }`}>
                                        {entry?.status || 'Missing'}
                                      </span>
                                    </td>
                                    {showComments && (
                                      <td className="px-4 py-4">
                                        <Input
                                          type="text"
                                          value={commentInputs[student.student_id] || ''}
                                          onChange={(e) => handleCommentChange(student.student_id, e.target.value)}
                                          className="w-48"
                                          placeholder="Add feedback..."
                                        />
                                      </td>
                                    )}
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
