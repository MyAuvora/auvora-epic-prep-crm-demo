import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, AlertTriangle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ARAgingSummary {
  count: number;
  total: number;
}

interface ARAgingInvoice {
  invoice_id: string;
  invoice_number: string;
  family_id: string;
  family_name: string;
  invoice_date: string;
  due_date: string;
  days_overdue: number;
  total: number;
  amount_paid: number;
  balance: number;
}

interface ARAgingData {
  summary: {
    '0-30': ARAgingSummary;
    '31-60': ARAgingSummary;
    '61-90': ARAgingSummary;
    '90+': ARAgingSummary;
  };
  details: {
    '0-30': ARAgingInvoice[];
    '31-60': ARAgingInvoice[];
    '61-90': ARAgingInvoice[];
    '90+': ARAgingInvoice[];
  };
}

export default function ARAgingReport() {
  const [arData, setArData] = useState<ARAgingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBucket, setSelectedBucket] = useState<string>('0-30');

  useEffect(() => {
    fetchARAgingReport();
  }, []);

  const fetchARAgingReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/reports/ar-aging`);
      const data = await response.json();
      setArData(data);
    } catch (error) {
      console.error('Error fetching AR aging report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!arData) return;

    const rows = [
      ['AR Aging Report'],
      ['Generated:', new Date().toLocaleDateString()],
      [],
      ['Bucket', 'Count', 'Total Amount'],
      ['0-30 days', arData.summary['0-30'].count.toString(), `$${arData.summary['0-30'].total.toFixed(2)}`],
      ['31-60 days', arData.summary['31-60'].count.toString(), `$${arData.summary['31-60'].total.toFixed(2)}`],
      ['61-90 days', arData.summary['61-90'].count.toString(), `$${arData.summary['61-90'].total.toFixed(2)}`],
      ['90+ days', arData.summary['90+'].count.toString(), `$${arData.summary['90+'].total.toFixed(2)}`],
      [],
      ['Invoice Number', 'Family', 'Invoice Date', 'Due Date', 'Days Overdue', 'Total', 'Paid', 'Balance']
    ];

    Object.entries(arData.details).forEach(([bucket, invoices]) => {
      rows.push([`${bucket} days overdue`]);
      invoices.forEach(inv => {
        rows.push([
          inv.invoice_number,
          inv.family_name,
          inv.invoice_date,
          inv.due_date,
          inv.days_overdue.toString(),
          `$${inv.total.toFixed(2)}`,
          `$${inv.amount_paid.toFixed(2)}`,
          `$${inv.balance.toFixed(2)}`
        ]);
      });
      rows.push([]);
    });

    const csv = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ar_aging_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading AR Aging Report...</div>
      </div>
    );
  }

  if (!arData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-red-600">Error loading AR Aging Report</div>
      </div>
    );
  }

  const chartData = [
    { name: '0-30 days', count: arData.summary['0-30'].count, amount: arData.summary['0-30'].total },
    { name: '31-60 days', count: arData.summary['31-60'].count, amount: arData.summary['31-60'].total },
    { name: '61-90 days', count: arData.summary['61-90'].count, amount: arData.summary['61-90'].total },
    { name: '90+ days', count: arData.summary['90+'].count, amount: arData.summary['90+'].total }
  ];

  const totalOverdue = Object.values(arData.summary).reduce((sum, bucket) => sum + bucket.total, 0);
  const totalInvoices = Object.values(arData.summary).reduce((sum, bucket) => sum + bucket.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">AR Aging Report</h2>
          <p className="text-gray-600">Accounts receivable aging analysis</p>
        </div>
        <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700">
          <Download className="mr-2 h-4 w-4" />
          Export to CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalOverdue.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">{totalInvoices} invoices</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedBucket('0-30')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">0-30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${arData.summary['0-30'].total.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">{arData.summary['0-30'].count} invoices</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedBucket('31-60')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">31-60 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${arData.summary['31-60'].total.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">{arData.summary['31-60'].count} invoices</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedBucket('61-90')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">61-90 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              ${arData.summary['61-90'].total.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">{arData.summary['61-90'].count} invoices</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedBucket('90+')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">90+ Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              ${arData.summary['90+'].total.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">{arData.summary['90+'].count} invoices</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aging Distribution</CardTitle>
          <CardDescription>Visual breakdown of overdue accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `$${value.toFixed(2)}`}
              />
              <Legend />
              <Bar dataKey="amount" fill="#ef4444" name="Amount Overdue" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overdue Invoices by Aging Bucket</CardTitle>
          <CardDescription>Detailed breakdown of overdue invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedBucket} onValueChange={setSelectedBucket}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="0-30">0-30 Days ({arData.summary['0-30'].count})</TabsTrigger>
              <TabsTrigger value="31-60">31-60 Days ({arData.summary['31-60'].count})</TabsTrigger>
              <TabsTrigger value="61-90">61-90 Days ({arData.summary['61-90'].count})</TabsTrigger>
              <TabsTrigger value="90+">90+ Days ({arData.summary['90+'].count})</TabsTrigger>
            </TabsList>

            {(['0-30', '31-60', '61-90', '90+'] as const).map(bucket => (
              <TabsContent key={bucket} value={bucket}>
                {arData.details[bucket].length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No overdue invoices in this bucket
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Family</TableHead>
                        <TableHead>Invoice Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Days Overdue</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {arData.details[bucket].map(invoice => (
                        <TableRow key={invoice.invoice_id}>
                          <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                          <TableCell>{invoice.family_name}</TableCell>
                          <TableCell>{new Date(invoice.invoice_date).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                              <span className="font-medium">{invoice.days_overdue} days</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">${invoice.total.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${invoice.amount_paid.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium text-red-600">
                            ${invoice.balance.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
