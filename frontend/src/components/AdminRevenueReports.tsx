import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MonthlyRevenue {
  month: string;
  tuition_step_up: number;
  tuition_out_of_pocket: number;
  tuition_total: number;
  fee_step_up: number;
  fee_out_of_pocket: number;
  fee_total: number;
  store_step_up: number;
  store_out_of_pocket: number;
  store_total: number;
  other_step_up: number;
  other_out_of_pocket: number;
  other_total: number;
  step_up_total: number;
  out_of_pocket_total: number;
  grand_total: number;
}

interface AdminRevenueReportsProps {
  role: 'owner' | 'admin' | 'coach' | 'parent';
}

export const AdminRevenueReports: React.FC<AdminRevenueReportsProps> = ({ role: _role }) => {
  const [revenueData, setRevenueData] = useState<MonthlyRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/revenue/monthly`);
      const data = await response.json();
      setRevenueData(data);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const exportToCSV = () => {
    const headers = [
      'Month',
      'Tuition Step-Up',
      'Tuition Out-of-Pocket',
      'Tuition Total',
      'Fees Step-Up',
      'Fees Out-of-Pocket',
      'Fees Total',
      'Store Step-Up',
      'Store Out-of-Pocket',
      'Store Total',
      'Other Step-Up',
      'Other Out-of-Pocket',
      'Other Total',
      'Total Step-Up',
      'Total Out-of-Pocket',
      'Grand Total'
    ];

    const rows = revenueData.map(row => [
      formatMonth(row.month),
      row.tuition_step_up,
      row.tuition_out_of_pocket,
      row.tuition_total,
      row.fee_step_up,
      row.fee_out_of_pocket,
      row.fee_total,
      row.store_step_up,
      row.store_out_of_pocket,
      row.store_total,
      row.other_step_up,
      row.other_out_of_pocket,
      row.other_total,
      row.step_up_total,
      row.out_of_pocket_total,
      row.grand_total
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalRevenue = revenueData.reduce((sum, month) => sum + month.grand_total, 0);
  const totalStepUp = revenueData.reduce((sum, month) => sum + month.step_up_total, 0);
  const totalOutOfPocket = revenueData.reduce((sum, month) => sum + month.out_of_pocket_total, 0);
  const stepUpPercentage = totalRevenue > 0 ? (totalStepUp / totalRevenue) * 100 : 0;

  const chartData = revenueData.slice().reverse().map(month => ({
    month: formatMonth(month.month),
    'Step-Up': month.step_up_total,
    'Out-of-Pocket': month.out_of_pocket_total
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading revenue data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Revenue Reports</h2>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-gray-500 mt-1">Last 6 months</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Step-Up Funding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalStepUp)}</div>
            <p className="text-xs text-gray-500 mt-1">{stepUpPercentage.toFixed(1)}% of total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Out-of-Pocket</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalOutOfPocket)}</div>
            <p className="text-xs text-gray-500 mt-1">{(100 - stepUpPercentage).toFixed(1)}% of total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Monthly</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue / revenueData.length)}</div>
            <p className="text-xs text-gray-500 mt-1">Per month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue by Source</CardTitle>
          <CardDescription>Monthly breakdown of Step-Up vs Out-of-Pocket payments</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Bar dataKey="Step-Up" fill="#10b981" stackId="a" />
              <Bar dataKey="Out-of-Pocket" fill="#3b82f6" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Monthly Breakdown</CardTitle>
          <CardDescription>Revenue by category and payment source</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Month</th>
                  <th className="text-right py-2 px-2">Tuition<br/>Step-Up</th>
                  <th className="text-right py-2 px-2">Tuition<br/>Out-of-Pocket</th>
                  <th className="text-right py-2 px-2">Tuition<br/>Total</th>
                  <th className="text-right py-2 px-2">Fees<br/>Total</th>
                  <th className="text-right py-2 px-2">Store<br/>Total</th>
                  <th className="text-right py-2 px-2">Other<br/>Total</th>
                  <th className="text-right py-2 px-2 font-bold">Grand<br/>Total</th>
                </tr>
              </thead>
              <tbody>
                {revenueData.slice().reverse().map((month) => (
                  <tr key={month.month} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2 font-medium">{formatMonth(month.month)}</td>
                    <td className="text-right py-2 px-2 text-green-600">{formatCurrency(month.tuition_step_up)}</td>
                    <td className="text-right py-2 px-2 text-blue-600">{formatCurrency(month.tuition_out_of_pocket)}</td>
                    <td className="text-right py-2 px-2 font-medium">{formatCurrency(month.tuition_total)}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(month.fee_total)}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(month.store_total)}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(month.other_total)}</td>
                    <td className="text-right py-2 px-2 font-bold">{formatCurrency(month.grand_total)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-bold">
                  <td className="py-2 px-2">TOTAL</td>
                  <td className="text-right py-2 px-2 text-green-600">{formatCurrency(totalStepUp)}</td>
                  <td className="text-right py-2 px-2 text-blue-600">{formatCurrency(totalOutOfPocket)}</td>
                  <td className="text-right py-2 px-2">{formatCurrency(revenueData.reduce((sum, m) => sum + m.tuition_total, 0))}</td>
                  <td className="text-right py-2 px-2">{formatCurrency(revenueData.reduce((sum, m) => sum + m.fee_total, 0))}</td>
                  <td className="text-right py-2 px-2">{formatCurrency(revenueData.reduce((sum, m) => sum + m.store_total, 0))}</td>
                  <td className="text-right py-2 px-2">{formatCurrency(revenueData.reduce((sum, m) => sum + m.other_total, 0))}</td>
                  <td className="text-right py-2 px-2">{formatCurrency(totalRevenue)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
