import { useState, useEffect } from 'react';
import { CheckCircle, Clock, CreditCard, FileText, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface BillingSummary {
  family_id: string;
  family_name: string;
  annual_tuition: number;
  scholarship_amount: number;
  parent_responsibility: number;
  monthly_parent_payment: number;
  total_paid_ytd: number;
  scholarship_received_ytd: number;
  parent_paid_ytd: number;
  current_balance: number;
  next_payment_due: string;
  next_payment_amount: number;
  payment_schedule: PaymentScheduleItem[];
}

interface PaymentScheduleItem {
  due_date: string;
  amount: number;
  type: 'parent' | 'scholarship';
  status: 'paid' | 'pending' | 'overdue';
}

interface OOPInvoice {
  invoice_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: string;
  total: number;
  amount_paid: number;
  balance: number;
  notes?: string;
  is_recurring?: string;
  recurring_frequency?: string;
}

interface OOPPayment {
  billing_record_id: string;
  date: string;
  description: string;
  amount: number;
  source: string | null;
}

interface SimplifiedBillingSummaryProps {
  familyId: string;
}

export function SimplifiedBillingSummary({ familyId }: SimplifiedBillingSummaryProps) {
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [invoices, setInvoices] = useState<OOPInvoice[]>([]);
  const [oopPayments, setOopPayments] = useState<OOPPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, [familyId]);

  const fetchAll = async () => {
    try {
      const [summaryRes, invoicesRes, recordsRes] = await Promise.all([
        fetch(`${API_URL}/api/families/${familyId}/billing-summary`),
        fetch(`${API_URL}/api/invoices?family_id=${familyId}`),
        fetch(`${API_URL}/api/billing/${familyId}`)
      ]);

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data);
      }

      if (invoicesRes.ok) {
        const invData: OOPInvoice[] = await invoicesRes.json();
        setInvoices(invData);
      }

      if (recordsRes.ok) {
        const records: OOPPayment[] = await recordsRes.json();
        const oop = records.filter(
          (r: OOPPayment) => r.amount < 0 && r.source !== 'Step-Up' && r.source !== 'SUFS'
        );
        setOopPayments(oop.sort((a: OOPPayment, b: OOPPayment) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getProgressPercentage = () => {
    if (!summary) return 0;
    const totalPaid = summary.scholarship_received_ytd + summary.parent_paid_ytd;
    return Math.min(100, (totalPaid / summary.annual_tuition) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A2463]"></div>
      </div>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          Unable to load billing summary
        </CardContent>
      </Card>
    );
  }

  const scholarshipPending = summary.payment_schedule.filter(p => p.type === 'scholarship' && p.status !== 'paid');

  // OOP balance from invoices: exclude cancelled, compute from active only
  const activeInvoices = invoices.filter(inv => inv.status !== 'Cancelled');
  const oopInvoiceTotal = activeInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const oopInvoicePaid = activeInvoices.reduce((sum, inv) => sum + inv.amount_paid, 0);
  const oopBalance = oopInvoiceTotal - oopInvoicePaid;
  const unpaidInvoices = activeInvoices.filter(inv => inv.balance > 0 && inv.status !== 'Paid');
  const paidInvoices = activeInvoices.filter(inv => inv.balance <= 0 || inv.status === 'Paid');

  return (
    <div className="space-y-6">
      {/* Main Summary Card */}
      <Card className="bg-gradient-to-r from-[#0A2463] to-[#163B9A] text-white">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Your Tuition Summary</h2>
            <p className="text-blue-100">2025-2026 School Year</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Tuition Progress</span>
              <span>{getProgressPercentage().toFixed(0)}% Paid</span>
            </div>
            <div className="w-full bg-blue-900 rounded-full h-4 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${getProgressPercentage()}%`,
                  background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)'
                }}
              />
            </div>
            <div className="flex justify-between text-xs mt-2 text-blue-200">
              <span>{formatCurrency(summary.scholarship_received_ytd + summary.parent_paid_ytd)} paid</span>
              <span>{formatCurrency(summary.annual_tuition)} total</span>
            </div>
          </div>

          {/* Annual Tuition */}
          <div className="text-center mb-4">
            <p className="text-blue-200 text-sm">Annual Tuition</p>
            <p className="text-3xl font-bold">{formatCurrency(summary.annual_tuition)}</p>
          </div>
        </CardContent>
      </Card>

      {/* ===== TWO-COLUMN: Step Up vs Out of Pocket ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT COLUMN — Step Up (SUFS) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <h3 className="text-lg font-bold text-green-800">Step Up For Students</h3>
          </div>
          <Card className="border-2 border-green-200 bg-green-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Annual Scholarship</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">{formatCurrency(summary.scholarship_amount)}</div>
              <p className="text-xs text-green-600 mt-1">Awarded for the school year</p>
            </CardContent>
          </Card>
          <Card className="border border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Received Year-to-Date</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{formatCurrency(summary.scholarship_received_ytd)}</div>
              <p className="text-xs text-green-600 mt-1">Sent directly to the school by SUFS</p>
              {summary.scholarship_amount > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-green-600 mb-1">
                    <span>Disbursed</span>
                    <span>{((summary.scholarship_received_ytd / summary.scholarship_amount) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (summary.scholarship_received_ytd / summary.scholarship_amount) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          {scholarshipPending.length > 0 && (
            <Card className="border border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700">Upcoming SUFS Payments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {scholarshipPending.slice(0, 3).map((payment, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-green-50 rounded-lg text-sm">
                    <div>
                      <p className="font-medium text-green-800">Scholarship Payment</p>
                      <p className="text-xs text-green-600">{formatDate(payment.due_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-700">{formatCurrency(payment.amount)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        payment.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {payment.status === 'overdue' ? 'Overdue' : 'Upcoming'}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN — Out of Pocket */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <h3 className="text-lg font-bold text-blue-800">Out of Pocket</h3>
          </div>

          {/* Current Balance Card — the key card */}
          <Card className={`border-2 ${oopBalance > 0 ? 'border-red-300 bg-red-50/50' : 'border-green-300 bg-green-50/50'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {oopBalance > 0 ? (
                  <Clock className="h-4 w-4 text-red-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                <span className={oopBalance > 0 ? 'text-red-700' : 'text-green-700'}>
                  Current Balance
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold ${oopBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {oopBalance > 0 ? `-${formatCurrency(oopBalance)}` : formatCurrency(0)}
              </div>
              {oopBalance > 0 ? (
                <p className="text-sm text-red-600 mt-2">
                  You owe {formatCurrency(oopBalance)} across {unpaidInvoices.length} invoice{unpaidInvoices.length !== 1 ? 's' : ''}
                </p>
              ) : (
                <p className="text-sm text-green-600 mt-2">You're all caught up!</p>
              )}
              {oopBalance > 0 && (
                <Button className="w-full mt-4 bg-[#0A2463] hover:bg-[#163B9A]">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay Now
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Unpaid invoices — what the owner has billed */}
          {unpaidInvoices.length > 0 && (
            <Card className="border border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Open Invoices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {unpaidInvoices.map(inv => (
                  <div key={inv.invoice_id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div>
                      <p className="font-medium text-blue-900 text-sm">{inv.invoice_number}</p>
                      <p className="text-xs text-blue-600">
                        Due {formatDate(inv.due_date)}
                        {inv.notes && <span className="ml-1">· {inv.notes}</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{formatCurrency(inv.balance)}</p>
                      {inv.amount_paid > 0 && (
                        <p className="text-xs text-green-600">
                          {formatCurrency(inv.amount_paid)} paid
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Year-to-date paid summary */}
          <Card className="border border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Paid Year-to-Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{formatCurrency(summary.parent_paid_ytd)}</div>
              <p className="text-xs text-blue-600 mt-1">Total out-of-pocket payments made</p>
              {summary.parent_responsibility > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-blue-600 mb-1">
                    <span>Annual progress</span>
                    <span>{((summary.parent_paid_ytd / summary.parent_responsibility) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (summary.parent_paid_ytd / summary.parent_responsibility) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Previous payments list */}
          <Card className="border border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Previous Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {oopPayments.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {oopPayments.map(payment => (
                    <div key={payment.billing_record_id} className="flex justify-between items-center p-2 bg-white rounded-lg border text-sm">
                      <div>
                        <p className="font-medium text-gray-800">{payment.description}</p>
                        <p className="text-xs text-gray-500">{formatDate(payment.date)}</p>
                      </div>
                      <p className="font-bold text-green-600">{formatCurrency(Math.abs(payment.amount))}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No payments recorded yet</p>
              )}

              {/* Paid invoices — settled */}
              {paidInvoices.length > 0 && (
                <div className="mt-4 pt-3 border-t">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Settled Invoices</p>
                  <div className="space-y-1">
                    {paidInvoices.map(inv => (
                      <div key={inv.invoice_id} className="flex justify-between items-center p-2 bg-green-50 rounded text-sm">
                        <div>
                          <p className="font-medium text-green-800">{inv.invoice_number}</p>
                          <p className="text-xs text-green-600">{formatDate(inv.invoice_date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-700">{formatCurrency(inv.total)}</p>
                          <span className="text-xs text-green-600">Paid</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Total Applied footer */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Total Applied to Tuition</span>
            </div>
            <span className="text-xl font-bold text-purple-700">{formatCurrency(summary.total_paid_ytd)}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            Scholarship payments are sent directly to the school by Step Up for Students every 2 months.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
