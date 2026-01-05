import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, Users, FileText, CheckCircle, Clock, AlertTriangle, TrendingUp, Download, Edit2, Save, X, Plus } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface SUFSScholarship {
  scholarship_id: string
  student_id: string
  family_id: string
  campus_id: string
  scholarship_type: string
  award_id: string
  school_year: string
  annual_award_amount: number
  quarterly_amount: number
  remaining_balance: number
  start_date: string
  end_date: string
  status: string
  eligibility_verified: boolean
  eligibility_verified_date: string
  notes: string
  created_date: string
  last_updated: string
}

interface SUFSClaim {
  claim_id: string
  scholarship_id: string
  student_id: string
  family_id: string
  campus_id: string
  claim_period: string
  claim_date: string
  amount_claimed: number
  tuition_amount: number
  fees_amount: number
  status: string
  submitted_date: string
  approved_date: string
  paid_date: string
  paid_amount: number
  denial_reason: string
  sufs_reference_number: string
  notes: string
  created_date: string
  last_updated: string
}

interface SUFSPayment {
  payment_id: string
  campus_id: string
  payment_date: string
  deposit_date: string
  total_amount: number
  sufs_reference_number: string
  bank_reference: string
  status: string
  reconciled_date: string
  reconciled_by: string
  notes: string
  created_date: string
}

interface SUFSDashboard {
  summary: {
    total_scholarship_students: number
    total_annual_awards: number
    total_remaining_balance: number
    total_payments_received: number
    total_outstanding_claims: number
    pending_reconciliation: number
  }
  claims_by_status: Record<string, { count: number; amount: number }>
  scholarship_by_type: Record<string, { count: number; total_amount: number }>
  recent_payments: SUFSPayment[]
  pending_claims: SUFSClaim[]
}

interface Student {
  student_id: string
  first_name: string
  last_name: string
  grade: string
}

const ANNUAL_TUITION = 10000 // $10,000/year per student - can be made editable per family

