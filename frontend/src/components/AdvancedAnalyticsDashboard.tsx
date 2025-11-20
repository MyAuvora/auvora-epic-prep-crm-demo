import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { AlertTriangle, TrendingUp, Users, Target } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface AtRiskAssessment {
  assessment_id: string
  student_id: string
  campus_id: string
  assessment_date: string
  attendance_score: number
  academic_score: number
  behavior_score: number
  engagement_score: number
  overall_risk_score: number
  overall_risk_level: string
  risk_factors: string[]
  recommended_interventions: string[]
  notes: string
}

interface RetentionPrediction {
  prediction_id: string
  student_id: string
  campus_id: string
  retention_probability: number
  risk_level: string
  key_factors: string[]
  recommended_actions: string[]
  last_updated: string
}

interface EnrollmentForecast {
  forecast_id: string
  campus_id: string
  grade_level: string
  school_year: string
  current_enrollment: number
  projected_enrollment: number
  confidence_interval_low: number
  confidence_interval_high: number
  factors: string[]
  last_updated: string
}

interface AnalyticsSummary {
  at_risk_summary: {
    critical: number
    high: number
    medium: number
    low: number
    total: number
  }
  retention_summary: {
    average_probability: number
    total_predictions: number
  }
  intervention_summary: {
    active: number
    total: number
  }
  iep_504_summary: {
    active: number
    total: number
  }
}

