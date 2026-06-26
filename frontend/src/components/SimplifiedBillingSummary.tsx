import { useState, useEffect } from 'react';
import { CheckCircle, Clock, CreditCard, FileText, DollarSign, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface StudentBilling {
  student_id: string;
  student_name: string;
  grade: string;
  annual_tuition: number;
  sufs_approved_amount: number;
  scholarship_amount: number;
  annual_oop: number;
}

interface OpenInvoice {
  invoice_id: string;
  invoice_number: string;
  student_id: string;
  due_date: string;
  total: number;
  amount_paid: number;
  balance: number;
  status: string;
  billing_type: string;
}

interface PaymentRecord {
  invoice_id: string;
  invoice_number: string;
  student_id: string;
  amount_paid: number;
  payment_method: string | null;
  payment_date: string | null;
  billing_type: string;
}

interface BillingSummaryData {
  family_id: string;
  family_name: string;
  students_billing: StudentBilling[];
  total_annual_tuition: number;
  total_sufs_approved: number;
  total_scholarship: number;
  total_annual_oop: number;
  total_invoiced: number;
  total_paid: number;
  outstanding_balance: number;
  open_invoices: OpenInvoice[];
  payment_history: PaymentRecord[];
}

interface SimplifiedBillingSummaryProps {
  familyId: string;
}

export function SimplifiedBillingSummary({ familyId }: SimplifiedBillingSummaryProps) {
  const [data, setData] = useState<BillingSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const res = await fetch(`${API_URL}/api/families/${familyId}/billing-summary`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (error) {
        console.error('Error fetching billing:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBilling();
  }, [familyId]);

  const fmt = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);

  const fmtDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A2463]"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          Unable to load billing summary
        </CardContent>
      </Card>
    );
  }

  const hasScholarship = data.total_scholarship > 0;
  const oopBalance = data.outstanding_balance;

  return (
    <div className="space-y-6">
      {/* Main Summary Header */}
      <Card className="bg-gradient-to-r from-[#0A2463] to-[#163B9A] text-white">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-center mb-4">Your Tuition Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-blue-200 text-xs uppercase tracking-wide">Annual Tuition</p>
              <p className="text-2xl font-bold">{fmt(data.total_annual_tuition)}</p>
            </div>
            <div>
              <p className="text-green-200 text-xs uppercase tracking-wide">SUFS Approved</p>
              <p className="text-2xl font-bold text-green-300">{fmt(data.total_sufs_approved)}</p>
            </div>
            {hasScholarship && (
              <div>
                <p className="text-purple-200 text-xs uppercase tracking-wide">Scholarship</p>
                <p className="text-2xl font-bold text-purple-300">{fmt(data.total_scholarship)}</p>
              </div>
            )}
            <div>
              <p className="text-red-200 text-xs uppercase tracking-wide">Your OOP Cost</p>
              <p className="text-2xl font-bold text-red-300">{fmt(data.total_annual_oop)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-Student Breakdown */}
      {data.students_billing.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Per-Student Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.students_billing.map((student) => (
              <div key={student.student_id} className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                    {student.student_name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{student.student_name}</p>
                    <p className="text-xs text-gray-500">Grade {student.grade}</p>
                  </div>
                </div>
                <div className={`grid grid-cols-2 ${student.scholarship_amount > 0 ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-2`}>
                  <div className="bg-blue-50 rounded p-2">
                    <p className="text-xs text-blue-600">Tuition</p>
                    <p className="font-bold text-blue-800 text-sm">{fmt(student.annual_tuition)}</p>
                  </div>
                  <div className="bg-green-50 rounded p-2">
                    <p className="text-xs text-green-600">SUFS</p>
                    <p className="font-bold text-green-800 text-sm">{fmt(student.sufs_approved_amount)}</p>
                  </div>
                  {student.scholarship_amount > 0 && (
                    <div className="bg-purple-50 rounded p-2">
                      <p className="text-xs text-purple-600">Scholarship</p>
                      <p className="font-bold text-purple-800 text-sm">{fmt(student.scholarship_amount)}</p>
                    </div>
                  )}
                  <div className="bg-red-50 rounded p-2">
                    <p className="text-xs text-red-600">Out of Pocket</p>
                    <p className="font-bold text-red-800 text-sm">{fmt(student.annual_oop)}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Current Balance */}
      <Card className={`border-2 ${oopBalance > 0 ? 'border-red-300 bg-red-50/50' : 'border-green-300 bg-green-50/50'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {oopBalance > 0 ? (
              <Clock className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            <span className={oopBalance > 0 ? 'text-red-700' : 'text-green-700'}>Current Balance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-4xl font-bold ${oopBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {oopBalance > 0 ? fmt(oopBalance) : '$0.00'}
          </div>
          {oopBalance > 0 ? (
            <p className="text-sm text-red-600 mt-2">
              You owe {fmt(oopBalance)} across {data.open_invoices.length} invoice{data.open_invoices.length !== 1 ? 's' : ''}
            </p>
          ) : (
            <p className="text-sm text-green-600 mt-2">All invoices are paid — you&apos;re all caught up!</p>
          )}
          {oopBalance > 0 && (
            <Button className="w-full mt-4 bg-[#0A2463] hover:bg-[#163B9A]">
              <CreditCard className="h-4 w-4 mr-2" />
              Pay Now
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Open Invoices */}
      {data.open_invoices.length > 0 && (
        <Card className="border border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Open Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.open_invoices.map((inv) => {
              const studentName = data.students_billing.find(s => s.student_id === inv.student_id)?.student_name || 'Family';
              return (
                <div key={inv.invoice_id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div>
                    <p className="font-medium text-blue-900 text-sm">{inv.invoice_number}</p>
                    <p className="text-xs text-blue-600">
                      {studentName} &bull; Due {fmtDate(inv.due_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{fmt(inv.balance)}</p>
                    {inv.amount_paid > 0 && (
                      <p className="text-xs text-green-600">{fmt(inv.amount_paid)} paid</p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      {data.payment_history.length > 0 && (
        <Card className="border border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.payment_history.map((pmt) => {
              const studentName = data.students_billing.find(s => s.student_id === pmt.student_id)?.student_name || 'Family';
              return (
                <div key={pmt.invoice_id} className="flex justify-between items-center p-2 bg-green-50 rounded-lg text-sm">
                  <div>
                    <p className="font-medium text-green-800">{pmt.invoice_number}</p>
                    <p className="text-xs text-green-600">
                      {studentName}
                      {pmt.payment_date && ` • ${fmtDate(pmt.payment_date)}`}
                      {pmt.payment_method && ` • ${pmt.payment_method}`}
                    </p>
                  </div>
                  <p className="font-bold text-green-700">{fmt(pmt.amount_paid)}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Summary Footer */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 uppercase">Total Invoiced</p>
              <p className="text-lg font-bold text-gray-700">{fmt(data.total_invoiced)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Total Paid</p>
              <p className="text-lg font-bold text-green-700">{fmt(data.total_paid)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Outstanding</p>
              <p className={`text-lg font-bold ${data.outstanding_balance > 0 ? 'text-red-700' : 'text-green-700'}`}>{fmt(data.outstanding_balance)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
