import { useState, useEffect } from 'react'
import { Clock, DollarSign, Users, Download, Search } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface TimeClockEntry {
  entry_id: string
  staff_id: string
  campus_id: string
  clock_in: string
  clock_out: string | null
  hours_worked: number
  notes: string
}

interface StaffMember {
  staff_id: string
  first_name: string
  last_name: string
  role: string
  email: string
  pay_type: string
  pay_rate: number
}

interface StaffSummary {
  staff_id: string
  name: string
  pay_type: string
  pay_rate: number
  total_hours: number
  total_entries: number
  total_pay: number
}

export function TimesheetPayroll() {
  const [entries, setEntries] = useState<TimeClockEntry[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [summaries, setSummaries] = useState<StaffSummary[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string>('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [activeTab, setActiveTab] = useState<'overview' | 'entries' | 'payrates'>('overview')
  const [editingPay, setEditingPay] = useState<string | null>(null)
  const [editPayForm, setEditPayForm] = useState({ pay_type: 'hourly', pay_rate: '' })

  useEffect(() => {
    fetchEntries()
    fetchStaff()
    fetchSummary()
  }, [])

  useEffect(() => {
    fetchEntries()
    fetchSummary()
  }, [selectedStaff, dateRange])

  const fetchEntries = async () => {
    try {
      let url = `${API_URL}/api/timeclock`
      if (selectedStaff) url += `?staff_id=${selectedStaff}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setEntries(data)
      }
    } catch (error) {
      console.error('Error fetching entries:', error)
    }
  }

  const fetchStaff = async () => {
    try {
      const response = await fetch(`${API_URL}/api/staff`)
      if (response.ok) {
        const data = await response.json()
        const coaches = data.filter((s: StaffMember) =>
          s.role === 'Coach' || s.role === 'coach'
        )
        setStaff(coaches)
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
    }
  }

  const fetchSummary = async () => {
    try {
      let url = `${API_URL}/api/timeclock/summary`
      const params: string[] = []
      if (selectedStaff) params.push(`staff_id=${selectedStaff}`)
      if (dateRange.start) params.push(`start_date=${dateRange.start}`)
      if (dateRange.end) params.push(`end_date=${dateRange.end}`)
      if (params.length > 0) url += `?${params.join('&')}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setSummaries(data)
      }
    } catch (error) {
      console.error('Error fetching summary:', error)
    }
  }

  const handleUpdatePay = async (staffId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/staff/${staffId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pay_type: editPayForm.pay_type,
          pay_rate: parseFloat(editPayForm.pay_rate) || 0,
        }),
      })
      if (response.ok) {
        setEditingPay(null)
        fetchStaff()
        fetchSummary()
      }
    } catch (error) {
      console.error('Error updating pay:', error)
    }
  }

  const getStaffName = (staffId: string) => {
    const s = staff.find(st => st.staff_id === staffId)
    return s ? `${s.first_name} ${s.last_name}` : staffId
  }

  const totalHours = summaries.reduce((sum, s) => sum + s.total_hours, 0)
  const totalPay = summaries.reduce((sum, s) => sum + s.total_pay, 0)

  const exportCSV = () => {
    const headers = ['Date', 'Coach', 'Clock In', 'Clock Out', 'Hours', 'Status']
    const rows = entries
      .filter(e => e.clock_out)
      .sort((a, b) => new Date(b.clock_in).getTime() - new Date(a.clock_in).getTime())
      .map(e => [
        new Date(e.clock_in).toLocaleDateString(),
        getStaffName(e.staff_id),
        new Date(e.clock_in).toLocaleTimeString(),
        e.clock_out ? new Date(e.clock_out).toLocaleTimeString() : '',
        e.hours_worked.toFixed(2),
        e.clock_out ? 'Completed' : 'Active',
      ])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `timesheets-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Coach</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
            >
              <option value="">All Coaches</option>
              {staff.map(s => (
                <option key={s.staff_id} value={s.staff_id}>
                  {s.first_name} {s.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
          />
        </div>
        <button
          onClick={exportCSV}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview' as const, label: 'Payroll Overview' },
            { id: 'entries' as const, label: 'All Entries' },
            { id: 'payrates' as const, label: 'Pay Rates' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Coaches</p>
                <p className="text-2xl font-bold text-gray-900">{summaries.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-green-600">{totalHours.toFixed(1)}h</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
            <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Payroll</p>
                <p className="text-2xl font-bold text-purple-600">${totalPay.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          {/* Per-Coach Summary */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coach</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pay Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shifts</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Pay</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summaries.map(s => (
                  <tr key={s.staff_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        s.pay_type === 'hourly' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {s.pay_type === 'hourly' ? 'Hourly' : 'Salary'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {s.pay_type === 'hourly' ? `$${s.pay_rate.toFixed(2)}/hr` : `$${s.pay_rate.toFixed(0)}/yr`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{s.total_hours.toFixed(1)}h</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{s.total_entries}</td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">${s.total_pay.toFixed(2)}</td>
                  </tr>
                ))}
                {summaries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No timesheet data found. Coaches will appear here after they clock in.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'entries' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coach</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...entries]
                .sort((a, b) => new Date(b.clock_in).getTime() - new Date(a.clock_in).getTime())
                .map(entry => (
                  <tr key={entry.entry_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(entry.clock_in).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {getStaffName(entry.staff_id)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(entry.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {entry.clock_out
                        ? new Date(entry.clock_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {entry.clock_out ? `${entry.hours_worked.toFixed(2)}h` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        entry.clock_out ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {entry.clock_out ? 'Completed' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No clock entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'payrates' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Coach Pay Rates</h3>
            <p className="text-sm text-gray-500">Manage hourly and salary rates for coaches</p>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coach</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pay Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staff.map(s => (
                <tr key={s.staff_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.first_name} {s.last_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{s.email}</td>
                  <td className="px-6 py-4">
                    {editingPay === s.staff_id ? (
                      <select
                        value={editPayForm.pay_type}
                        onChange={(e) => setEditPayForm({ ...editPayForm, pay_type: e.target.value })}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="hourly">Hourly</option>
                        <option value="salary">Salary</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        (s.pay_type || 'hourly') === 'hourly' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {(s.pay_type || 'hourly') === 'hourly' ? 'Hourly' : 'Salary'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingPay === s.staff_id ? (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editPayForm.pay_rate}
                        onChange={(e) => setEditPayForm({ ...editPayForm, pay_rate: e.target.value })}
                        className="text-sm border border-gray-300 rounded px-2 py-1 w-32"
                        placeholder={editPayForm.pay_type === 'hourly' ? '15.00' : '45000'}
                      />
                    ) : (
                      <span className="text-sm text-gray-900">
                        {(s.pay_type || 'hourly') === 'hourly'
                          ? `$${(s.pay_rate || 0).toFixed(2)}/hr`
                          : `$${(s.pay_rate || 0).toFixed(0)}/yr`}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingPay === s.staff_id ? (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleUpdatePay(s.staff_id)}
                          className="text-sm text-green-600 hover:text-green-800 font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPay(null)}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingPay(s.staff_id)
                          setEditPayForm({
                            pay_type: s.pay_type || 'hourly',
                            pay_rate: String(s.pay_rate || 0),
                          })
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No coaches found. Add coaches in User Management.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
