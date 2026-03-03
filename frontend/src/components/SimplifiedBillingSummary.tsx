import { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, CreditCard } from 'lucide-react';
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

interface SimplifiedBillingSummaryProps {
  familyId: string;
}

export function SimplifiedBillingSummary({ familyId }: SimplifiedBillingSummaryProps) {
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingSummary();
  }, [familyId]);

  const fetchBillingSummary = async () => {
    try {
      const response = await fetch(`${API_URL}/api/families/${familyId}/billing-summary`);
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Error fetching billing summary:', error);
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

  // Calculate progress percentage
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

          {/* Tuition Breakdown */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-blue-200 text-xs mb-1">Annual Tuition</p>
              <p className="text-xl font-bold">{formatCurrency(summary.annual_tuition)}</p>
            </div>
            <div className="bg-green-500/20 rounded-lg p-4 border border-green-400/30">
              <p className="text-green-200 text-xs mb-1">Scholarship Covers</p>
              <p className="text-xl font-bold text-green-300">{formatCurrency(summary.scholarship_amount)}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 border-2 border-white/30">
              <p className="text-blue-200 text-xs mb-1">Your Portion</p>
              <p className="text-xl font-bold">{formatCurrency(summary.parent_responsibility)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Due Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={summary.current_balance > 0 ? 'border-2 border-amber-400' : 'border-2 border-green-400'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              {summary.current_balance > 0 ? (
                <Clock className="h-5 w-5 text-amber-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              Amount Due Now
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${summary.current_balance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {formatCurrency(Math.max(0, summary.current_balance))}
            </div>
            {summary.current_balance <= 0 ? (
              <p className="text-sm text-green-600 mt-2">You're all caught up!</p>
            ) : (
              <p className="text-sm text-gray-500 mt-2">
                Due by {formatDate(summary.next_payment_due)}
              </p>
            )}
            {summary.current_balance > 0 && (
              <Button className="w-full mt-4 bg-[#0A2463] hover:bg-[#163B9A]">
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Now
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#0A2463]" />
              Your Monthly Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#0A2463]">
              {formatCurrency(summary.monthly_parent_payment)}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Due on the 1st of each month
            </p>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                This is your portion after the Step Up scholarship is applied.
                The scholarship pays {formatCurrency(summary.scholarship_amount / 12)}/month directly to the school.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Year-to-Date Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Year-to-Date Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">Scholarship Received</span>
              </div>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(summary.scholarship_received_ytd)}</p>
              <p className="text-xs text-green-600 mt-1">From Step Up for Students</p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-800">Your Payments</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">{formatCurrency(summary.parent_paid_ytd)}</p>
              <p className="text-xs text-blue-600 mt-1">Out-of-pocket payments</p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-purple-800">Total Applied</span>
              </div>
              <p className="text-2xl font-bold text-purple-700">{formatCurrency(summary.total_paid_ytd)}</p>
              <p className="text-xs text-purple-600 mt-1">Combined payments</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simple Payment Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summary.payment_schedule
              .filter(p => p.status !== 'paid')
              .slice(0, 4)
              .map((payment, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    payment.type === 'scholarship' ? 'bg-green-50' : 'bg-blue-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      payment.type === 'scholarship' ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                    <div>
                      <p className="font-medium text-sm">
                        {payment.type === 'scholarship' ? 'Scholarship Payment' : 'Your Payment'}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(payment.due_date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      payment.type === 'scholarship' ? 'text-green-700' : 'text-blue-700'
                    }`}>
                      {formatCurrency(payment.amount)}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      payment.status === 'overdue' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {payment.status === 'overdue' ? 'Overdue' : 'Upcoming'}
                    </span>
                  </div>
                </div>
              ))}
          </div>
          
          <p className="text-xs text-gray-500 mt-4 text-center">
            Scholarship payments are sent directly to the school by Step Up for Students every 2 months.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