export function SUFSScholarshipManagement({ campusId }: { campusId?: string | null }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [dashboard, setDashboard] = useState<SUFSDashboard | null>(null)
  const [scholarships, setScholarships] = useState<SUFSScholarship[]>([])
  const [claims, setClaims] = useState<SUFSClaim[]>([])
  const [payments, setPayments] = useState<SUFSPayment[]>([])
  const [students, setStudents] = useState<Record<string, Student>>({})
  const [loading, setLoading] = useState(true)
  
  // Editing state
  const [editingScholarshipId, setEditingScholarshipId] = useState<string | null>(null)
  const [editAwardAmount, setEditAwardAmount] = useState<string>('')
  const [editTuitionAmount, setEditTuitionAmount] = useState<string>('')
  const [showNewScholarshipModal, setShowNewScholarshipModal] = useState(false)
  const [newScholarship, setNewScholarship] = useState({
    student_id: '',
    scholarship_type: 'FTC',
    annual_award_amount: '',
    tuition_amount: ANNUAL_TUITION.toString()
  })

  useEffect(() => {
    fetchDashboard()
    fetchScholarships()
    fetchClaims()
    fetchPayments()
    fetchStudents()
  }, [campusId])

  const fetchDashboard = async () => {
    try {
      const url = campusId 
        ? `${API_URL}/api/sufs/dashboard?campus_id=${campusId}`
        : `${API_URL}/api/sufs/dashboard`
      const response = await fetch(url)
      const data = await response.json()
      setDashboard(data)
    } catch (error) {
      console.error('Error fetching SUFS dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchScholarships = async () => {
    try {
      const url = campusId 
        ? `${API_URL}/api/sufs/scholarships?campus_id=${campusId}`
        : `${API_URL}/api/sufs/scholarships`
      const response = await fetch(url)
      const data = await response.json()
      setScholarships(data)
    } catch (error) {
      console.error('Error fetching scholarships:', error)
    }
  }

  const fetchClaims = async () => {
    try {
      const url = campusId 
        ? `${API_URL}/api/sufs/claims?campus_id=${campusId}`
        : `${API_URL}/api/sufs/claims`
      const response = await fetch(url)
      const data = await response.json()
      setClaims(data)
    } catch (error) {
      console.error('Error fetching claims:', error)
    }
  }

  const fetchPayments = async () => {
    try {
      const url = campusId 
        ? `${API_URL}/api/sufs/payments?campus_id=${campusId}`
        : `${API_URL}/api/sufs/payments`
      const response = await fetch(url)
      const data = await response.json()
      setPayments(data)
    } catch (error) {
      console.error('Error fetching payments:', error)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/students`)
      const data = await response.json()
      const studentMap: Record<string, Student> = {}
      data.forEach((s: Student) => {
        studentMap[s.student_id] = s
      })
      setStudents(studentMap)
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const getStudentName = (studentId: string) => {
    const student = students[studentId]
    return student ? `${student.first_name} ${student.last_name}` : studentId
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
      case 'Reconciled':
        return 'bg-green-100 text-green-800'
      case 'Approved':
      case 'Received':
        return 'bg-blue-100 text-blue-800'
      case 'Submitted':
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'Draft':
        return 'bg-gray-100 text-gray-800'
      case 'Denied':
      case 'Discrepancy':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getScholarshipTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'FES-UA': 'Family Empowerment - Unique Abilities',
      'FES-EO': 'Family Empowerment - Educational Options',
      'FTC': 'Florida Tax Credit',
      'Hope': 'Hope Scholarship',
      'New Worlds': 'New Worlds Scholarship',
      'AAA': 'Reading Scholarship'
    }
    return labels[type] || type
  }

  // Edit handlers
  const handleEditScholarship = (scholarship: SUFSScholarship) => {
    setEditingScholarshipId(scholarship.scholarship_id)
    setEditAwardAmount(scholarship.annual_award_amount.toString())
    setEditTuitionAmount(ANNUAL_TUITION.toString())
  }

  const handleCancelEdit = () => {
    setEditingScholarshipId(null)
    setEditAwardAmount('')
    setEditTuitionAmount('')
  }

  const handleSaveScholarship = async (scholarship: SUFSScholarship) => {
    const newAwardAmount = parseFloat(editAwardAmount)
    const newTuitionAmount = parseFloat(editTuitionAmount) || ANNUAL_TUITION
    
    if (isNaN(newAwardAmount) || newAwardAmount < 0) {
      alert('Please enter a valid award amount')
      return
    }
    
    if (newAwardAmount > newTuitionAmount) {
      alert(`Award amount cannot exceed tuition ($${newTuitionAmount.toLocaleString()})`)
      return
    }

    try {
      // Calculate new remaining balance based on what's been paid
      const paidSoFar = scholarship.annual_award_amount - scholarship.remaining_balance
      const newRemainingBalance = Math.max(0, newAwardAmount - paidSoFar)

      const response = await fetch(`${API_URL}/api/sufs/scholarships/${scholarship.scholarship_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annual_award_amount: newAwardAmount,
          quarterly_amount: newAwardAmount / 6, // bi-monthly payments
          remaining_balance: newRemainingBalance
        })
      })

      if (response.ok) {
        // Update local state
        setScholarships(prev => prev.map(s => 
          s.scholarship_id === scholarship.scholarship_id 
            ? { ...s, annual_award_amount: newAwardAmount, remaining_balance: newRemainingBalance }
            : s
        ))
        setEditingScholarshipId(null)
        setEditAwardAmount('')
        setEditTuitionAmount('')
        // Refresh dashboard to update totals
        fetchDashboard()
      } else {
        alert('Failed to update scholarship')
      }
    } catch (error) {
      console.error('Error updating scholarship:', error)
      alert('Error updating scholarship')
    }
  }

  const handleCreateScholarship = async () => {
    if (!newScholarship.student_id || !newScholarship.annual_award_amount) {
      alert('Please fill in all required fields')
      return
    }

    const awardAmount = parseFloat(newScholarship.annual_award_amount)
    const tuitionAmount = parseFloat(newScholarship.tuition_amount) || ANNUAL_TUITION

    if (isNaN(awardAmount) || awardAmount < 0) {
      alert('Please enter a valid award amount')
      return
    }

    if (awardAmount > tuitionAmount) {
      alert(`Award amount cannot exceed tuition ($${tuitionAmount.toLocaleString()})`)
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/sufs/scholarships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: newScholarship.student_id,
          scholarship_type: newScholarship.scholarship_type,
          annual_award_amount: awardAmount,
          quarterly_amount: awardAmount / 6,
          remaining_balance: awardAmount,
          status: 'Active',
          eligibility_verified: false
        })
      })

      if (response.ok) {
        setShowNewScholarshipModal(false)
        setNewScholarship({
          student_id: '',
          scholarship_type: 'FTC',
          annual_award_amount: '',
          tuition_amount: ANNUAL_TUITION.toString()
        })
        // Refresh data
        fetchScholarships()
        fetchDashboard()
      } else {
        alert('Failed to create scholarship')
      }
    } catch (error) {
      console.error('Error creating scholarship:', error)
      alert('Error creating scholarship')
    }
  }

  // Get students without scholarships for new scholarship dropdown
  const studentsWithoutScholarships = Object.values(students).filter(
    student => !scholarships.some(s => s.student_id === student.student_id)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Step Up for Students Scholarships</h2>
          <p className="text-sm text-gray-600 mt-1">Manage scholarship awards, claims, and payments</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="scholarships">Scholarships</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          {dashboard && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="border-l-4 border-amber-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Scholarship Students</CardTitle>
                    <Users className="h-4 w-4 text-amber-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboard.summary.total_scholarship_students}</div>
                    <p className="text-xs text-gray-500">Active SUFS recipients</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-green-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Annual Awards</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${dashboard.summary.total_annual_awards.toLocaleString()}</div>
                    <p className="text-xs text-gray-500">2025-2026 school year</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-blue-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Payments Received</CardTitle>
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${dashboard.summary.total_payments_received.toLocaleString()}</div>
                    <p className="text-xs text-gray-500">Year to date</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-yellow-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Outstanding Claims</CardTitle>
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${dashboard.summary.total_outstanding_claims.toLocaleString()}</div>
                    <p className="text-xs text-gray-500">Awaiting payment</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-purple-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Remaining Balance</CardTitle>
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${dashboard.summary.total_remaining_balance.toLocaleString()}</div>
                    <p className="text-xs text-gray-500">Available to claim</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-orange-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Reconciliation</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${dashboard.summary.pending_reconciliation.toLocaleString()}</div>
                    <p className="text-xs text-gray-500">Needs review</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Claims by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(dashboard.claims_by_status).map(([status, data]) => (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
                              {status}
                            </span>
                            <span className="text-sm text-gray-600">{data.count} claims</span>
                          </div>
                          <span className="font-medium">${data.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Scholarships by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(dashboard.scholarship_by_type).map(([type, data]) => (
                        data.count > 0 && (
                          <div key={type} className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium">{type}</span>
                              <span className="text-xs text-gray-500 ml-2">({data.count} students)</span>
                            </div>
                            <span className="font-medium">${data.total_amount.toLocaleString()}</span>
                          </div>
                        )
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {dashboard.pending_claims.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pending Claims Requiring Action</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {dashboard.pending_claims.slice(0, 5).map((claim) => (
                            <tr key={claim.claim_id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm">{getStudentName(claim.student_id)}</td>
                              <td className="px-4 py-2 text-sm">{claim.claim_period}</td>
                              <td className="px-4 py-2 text-sm font-medium">${claim.amount_claimed.toLocaleString()}</td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(claim.status)}`}>
                                  {claim.status}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">
                                {claim.submitted_date ? new Date(claim.submitted_date).toLocaleDateString() : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="scholarships" className="mt-6">
          {/* New Scholarship Modal */}
          {showNewScholarshipModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Add New Scholarship</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowNewScholarshipModal(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={newScholarship.student_id}
                      onChange={(e) => setNewScholarship({...newScholarship, student_id: e.target.value})}
                    >
                      <option value="">Select a student...</option>
                      {studentsWithoutScholarships.map(student => (
                        <option key={student.student_id} value={student.student_id}>
                          {student.first_name} {student.last_name} - Grade {student.grade}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scholarship Type *</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={newScholarship.scholarship_type}
                      onChange={(e) => setNewScholarship({...newScholarship, scholarship_type: e.target.value})}
                    >
                      <option value="FTC">FTC - Florida Tax Credit</option>
                      <option value="FES-UA">FES-UA - Family Empowerment (Unique Abilities)</option>
                      <option value="FES-EO">FES-EO - Family Empowerment (Educational Options)</option>
                      <option value="Hope">Hope Scholarship</option>
                      <option value="New Worlds">New Worlds Scholarship</option>
                      <option value="AAA">AAA - Reading Scholarship</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Annual Tuition</label>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">$</span>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={newScholarship.tuition_amount}
                        onChange={(e) => setNewScholarship({...newScholarship, tuition_amount: e.target.value})}
                        placeholder="10000"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Default: $10,000/year</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scholarship Award Amount *</label>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">$</span>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={newScholarship.annual_award_amount}
                        onChange={(e) => setNewScholarship({...newScholarship, annual_award_amount: e.target.value})}
                        placeholder="Enter award amount"
                      />
                    </div>
                    {newScholarship.annual_award_amount && newScholarship.tuition_amount && (
                      <p className="text-xs text-blue-600 mt-1">
                        Parent Responsibility: ${(parseFloat(newScholarship.tuition_amount) - parseFloat(newScholarship.annual_award_amount)).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setShowNewScholarshipModal(false)}>Cancel</Button>
                  <Button onClick={handleCreateScholarship} className="bg-amber-600 hover:bg-amber-700 text-white">
                    Create Scholarship
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Active Scholarships</CardTitle>
              <div className="flex gap-2">
                <Button onClick={() => setShowNewScholarshipModal(true)} className="bg-amber-600 hover:bg-amber-700 text-white" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  New Scholarship
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Award ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Annual Tuition</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scholarship Award</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent Pays</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remaining</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {scholarships.map((scholarship) => {
                      const isEditing = editingScholarshipId === scholarship.scholarship_id
                      const currentAward = isEditing ? parseFloat(editAwardAmount) || 0 : scholarship.annual_award_amount
                      const currentTuition = isEditing ? parseFloat(editTuitionAmount) || ANNUAL_TUITION : ANNUAL_TUITION
                      const parentPays = currentTuition - currentAward
                      
                      return (
                        <tr key={scholarship.scholarship_id} className="hover:bg-amber-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {getStudentName(scholarship.student_id)}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{scholarship.scholarship_type}</div>
                            <div className="text-xs text-gray-500">{getScholarshipTypeLabel(scholarship.scholarship_type)}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {scholarship.award_id}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center">
                                <span className="text-gray-500 mr-1">$</span>
                                <input
                                  type="number"
                                  value={editTuitionAmount}
                                  onChange={(e) => setEditTuitionAmount(e.target.value)}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </div>
                            ) : (
                              <span className="text-sm text-gray-900">${ANNUAL_TUITION.toLocaleString()}</span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center">
                                <span className="text-gray-500 mr-1">$</span>
                                <input
                                  type="number"
                                  value={editAwardAmount}
                                  onChange={(e) => setEditAwardAmount(e.target.value)}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </div>
                            ) : (
                              <span className="text-sm font-medium text-green-600">
                                ${scholarship.annual_award_amount.toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${parentPays > 0 ? 'text-blue-600' : 'text-green-600'}`}>
                              ${parentPays.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-amber-600">
                            ${scholarship.remaining_balance.toLocaleString()}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              scholarship.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {scholarship.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {scholarship.eligibility_verified ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <Clock className="h-5 w-5 text-yellow-500" />
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSaveScholarship(scholarship)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 w-8 p-0"
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelEdit}
                                  className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 h-8 w-8 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditScholarship(scholarship)}
                                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              >
                                <Edit2 className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="claims" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Scholarship Claims</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  New Claim
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tuition</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fees</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {claims.map((claim) => (
                      <tr key={claim.claim_id} className="hover:bg-amber-50 cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {getStudentName(claim.student_id)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {claim.claim_period}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          ${claim.amount_claimed.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${claim.tuition_amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${claim.fees_amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(claim.status)}`}>
                            {claim.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {claim.sufs_reference_number || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {claim.paid_amount ? `$${claim.paid_amount.toLocaleString()}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>SUFS Payments Received</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deposit Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SUFS Reference</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank Reference</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reconciled</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment.payment_id} className="hover:bg-amber-50 cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.deposit_date ? new Date(payment.deposit_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          ${payment.total_amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.sufs_reference_number || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.bank_reference || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.reconciled_date ? new Date(payment.reconciled_date).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reconciliation" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reconciliation Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-600 font-medium">Reconciled</div>
                    <div className="text-2xl font-bold text-green-700">
                      {payments.filter(p => p.status === 'Reconciled').length}
                    </div>
                    <div className="text-sm text-green-600">
                      ${payments.filter(p => p.status === 'Reconciled').reduce((sum, p) => sum + p.total_amount, 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="text-sm text-yellow-600 font-medium">Pending</div>
                    <div className="text-2xl font-bold text-yellow-700">
                      {payments.filter(p => p.status === 'Received' || p.status === 'Pending').length}
                    </div>
                    <div className="text-sm text-yellow-600">
                      ${payments.filter(p => p.status === 'Received' || p.status === 'Pending').reduce((sum, p) => sum + p.total_amount, 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="text-sm text-red-600 font-medium">Discrepancies</div>
                    <div className="text-2xl font-bold text-red-700">
                      {payments.filter(p => p.status === 'Discrepancy').length}
                    </div>
                    <div className="text-sm text-red-600">Needs review</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium">Total Claims</div>
                    <div className="text-2xl font-bold text-blue-700">{claims.length}</div>
                    <div className="text-sm text-blue-600">
                      ${claims.reduce((sum, c) => sum + c.amount_claimed, 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payments Pending Reconciliation</CardTitle>
              </CardHeader>
              <CardContent>
                {payments.filter(p => p.status === 'Received').length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SUFS Reference</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {payments.filter(p => p.status === 'Received').map((payment) => (
                          <tr key={payment.payment_id} className="hover:bg-amber-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {new Date(payment.payment_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              ${payment.total_amount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {payment.sufs_reference_number || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                                {payment.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Button size="sm" variant="outline">Reconcile</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                    <p>All payments have been reconciled</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
