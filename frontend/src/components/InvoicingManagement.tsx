import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Eye } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Invoice {
  invoice_id: string;
  campus_id: string;
  family_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  amount_paid: number;
  balance: number;
  notes?: string;
}

interface InvoiceLineItem {
  line_item_id: string;
  invoice_id: string;
  description: string;
  category: string;
  student_id?: string;
  quantity: number;
  unit_price: number;
  total: number;
  funding_source?: string;
}

interface Family {
  family_id: string;
  family_name: string;
}

export default function InvoicingManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterFamily, setFilterFamily] = useState<string>('all');
  const [generateMonth, setGenerateMonth] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  useEffect(() => {
    fetchInvoices();
    fetchFamilies();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await fetch(`${API_URL}/api/invoices`);
      const data = await response.json();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
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

  const fetchInvoiceDetails = async (invoiceId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/invoices/${invoiceId}`);
      const data = await response.json();
      setSelectedInvoice(data);
      setLineItems(data.line_items || []);
      setShowInvoiceDetails(true);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
    }
  };

  const generateMonthlyInvoices = async () => {
    if (!generateMonth) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/invoices/generate-monthly?month=${generateMonth}`, {
        method: 'POST',
      });
      const data = await response.json();
      alert(`Successfully generated ${data.count} invoices for ${generateMonth}`);
      fetchInvoices();
      setShowGenerateDialog(false);
      setGenerateMonth('');
    } catch (error) {
      console.error('Error generating invoices:', error);
      alert('Error generating invoices');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'Draft': 'bg-gray-500',
      'Sent': 'bg-blue-500',
      'Paid': 'bg-green-500',
      'Overdue': 'bg-red-500',
      'Cancelled': 'bg-gray-400'
    };
    return (
      <Badge className={`${statusColors[status] || 'bg-gray-500'} text-white`}>
        {status}
      </Badge>
    );
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (filterStatus !== 'all' && invoice.status !== filterStatus) return false;
    if (filterFamily !== 'all' && invoice.family_id !== filterFamily) return false;
    return true;
  });

  const totalInvoiced = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = filteredInvoices.reduce((sum, inv) => sum + inv.amount_paid, 0);
  const totalOutstanding = filteredInvoices.reduce((sum, inv) => sum + inv.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Invoicing Management</h2>
          <p className="text-gray-600">Manage invoices and billing</p>
        </div>
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Generate Monthly Invoices
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Monthly Invoices</DialogTitle>
              <DialogDescription>
                Generate invoices for all families for a specific month
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="month">Month (YYYY-MM)</Label>
                <Input
                  id="month"
                  type="month"
                  value={generateMonth}
                  onChange={(e) => setGenerateMonth(e.target.value.replace('-', '-'))}
                  placeholder="2024-11"
                />
              </div>
              <Button
                onClick={generateMonthlyInvoices}
                disabled={loading || !generateMonth}
                className="w-full"
              >
                {loading ? 'Generating...' : 'Generate Invoices'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Invoiced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalInvoiced.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">{filteredInvoices.length} invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">
              {((totalPaid / totalInvoiced) * 100).toFixed(1)}% collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalOutstanding.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">
              {((totalOutstanding / totalInvoiced) * 100).toFixed(1)}% unpaid
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>View and manage all invoices</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Sent">Sent</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterFamily} onValueChange={setFilterFamily}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by family" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Families</SelectItem>
                  {families.map(family => (
                    <SelectItem key={family.family_id} value={family.family_id}>
                      {family.family_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Family</TableHead>
                <TableHead>Invoice Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map(invoice => {
                const family = families.find(f => f.family_id === invoice.family_id);
                return (
                  <TableRow key={invoice.invoice_id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{family?.family_name || 'Unknown'}</TableCell>
                    <TableCell>{new Date(invoice.invoice_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">${invoice.total.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${invoice.amount_paid.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${invoice.balance.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchInvoiceDetails(invoice.invoice_id)}
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

      <Dialog open={showInvoiceDetails} onOpenChange={setShowInvoiceDetails}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[80vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              {selectedInvoice?.invoice_number}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Invoice Date</Label>
                  <p className="font-medium">{new Date(selectedInvoice.invoice_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Due Date</Label>
                  <p className="font-medium">{new Date(selectedInvoice.due_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedInvoice.status)}</div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Family</Label>
                  <p className="font-medium">
                    {families.find(f => f.family_id === selectedInvoice.family_id)?.family_name || 'Unknown'}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm text-gray-600 mb-2 block">Line Items</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Funding Source</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map(item => (
                      <TableRow key={item.line_item_id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.funding_source || 'N/A'}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">${item.unit_price.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">${item.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-end space-y-2">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">${selectedInvoice.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-medium">${selectedInvoice.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>${selectedInvoice.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Amount Paid:</span>
                      <span className="font-medium">${selectedInvoice.amount_paid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-600 text-lg font-bold">
                      <span>Balance Due:</span>
                      <span>${selectedInvoice.balance.toFixed(2)}</span>
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
