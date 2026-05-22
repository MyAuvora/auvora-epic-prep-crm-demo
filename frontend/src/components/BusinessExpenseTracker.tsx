import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import {
  DollarSign, Plus, Edit2, Trash2, TrendingUp, Filter,
  Receipt, Building2, Zap, ShieldCheck, Wrench,
  Megaphone, Monitor, UtensilsCrossed, Bus, Briefcase, BookOpen, MoreHorizontal,
  X, Save, ChevronDown, ChevronUp,
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Expense {
  expense_id: string
  campus_id: string
  category: string
  vendor: string
  description: string
  amount: number
  date: string
  due_date?: string
  status: string
  recurrence: string
  payment_method?: string
  receipt_note?: string
  created_at: string
  updated_at: string
}

interface CategorySummary {
  categories: { category: string; total: number }[]
  grand_total: number
  count: number
}

interface MonthlySummary {
  year: number
  months: { month: string; total: number }[]
  annual_total: number
}

const CATEGORIES = [
  'Rent', 'Utilities', 'Payroll', 'Supplies', 'Insurance',
  'Maintenance', 'Marketing', 'Technology', 'Food & Snacks',
  'Transportation', 'Professional Services', 'Curriculum & Materials', 'Other',
]

const STATUSES = ['Pending', 'Paid', 'Overdue', 'Cancelled']
const RECURRENCES = ['none', 'monthly', 'quarterly', 'annually']
const PAYMENT_METHODS = ['Check', 'ACH/Bank Transfer', 'Credit Card', 'Cash', 'Venmo', 'Cash App', 'Other']

const categoryIcons: Record<string, React.ReactNode> = {
  'Rent': <Building2 className="h-4 w-4" />,
  'Utilities': <Zap className="h-4 w-4" />,
  'Payroll': <DollarSign className="h-4 w-4" />,
  'Supplies': <Receipt className="h-4 w-4" />,
  'Insurance': <ShieldCheck className="h-4 w-4" />,
  'Maintenance': <Wrench className="h-4 w-4" />,
  'Marketing': <Megaphone className="h-4 w-4" />,
  'Technology': <Monitor className="h-4 w-4" />,
  'Food & Snacks': <UtensilsCrossed className="h-4 w-4" />,
  'Transportation': <Bus className="h-4 w-4" />,
  'Professional Services': <Briefcase className="h-4 w-4" />,
  'Curriculum & Materials': <BookOpen className="h-4 w-4" />,
  'Other': <MoreHorizontal className="h-4 w-4" />,
}

const categoryColors: Record<string, string> = {
  'Rent': 'bg-blue-100 text-blue-800',
  'Utilities': 'bg-yellow-100 text-yellow-800',
  'Payroll': 'bg-green-100 text-green-800',
  'Supplies': 'bg-purple-100 text-purple-800',
  'Insurance': 'bg-indigo-100 text-indigo-800',
  'Maintenance': 'bg-orange-100 text-orange-800',
  'Marketing': 'bg-pink-100 text-pink-800',
  'Technology': 'bg-cyan-100 text-cyan-800',
  'Food & Snacks': 'bg-amber-100 text-amber-800',
  'Transportation': 'bg-teal-100 text-teal-800',
  'Professional Services': 'bg-slate-100 text-slate-800',
  'Curriculum & Materials': 'bg-emerald-100 text-emerald-800',
  'Other': 'bg-gray-100 text-gray-800',
}

interface ExpenseFormData {
  category: string
  vendor: string
  description: string
  amount: string
  date: string
  due_date: string
  status: string
  recurrence: string
  payment_method: string
  receipt_note: string
  campus_id: string
}

const emptyForm: ExpenseFormData = {
  category: 'Other',
  vendor: '',
  description: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  due_date: '',
  status: 'Paid',
  recurrence: 'none',
  payment_method: '',
  receipt_note: '',
  campus_id: 'campus_pace',
}

export function BusinessExpenseTracker({ selectedCampusId }: { selectedCampusId?: string | null }) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categorySummary, setCategorySummary] = useState<CategorySummary | null>(null)
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ExpenseFormData>(emptyForm)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortField, setSortField] = useState<'date' | 'amount' | 'category'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [selectedCampusId])

  const fetchData = async () => {
    try {
      const campusParam = selectedCampusId ? `?campus_id=${selectedCampusId}` : ''
      const [expResp, catResp, monthResp] = await Promise.all([
        fetch(`${API_URL}/api/expenses${campusParam}`),
        fetch(`${API_URL}/api/expenses/summary/by-category${campusParam}`),
        fetch(`${API_URL}/api/expenses/summary/monthly${campusParam}`),
      ])
      setExpenses(await expResp.json())
      setCategorySummary(await catResp.json())
      setMonthlySummary(await monthResp.json())
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.vendor || !form.amount || !form.description) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        campus_id: selectedCampusId || form.campus_id,
        due_date: form.due_date || undefined,
        payment_method: form.payment_method || undefined,
        receipt_note: form.receipt_note || undefined,
      }
      const url = editingId
        ? `${API_URL}/api/expenses/${editingId}`
        : `${API_URL}/api/expenses`
      const method = editingId ? 'PUT' : 'POST'
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      fetchData()
    } catch (error) {
      console.error('Error saving expense:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (expense: Expense) => {
    setForm({
      category: expense.category,
      vendor: expense.vendor,
      description: expense.description,
      amount: expense.amount.toString(),
      date: expense.date,
      due_date: expense.due_date || '',
      status: expense.status,
      recurrence: expense.recurrence,
      payment_method: expense.payment_method || '',
      receipt_note: expense.receipt_note || '',
      campus_id: expense.campus_id,
    })
    setEditingId(expense.expense_id)
    setShowForm(true)
  }

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Delete this expense?')) return
    try {
      await fetch(`${API_URL}/api/expenses/${expenseId}`, { method: 'DELETE' })
      fetchData()
    } catch (error) {
      console.error('Error deleting expense:', error)
    }
  }

  const filteredExpenses = useMemo(() => {
    let result = [...expenses]
    if (filterCategory !== 'all') {
      result = result.filter(e => e.category === filterCategory)
    }
    if (filterStatus !== 'all') {
      result = result.filter(e => e.status === filterStatus)
    }
    result.sort((a, b) => {
      let cmp = 0
      if (sortField === 'date') cmp = a.date.localeCompare(b.date)
      else if (sortField === 'amount') cmp = a.amount - b.amount
      else cmp = a.category.localeCompare(b.category)
      return sortDir === 'desc' ? -cmp : cmp
    })
    return result
  }, [expenses, filterCategory, filterStatus, sortField, sortDir])

  const toggleSort = (field: 'date' | 'amount' | 'category') => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null
    return sortDir === 'desc'
      ? <ChevronDown className="h-3 w-3 inline ml-1" />
      : <ChevronUp className="h-3 w-3 inline ml-1" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Expenses</h2>
          <p className="text-sm text-gray-500 mt-1">Track and manage all business operating expenses</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm) }}>
          <Plus className="h-4 w-4 mr-2" /> Add Expense
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">All Expenses ({expenses.length})</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Breakdown</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Expenses</p>
                    <p className="text-3xl font-bold text-red-600">
                      ${(categorySummary?.grand_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Transactions</p>
                    <p className="text-3xl font-bold text-gray-900">{categorySummary?.count || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Receipt className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pending Payments</p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {expenses.filter(e => e.status === 'Pending' || e.status === 'Overdue').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categorySummary && categorySummary.categories.length > 0 ? (
                <div className="space-y-3">
                  {categorySummary.categories.map((cat) => {
                    const pct = categorySummary.grand_total > 0
                      ? (cat.total / categorySummary.grand_total) * 100
                      : 0
                    return (
                      <div key={cat.category} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${categoryColors[cat.category] || 'bg-gray-100 text-gray-800'}`}>
                          {categoryIcons[cat.category] || <MoreHorizontal className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{cat.category}</span>
                            <span className="text-sm font-semibold">
                              ${cat.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 w-12 text-right">{pct.toFixed(1)}%</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No expenses recorded yet</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Expenses */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length > 0 ? (
                <div className="space-y-3">
                  {expenses.slice(0, 5).map((exp) => (
                    <div key={exp.expense_id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${categoryColors[exp.category] || 'bg-gray-100'}`}>
                          {categoryIcons[exp.category] || <MoreHorizontal className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{exp.vendor}</p>
                          <p className="text-xs text-gray-500">{exp.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-red-600">-${exp.amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">{new Date(exp.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No expenses yet — click "Add Expense" to get started</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Expenses Tab */}
        <TabsContent value="expenses" className="mt-6 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label className="text-xs text-gray-500">Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-3 w-3 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Expense Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => toggleSort('date')}>
                        Date <SortIcon field="date" />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => toggleSort('category')}>
                        Category <SortIcon field="category" />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => toggleSort('amount')}>
                        Amount <SortIcon field="amount" />
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredExpenses.length > 0 ? (
                      filteredExpenses.map((exp) => (
                        <tr key={exp.expense_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                            {new Date(exp.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${categoryColors[exp.category] || 'bg-gray-100 text-gray-800'}`}>
                              {categoryIcons[exp.category]}
                              {exp.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{exp.vendor}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{exp.description}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              exp.status === 'Paid' ? 'bg-green-100 text-green-800' :
                              exp.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                              exp.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {exp.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-red-600 text-right whitespace-nowrap">
                            ${exp.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(exp)}>
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(exp.expense_id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          No expenses match the current filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Breakdown Tab */}
        <TabsContent value="monthly" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Expenses — {monthlySummary?.year || new Date().getFullYear()}</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlySummary && monthlySummary.months.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-right mb-4">
                    <span className="text-sm text-gray-500">Annual Total: </span>
                    <span className="text-xl font-bold text-red-600">
                      ${monthlySummary.annual_total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {monthlySummary.months.map((m) => {
                    const monthName = new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    const pct = monthlySummary.annual_total > 0
                      ? (m.total / monthlySummary.annual_total) * 100
                      : 0
                    return (
                      <div key={m.month} className="flex items-center gap-4">
                        <span className="text-sm font-medium w-36">{monthName}</span>
                        <div className="flex-1">
                          <div className="w-full bg-gray-100 rounded-full h-6 relative">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-blue-700 h-6 rounded-full flex items-center justify-end pr-2 transition-all"
                              style={{ width: `${Math.max(pct, 5)}%` }}
                            >
                              <span className="text-xs text-white font-medium">
                                ${m.total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No monthly data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Expense Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-bold">{editingId ? 'Edit Expense' : 'Add New Expense'}</h3>
              <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingId(null) }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category *</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Vendor / Payee *</Label>
                <Input placeholder="e.g. Florida Power & Light" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
              </div>
              <div>
                <Label>Description *</Label>
                <Input placeholder="e.g. Monthly electric bill" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount ($) *</Label>
                  <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <Label>Date *</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Due Date</Label>
                  <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                </div>
                <div>
                  <Label>Recurrence</Label>
                  <Select value={form.recurrence} onValueChange={(v) => setForm({ ...form, recurrence: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RECURRENCES.map(r => (
                        <SelectItem key={r} value={r}>
                          {r === 'none' ? 'One-time' : r.charAt(0).toUpperCase() + r.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select value={form.payment_method || 'none'} onValueChange={(v) => setForm({ ...form, payment_method: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {PAYMENT_METHODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes / Receipt Info</Label>
                <Input placeholder="Optional notes or receipt reference" value={form.receipt_note} onChange={(e) => setForm({ ...form, receipt_note: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={saving || !form.vendor || !form.amount || !form.description}
              >
                <Save className="h-4 w-4 mr-2" />
                {editingId ? 'Update Expense' : 'Save Expense'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
