import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PaymentRecord {
  billing_record_id: string;
  date: string;
  description: string;
  amount: number;
  source: string | null;
  category: string | null;
  student_id: string | null;
}

interface MonthlyHistory {
  month: string;
  tuition_charge: number;
  step_up_paid: number;
  out_of_pocket_paid: number;
  total_paid: number;
  remaining_balance: number;
  charges: PaymentRecord[];
  payments: PaymentRecord[];
}

interface TuitionHistory {
  family_id: string;
  family_name: string;
  current_balance: number;
  monthly_tuition_amount: number;
  history: MonthlyHistory[];
}

interface ParentTuitionHistoryProps {
  familyId: string;
}

export const ParentTuitionHistory: React.FC<ParentTuitionHistoryProps> = ({ familyId }) => {
  const [tuitionHistory, setTuitionHistory] = useState<TuitionHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  useEffect(() => {
    fetchTuitionHistory();
  }, [familyId]);

  const fetchTuitionHistory = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/families/${familyId}/tuition-history`);
      const data = await response.json();
      setTuitionHistory(data);
    } catch (error) {
      console.error('Error fetching tuition history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getPaymentSourceBadge = (source: string | null) => {
    if (source === 'Step-Up') {
      return <Badge className="bg-green-100 text-green-800 text-xs">Step-Up</Badge>;
    } else if (source === 'Out-of-Pocket') {
      return <Badge className="bg-blue-100 text-blue-800 text-xs">Out-of-Pocket</Badge>;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading payment history...</div>
      </div>
    );
  }

  if (!tuitionHistory) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No payment history available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Tuition Payment History</h2>
        <p className="text-gray-600">{tuitionHistory.family_name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Monthly Tuition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(tuitionHistory.monthly_tuition_amount)}</div>
            <p className="text-xs text-gray-500 mt-1">Per month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${tuitionHistory.current_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(tuitionHistory.current_balance)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {tuitionHistory.current_balance > 0 ? 'Amount due' : 'Paid in full'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tuitionHistory.history.length}</div>
            <p className="text-xs text-gray-500 mt-1">Months on record</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
          <CardDescription>View charges and payments by month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tuitionHistory.history.slice().reverse().map((month) => (
              <div key={month.month} className="border rounded-lg p-4">
                <div 
                  className="flex justify-between items-start cursor-pointer"
                  onClick={() => setExpandedMonth(expandedMonth === month.month ? null : month.month)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <h3 className="font-semibold">{formatMonth(month.month)}</h3>
                    </div>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Charged</p>
                        <p className="font-medium">{formatCurrency(month.tuition_charge)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Step-Up Paid</p>
                        <p className="font-medium text-green-600">{formatCurrency(month.step_up_paid)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Out-of-Pocket Paid</p>
                        <p className="font-medium text-blue-600">{formatCurrency(month.out_of_pocket_paid)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Balance</p>
                        <p className={`font-medium ${month.remaining_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(month.remaining_balance)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-400">
                    {expandedMonth === month.month ? '▼' : '▶'}
                  </div>
                </div>

                {expandedMonth === month.month && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    {month.charges.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Charges</h4>
                        <div className="space-y-2">
                          {month.charges.map((charge) => (
                            <div key={charge.billing_record_id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                              <div>
                                <p className="font-medium">{charge.description}</p>
                                <p className="text-xs text-gray-500">{formatDate(charge.date)}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{formatCurrency(charge.amount)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {month.payments.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Payments</h4>
                        <div className="space-y-2">
                          {month.payments.map((payment) => (
                            <div key={payment.billing_record_id} className="flex justify-between items-center text-sm bg-green-50 p-2 rounded">
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-gray-500" />
                                <div>
                                  <p className="font-medium">{payment.description}</p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs text-gray-500">{formatDate(payment.date)}</p>
                                    {getPaymentSourceBadge(payment.source)}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-green-600">{formatCurrency(Math.abs(payment.amount))}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
