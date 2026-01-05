import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, Users, FileText, CheckCircle, Clock, AlertTriangle, TrendingUp, Download } from 'lucide-react'

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

export function SUFSScholarshipManagement({ campusId }: { campusId?: string | null }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [dashboard, setDashboard] = useState<SUFSDashboard | null>(null)
  const [scholarships, setScholarships] = useState<SUFSScholarship[]>([])
  const [claims, setClaims] = useState<SUFSClaim[]>([])
  const [payments, setPayments] = useState<SUFSPayment[]>([])
  const [students, setStudents] = useState<Record<string, Student>>({})
  const [loading, setLoading] = useState(true)

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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Active Scholarships</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scholarship Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Award ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Annual Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remaining</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {scholarships.map((scholarship) => (
                      <tr key={scholarship.scholarship_id} className="hover:bg-amber-50 cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {getStudentName(scholarship.student_id)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{scholarship.scholarship_type}</div>
                          <div className="text-xs text-gray-500">{getScholarshipTypeLabel(scholarship.scholarship_type)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {scholarship.award_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          ${scholarship.annual_award_amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          ${scholarship.remaining_balance.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            scholarship.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {scholarship.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {scholarship.eligibility_verified ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-yellow-500" />
                          )}
                        </td>
                      </tr>
                    ))}
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
