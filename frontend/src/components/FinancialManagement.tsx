import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, FileText, DollarSign, TrendingUp } from 'lucide-react';
import InvoicingManagement from './InvoicingManagement';
import PaymentPlansManagement from './PaymentPlansManagement';
import ARAgingReport from './ARAgingReport';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface FinancialManagementProps {
  selectedCampusId: string | null;
}

export default function FinancialManagement({ selectedCampusId: _selectedCampusId }: FinancialManagementProps) {
  const [familyId, setFamilyId] = useState('');
  const [qbStartDate, setQbStartDate] = useState('');
  const [qbEndDate, setQbEndDate] = useState('');
  const [reconciliationMonth, setReconciliationMonth] = useState('');

  const downloadFamilyStatement = async (format: 'json' | 'csv') => {
    if (!familyId) {
      alert('Please enter a Family ID');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/families/${familyId}/statement?format=${format}`);
      
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `family_statement_${familyId}.csv`;
        a.click();
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `family_statement_${familyId}.json`;
        a.click();
      }
    } catch (error) {
      console.error('Error downloading family statement:', error);
      alert('Error downloading family statement');
    }
  };

  const downloadQuickBooksExport = async () => {
    if (!qbStartDate || !qbEndDate) {
      alert('Please enter both start and end dates');
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/reports/quickbooks-export?start_date=${qbStartDate}&end_date=${qbEndDate}`
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quickbooks_export_${qbStartDate}_${qbEndDate}.csv`;
      a.click();
    } catch (error) {
      console.error('Error downloading QuickBooks export:', error);
      alert('Error downloading QuickBooks export');
    }
  };

  const downloadStepUpReconciliation = async () => {
    if (!reconciliationMonth) {
      alert('Please enter a month');
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/reports/step-up-reconciliation?month=${reconciliationMonth}`
      );
      const data = await response.json();
      
      const csv = [
        ['Step-Up Reconciliation Report'],
        ['Month:', reconciliationMonth],
        [],
        ['Summary'],
        ['Total Expected:', `$${data.summary.total_expected}`],
        ['Total Received:', `$${data.summary.total_received}`],
        ['Total Variance:', `$${data.summary.total_variance}`],
        ['Variance %:', `${data.summary.variance_percentage}%`],
        [],
        ['Student', 'Grade', 'Step-Up %', 'Expected', 'Received', 'Variance', 'Variance %'],
        ...data.details.map((d: any) => [
          d.name,
          d.grade,
          `${d.step_up_percentage}%`,
          `$${d.expected}`,
          `$${d.received}`,
          `$${d.variance}`,
          `${d.variance_percentage}%`
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `step_up_reconciliation_${reconciliationMonth}.csv`;
      a.click();
    } catch (error) {
      console.error('Error downloading Step-Up reconciliation:', error);
      alert('Error downloading Step-Up reconciliation');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Financial Management</h2>
        <p className="text-gray-600">Comprehensive financial management and reporting</p>
      </div>

      <Tabs defaultValue="invoicing" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="invoicing">
            <FileText className="mr-2 h-4 w-4" />
            Invoicing
          </TabsTrigger>
          <TabsTrigger value="payment-plans">
            <DollarSign className="mr-2 h-4 w-4" />
            Payment Plans
          </TabsTrigger>
          <TabsTrigger value="ar-aging">
            <TrendingUp className="mr-2 h-4 w-4" />
            AR Aging
          </TabsTrigger>
          <TabsTrigger value="family-statements">
            <FileText className="mr-2 h-4 w-4" />
            Family Statements
          </TabsTrigger>
          <TabsTrigger value="quickbooks">
            <Download className="mr-2 h-4 w-4" />
            QuickBooks
          </TabsTrigger>
          <TabsTrigger value="step-up">
            <TrendingUp className="mr-2 h-4 w-4" />
            Step-Up Recon
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoicing">
          <InvoicingManagement />
        </TabsContent>

        <TabsContent value="payment-plans">
          <PaymentPlansManagement />
        </TabsContent>

        <TabsContent value="ar-aging">
          <ARAgingReport />
        </TabsContent>

        <TabsContent value="family-statements">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Family Statements</CardTitle>
                <CardDescription>
                  Generate and download detailed family billing statements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="familyId">Family ID</Label>
                  <Input
                    id="familyId"
                    placeholder="Enter family ID (e.g., fam_1)"
                    value={familyId}
                    onChange={(e) => setFamilyId(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Enter the family ID to generate a statement showing all invoices, payments, and balances
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => downloadFamilyStatement('csv')}
                    disabled={!familyId}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                  </Button>
                  <Button
                    onClick={() => downloadFamilyStatement('json')}
                    disabled={!familyId}
                    variant="outline"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download JSON
                  </Button>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-2">What's included in a family statement:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    <li>Family information and current balance</li>
                    <li>List of all students in the family</li>
                    <li>Complete invoice history with dates and amounts</li>
                    <li>Payment history showing all transactions</li>
                    <li>Summary totals (invoiced, paid, outstanding)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quickbooks">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>QuickBooks Export</CardTitle>
                <CardDescription>
                  Export transaction data for QuickBooks import
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="qbStartDate">Start Date</Label>
                    <Input
                      id="qbStartDate"
                      type="date"
                      value={qbStartDate}
                      onChange={(e) => setQbStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qbEndDate">End Date</Label>
                    <Input
                      id="qbEndDate"
                      type="date"
                      value={qbEndDate}
                      onChange={(e) => setQbEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  onClick={downloadQuickBooksExport}
                  disabled={!qbStartDate || !qbEndDate}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export to QuickBooks CSV
                </Button>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-2">QuickBooks export includes:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    <li>All invoices within the date range</li>
                    <li>Line items with proper account categorization</li>
                    <li>Payment transactions linked to invoices</li>
                    <li>Campus information for multi-location tracking</li>
                    <li>Ready to import directly into QuickBooks</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Import Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                    <li>Download the CSV file using the button above</li>
                    <li>Open QuickBooks and go to File → Import → CSV</li>
                    <li>Select the downloaded file and follow the import wizard</li>
                    <li>Map the columns to QuickBooks fields as needed</li>
                    <li>Review and complete the import</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="step-up">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Step-Up Reconciliation Report</CardTitle>
                <CardDescription>
                  Compare expected vs received Step-Up scholarship funding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reconciliationMonth">Month (YYYY-MM)</Label>
                  <Input
                    id="reconciliationMonth"
                    type="month"
                    value={reconciliationMonth}
                    onChange={(e) => setReconciliationMonth(e.target.value)}
                    placeholder="2024-11"
                  />
                  <p className="text-sm text-gray-500">
                    Select the month to reconcile Step-Up scholarship payments
                  </p>
                </div>

                <Button
                  onClick={downloadStepUpReconciliation}
                  disabled={!reconciliationMonth}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Reconciliation Report
                </Button>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-2">Step-Up reconciliation report includes:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    <li>Per-student expected Step-Up funding amounts</li>
                    <li>Actual Step-Up payments received</li>
                    <li>Variance analysis (expected vs received)</li>
                    <li>Percentage variance for each student</li>
                    <li>Summary totals and overall variance percentage</li>
                    <li>Sorted by variance to identify discrepancies</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">Important Notes:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                    <li>Expected amounts are calculated based on student Step-Up percentages</li>
                    <li>Received amounts reflect actual payments recorded in the system</li>
                    <li>Negative variance indicates underpayment from Step-Up program</li>
                    <li>Positive variance indicates overpayment (rare but possible)</li>
                    <li>Use this report to follow up with Step-Up program administrators</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
