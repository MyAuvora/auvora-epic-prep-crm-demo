import { useState, useEffect } from 'react'
import { User, DollarSign, Calendar, BookOpen, GraduationCap, ExternalLink, RefreshCw, X, CreditCard, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ConferenceScheduling } from './ConferenceScheduling'
import { AskAuvoraWidget } from './AskAuvoraWidget'
import { EventsCalendar } from './EventsCalendar'
import { DocumentManagement } from './DocumentManagement'
import { StoreComponent } from './StoreComponent'
import { PhotoGallery } from './PhotoGallery'
import { MessagingPlatform } from './MessagingPlatform'
import { HealthRecords } from './HealthRecords'
import { ParentTuitionHistory } from './ParentTuitionHistory'
import { ParentAnnouncementFeed } from './ParentAnnouncementFeed'
import { GradeBreakdownModal } from './GradeBreakdownModal'
import { PaymentMethodStorage } from './PaymentMethodStorage'
import { AttendanceCalendarModal } from './AttendanceCalendarModal'
import { DailyBibleVerse } from './DailyBibleVerse'
import { EnrollmentForm } from './EnrollmentForm'
import { ParentEnrollmentSubmissions } from './EnrollmentSubmissions'
import { SimplifiedBillingSummary } from './SimplifiedBillingSummary'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Student {
  student_id: string
  first_name: string
  last_name: string
  grade: string
  session: string
  room: string
  campus_id?: string
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

interface EnhancedParentDashboardProps {
  parentId: string
}

export function EnhancedParentDashboard({ parentId }: EnhancedParentDashboardProps) {
  const [view, setView] = useState<'home' | 'announcements' | 'billing' | 'conferences' | 'events' | 'documents' | 'store' | 'photos' | 'messages' | 'health' | 'enrollment'>('home')
  const [parentData, setParentData] = useState<ParentData | null>(null)
  const [selectedChild, setSelectedChild] = useState<Student | null>(null)
  const [childGrades, setChildGrades] = useState<any[]>([])
  const [childIXL, setChildIXL] = useState<any>(null)
  const [gradeBreakdownModal, setGradeBreakdownModal] = useState<{
    isOpen: boolean;
    studentId: string;
    subject: string;
    overallGrade: string;
  }>({
    isOpen: false,
    studentId: '',
    subject: '',
    overallGrade: ''
  })

  const [attendanceCalendarModal, setAttendanceCalendarModal] = useState<{
    isOpen: boolean;
    studentId: string;
    studentName: string;
  }>({
    isOpen: false,
    studentId: '',
    studentName: ''
  })

  const [reEnrollmentStatus, setReEnrollmentStatus] = useState<{
    [studentId: string]: { enrolled: boolean; year: string }
  }>({})

  // Re-enrollment payment modal state
  const [reEnrollmentPaymentModal, setReEnrollmentPaymentModal] = useState<{
    isOpen: boolean;
    studentId: string;
    studentName: string;
    isProcessing: boolean;
    paymentComplete: boolean;
  }>({
    isOpen: false,
    studentId: '',
    studentName: '',
    isProcessing: false,
    paymentComplete: false
  })

  // Enrollment fee constant (can be fetched from API in production)
  const ENROLLMENT_FEE = 250

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

  // Re-enrollment handlers - opens payment modal for parents
  const handleReEnroll = (studentId: string, studentName: string) => {
    setReEnrollmentPaymentModal({
      isOpen: true,
      studentId,
      studentName,
      isProcessing: false,
      paymentComplete: false
    });
  };

  // Process enrollment payment
  const handleEnrollmentPayment = async () => {
    setReEnrollmentPaymentModal(prev => ({ ...prev, isProcessing: true }));
    
    // Simulate payment processing (will be replaced with Stripe integration)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const currentYear = new Date().getFullYear();
    const schoolYear = `${currentYear}-${currentYear + 1}`;
    
    // Mark as enrolled after payment
    setReEnrollmentStatus(prev => ({
      ...prev,
      [reEnrollmentPaymentModal.studentId]: { enrolled: true, year: schoolYear }
    }));
    
    setReEnrollmentPaymentModal(prev => ({ 
      ...prev, 
      isProcessing: false, 
      paymentComplete: true 
    }));
  };

  // Close payment modal
  const closePaymentModal = () => {
    setReEnrollmentPaymentModal({
      isOpen: false,
      studentId: '',
      studentName: '',
      isProcessing: false,
      paymentComplete: false
    });
  };

  const handleCancelReEnrollment = (studentId: string) => {
    setReEnrollmentStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[studentId];
      return newStatus;
    });
  };

  if (!parentData) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 py-4">
            <button
              onClick={() => setView('home')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'home'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Home
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
              onClick={() => setView('billing')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'billing'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Billing
            </button>
            <button
              onClick={() => setView('conferences')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'conferences'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Conferences
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
              onClick={() => setView('store')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                view === 'store'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Store
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
                        onClick={() => setView('health')}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          view === 'health'
                            ? 'bg-red-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Health
                      </button>
                      <button
                        onClick={() => setView('enrollment')}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          view === 'enrollment'
                            ? 'bg-red-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Enrollment
                      </button>
                    </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'home' && (
          <>
                        <div className="mb-8">
                          <h2 className="text-3xl font-bold text-gray-900">
                            Welcome, {parentData.parent.first_name} {parentData.parent.last_name}
                          </h2>
                          <p className="text-gray-600 mt-2">Parent Dashboard</p>
                        </div>

                        <div className="mb-8">
                          <DailyBibleVerse />
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
                            ? 'ring-2 ring-red-600'
                            : 'hover:shadow-lg'
                        }`}
                        onClick={() => setSelectedChild(child)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
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
                    <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
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
                      <button
                        onClick={() => setAttendanceCalendarModal({
                          isOpen: true,
                          studentId: selectedChild.student_id,
                          studentName: `${selectedChild.first_name} ${selectedChild.last_name}`
                        })}
                        className="text-blue-600 hover:text-amber-700 transition-colors"
                        title="View attendance calendar"
                      >
                        <Calendar className="h-4 w-4" />
                      </button>
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
                      <GraduationCap className="h-4 w-4 text-blue-600" />
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
                      <BookOpen className="h-4 w-4 text-blue-600" />
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
                      <CardDescription>Click on any grade to see detailed breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {childGrades.map((grade) => (
                          <div 
                            key={grade.grade_record_id} 
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                            onClick={() => setGradeBreakdownModal({
                              isOpen: true,
                              studentId: selectedChild.student_id,
                              subject: grade.subject,
                              overallGrade: grade.grade_value
                            })}
                          >
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
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>IXL Progress</CardTitle>
                        <a
                          href="https://www.ixl.com/signin"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-[#0A2463] hover:bg-[#163B9A] rounded-md transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open IXL
                        </a>
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

                {/* Re-Enrollment Section */}
                <Card className="mt-6">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 text-blue-600" />
                      Re-Enrollment for Next Year
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reEnrollmentStatus[selectedChild.student_id]?.enrolled ? (
                      <div className="flex items-center justify-between bg-green-50 p-4 rounded-lg border border-green-200">
                        <div>
                          <p className="font-semibold text-green-800">
                            Re-enrolled for {reEnrollmentStatus[selectedChild.student_id].year}
                          </p>
                          <p className="text-sm text-green-600">{selectedChild.first_name} is confirmed for the next school year</p>
                        </div>
                        <button
                          onClick={() => handleCancelReEnrollment(selectedChild.student_id)}
                          className="flex items-center px-3 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-700">Not yet enrolled for next year</p>
                          <p className="text-sm text-gray-500">Click to re-enroll {selectedChild.first_name} for the upcoming school year</p>
                        </div>
                        <button
                          onClick={() => handleReEnroll(selectedChild.student_id, selectedChild.first_name)}
                          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Re-Enroll for {new Date().getFullYear()}-{new Date().getFullYear() + 1}
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        {view === 'announcements' && selectedChild && (
          <ParentAnnouncementFeed 
            userId={parentId} 
            campusId={selectedChild.campus_id || ''} 
          />
        )}

                {view === 'billing' && (
                  <div className="space-y-6">
                    <SimplifiedBillingSummary familyId={parentData.family.family_id} />
                    <PaymentMethodStorage familyId={parentData.family.family_id} />
                    <ParentTuitionHistory familyId={parentData.family.family_id} />
                  </div>
                )}

        {view === 'conferences' && (
          <ConferenceScheduling 
            parentId={parentId} 
            students={parentData.children}
          />
        )}

        {view === 'events' && (
          <EventsCalendar role="parent" userId={parentId} />
        )}

                {view === 'documents' && (
                  <div className="space-y-8">
                    <ParentEnrollmentSubmissions parentEmail={parentData?.parent?.email} />
                    <DocumentManagement role="parent" userId={parentId} />
                  </div>
                )}

        {view === 'store' && (
          <StoreComponent role="parent" userId={parentId} />
        )}

        {view === 'photos' && (
          <PhotoGallery role="parent" />
        )}

        {view === 'messages' && (
          <MessagingPlatform role="parent" userId={parentId} userType="Parent" />
        )}

              {view === 'health' && (
                <HealthRecords role="parent" userId={parentId} />
              )}

              {view === 'enrollment' && (
                <EnrollmentForm 
                  onSubmit={(data) => {
                    console.log('Enrollment submitted:', data);
                    setView('home');
                  }}
                  onCancel={() => setView('home')}
                />
              )}
            </div>

      {/* Ask Auvora Widget */}
      <AskAuvoraWidget />

      {/* Grade Breakdown Modal */}
      <GradeBreakdownModal
        isOpen={gradeBreakdownModal.isOpen}
        onClose={() => setGradeBreakdownModal({ ...gradeBreakdownModal, isOpen: false })}
        studentId={gradeBreakdownModal.studentId}
        subject={gradeBreakdownModal.subject}
        overallGrade={gradeBreakdownModal.overallGrade}
      />

      {/* Attendance Calendar Modal */}
      <AttendanceCalendarModal
        isOpen={attendanceCalendarModal.isOpen}
        onClose={() => setAttendanceCalendarModal({ ...attendanceCalendarModal, isOpen: false })}
        studentId={attendanceCalendarModal.studentId}
        studentName={attendanceCalendarModal.studentName}
      />

      {/* Re-Enrollment Payment Modal */}
      <Dialog open={reEnrollmentPaymentModal.isOpen} onOpenChange={(open) => !open && closePaymentModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reEnrollmentPaymentModal.paymentComplete ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <CreditCard className="h-5 w-5 text-[#0A2463]" />
              )}
              {reEnrollmentPaymentModal.paymentComplete ? 'Payment Complete!' : 'Re-Enrollment Payment'}
            </DialogTitle>
            <DialogDescription>
              {reEnrollmentPaymentModal.paymentComplete 
                ? `${reEnrollmentPaymentModal.studentName} has been successfully re-enrolled!`
                : `Complete payment to re-enroll ${reEnrollmentPaymentModal.studentName} for the ${new Date().getFullYear()}-${new Date().getFullYear() + 1} school year.`
              }
            </DialogDescription>
          </DialogHeader>

          {!reEnrollmentPaymentModal.paymentComplete ? (
            <div className="space-y-4">
              {/* Fee Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Student</span>
                  <span className="font-medium">{reEnrollmentPaymentModal.studentName}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">School Year</span>
                  <span className="font-medium">{new Date().getFullYear()}-{new Date().getFullYear() + 1}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800 font-semibold">Enrollment Fee</span>
                    <span className="text-2xl font-bold text-[#0A2463]">${ENROLLMENT_FEE.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Info */}
              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                <p className="font-medium mb-1">Payment will be charged to your saved payment method.</p>
                <p className="text-blue-600">You can manage your payment methods in the Billing section.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={closePaymentModal}
                  disabled={reEnrollmentPaymentModal.isProcessing}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEnrollmentPayment}
                  disabled={reEnrollmentPaymentModal.isProcessing}
                  className="flex-1 bg-[#0A2463] hover:bg-[#163B9A]"
                >
                  {reEnrollmentPaymentModal.isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay ${ENROLLMENT_FEE.toFixed(2)}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Success Message */}
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <p className="text-green-800 font-semibold">Payment Successful!</p>
                <p className="text-green-600 text-sm mt-1">
                  ${ENROLLMENT_FEE.toFixed(2)} has been charged to your payment method.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                <p>{reEnrollmentPaymentModal.studentName} is now enrolled for the {new Date().getFullYear()}-{new Date().getFullYear() + 1} school year.</p>
                <p className="mt-1">A confirmation email has been sent to your registered email address.</p>
              </div>

              <Button
                onClick={closePaymentModal}
                className="w-full bg-[#0A2463] hover:bg-[#163B9A]"
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
