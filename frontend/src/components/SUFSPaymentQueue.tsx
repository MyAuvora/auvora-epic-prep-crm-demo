import { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ExpectedPayment {
  scholarship_id: string;
  student_id: string;
  student_name: string;
  family_id: string;
  family_name: string;
  scholarship_type: string;
  expected_amount: number;
  expected_date: string;
  status: 'expected' | 'received';
  remaining_balance: number;
}

interface PaymentQueueData {
  payment_period: string;
  total_scholarships: number;
  total_expected_amount: number;
  total_received_amount: number;
  payments: ExpectedPayment[];
}

interface SUFSPaymentQueueProps {
  campusId?: string | null;
}

export function SUFSPaymentQueue({ campusId }: SUFSPaymentQueueProps) {
  const [queueData, setQueueData] = useState<PaymentQueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentQueue();
  }, [campusId]);

  const fetchPaymentQueue = async () => {
    try {
      setLoading(true);
      const url = campusId 
        ? `${API_URL}/api/sufs/payment-queue?campus_id=${campusId}`
        : `${API_URL}/api/sufs/payment-queue`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setQueueData(data);
      }
    } catch (error) {
      console.error('Error fetching payment queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReceived = async (scholarshipId: string, amount: number) => {
    setProcessingId(scholarshipId);
    try {
      const response = await fetch(`${API_URL}/api/sufs/mark-received/${scholarshipId}?amount=${amount}`, {
        method: 'POST'
      });
      if (response.ok) {
        // Refresh the queue
        await fetchPaymentQueue();
      } else {
        alert('Failed to mark payment as received');
      }
    } catch (error) {
      console.error('Error marking payment received:', error);
      alert('Error marking payment as received');
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAllReceived = async () => {
    if (!queueData) return;
    
    const pendingPayments = queueData.payments.filter(p => p.status === 'expected');
    if (pendingPayments.length === 0) {
      alert('No pending payments to mark');
      return;
    }

    if (!confirm(`Mark ${pendingPayments.length} payments as received totaling $${queueData.total_expected_amount.toLocaleString()}?`)) {
      return;
    }

    setProcessingId('all');
    try {
      for (const payment of pendingPayments) {
        await fetch(`${API_URL}/api/sufs/mark-received/${payment.scholarship_id}?amount=${payment.expected_amount}`, {
          method: 'POST'
        });
      }
      await fetchPaymentQueue();
    } catch (error) {
      console.error('Error marking payments received:', error);
    } finally {
      setProcessingId(null);
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

  const getPaymentPeriodLabel = (period: string) => {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A2463]"></div>
      </div>
    );
  }

  if (!queueData) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          Unable to load payment queue
        </CardContent>
      </Card>
    );
  }

  const pendingPayments = queueData.payments.filter(p => p.status === 'expected');
  const receivedPayments = queueData.payments.filter(p => p.status === 'received');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">SUFS Payment Queue</h2>
          <p className="text-sm text-gray-600 mt-1">
            Expected payments for {getPaymentPeriodLabel(queueData.payment_period)}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchPaymentQueue}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Scholarships</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueData.total_scholarships}</div>
            <p className="text-xs text-gray-500">Active recipients</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Expected This Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(queueData.total_expected_amount)}</div>
            <p className="text-xs text-gray-500">{pendingPayments.length} payments pending</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Received This Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(queueData.total_received_amount)}</div>
            <p className="text-xs text-gray-500">{receivedPayments.length} payments received</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {queueData.total_scholarships > 0 
                ? Math.round((receivedPayments.length / queueData.total_scholarships) * 100)
                : 0}%
            </div>
            <p className="text-xs text-gray-500">Payments recorded</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Pending Payments
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Click "Mark Received" when SUFS payment arrives
            </p>
          </div>
          {pendingPayments.length > 0 && (
            <Button 
              onClick={handleMarkAllReceived}
              disabled={processingId === 'all'}
              className="bg-green-600 hover:bg-green-700"
            >
              {processingId === 'all' ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark All Received
                </>
              )}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {pendingPayments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p className="font-medium">All payments received!</p>
              <p className="text-sm">No pending SUFS payments for this period</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPayments.map((payment) => (
                <div 
                  key={payment.scholarship_id}
                  className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium">{payment.family_name}</p>
                        <p className="text-sm text-gray-600">{payment.student_name}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-center px-4">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {payment.scholarship_type}
                    </span>
                  </div>
                  <div className="text-right px-4">
                    <p className="font-bold text-lg">{formatCurrency(payment.expected_amount)}</p>
                    <p className="text-xs text-gray-500">Expected {formatDate(payment.expected_date)}</p>
                  </div>
                  <Button
                    onClick={() => handleMarkReceived(payment.scholarship_id, payment.expected_amount)}
                    disabled={processingId === payment.scholarship_id}
                    className="bg-green-600 hover:bg-green-700 ml-4"
                  >
                    {processingId === payment.scholarship_id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Received
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Received Payments */}
      {receivedPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Received This Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {receivedPayments.map((payment) => (
                <div 
                  key={payment.scholarship_id}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">{payment.family_name}</p>
                      <p className="text-sm text-gray-600">{payment.student_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-700">{formatCurrency(payment.expected_amount)}</p>
                    <p className="text-xs text-gray-500">{payment.scholarship_type}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How this works:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Step Up for Students sends payments every 2 months (Aug, Oct, Dec, Feb, Apr, Jun)</li>
                <li>When you receive a payment, click "Mark Received" to record it</li>
                <li>This automatically updates the family's balance and creates a billing record</li>
                <li>Use "Mark All Received" if you receive a bulk payment for all students</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
