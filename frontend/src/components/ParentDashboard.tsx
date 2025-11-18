import { useState, useEffect } from 'react'
import { User, DollarSign, Calendar, BookOpen, GraduationCap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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

interface Family {
  family_id: string
  family_name: string
  monthly_tuition_amount: number
  current_balance: number
  billing_status: string
  last_payment_date: string
}

interface ParentData {
  parent: {
    parent_id: string
    first_name: string
    last_name: string
    email: string
    phone: string
  }
  children: Student[]
  family: Family
}

interface ParentDashboardProps {
  parentId: string
}

export function ParentDashboard({ parentId }: ParentDashboardProps) {
  const [parentData, setParentData] = useState<ParentData | null>(null)
  const [selectedChild, setSelectedChild] = useState<Student | null>(null)
  const [childGrades, setChildGrades] = useState<any[]>([])
  const [childIXL, setChildIXL] = useState<any>(null)

  useEffect(() => {
    fetchParentData()
  }, [parentId])

  useEffect(() => {
    if (selectedChild) {
      fetchChildDetails(selectedChild.student_id)
    }
  }, [selectedChild])

  const fetchParentData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/dashboard/parent/${parentId}`)
      const data = await response.json()
      setParentData(data)
      if (data.children.length > 0) {
        setSelectedChild(data.children[0])
      }
    } catch (error) {
      console.error('Error fetching parent data:', error)
    }
  }

  const fetchChildDetails = async (studentId: string) => {
    try {
      const [gradesResponse, ixlResponse] = await Promise.all([
        fetch(`${API_URL}/api/grades/${studentId}`),
        fetch(`${API_URL}/api/ixl/${studentId}`)
      ])
      
      const grades = await gradesResponse.json()
      const ixl = await ixlResponse.json()
      
      setChildGrades(grades)
      setChildIXL(ixl)
    } catch (error) {
      console.error('Error fetching child details:', error)
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

  if (!parentData) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome, {parentData.parent.first_name} {parentData.parent.last_name}
          </h2>
          <p className="text-gray-600 mt-2">Parent Dashboard</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>My Children</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parentData.children.map((child) => (
                  <Card
                    key={child.student_id}
                    className={`cursor-pointer transition-all ${
                      selectedChild?.student_id === child.student_id
                        ? 'ring-2 ring-amber-600'
                        : 'hover:shadow-lg'
                    }`}
                    onClick={() => setSelectedChild(child)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">
                            {child.first_name} {child.last_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Grade {child.grade} • {child.session} • {child.room}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-gray-500">Attendance</p>
                          <p className="text-sm font-medium">
                            {child.attendance_present_count}P / {child.attendance_absent_count}A
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Grades</p>
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            child.overall_grade_flag === 'On track' ? 'bg-green-100 text-green-800' :
                            child.overall_grade_flag === 'Needs attention' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {child.overall_grade_flag}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-amber-600" />
                Billing Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Current Balance</p>
                <p className="text-2xl font-bold">
                  ${parentData.family.current_balance.toFixed(2)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Monthly Tuition</p>
                <p className="text-lg font-medium">
                  ${parentData.family.monthly_tuition_amount.toFixed(2)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getBillingStatusColor(parentData.family.billing_status)}`}>
                  {parentData.family.billing_status}
                </span>
              </div>
              
              {parentData.family.last_payment_date && (
                <div>
                  <p className="text-sm text-gray-500">Last Payment</p>
                  <p className="text-sm font-medium">
                    {new Date(parentData.family.last_payment_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {selectedChild && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900">
              {selectedChild.first_name}'s Progress
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Attendance</CardTitle>
                  <Calendar className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Present</span>
                      <span className="text-sm font-medium">{selectedChild.attendance_present_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Absent</span>
                      <span className="text-sm font-medium">{selectedChild.attendance_absent_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Tardy</span>
                      <span className="text-sm font-medium">{selectedChild.attendance_tardy_count}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overall Grades</CardTitle>
                  <GraduationCap className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    {selectedChild.overall_grade_flag}
                  </div>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    selectedChild.overall_grade_flag === 'On track' ? 'bg-green-100 text-green-800' :
                    selectedChild.overall_grade_flag === 'Needs attention' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedChild.overall_grade_flag}
                  </span>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">IXL Status</CardTitle>
                  <BookOpen className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    {childIXL?.weekly_hours?.toFixed(1) || '0.0'} hrs
                  </div>
                  <p className="text-xs text-gray-500">This week</p>
                  <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${
                    selectedChild.ixl_status_flag === 'On track' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedChild.ixl_status_flag}
                  </span>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Grades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {childGrades.map((grade) => (
                      <div key={grade.grade_record_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{grade.subject}</p>
                          <p className="text-xs text-gray-500">{grade.term}</p>
                        </div>
                        <div className={`text-2xl font-bold ${
                          grade.is_failing ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {grade.grade_value}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {childIXL && (
                <Card>
                  <CardHeader>
                    <CardTitle>IXL Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Weekly Hours</p>
                        <p className="text-2xl font-bold">{childIXL.weekly_hours.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Skills Practiced</p>
                        <p className="text-2xl font-bold">{childIXL.skills_practiced_this_week}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Total Skills Mastered</p>
                      <p className="text-2xl font-bold">{childIXL.skills_mastered_total}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Math</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          childIXL.math_proficiency === 'On track' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {childIXL.math_proficiency}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">ELA</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          childIXL.ela_proficiency === 'On track' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {childIXL.ela_proficiency}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-2">Recent Skills</p>
                      <div className="space-y-1">
                        {childIXL.recent_skills.map((skill: string, index: number) => (
                          <div key={index} className="text-sm bg-gray-50 px-3 py-2 rounded">
                            {skill}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Last Active</p>
                      <p className="text-sm font-medium">
                        {new Date(childIXL.last_active_date).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
