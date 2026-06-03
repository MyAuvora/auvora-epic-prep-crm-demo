import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import {
  BookOpen, Plus, Edit2, Trash2, Filter,
  Layers, ChevronDown, ChevronUp, GripVertical,
  X, Save, Search, FileText, CheckCircle, Archive,
  Clock, Upload, Download, File as FileIcon, Image, Presentation,
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Curriculum {
  curriculum_id: string
  campus_id: string
  title: string
  subject: string
  grade_level: string
  description: string
  objectives: string
  materials: string
  pacing: string
  status: string
  created_by: string
  created_at: string
  updated_at: string
}

interface CurriculumUnit {
  unit_id: string
  curriculum_id: string
  title: string
  description: string
  order_index: number
  duration_weeks: number
  objectives: string
  materials: string
  standards_alignment: string
  created_at: string
  updated_at: string
}

interface CurriculumFile {
  file_id: string
  curriculum_id: string
  unit_id: string | null
  file_name: string
  file_key: string
  file_url: string
  file_size: number
  file_type: string
  uploaded_by: string
  uploaded_at: string
}

const SUBJECTS = [
  'Math', 'English Language Arts', 'Science', 'Social Studies',
  'Bible', 'Reading', 'Writing', 'Phonics',
  'Art', 'Music', 'Physical Education', 'Technology',
  'Foreign Language', 'Other',
]

const GRADE_LEVELS = [
  'Pre-K', 'Kindergarten',
  '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade',
  '6th Grade', '7th Grade', '8th Grade',
  '9th Grade', '10th Grade', '11th Grade', '12th Grade',
  'All Grades',
]

const STATUSES = ['Draft', 'Active', 'Archived']

const statusColors: Record<string, string> = {
  'Draft': 'bg-yellow-100 text-yellow-800',
  'Active': 'bg-green-100 text-green-800',
  'Archived': 'bg-gray-100 text-gray-600',
}

const statusIcons: Record<string, React.ReactNode> = {
  'Draft': <Clock className="h-3.5 w-3.5" />,
  'Active': <CheckCircle className="h-3.5 w-3.5" />,
  'Archived': <Archive className="h-3.5 w-3.5" />,
}

interface CurriculumBuilderProps {
  selectedCampusId: string | null
}

export function CurriculumBuilder({ selectedCampusId }: CurriculumBuilderProps) {
  const [curricula, setCurricula] = useState<Curriculum[]>([])
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCurriculum, setEditingCurriculum] = useState<Curriculum | null>(null)
  const [expandedCurriculum, setExpandedCurriculum] = useState<string | null>(null)
  const [units, setUnits] = useState<Record<string, CurriculumUnit[]>>({})
  const [files, setFiles] = useState<Record<string, CurriculumFile[]>>({})
  const [showUnitForm, setShowUnitForm] = useState<string | null>(null)
  const [editingUnit, setEditingUnit] = useState<CurriculumUnit | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSubject, setFilterSubject] = useState('all')
  const [filterGrade, setFilterGrade] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    grade_level: '',
    description: '',
    objectives: '',
    materials: '',
    pacing: '',
    status: 'Draft',
  })

  // Unit form state
  const [unitFormData, setUnitFormData] = useState({
    title: '',
    description: '',
    duration_weeks: 1,
    objectives: '',
    materials: '',
    standards_alignment: '',
  })

  useEffect(() => {
    fetchCurricula()
  }, [selectedCampusId])

  const fetchCurricula = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCampusId) params.append('campus_id', selectedCampusId)
      const url = `${API_URL}/api/curricula${params.toString() ? '?' + params.toString() : ''}`
      const resp = await fetch(url)
      const data = await resp.json()
      setCurricula(data)
    } catch (err) {
      console.error('Error fetching curricula:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUnits = async (curriculumId: string) => {
    try {
      const resp = await fetch(`${API_URL}/api/curricula/${curriculumId}/units`)
      const data = await resp.json()
      setUnits(prev => ({ ...prev, [curriculumId]: data }))
    } catch (err) {
      console.error('Error fetching units:', err)
    }
  }

  const fetchFiles = async (curriculumId: string) => {
    try {
      const resp = await fetch(`${API_URL}/api/curricula/${curriculumId}/files`)
      const data = await resp.json()
      setFiles(prev => ({ ...prev, [curriculumId]: data }))
    } catch (err) {
      console.error('Error fetching files:', err)
    }
  }

  const handleFileUpload = async (curriculumId: string, fileList: FileList, unitId?: string) => {
    setUploading(curriculumId)
    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        const formData = new FormData()
        formData.append('file', file)
        const params = new URLSearchParams()
        if (unitId) params.append('unit_id', unitId)
        const url = `${API_URL}/api/curricula/${curriculumId}/files${params.toString() ? '?' + params.toString() : ''}`
        const resp = await fetch(url, { method: 'POST', body: formData })
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}))
          alert(err.detail || 'Upload failed')
        }
      }
      await fetchFiles(curriculumId)
    } catch (err) {
      console.error('Error uploading file:', err)
      alert('Failed to upload file')
    } finally {
      setUploading(null)
    }
  }

  const handleDeleteFile = async (curriculumId: string, fileId: string) => {
    try {
      const resp = await fetch(`${API_URL}/api/curricula/${curriculumId}/files/${fileId}`, { method: 'DELETE' })
      if (resp.ok) {
        await fetchFiles(curriculumId)
      }
    } catch (err) {
      console.error('Error deleting file:', err)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (_fileType: string, fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || ''
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return <Image className="h-4 w-4 text-green-600" />
    if (['ppt', 'pptx'].includes(ext)) return <Presentation className="h-4 w-4 text-orange-600" />
    if (['pdf'].includes(ext)) return <FileText className="h-4 w-4 text-red-600" />
    if (['doc', 'docx'].includes(ext)) return <FileIcon className="h-4 w-4 text-blue-600" />
    if (['xls', 'xlsx'].includes(ext)) return <FileIcon className="h-4 w-4 text-green-700" />
    return <FileIcon className="h-4 w-4 text-gray-500" />
  }

  const handleCreateCurriculum = async () => {
    try {
      const body = {
        ...formData,
        campus_id: selectedCampusId || 'campus_pace',
      }
      const resp = await fetch(`${API_URL}/api/curricula`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (resp.ok) {
        await fetchCurricula()
        resetForm()
      }
    } catch (err) {
      console.error('Error creating curriculum:', err)
    }
  }

  const handleUpdateCurriculum = async () => {
    if (!editingCurriculum) return
    try {
      const resp = await fetch(`${API_URL}/api/curricula/${editingCurriculum.curriculum_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (resp.ok) {
        await fetchCurricula()
        resetForm()
      }
    } catch (err) {
      console.error('Error updating curriculum:', err)
    }
  }

  const handleDeleteCurriculum = async (id: string) => {
    try {
      const resp = await fetch(`${API_URL}/api/curricula/${id}`, { method: 'DELETE' })
      if (resp.ok) {
        await fetchCurricula()
        if (expandedCurriculum === id) setExpandedCurriculum(null)
      }
    } catch (err) {
      console.error('Error deleting curriculum:', err)
    }
  }

  const handleCreateUnit = async (curriculumId: string) => {
    try {
      const resp = await fetch(`${API_URL}/api/curricula/${curriculumId}/units`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unitFormData),
      })
      if (resp.ok) {
        await fetchUnits(curriculumId)
        resetUnitForm()
      }
    } catch (err) {
      console.error('Error creating unit:', err)
    }
  }

  const handleUpdateUnit = async (curriculumId: string) => {
    if (!editingUnit) return
    try {
      const resp = await fetch(`${API_URL}/api/curricula/${curriculumId}/units/${editingUnit.unit_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unitFormData),
      })
      if (resp.ok) {
        await fetchUnits(curriculumId)
        resetUnitForm()
      }
    } catch (err) {
      console.error('Error updating unit:', err)
    }
  }

  const handleDeleteUnit = async (curriculumId: string, unitId: string) => {
    try {
      const resp = await fetch(`${API_URL}/api/curricula/${curriculumId}/units/${unitId}`, { method: 'DELETE' })
      if (resp.ok) {
        await fetchUnits(curriculumId)
      }
    } catch (err) {
      console.error('Error deleting unit:', err)
    }
  }

  const resetForm = () => {
    setFormData({ title: '', subject: '', grade_level: '', description: '', objectives: '', materials: '', pacing: '', status: 'Draft' })
    setEditingCurriculum(null)
    setShowForm(false)
  }

  const resetUnitForm = () => {
    setUnitFormData({ title: '', description: '', duration_weeks: 1, objectives: '', materials: '', standards_alignment: '' })
    setEditingUnit(null)
    setShowUnitForm(null)
  }

  const startEdit = (c: Curriculum) => {
    setFormData({
      title: c.title,
      subject: c.subject,
      grade_level: c.grade_level,
      description: c.description,
      objectives: c.objectives,
      materials: c.materials,
      pacing: c.pacing,
      status: c.status,
    })
    setEditingCurriculum(c)
    setShowForm(true)
  }

  const startEditUnit = (curriculumId: string, unit: CurriculumUnit) => {
    setUnitFormData({
      title: unit.title,
      description: unit.description,
      duration_weeks: unit.duration_weeks,
      objectives: unit.objectives,
      materials: unit.materials,
      standards_alignment: unit.standards_alignment,
    })
    setEditingUnit(unit)
    setShowUnitForm(curriculumId)
  }

  const toggleExpand = (id: string) => {
    if (expandedCurriculum === id) {
      setExpandedCurriculum(null)
    } else {
      setExpandedCurriculum(id)
      if (!units[id]) fetchUnits(id)
      if (!files[id]) fetchFiles(id)
    }
  }

  const filtered = useMemo(() => {
    let result = [...curricula]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.grade_level.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      )
    }
    if (filterSubject !== 'all') result = result.filter(c => c.subject === filterSubject)
    if (filterGrade !== 'all') result = result.filter(c => c.grade_level === filterGrade)
    if (filterStatus !== 'all') result = result.filter(c => c.status === filterStatus)
    return result
  }, [curricula, searchQuery, filterSubject, filterGrade, filterStatus])

  const summary = useMemo(() => {
    const total = curricula.length
    const active = curricula.filter(c => c.status === 'Active').length
    const draft = curricula.filter(c => c.status === 'Draft').length
    const subjects = new Set(curricula.map(c => c.subject)).size
    return { total, active, draft, subjects }
  }, [curricula])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A2463]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Curriculum Builder</h2>
        <Button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="bg-[#0A2463] hover:bg-[#0A2463]/90"
        >
          <Plus className="h-4 w-4 mr-2" /> New Curriculum
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">All Curricula</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpen className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Curricula</p>
                    <p className="text-2xl font-bold">{summary.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Active</p>
                    <p className="text-2xl font-bold">{summary.active}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Drafts</p>
                    <p className="text-2xl font-bold">{summary.draft}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Layers className="h-5 w-5 text-purple-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Subjects</p>
                    <p className="text-2xl font-bold">{summary.subjects}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {curricula.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Curricula by Subject</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(
                    curricula.reduce((acc, c) => {
                      acc[c.subject] = (acc[c.subject] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)
                  ).sort((a, b) => b[1] - a[1]).map(([subject, count]) => (
                    <div key={subject} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{subject}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 bg-[#0A2463] rounded-full" style={{ width: `${Math.max(20, (count / curricula.length) * 200)}px` }} />
                        <span className="text-sm text-gray-500 w-6 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* All Curricula Tab */}
        <TabsContent value="all" className="mt-6">
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search curricula..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-1" />
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterGrade} onValueChange={setFilterGrade}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Curriculum List */}
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-1">No curricula found</h3>
                <p className="text-gray-400 mb-4">
                  {curricula.length === 0
                    ? 'Get started by creating your first curriculum.'
                    : 'Try adjusting your search or filters.'}
                </p>
                {curricula.length === 0 && (
                  <Button onClick={() => { resetForm(); setShowForm(true) }} className="bg-[#0A2463] hover:bg-[#0A2463]/90">
                    <Plus className="h-4 w-4 mr-2" /> Create First Curriculum
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map(c => (
                <Card key={c.curriculum_id} className="overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleExpand(c.curriculum_id)}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="p-2 bg-[#0A2463]/10 rounded-lg shrink-0">
                        <BookOpen className="h-5 w-5 text-[#0A2463]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 truncate">{c.title}</h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status] || 'bg-gray-100 text-gray-600'}`}>
                            {statusIcons[c.status]}
                            {c.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span>{c.subject}</span>
                          <span>•</span>
                          <span>{c.grade_level}</span>
                          {c.description && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[300px]">{c.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => { e.stopPropagation(); startEdit(c) }}
                        className="text-gray-400 hover:text-blue-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => { e.stopPropagation(); handleDeleteCurriculum(c.curriculum_id) }}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {expandedCurriculum === c.curriculum_id
                        ? <ChevronUp className="h-5 w-5 text-gray-400" />
                        : <ChevronDown className="h-5 w-5 text-gray-400" />
                      }
                    </div>
                  </div>

                  {/* Expanded Curriculum Details + Units */}
                  {expandedCurriculum === c.curriculum_id && (
                    <div className="border-t bg-gray-50 p-4">
                      {/* Curriculum details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {c.objectives && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Objectives</p>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{c.objectives}</p>
                          </div>
                        )}
                        {c.materials && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Materials</p>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{c.materials}</p>
                          </div>
                        )}
                        {c.pacing && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Pacing Guide</p>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{c.pacing}</p>
                          </div>
                        )}
                      </div>

                      {/* Units section */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                            <Layers className="h-4 w-4" /> Units
                          </h4>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              resetUnitForm()
                              setShowUnitForm(c.curriculum_id)
                            }}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" /> Add Unit
                          </Button>
                        </div>

                        {/* Unit Form (inline) */}
                        {showUnitForm === c.curriculum_id && (
                          <Card className="mb-3 border-blue-200 bg-white">
                            <CardContent className="pt-4 space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs">Unit Title *</Label>
                                  <Input
                                    value={unitFormData.title}
                                    onChange={e => setUnitFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="e.g. Chapter 1: Introduction to Algebra"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Duration (weeks)</Label>
                                  <Input
                                    type="number"
                                    min={1}
                                    value={unitFormData.duration_weeks}
                                    onChange={e => setUnitFormData(prev => ({ ...prev, duration_weeks: parseInt(e.target.value) || 1 }))}
                                  />
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs">Description</Label>
                                <textarea
                                  className="w-full border rounded-md px-3 py-2 text-sm resize-none"
                                  rows={2}
                                  value={unitFormData.description}
                                  onChange={e => setUnitFormData(prev => ({ ...prev, description: e.target.value }))}
                                  placeholder="Brief description of this unit..."
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <Label className="text-xs">Objectives</Label>
                                  <textarea
                                    className="w-full border rounded-md px-3 py-2 text-sm resize-none"
                                    rows={2}
                                    value={unitFormData.objectives}
                                    onChange={e => setUnitFormData(prev => ({ ...prev, objectives: e.target.value }))}
                                    placeholder="Learning objectives..."
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Materials</Label>
                                  <textarea
                                    className="w-full border rounded-md px-3 py-2 text-sm resize-none"
                                    rows={2}
                                    value={unitFormData.materials}
                                    onChange={e => setUnitFormData(prev => ({ ...prev, materials: e.target.value }))}
                                    placeholder="Required materials..."
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Standards Alignment</Label>
                                  <textarea
                                    className="w-full border rounded-md px-3 py-2 text-sm resize-none"
                                    rows={2}
                                    value={unitFormData.standards_alignment}
                                    onChange={e => setUnitFormData(prev => ({ ...prev, standards_alignment: e.target.value }))}
                                    placeholder="e.g. CCSS.MATH.1.OA.A.1"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={resetUnitForm}>
                                  <X className="h-3.5 w-3.5 mr-1" /> Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-[#0A2463] hover:bg-[#0A2463]/90"
                                  disabled={!unitFormData.title.trim()}
                                  onClick={() => editingUnit ? handleUpdateUnit(c.curriculum_id) : handleCreateUnit(c.curriculum_id)}
                                >
                                  <Save className="h-3.5 w-3.5 mr-1" />
                                  {editingUnit ? 'Update Unit' : 'Add Unit'}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Units list */}
                        {(units[c.curriculum_id] || []).length === 0 ? (
                          <p className="text-sm text-gray-400 italic">No units added yet. Click &quot;Add Unit&quot; to get started.</p>
                        ) : (
                          <div className="space-y-2">
                            {(units[c.curriculum_id] || []).map((unit, idx) => (
                              <div
                                key={unit.unit_id}
                                className="flex items-start gap-3 p-3 bg-white rounded-lg border hover:border-blue-200 transition-colors"
                              >
                                <div className="flex items-center gap-2 shrink-0 mt-0.5">
                                  <GripVertical className="h-4 w-4 text-gray-300" />
                                  <span className="text-xs font-bold text-gray-400 w-5 text-center">{idx + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-gray-800">{unit.title}</span>
                                    <span className="text-xs text-gray-400">({unit.duration_weeks} {unit.duration_weeks === 1 ? 'week' : 'weeks'})</span>
                                  </div>
                                  {unit.description && <p className="text-xs text-gray-500 mt-0.5">{unit.description}</p>}
                                  {unit.standards_alignment && (
                                    <span className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                      <FileText className="h-3 w-3" /> {unit.standards_alignment}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600"
                                    onClick={() => startEditUnit(c.curriculum_id, unit)}
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                                    onClick={() => handleDeleteUnit(c.curriculum_id, unit.unit_id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Files / Documents Section */}
                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                            <Upload className="h-4 w-4" /> Files & Documents
                          </h4>
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              multiple
                              className="hidden"
                              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt,.csv"
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  handleFileUpload(c.curriculum_id, e.target.files)
                                  e.target.value = ''
                                }
                              }}
                            />
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
                              <Plus className="h-3.5 w-3.5" /> Browse Files
                            </span>
                          </label>
                        </div>

                        {/* Drag & Drop Zone */}
                        <div
                          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                            dragOver === c.curriculum_id
                              ? 'border-[#0A2463] bg-[#0A2463]/5'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setDragOver(c.curriculum_id)
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setDragOver(null)
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setDragOver(null)
                            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                              handleFileUpload(c.curriculum_id, e.dataTransfer.files)
                            }
                          }}
                        >
                          {uploading === c.curriculum_id ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A2463]" />
                              <p className="text-sm text-gray-500">Uploading...</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <Upload className={`h-8 w-8 ${dragOver === c.curriculum_id ? 'text-[#0A2463]' : 'text-gray-400'}`} />
                              <p className="text-sm text-gray-600 font-medium">
                                {dragOver === c.curriculum_id ? 'Drop files here' : 'Drag & drop files here'}
                              </p>
                              <p className="text-xs text-gray-400">
                                Worksheets, PowerPoints, PDFs, documents, images — up to 50 MB each
                              </p>
                            </div>
                          )}
                        </div>

                        {/* File List */}
                        {(files[c.curriculum_id] || []).length > 0 && (
                          <div className="mt-3 space-y-1.5">
                            {(files[c.curriculum_id] || []).map(f => (
                              <div
                                key={f.file_id}
                                className="flex items-center gap-3 p-2.5 bg-white rounded-lg border hover:border-blue-200 transition-colors group"
                              >
                                <div className="shrink-0">
                                  {getFileIcon(f.file_type, f.file_name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium text-gray-800 truncate block">{f.file_name}</span>
                                  <span className="text-xs text-gray-400">
                                    {formatFileSize(f.file_size)}
                                    {f.uploaded_at && ` • ${new Date(f.uploaded_at).toLocaleDateString()}`}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <a
                                    href={f.file_url.startsWith('/') ? `${API_URL}${f.file_url}` : f.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                                    title="Download"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                  </a>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                                    onClick={() => handleDeleteFile(c.curriculum_id, f.file_id)}
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Curriculum Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCurriculum ? 'Edit Curriculum' : 'New Curriculum'}
              </h3>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-5 space-y-4">
              {/* Title */}
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. 3rd Grade Math - Full Year"
                />
              </div>

              {/* Subject + Grade + Status row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Subject *</Label>
                  <Select value={formData.subject} onValueChange={v => setFormData(prev => ({ ...prev, subject: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Grade Level *</Label>
                  <Select value={formData.grade_level} onValueChange={v => setFormData(prev => ({ ...prev, grade_level: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={v => setFormData(prev => ({ ...prev, status: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label>Description</Label>
                <textarea
                  className="w-full border rounded-md px-3 py-2 text-sm resize-none"
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this curriculum..."
                />
              </div>

              {/* Objectives */}
              <div>
                <Label>Learning Objectives</Label>
                <textarea
                  className="w-full border rounded-md px-3 py-2 text-sm resize-none"
                  rows={3}
                  value={formData.objectives}
                  onChange={e => setFormData(prev => ({ ...prev, objectives: e.target.value }))}
                  placeholder="Key learning objectives for students..."
                />
              </div>

              {/* Materials + Pacing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Materials & Resources</Label>
                  <textarea
                    className="w-full border rounded-md px-3 py-2 text-sm resize-none"
                    rows={2}
                    value={formData.materials}
                    onChange={e => setFormData(prev => ({ ...prev, materials: e.target.value }))}
                    placeholder="Textbooks, workbooks, online resources..."
                  />
                </div>
                <div>
                  <Label>Pacing Guide</Label>
                  <textarea
                    className="w-full border rounded-md px-3 py-2 text-sm resize-none"
                    rows={2}
                    value={formData.pacing}
                    onChange={e => setFormData(prev => ({ ...prev, pacing: e.target.value }))}
                    placeholder="Timeline and pacing notes..."
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t bg-gray-50">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button
                className="bg-[#0A2463] hover:bg-[#0A2463]/90"
                disabled={!formData.title.trim() || !formData.subject || !formData.grade_level}
                onClick={editingCurriculum ? handleUpdateCurriculum : handleCreateCurriculum}
              >
                <Save className="h-4 w-4 mr-2" />
                {editingCurriculum ? 'Save Changes' : 'Create Curriculum'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
