import { useEffect, useState } from 'react';
import { ArrowLeft, Users, DollarSign, Calendar, BookOpen, AlertTriangle, FileText, Phone, Mail, MapPin, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Student {
  student_id: string;
  first_name: string;
  last_name: string;
  grade: string;
  session: string;
  room: string;
  family_id: string;
  attendance_present_count: number;
  attendance_absent_count: number;
  attendance_tardy_count: number;
  overall_grade_flag: string;
  ixl_status_flag: string;
  overall_risk_flag: string;
  date_of_birth?: string;
  enrollment_date?: string;
}

interface Family {
  family_id: string;
  family_name: string;
  student_ids: string[];
  monthly_tuition_amount: number;
  current_balance: number;
  billing_status: string;
  last_payment_date: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  address?: string;
  payment_method?: string;
  autopay_enabled?: boolean;
}

interface Grade {
  subject: string;
  grade_value: string;
}

interface IXLSummary {
  weekly_hours: number;
  skills_practiced_this_week: number;
  skills_mastered_total: number;
  math_proficiency: string;
  ela_proficiency: string;
  recent_skills: string[];
  last_active_date: string;
}

interface Invoice {
  invoice_id: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  status: string;
  description: string;
}

interface BillingRecord {
  billing_record_id: string;
  family_id: string;
  date: string;
  type: string;
  description: string;
  amount: number;
  source: string | null;
  period_month: string | null;
  category: string | null;
  student_id: string | null;
}

interface SUFSScholarship {
  scholarship_id: string;
  student_id: string;
  scholarship_type: string;
  annual_award_amount: number;
  remaining_balance: number;
  status: string;
}

const ANNUAL_TUITION = 10000; // $10,000/year per student

interface FullAccountViewProps {
  type: 'family' | 'student';
  id: string;
  onBack: () => void;
  onStudentClick?: (studentId: string) => void;
  onFamilyClick?: (familyId: string) => void;
}

export function FullAccountView({ type, id, onBack, onStudentClick, onFamilyClick }: FullAccountViewProps) {
  const [loading, setLoading] = useState(true);
  const [family, setFamily] = useState<Family | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [ixl, setIxl] = useState<IXLSummary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [scholarships, setScholarships] = useState<SUFSScholarship[]>([]);
  const [editingScholarshipId, setEditingScholarshipId] = useState<string | null>(null);
  const [editAwardAmount, setEditAwardAmount] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (type === 'family') {
          // Fetch family data
          const familyRes = await fetch(`${API_URL}/api/families/${id}`);
          const familyData = await familyRes.json();
          setFamily(familyData);

          // Fetch students in this family
          const studentsRes = await fetch(`${API_URL}/api/students?family_id=${id}`);
          const studentsData = await studentsRes.json();
          setStudents(studentsData);

          // Fetch invoices
          try {
            const invoicesRes = await fetch(`${API_URL}/api/invoices?family_id=${id}`);
            if (invoicesRes.ok) {
              const invoicesData = await invoicesRes.json();
              setInvoices(invoicesData);
            }
          } catch (e) {
            console.log('Invoices not available');
          }

          // Fetch billing records (includes payment source info)
          try {
            const billingRes = await fetch(`${API_URL}/api/billing/${id}`);
            if (billingRes.ok) {
              const billingData = await billingRes.json();
              setBillingRecords(billingData);
            }
          } catch (e) {
            console.log('Billing records not available');
          }

          // Fetch SUFS scholarships for this family
          try {
            const scholarshipsRes = await fetch(`${API_URL}/api/sufs/scholarships?family_id=${id}`);
            if (scholarshipsRes.ok) {
              const scholarshipsData = await scholarshipsRes.json();
              setScholarships(scholarshipsData);
            }
          } catch (e) {
            console.log('Scholarships not available');
          }
        } else {
          // Fetch student data
          const studentRes = await fetch(`${API_URL}/api/students/${id}`);
          const studentData = await studentRes.json();
          setSelectedStudent(studentData);

          // Fetch family data for this student
          if (studentData.family_id) {
            const familyRes = await fetch(`${API_URL}/api/families/${studentData.family_id}`);
            const familyData = await familyRes.json();
            setFamily(familyData);
          }

          // Fetch grades
          const gradesRes = await fetch(`${API_URL}/api/grades/${id}`);
          const gradesData = await gradesRes.json();
          setGrades(gradesData);

          // Fetch IXL data
          const ixlRes = await fetch(`${API_URL}/api/ixl/${id}`);
          const ixlData = await ixlRes.json();
          setIxl(ixlData);

          // Fetch SUFS scholarships for this student
          try {
            const scholarshipsRes = await fetch(`${API_URL}/api/sufs/scholarships?student_id=${id}`);
            if (scholarshipsRes.ok) {
              const scholarshipsData = await scholarshipsRes.json();
              setScholarships(scholarshipsData);
            }
          } catch (e) {
            console.log('Scholarships not available');
          }
        }
      } catch (error) {
        console.error('Error fetching account data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type, id]);

  const getBillingStatusColor = (status: string) => {
    switch (status) {
      case 'Green': return 'text-green-600 bg-green-100';
      case 'Yellow': return 'text-yellow-600 bg-yellow-100';
      case 'Red': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskFlagColor = (flag: string) => {
    switch (flag) {
      case 'None': return 'text-green-600 bg-green-100';
      case 'Watch': return 'text-yellow-600 bg-yellow-100';
      case 'At risk': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleEditScholarship = (scholarship: SUFSScholarship) => {
    setEditingScholarshipId(scholarship.scholarship_id);
    setEditAwardAmount(scholarship.annual_award_amount.toString());
  };

  const handleCancelEdit = () => {
    setEditingScholarshipId(null);
    setEditAwardAmount('');
  };

  const handleSaveScholarship = async (scholarship: SUFSScholarship) => {
    const newAwardAmount = parseFloat(editAwardAmount);
    if (isNaN(newAwardAmount) || newAwardAmount < 0 || newAwardAmount > ANNUAL_TUITION) {
      alert(`Award amount must be between $0 and $${ANNUAL_TUITION.toLocaleString()}`);
      return;
    }

    try {
      // Calculate new remaining balance based on what's been paid
      const paidSoFar = scholarship.annual_award_amount - scholarship.remaining_balance;
      const newRemainingBalance = Math.max(0, newAwardAmount - paidSoFar);

      const response = await fetch(`${API_URL}/api/sufs/scholarships/${scholarship.scholarship_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annual_award_amount: newAwardAmount,
          quarterly_amount: newAwardAmount / 6, // bi-monthly payments
          remaining_balance: newRemainingBalance
        })
      });

      if (response.ok) {
        // Update local state
        setScholarships(prev => prev.map(s => 
          s.scholarship_id === scholarship.scholarship_id 
            ? { ...s, annual_award_amount: newAwardAmount, remaining_balance: newRemainingBalance }
            : s
        ));
        setEditingScholarshipId(null);
        setEditAwardAmount('');
      } else {
        alert('Failed to update scholarship');
      }
    } catch (error) {
      console.error('Error updating scholarship:', error);
      alert('Error updating scholarship');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading account information...</p>
          </div>
        </div>
      </div>
    );
  }

  // Family Account View
  if (type === 'family' && family) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="text-white hover:bg-amber-700"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-3xl font-bold">{family.family_name}</h1>
                  <p className="text-amber-100">Family Account</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBillingStatusColor(family.billing_status)}`}>
                  {family.billing_status} Status
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="scholarships">Scholarships</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Students</CardTitle>
                    <Users className="h-4 w-4 text-amber-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{students.length}</div>
                    <p className="text-xs text-gray-500">Enrolled students</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Tuition</CardTitle>
                    <DollarSign className="h-4 w-4 text-amber-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${(family.monthly_tuition_amount || 0).toFixed(2)}</div>
                    <p className="text-xs text-gray-500">Per month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                    <DollarSign className="h-4 w-4 text-amber-600" />
                  </CardHeader>
                  <CardContent>
                                        <div className={`text-2xl font-bold ${(family.current_balance || 0) > 100 ? 'text-red-600' : 'text-green-600'}`}>
                                          ${(family.current_balance || 0).toFixed(2)}
                                        </div>
                    <p className="text-xs text-gray-500">Outstanding</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Last Payment</CardTitle>
                    <Calendar className="h-4 w-4 text-amber-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {family.last_payment_date ? new Date(family.last_payment_date).toLocaleDateString() : 'N/A'}
                    </div>
                    <p className="text-xs text-gray-500">Payment date</p>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{family.primary_contact_phone || '(555) 123-4567'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{family.primary_contact_email || `${family.family_name.toLowerCase().replace(' ', '')}@email.com`}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium">{family.address || '123 Main St, City, FL 33000'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Students Quick View */}
              <Card>
                <CardHeader>
                  <CardTitle>Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {students.map((student) => (
                      <Card 
                        key={student.student_id} 
                        className="cursor-pointer hover:shadow-lg transition-shadow hover:border-amber-500"
                        onClick={() => onStudentClick?.(student.student_id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{student.first_name} {student.last_name}</p>
                              <p className="text-sm text-gray-500">Grade {student.grade} - {student.session}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskFlagColor(student.overall_risk_flag)}`}>
                              {student.overall_risk_flag}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="students" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Enrolled Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {students.map((student) => (
                          <tr 
                            key={student.student_id} 
                            className="hover:bg-amber-50 cursor-pointer transition-colors"
                            onClick={() => onStudentClick?.(student.student_id)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{student.first_name} {student.last_name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.grade}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.session}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.room}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="text-green-600">{student.attendance_present_count}P</span> / 
                              <span className="text-red-600 ml-1">{student.attendance_absent_count}A</span> / 
                              <span className="text-yellow-600 ml-1">{student.attendance_tardy_count}T</span>
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
            </TabsContent>

            <TabsContent value="billing" className="mt-6 space-y-6">
              {/* Billing Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Monthly Tuition</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-amber-600">${(family.monthly_tuition_amount || 0).toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Current Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                                        <div className={`text-3xl font-bold ${(family.current_balance || 0) > 100 ? 'text-red-600' : 'text-green-600'}`}>
                                          ${(family.current_balance || 0).toFixed(2)}
                                        </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Scholarship Coverage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      ${scholarships.reduce((sum, s) => sum + ((s.annual_award_amount || 0) / 12), 0).toFixed(2)}
                    </div>
                    <p className="text-xs text-gray-500">Per month</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Invoices */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  {invoices.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {invoices.map((invoice) => (
                            <tr key={invoice.invoice_id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.invoice_id}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(invoice.due_date).toLocaleDateString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${(invoice.amount || 0).toFixed(2)}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                  invoice.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {invoice.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No invoices found</p>
                  )}
                </CardContent>
              </Card>

              {/* Payment Summary by Source */}
              {billingRecords.length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Payment Summary by Source</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-500 text-white">Out of Pocket</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-700">
                          ${Math.abs(billingRecords.filter(b => b.type === 'Payment' && b.source === 'Out of pocket').reduce((sum, b) => sum + b.amount, 0)).toFixed(2)}
                        </div>
                        <p className="text-xs text-blue-600 mt-1">Family payments</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500 text-white">Step Up (SUFS)</span>
                        </div>
                        <div className="text-2xl font-bold text-green-700">
                          ${Math.abs(billingRecords.filter(b => b.type === 'Payment' && b.source === 'Step-Up').reduce((sum, b) => sum + b.amount, 0)).toFixed(2)}
                        </div>
                        <p className="text-xs text-green-600 mt-1">Scholarship payments</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-500 text-white">Total Charges</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-700">
                          ${billingRecords.filter(b => b.type === 'Charge').reduce((sum, b) => sum + b.amount, 0).toFixed(2)}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">All tuition charges</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Billing Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Billing Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {billingRecords.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {billingRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((record) => (
                            <tr key={record.billing_record_id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(record.date).toLocaleDateString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.description}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  record.type === 'Payment' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {record.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {record.source ? (
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    record.source === 'Step-Up' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                                  }`}>
                                    {record.source === 'Step-Up' ? 'SUFS' : 'Out of Pocket'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                                record.amount < 0 ? 'text-green-600' : 'text-gray-900'
                              }`}>
                                {record.amount < 0 ? '-' : ''}${Math.abs(record.amount || 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No billing activity found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scholarships" className="mt-6 space-y-6">
              {/* Tuition Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Tuition & Scholarship Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">Annual Tuition (per student)</div>
                      <div className="text-2xl font-bold text-gray-900">${ANNUAL_TUITION.toLocaleString()}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="text-sm text-green-600 mb-1">Total Scholarship Awards</div>
                      <div className="text-2xl font-bold text-green-700">
                        ${scholarships.reduce((sum, s) => sum + (s.annual_award_amount || 0), 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="text-sm text-blue-600 mb-1">Parent Responsibility</div>
                      <div className="text-2xl font-bold text-blue-700">
                        ${((students.length * ANNUAL_TUITION) - scholarships.reduce((sum, s) => sum + (s.annual_award_amount || 0), 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </div>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                      <div className="text-sm text-amber-600 mb-1">Scholarship Remaining</div>
                      <div className="text-2xl font-bold text-amber-700">
                        ${scholarships.reduce((sum, s) => sum + (s.remaining_balance || 0), 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Scholarships Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Step Up for Students Scholarships</CardTitle>
                </CardHeader>
                <CardContent>
                  {scholarships.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Annual Tuition</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scholarship Award</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent Pays</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remaining</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {scholarships.map((scholarship) => {
                            const student = students.find(s => s.student_id === scholarship.student_id) || 
                                           students.find(s => s.student_id === scholarship.scholarship_id.split('-')[0]);
                            const isEditing = editingScholarshipId === scholarship.scholarship_id;
                            const parentResponsibility = ANNUAL_TUITION - (scholarship.annual_award_amount || 0);
                            
                            return (
                              <tr key={scholarship.scholarship_id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {student ? `${student.first_name} ${student.last_name}` : 'Unknown'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{scholarship.scholarship_type}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${ANNUAL_TUITION.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {isEditing ? (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-gray-500">$</span>
                                      <input
                                        type="number"
                                        value={editAwardAmount}
                                        onChange={(e) => setEditAwardAmount(e.target.value)}
                                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                        min="0"
                                        max={ANNUAL_TUITION}
                                        step="0.01"
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-sm font-medium text-green-600">
                                      ${(scholarship.annual_award_amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`text-sm font-medium ${parentResponsibility > 0 ? 'text-blue-600' : 'text-green-600'}`}>
                                    ${(isEditing ? (ANNUAL_TUITION - parseFloat(editAwardAmount || '0')) : parentResponsibility).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-600">
                                  ${(scholarship.remaining_balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    scholarship.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {scholarship.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {isEditing ? (
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleSaveScholarship(scholarship)}
                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                      >
                                        <Save className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleCancelEdit}
                                        className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
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
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No scholarships found for this family</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Family Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardContent className="p-4 flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-amber-600" />
                        <div>
                          <p className="font-medium">Enrollment Agreement</p>
                          <p className="text-sm text-gray-500">Signed 08/15/2025</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardContent className="p-4 flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-amber-600" />
                        <div>
                          <p className="font-medium">Emergency Contact Form</p>
                          <p className="text-sm text-gray-500">Updated 09/01/2025</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardContent className="p-4 flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-amber-600" />
                        <div>
                          <p className="font-medium">Photo Release</p>
                          <p className="text-sm text-gray-500">Signed 08/15/2025</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // Student Account View
  if (type === 'student' && selectedStudent) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="text-white hover:bg-amber-700"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-3xl font-bold">{selectedStudent.first_name} {selectedStudent.last_name}</h1>
                  <p className="text-amber-100">Grade {selectedStudent.grade} - {selectedStudent.session} - Room {selectedStudent.room}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskFlagColor(selectedStudent.overall_risk_flag)}`}>
                  {selectedStudent.overall_risk_flag}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="academics">Academics</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="ixl">IXL Progress</TabsTrigger>
              <TabsTrigger value="family">Family</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Grade Level</CardTitle>
                    <BookOpen className="h-4 w-4 text-amber-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedStudent.grade}</div>
                    <p className="text-xs text-gray-500">{selectedStudent.session} Session</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                    <Calendar className="h-4 w-4 text-amber-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {((selectedStudent.attendance_present_count / (selectedStudent.attendance_present_count + selectedStudent.attendance_absent_count + selectedStudent.attendance_tardy_count)) * 100).toFixed(0)}%
                    </div>
                    <p className="text-xs text-gray-500">{selectedStudent.attendance_present_count} days present</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Academic Status</CardTitle>
                    <BookOpen className="h-4 w-4 text-amber-600" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${
                      selectedStudent.overall_grade_flag === 'Failing' ? 'text-red-600' :
                      selectedStudent.overall_grade_flag === 'Needs attention' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {selectedStudent.overall_grade_flag}
                    </div>
                    <p className="text-xs text-gray-500">Overall performance</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">IXL Status</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${
                      selectedStudent.ixl_status_flag === 'Needs attention' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {selectedStudent.ixl_status_flag}
                    </div>
                    <p className="text-xs text-gray-500">Weekly progress</p>
                  </CardContent>
                </Card>
              </div>

              {/* Current Grades */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Grades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {grades.map((grade, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <p className="text-sm text-gray-600">{grade.subject}</p>
                          <p className="text-3xl font-bold text-amber-600">{grade.grade_value}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Family Link */}
              {family && (
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow hover:border-amber-500"
                  onClick={() => onFamilyClick?.(family.family_id)}
                >
                  <CardHeader>
                    <CardTitle>Family Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-lg">{family.family_name}</p>
                        <p className="text-sm text-gray-500">Click to view family account</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBillingStatusColor(family.billing_status)}`}>
                        {family.billing_status} Status
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="academics" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Grade Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Grade</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {grades.map((grade, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{grade.subject}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-2xl font-bold text-amber-600">{grade.grade_value}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                ['A', 'B'].includes(grade.grade_value) ? 'bg-green-100 text-green-800' :
                                grade.grade_value === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {['A', 'B'].includes(grade.grade_value) ? 'Passing' : grade.grade_value === 'C' ? 'Satisfactory' : 'Needs Improvement'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-gray-600">Present</p>
                    <p className="text-4xl font-bold text-green-600">{selectedStudent.attendance_present_count}</p>
                    <p className="text-xs text-gray-500 mt-2">Days attended</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-gray-600">Absent</p>
                    <p className="text-4xl font-bold text-red-600">{selectedStudent.attendance_absent_count}</p>
                    <p className="text-xs text-gray-500 mt-2">Days missed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-gray-600">Tardy</p>
                    <p className="text-4xl font-bold text-yellow-600">{selectedStudent.attendance_tardy_count}</p>
                    <p className="text-xs text-gray-500 mt-2">Late arrivals</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Attendance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500" 
                      style={{ 
                        width: `${(selectedStudent.attendance_present_count / (selectedStudent.attendance_present_count + selectedStudent.attendance_absent_count + selectedStudent.attendance_tardy_count)) * 100}%` 
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {((selectedStudent.attendance_present_count / (selectedStudent.attendance_present_count + selectedStudent.attendance_absent_count + selectedStudent.attendance_tardy_count)) * 100).toFixed(1)}% attendance rate
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ixl" className="mt-6 space-y-6">
              {ixl ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <p className="text-sm text-gray-600">Weekly Hours</p>
                        <p className="text-4xl font-bold text-amber-600">{ixl.weekly_hours}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <p className="text-sm text-gray-600">Skills Practiced</p>
                        <p className="text-4xl font-bold text-blue-600">{ixl.skills_practiced_this_week}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <p className="text-sm text-gray-600">Total Mastered</p>
                        <p className="text-4xl font-bold text-green-600">{ixl.skills_mastered_total}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <p className="text-sm text-gray-600">Last Active</p>
                        <p className="text-lg font-bold">{new Date(ixl.last_active_date).toLocaleDateString()}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Proficiency Levels</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-gray-600">Math Proficiency</p>
                          <p className={`text-2xl font-bold ${
                            ixl.math_proficiency === 'Needs attention' ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {ixl.math_proficiency}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">ELA Proficiency</p>
                          <p className={`text-2xl font-bold ${
                            ixl.ela_proficiency === 'Needs attention' ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {ixl.ela_proficiency}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Skills</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {ixl.recent_skills.map((skill, index) => (
                          <span key={index} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">No IXL data available</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="family" className="mt-6">
              {family && (
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow hover:border-amber-500"
                  onClick={() => onFamilyClick?.(family.family_id)}
                >
                  <CardHeader>
                    <CardTitle>{family.family_name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-gray-500">Monthly Tuition</p>
                                              <p className="text-xl font-bold">${(family.monthly_tuition_amount || 0).toFixed(2)}</p>
                                            </div>
                                            <div>
                                              <p className="text-sm text-gray-500">Current Balance</p>
                                              <p className={`text-xl font-bold ${(family.current_balance || 0) > 100 ? 'text-red-600' : 'text-green-600'}`}>
                                                ${(family.current_balance || 0).toFixed(2)}
                                              </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Billing Status</p>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBillingStatusColor(family.billing_status)}`}>
                          {family.billing_status}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-amber-600 mt-4 font-medium">Click to view full family account →</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Account not found</p>
        </div>
      </div>
    </div>
  );
}