export function AdvancedAnalyticsDashboard() {
  const [atRiskAssessments, setAtRiskAssessments] = useState<AtRiskAssessment[]>([])
  const [retentionPredictions, setRetentionPredictions] = useState<RetentionPrediction[]>([])
  const [enrollmentForecasts, setEnrollmentForecasts] = useState<EnrollmentForecast[]>([])
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedView, setSelectedView] = useState<'at-risk' | 'retention' | 'enrollment'>('at-risk')

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    try {
      const [atRiskRes, retentionRes, enrollmentRes, summaryRes] = await Promise.all([
        fetch(`${API_URL}/api/analytics/at-risk-assessments`),
        fetch(`${API_URL}/api/analytics/retention-predictions`),
        fetch(`${API_URL}/api/analytics/enrollment-forecasts`),
        fetch(`${API_URL}/api/analytics/dashboard`)
      ])

      const atRiskData = atRiskRes.ok ? await atRiskRes.json() : []
      const retentionData = retentionRes.ok ? await retentionRes.json() : []
      const enrollmentData = enrollmentRes.ok ? await enrollmentRes.json() : []
      const summaryData = summaryRes.ok ? await summaryRes.json() : null

      setAtRiskAssessments(Array.isArray(atRiskData) ? atRiskData : [])
      setRetentionPredictions(Array.isArray(retentionData) ? retentionData : [])
      setEnrollmentForecasts(Array.isArray(enrollmentData) ? enrollmentData : [])
      setSummary(summaryData)
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      setAtRiskAssessments([])
      setRetentionPredictions([])
      setEnrollmentForecasts([])
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'bg-red-100 text-red-800'
      case 'High': return 'bg-orange-100 text-orange-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const prepareRiskDistributionData = () => {
    if (!summary) return []
    return [
      { name: 'Critical', value: summary.at_risk_summary.critical, color: '#ef4444' },
      { name: 'High', value: summary.at_risk_summary.high, color: '#f97316' },
      { name: 'Medium', value: summary.at_risk_summary.medium, color: '#eab308' },
      { name: 'Low', value: summary.at_risk_summary.low, color: '#22c55e' }
    ]
  }

  const prepareRetentionData = () => {
    const grouped = (retentionPredictions ?? []).reduce((acc, pred) => {
      const range = Math.floor(pred.retention_probability / 10) * 10
      const key = `${range}-${range + 10}%`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(grouped).map(([range, count]) => ({
      range,
      count
    }))
  }

  const prepareEnrollmentData = () => {
    return (enrollmentForecasts ?? []).map(forecast => ({
      grade: forecast.grade_level,
      current: forecast.current_enrollment,
      projected: forecast.projected_enrollment
    }))
  }

  if (loading) {
    return <div className="p-6">Loading analytics...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-gray-600">Predictive insights and risk assessment</p>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">At-Risk Students</p>
                  <p className="text-2xl font-bold">{summary.at_risk_summary.total}</p>
                  <p className="text-xs text-red-600">{summary.at_risk_summary.critical} Critical</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Retention</p>
                  <p className="text-2xl font-bold">{summary.retention_summary.average_probability}%</p>
                  <p className="text-xs text-gray-600">{summary.retention_summary.total_predictions} predictions</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Interventions</p>
                  <p className="text-2xl font-bold">{summary.intervention_summary.active}</p>
                  <p className="text-xs text-gray-600">of {summary.intervention_summary.total} total</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active IEP/504</p>
                  <p className="text-2xl font-bold">{summary.iep_504_summary.active}</p>
                  <p className="text-xs text-gray-600">of {summary.iep_504_summary.total} total</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setSelectedView('at-risk')}
          className={`px-4 py-2 rounded-md ${selectedView === 'at-risk' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          At-Risk Analysis
        </button>
        <button
          onClick={() => setSelectedView('retention')}
          className={`px-4 py-2 rounded-md ${selectedView === 'retention' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Retention Predictions
        </button>
        <button
          onClick={() => setSelectedView('enrollment')}
          className={`px-4 py-2 rounded-md ${selectedView === 'enrollment' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Enrollment Forecasts
        </button>
      </div>

      {selectedView === 'at-risk' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Level Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={prepareRiskDistributionData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {prepareRiskDistributionData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>At-Risk Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(atRiskAssessments ?? [])
                  .sort((a, b) => b.overall_risk_score - a.overall_risk_score)
                  .map(assessment => (
                    <div key={assessment.assessment_id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">Student ID: {assessment.student_id}</p>
                          <p className="text-sm text-gray-600">
                            Score: {assessment.overall_risk_score}/100
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(assessment.overall_risk_level)}`}>
                          {assessment.overall_risk_level}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                        <div>Attendance: {assessment.attendance_score}</div>
                        <div>Academic: {assessment.academic_score}</div>
                        <div>Behavior: {assessment.behavior_score}</div>
                        <div>Engagement: {assessment.engagement_score}</div>
                      </div>
                      {(assessment.risk_factors?.length ?? 0) > 0 && (
                        <div className="text-xs text-gray-600">
                          <p className="font-medium">Risk Factors:</p>
                          <ul className="list-disc list-inside">
                            {(assessment.risk_factors ?? []).slice(0, 2).map((factor, idx) => (
                              <li key={idx}>{factor}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedView === 'retention' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Retention Probability Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prepareRetentionData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Retention Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(retentionPredictions ?? [])
                  .sort((a, b) => a.retention_probability - b.retention_probability)
                  .map(prediction => (
                    <div key={prediction.prediction_id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">Student ID: {prediction.student_id}</p>
                          <p className="text-sm text-gray-600">
                            Retention: {prediction.retention_probability}%
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(prediction.risk_level)}`}>
                          {prediction.risk_level}
                        </span>
                      </div>
                      {(prediction.key_factors?.length ?? 0) > 0 && (
                        <div className="text-xs text-gray-600 mb-2">
                          <p className="font-medium">Key Factors:</p>
                          <ul className="list-disc list-inside">
                            {(prediction.key_factors ?? []).slice(0, 2).map((factor, idx) => (
                              <li key={idx}>{factor}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(prediction.recommended_actions?.length ?? 0) > 0 && (
                        <div className="text-xs text-blue-600">
                          <p className="font-medium">Recommended:</p>
                          <p>{prediction.recommended_actions[0]}</p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedView === 'enrollment' && (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Forecasts by Grade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prepareEnrollmentData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="grade" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="current" fill="#3b82f6" name="Current Enrollment" />
                    <Bar dataKey="projected" fill="#10b981" name="Projected Enrollment" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Forecast Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(enrollmentForecasts ?? []).length > 0 ? (
                  (enrollmentForecasts ?? []).map(forecast => (
                  <div key={forecast.forecast_id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{forecast.grade_level}</p>
                        <p className="text-sm text-gray-600">{forecast.school_year}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{forecast.projected_enrollment}</p>
                        <p className="text-xs text-gray-600">
                          Current: {forecast.current_enrollment}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      <p>Confidence: {forecast.confidence_interval_low} - {forecast.confidence_interval_high}</p>
                      {(forecast.factors?.length ?? 0) > 0 && (
                        <p className="mt-1">Factors: {forecast.factors.join(', ')}</p>
                      )}
                    </div>
                  </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No enrollment forecasts available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
