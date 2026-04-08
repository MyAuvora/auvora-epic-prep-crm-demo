import { useState, useCallback } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, X, Search, Users, Home, UserCheck, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

type DataType = 'students' | 'families' | 'parents' | 'staff'

interface PreviewResult {
  data_type: string
  total_rows: number
  detected_columns: Record<string, string>
  unmapped_columns: string[]
  sample_rows: Record<string, string>[]
}

interface ImportResult {
  data_type: string
  total_rows: number
  imported: number
  skipped: number
  errors: string[]
}

interface AutoDetectResult {
  detected_type: string
  confidence_scores: Record<string, number>
  total_rows: number
  detected_columns: Record<string, string>
  unmapped_columns: string[]
  headers: string[]
}

const DATA_TYPE_CONFIG: Record<DataType, { label: string; icon: typeof Users; description: string; color: string }> = {
  students: {
    label: 'Students',
    icon: Users,
    description: 'Import student records (names, grades, rooms, DOB, enrollment dates)',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  families: {
    label: 'Families',
    icon: Home,
    description: 'Import family/account records (names, tuition amounts, balances)',
    color: 'bg-green-50 border-green-200 text-green-700',
  },
  parents: {
    label: 'Parents / Guardians',
    icon: UserCheck,
    description: 'Import parent/guardian records (names, emails, phones, relationships)',
    color: 'bg-purple-50 border-purple-200 text-purple-700',
  },
  staff: {
    label: 'Staff',
    icon: Briefcase,
    description: 'Import staff/employee records (names, roles, emails, classrooms)',
    color: 'bg-orange-50 border-orange-200 text-orange-700',
  },
}

export function ProCareImport() {
  const [selectedType, setSelectedType] = useState<DataType | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [step, setStep] = useState<'select-type' | 'upload' | 'preview' | 'importing' | 'result'>('select-type')
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [autoDetect, setAutoDetect] = useState<AutoDetectResult | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.txt'))) {
      setFile(droppedFile)
      setError(null)
    } else {
      setError('Please drop a CSV file (.csv or .txt)')
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setError(null)
    }
  }

  const handleAutoDetect = async () => {
    if (!file) return
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch(`${API_URL}/api/import/auto-detect`, {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || 'Auto-detect failed')
      }
      const data: AutoDetectResult = await response.json()
      setAutoDetect(data)
      if (data.detected_type && data.detected_type !== 'unknown') {
        setSelectedType(data.detected_type as DataType)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auto-detect failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreview = async () => {
    if (!file || !selectedType) return
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch(`${API_URL}/api/import/preview?data_type=${selectedType}`, {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || 'Preview failed')
      }
      const data: PreviewResult = await response.json()
      setPreview(data)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async () => {
    if (!file || !selectedType) return
    setStep('importing')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch(`${API_URL}/api/import/${selectedType}`, {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || 'Import failed')
      }
      const data: ImportResult = await response.json()
      setImportResult(data)
      setStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
      setStep('preview')
    }
  }

  const resetAll = () => {
    setSelectedType(null)
    setFile(null)
    setPreview(null)
    setImportResult(null)
    setError(null)
    setAutoDetect(null)
    setStep('select-type')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">ProCare Data Import</h2>
        <p className="text-gray-600 mt-1">
          Import data from ProCare CSV exports into the EPIC CRM. Export your data from ProCare, then upload the CSV files here.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4 text-red-400" />
          </button>
        </div>
      )}

      {/* Step 1: Select data type */}
      {step === 'select-type' && (
        <div className="space-y-4">
          {/* File upload area */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Step 1: Upload CSV File</CardTitle>
              <CardDescription>
                Export your data from ProCare as a CSV file, then upload it here. We'll auto-detect the data type.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : file
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="h-10 w-10 text-green-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setFile(null); setAutoDetect(null); setSelectedType(null) }} className="ml-4">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-700 font-medium">Drop a CSV file here or click to browse</p>
                    <p className="text-sm text-gray-400 mt-1">Supports .csv and .txt files from ProCare exports</p>
                  </label>
                )}
              </div>

              {file && !autoDetect && (
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={handleAutoDetect}
                    disabled={isLoading}
                    className="text-white"
                    style={{ background: 'linear-gradient(to right, #1e3a5f, #dc3545)' }}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Detecting...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Auto-Detect Data Type
                      </>
                    )}
                  </Button>
                </div>
              )}

              {autoDetect && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">
                    Auto-detected: <span className="font-bold capitalize">{autoDetect.detected_type}</span>
                    {' '}({Object.keys(autoDetect.detected_columns).length}/{autoDetect.headers.length} columns matched)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data type selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Step 2: Select Data Type</CardTitle>
              <CardDescription>
                Choose what type of data you're importing. {autoDetect ? 'We auto-detected the type above, but you can change it.' : 'Upload a file first to auto-detect, or select manually.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(Object.entries(DATA_TYPE_CONFIG) as [DataType, typeof DATA_TYPE_CONFIG[DataType]][]).map(([type, config]) => {
                  const Icon = config.icon
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedType === type
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${config.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{config.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{config.description}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Preview button */}
          <div className="flex justify-end gap-3">
            <Button
              onClick={handlePreview}
              disabled={!file || !selectedType || isLoading}
              className="text-white"
              style={{ background: 'linear-gradient(to right, #1e3a5f, #dc3545)' }}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Loading Preview...
                </>
              ) : (
                'Preview Import'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && preview && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Import Preview - {DATA_TYPE_CONFIG[selectedType!]?.label}
              </CardTitle>
              <CardDescription>
                {preview.total_rows} rows detected. Review the column mapping and sample data below before importing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Column mapping */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Detected Column Mappings</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(preview.detected_columns).map(([csvCol, mappedField]) => (
                    <div key={csvCol} className="flex items-center gap-2 text-sm bg-green-50 border border-green-200 rounded px-3 py-1.5">
                      <span className="text-gray-700">{csvCol}</span>
                      <span className="text-gray-400">&rarr;</span>
                      <span className="font-medium text-green-700">{mappedField}</span>
                    </div>
                  ))}
                </div>
              </div>

              {preview.unmapped_columns.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Unmapped Columns (will be skipped)</h4>
                  <div className="flex flex-wrap gap-2">
                    {preview.unmapped_columns.map((col) => (
                      <span key={col} className="text-sm bg-yellow-50 border border-yellow-200 text-yellow-700 rounded px-2 py-1">
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sample data table */}
              {preview.sample_rows.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Sample Data (first {preview.sample_rows.length} rows)</h4>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(preview.sample_rows[0]).map((key) => (
                            <th key={key} className="px-3 py-2 text-left font-medium text-gray-600 border-b whitespace-nowrap">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.sample_rows.map((row, i) => (
                          <tr key={i} className="border-b last:border-b-0">
                            {Object.values(row).map((val, j) => (
                              <td key={j} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                                {val || <span className="text-gray-300">-</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => { setStep('select-type'); setPreview(null) }}>
              Back
            </Button>
            <Button
              onClick={handleImport}
              className="text-white"
              style={{ background: 'linear-gradient(to right, #1e3a5f, #dc3545)' }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import {preview.total_rows} {DATA_TYPE_CONFIG[selectedType!]?.label}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Importing */}
      {step === 'importing' && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">Importing data...</p>
            <p className="text-gray-500 mt-1">This may take a moment for large files.</p>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Results */}
      {step === 'result' && importResult && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className={`p-4 rounded-lg mb-6 ${
                importResult.errors.length === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-center gap-2">
                  {importResult.errors.length === 0 ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                  )}
                  <h3 className={`font-semibold ${
                    importResult.errors.length === 0 ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {importResult.errors.length === 0
                      ? 'Import Successful!'
                      : 'Import Complete with Warnings'}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">{importResult.total_rows}</p>
                  <p className="text-sm text-gray-600">Total Rows</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">{importResult.imported}</p>
                  <p className="text-sm text-gray-600">Imported</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-3xl font-bold text-yellow-600">{importResult.skipped}</p>
                  <p className="text-sm text-gray-600">Skipped</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Issues ({importResult.errors.length})</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                    <ul className="text-sm text-red-700 space-y-1">
                      {importResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={resetAll}>
              Import More Data
            </Button>
          </div>
        </div>
      )}

      {/* Help section */}
      <Card className="bg-gray-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-700">How to Export from ProCare</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Log into your ProCare account</li>
            <li>Navigate to <strong>Reports</strong> &rarr; <strong>Custom Reports</strong> or <strong>Child Reports</strong></li>
            <li>Select the data you want to export (children, families, staff, etc.)</li>
            <li>Click <strong>Export</strong> and choose <strong>CSV</strong> format</li>
            <li>Upload the downloaded CSV file here</li>
          </ol>
          <p className="text-xs text-gray-400 mt-3">
            Supported ProCare column formats are auto-detected. Column names like "First Name", "firstname", "Child First Name" etc. are all recognized.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
