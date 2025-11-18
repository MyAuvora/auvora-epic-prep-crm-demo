import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Eye, CheckCircle, XCircle, Clock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface PaymentPlan {
  payment_plan_id: string;
  campus_id: string;
  family_id: string;
  plan_name: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  start_date: string;
  end_date: string;
  status: string;
  created_date: string;
  last_updated: string;
}

interface PaymentSchedule {
  schedule_id: string;
  payment_plan_id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  paid: boolean;
  paid_date?: string;
  paid_amount: number;
}

interface Family {
  family_id: string;
  family_name: string;
}

export default function PaymentPlansManagement() {
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [showPlanDetails, setShowPlanDetails] = useState(false);

  useEffect(() => {
    fetchPaymentPlans();
    fetchFamilies();
  }, []);

  const fetchPaymentPlans = async () => {
    try {
      const response = await fetch(`${API_URL}/api/payment-plans`);
      const data = await response.json();
      setPaymentPlans(data);
    } catch (error) {
      console.error('Error fetching payment plans:', error);
    }
  };

  const fetchFamilies = async () => {
    try {
      const response = await fetch(`${API_URL}/api/families`);
      const data = await response.json();
      setFamilies(data);
    } catch (error) {
      console.error('Error fetching families:', error);
    }
  };

  const fetchPlanDetails = async (planId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/payment-plans/${planId}`);
      const data = await response.json();
      setSelectedPlan(data);
      setSchedules(data.schedules || []);
      setShowPlanDetails(true);
    } catch (error) {
      console.error('Error fetching plan details:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'Active': 'bg-blue-500',
      'Completed': 'bg-green-500',
      'Defaulted': 'bg-red-500',
      'Cancelled': 'bg-gray-400'
    };
    return (
      <Badge className={`${statusColors[status] || 'bg-gray-500'} text-white`}>
        {status}
      </Badge>
    );
  };

  const totalPlanned = paymentPlans.reduce((sum, plan) => sum + plan.total_amount, 0);
  const totalPaid = paymentPlans.reduce((sum, plan) => sum + plan.amount_paid, 0);
  const totalRemaining = paymentPlans.reduce((sum, plan) => sum + plan.balance, 0);
  const activePlans = paymentPlans.filter(p => p.status === 'Active').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Payment Plans Management</h2>
          <p className="text-gray-600">Manage family payment plans and installment schedules</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePlans}</div>
            <p className="text-xs text-gray-500 mt-1">of {paymentPlans.length} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Planned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPlanned.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">across all plans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">
              {((totalPaid / totalPlanned) * 100).toFixed(1)}% collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Remaining Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalRemaining.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">
              {((totalRemaining / totalPlanned) * 100).toFixed(1)}% unpaid
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Plans</CardTitle>
          <CardDescription>View and manage all payment plans</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan Name</TableHead>
                <TableHead>Family</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentPlans.map(plan => {
                const family = families.find(f => f.family_id === plan.family_id);
                const progress = (plan.amount_paid / plan.total_amount) * 100;
                return (
                  <TableRow key={plan.payment_plan_id}>
                    <TableCell className="font-medium">{plan.plan_name}</TableCell>
                    <TableCell>{family?.family_name || 'Unknown'}</TableCell>
                    <TableCell>{new Date(plan.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(plan.end_date).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(plan.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="w-20" />
                        <span className="text-xs text-gray-600">{progress.toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">${plan.total_amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${plan.amount_paid.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${plan.balance.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchPlanDetails(plan.payment_plan_id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showPlanDetails} onOpenChange={setShowPlanDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Payment Plan Details</DialogTitle>
            <DialogDescription>
              {selectedPlan?.plan_name}
            </DialogDescription>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Family</p>
                  <p className="font-medium">
                    {families.find(f => f.family_id === selectedPlan.family_id)?.family_name || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedPlan.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Start Date</p>
                  <p className="font-medium">{new Date(selectedPlan.start_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">End Date</p>
                  <p className="font-medium">{new Date(selectedPlan.end_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="font-medium text-lg">${selectedPlan.total_amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Progress</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress 
                      value={(selectedPlan.amount_paid / selectedPlan.total_amount) * 100} 
                      className="flex-1"
                    />
                    <span className="text-sm font-medium">
                      {((selectedPlan.amount_paid / selectedPlan.total_amount) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Payment Schedule</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Installment #</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Paid Amount</TableHead>
                      <TableHead>Paid Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules.map(schedule => (
                      <TableRow key={schedule.schedule_id} className={schedule.paid ? 'bg-green-50' : ''}>
                        <TableCell className="font-medium">
                          Installment {schedule.installment_number}
                        </TableCell>
                        <TableCell>{new Date(schedule.due_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {schedule.paid ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">Paid</span>
                            </div>
                          ) : new Date(schedule.due_date) < new Date() ? (
                            <div className="flex items-center gap-1 text-red-600">
                              <XCircle className="h-4 w-4" />
                              <span className="text-sm">Overdue</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-blue-600">
                              <Clock className="h-4 w-4" />
                              <span className="text-sm">Pending</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">${schedule.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          {schedule.paid ? `$${schedule.paid_amount.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell>
                          {schedule.paid_date ? new Date(schedule.paid_date).toLocaleDateString() : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-medium">${selectedPlan.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Amount Paid:</span>
                      <span className="font-medium">${selectedPlan.amount_paid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-600 text-lg font-bold border-t pt-2">
                      <span>Balance Remaining:</span>
                      <span>${selectedPlan.balance.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
