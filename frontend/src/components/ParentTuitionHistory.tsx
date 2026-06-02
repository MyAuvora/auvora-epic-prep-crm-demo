import React, { useState, useEffect } from 'react';
import { Calendar, CreditCard, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

  // Totals across all months
  const totalStepUp = tuitionHistory.history.reduce((sum, m) => sum + m.step_up_paid, 0);
  const totalOutOfPocket = tuitionHistory.history.reduce((sum, m) => sum + m.out_of_pocket_paid, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Payment History</h2>
        <p className="text-gray-600">{tuitionHistory.family_name}</p>
      </div>

      {/* Summary cards with two-column emphasis */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-green-700 flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
              Step Up Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-700">{formatCurrency(totalStepUp)}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-blue-700 flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
              Out of Pocket Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-700">{formatCurrency(totalOutOfPocket)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600">Monthly Tuition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(tuitionHistory.monthly_tuition_amount)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${tuitionHistory.current_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(tuitionHistory.current_balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly breakdown with two-column layout */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
          <CardDescription>Click a month to see individual transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Column headers */}
          <div className="hidden md:grid md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 px-4 pb-3 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span>Month</span>
            <span className="text-green-700 flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full"></div>Step Up</span>
            <span className="text-blue-700 flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full"></div>Out of Pocket</span>
            <span>Balance</span>
            <span className="w-6"></span>
          </div>

          <div className="space-y-1 mt-1">
            {tuitionHistory.history.slice().reverse().map((month) => {
              const isExpanded = expandedMonth === month.month;
              const stepUpPayments = month.payments.filter(p => p.source === 'Step-Up' || p.source === 'Step Up' || p.source === 'SUFS');
              const oopPayments = month.payments.filter(p => p.source !== 'Step-Up' && p.source !== 'Step Up' && p.source !== 'SUFS');

              return (
                <div key={month.month} className="border rounded-lg overflow-hidden">
                  <div 
                    className="flex flex-col md:grid md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 md:gap-4 items-start md:items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedMonth(isExpanded ? null : month.month)}
                  >
                    {/* Month */}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-sm">{formatMonth(month.month)}</span>
                    </div>
                    
                    {/* Step Up column */}
                    <div className="flex items-center gap-2">
                      <span className="md:hidden text-xs text-green-600 font-medium">Step Up:</span>
                      <span className="font-bold text-green-700 text-sm">{formatCurrency(month.step_up_paid)}</span>
                    </div>

                    {/* Out of Pocket column */}
                    <div className="flex items-center gap-2">
                      <span className="md:hidden text-xs text-blue-600 font-medium">Out of Pocket:</span>
                      <span className="font-bold text-blue-700 text-sm">{formatCurrency(month.out_of_pocket_paid)}</span>
                    </div>

                    {/* Balance */}
                    <div>
                      <span className={`font-medium text-sm ${month.remaining_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(month.remaining_balance)}
                      </span>
                    </div>

                    {/* Expand icon */}
                    <div className="text-gray-400">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Expanded detail — two columns */}
                  {isExpanded && (
                    <div className="border-t bg-gray-50 p-4">
                      {/* Charges row */}
                      {month.charges.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-xs text-gray-500 uppercase tracking-wider mb-2">Charges</h4>
                          <div className="space-y-1">
                            {month.charges.map((charge) => (
                              <div key={charge.billing_record_id} className="flex justify-between items-center text-sm bg-white p-2 rounded border">
                                <div>
                                  <p className="font-medium">{charge.description}</p>
                                  <p className="text-xs text-gray-500">{formatDate(charge.date)}</p>
                                </div>
                                <p className="font-medium">{formatCurrency(charge.amount)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Two-column payment breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Step Up payments */}
                        <div>
                          <h4 className="font-medium text-xs text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Step Up Payments
                          </h4>
                          {stepUpPayments.length > 0 ? (
                            <div className="space-y-1">
                              {stepUpPayments.map((payment) => (
                                <div key={payment.billing_record_id} className="flex justify-between items-center text-sm bg-green-50 p-2 rounded border border-green-200">
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="w-3.5 h-3.5 text-green-500" />
                                    <div>
                                      <p className="font-medium text-green-800">{payment.description}</p>
                                      <p className="text-xs text-green-600">{formatDate(payment.date)}</p>
                                    </div>
                                  </div>
                                  <p className="font-bold text-green-700">{formatCurrency(Math.abs(payment.amount))}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic p-2">No Step Up payments this month</p>
                          )}
                        </div>

                        {/* Out of Pocket payments */}
                        <div>
                          <h4 className="font-medium text-xs text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            Out of Pocket Payments
                          </h4>
                          {oopPayments.length > 0 ? (
                            <div className="space-y-1">
                              {oopPayments.map((payment) => (
                                <div key={payment.billing_record_id} className="flex justify-between items-center text-sm bg-blue-50 p-2 rounded border border-blue-200">
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                                    <div>
                                      <p className="font-medium text-blue-800">{payment.description}</p>
                                      <p className="text-xs text-blue-600">{formatDate(payment.date)}</p>
                                    </div>
                                  </div>
                                  <p className="font-bold text-blue-700">{formatCurrency(Math.abs(payment.amount))}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic p-2">No out-of-pocket payments this month</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
