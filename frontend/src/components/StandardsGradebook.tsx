import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, TrendingUp, Award, CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface AcademicStandard {
  standard_id: string;
  subject: string;
  grade: string;
  code: string;
  description: string;
  category: string;
}

interface StandardAssessment {
  assessment_id: string;
  student_id: string;
  standard_id: string;
  mastery_level: string;
  assessment_date: string;
  notes: string;
  teacher_id: string;
}

interface ProgressReport {
  report_id: string;
  student_id: string;
  term: string;
  generated_date: string;
  standards_assessed: number;
  proficient_count: number;
  developing_count: number;
  beginning_count: number;
  overall_progress: string;
}

interface StandardsGradebookProps {
  selectedCampusId: string | null;
}

export default function StandardsGradebook({ selectedCampusId: _selectedCampusId }: StandardsGradebookProps) {
  const [standards, setStandards] = useState<AcademicStandard[]>([]);
  const [assessments, setAssessments] = useState<StandardAssessment[]>([]);
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStandards();
    fetchAssessments();
    fetchReports();
  }, [selectedSubject, selectedGrade]);

  const fetchStandards = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedSubject !== 'all') params.append('subject', selectedSubject);
      if (selectedGrade !== 'all') params.append('grade', selectedGrade);
      
      const url = `${API_URL}/api/academics/standards${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      setStandards(data);
    } catch (error) {
      console.error('Error fetching standards:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/academics/assessments`);
      const data = await response.json();
      setAssessments(data.slice(0, 50));
    } catch (error) {
      console.error('Error fetching assessments:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await fetch(`${API_URL}/api/academics/progress-reports`);
      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const getMasteryColor = (level: string) => {
    const colors: Record<string, string> = {
      'Not Assessed': 'bg-gray-100 text-gray-800',
      'Beginning': 'bg-red-100 text-red-800',
      'Developing': 'bg-yellow-100 text-yellow-800',
      'Proficient': 'bg-green-100 text-green-800',
      'Advanced': 'bg-blue-100 text-blue-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const getProgressColor = (progress: string) => {
    const colors: Record<string, string> = {
      'Excelling': 'bg-blue-100 text-blue-800',
      'On Track': 'bg-green-100 text-green-800',
      'Needs Support': 'bg-yellow-100 text-yellow-800'
    };
    return colors[progress] || 'bg-gray-100 text-gray-800';
  };

  const subjects = ['Math', 'ELA', 'Science'];
  const grades = ['K', '1', '2', '3', '4', '5'];

  if (loading) {
    return <div className="p-6">Loading standards-based gradebook...</div>;
  }

  const proficientCount = reports.reduce((sum, r) => sum + r.proficient_count, 0);
  const totalAssessed = reports.reduce((sum, r) => sum + r.standards_assessed, 0);
  const proficiencyRate = totalAssessed > 0 ? Math.round((proficientCount / totalAssessed) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Standards-Based Gradebook</h2>
          <p className="text-gray-500">Track student mastery of academic standards</p>
        </div>
        <Button>Record Assessment</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Standards</CardTitle>
            <BookOpen className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{standards.length}</div>
            <p className="text-xs text-gray-500">Academic standards</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proficiency Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proficiencyRate}%</div>
            <p className="text-xs text-gray-500">Students proficient</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress Reports</CardTitle>
            <Award className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
            <p className="text-xs text-gray-500">Generated reports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Assessments</CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessments.length}</div>
            <p className="text-xs text-gray-500">This term</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="standards" className="space-y-4">
        <TabsList>
          <TabsTrigger value="standards">Academic Standards</TabsTrigger>
          <TabsTrigger value="assessments">Recent Assessments</TabsTrigger>
          <TabsTrigger value="reports">Progress Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="standards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Academic Standards</CardTitle>
              <CardDescription>Browse standards by subject and grade level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex gap-2">
                  <Button
                    variant={selectedSubject === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSubject('all')}
                  >
                    All Subjects
                  </Button>
                  {subjects.map(subject => (
                    <Button
                      key={subject}
                      variant={selectedSubject === subject ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedSubject(subject)}
                    >
                      {subject}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={selectedGrade === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedGrade('all')}
                  >
                    All Grades
                  </Button>
                  {grades.map(grade => (
                    <Button
                      key={grade}
                      variant={selectedGrade === grade ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedGrade(grade)}
                    >
                      Grade {grade}
                    </Button>
                  ))}
                </div>
              </div>

              {standards.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No standards found for selected filters
                </div>
              ) : (
                <div className="space-y-3">
                  {standards.map(standard => (
                    <Card key={standard.standard_id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">{standard.code}</Badge>
                              <Badge>{standard.subject}</Badge>
                              <Badge variant="secondary">Grade {standard.grade}</Badge>
                            </div>
                            
                            <div className="text-sm font-medium text-gray-700">
                              {standard.category}
                            </div>

                            <p className="text-sm text-gray-600">{standard.description}</p>
                          </div>

                          <Button variant="outline" size="sm">Assess Students</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Assessments</CardTitle>
              <CardDescription>Latest student assessments on academic standards</CardDescription>
            </CardHeader>
            <CardContent>
              {assessments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No assessments found
                </div>
              ) : (
                <div className="space-y-3">
                  {assessments.map(assessment => {
                    const standard = standards.find(s => s.standard_id === assessment.standard_id);
                    return (
                      <Card key={assessment.assessment_id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-3">
                                <Badge className={getMasteryColor(assessment.mastery_level)}>
                                  {assessment.mastery_level}
                                </Badge>
                                {standard && (
                                  <>
                                    <Badge variant="outline">{standard.code}</Badge>
                                    <Badge>{standard.subject}</Badge>
                                  </>
                                )}
                              </div>
                              
                              {standard && (
                                <div className="text-sm font-medium text-gray-700">
                                  {standard.description}
                                </div>
                              )}

                              <div className="text-sm text-gray-600">
                                Assessed: {new Date(assessment.assessment_date).toLocaleDateString()}
                              </div>

                              {assessment.notes && (
                                <p className="text-sm text-gray-600 italic">{assessment.notes}</p>
                              )}
                            </div>

                            <Button variant="outline" size="sm">View Details</Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progress Reports</CardTitle>
              <CardDescription>Student progress reports for current term</CardDescription>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No progress reports found
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map(report => (
                    <Card key={report.report_id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg">Student {report.student_id}</h3>
                              <Badge className={getProgressColor(report.overall_progress)}>
                                {report.overall_progress}
                              </Badge>
                              <Badge variant="outline">{report.term}</Badge>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <div className="text-gray-500">Standards Assessed</div>
                                <div className="font-semibold">{report.standards_assessed}</div>
                              </div>
                              <div>
                                <div className="text-gray-500">Proficient</div>
                                <div className="font-semibold text-green-600">{report.proficient_count}</div>
                              </div>
                              <div>
                                <div className="text-gray-500">Developing</div>
                                <div className="font-semibold text-yellow-600">{report.developing_count}</div>
                              </div>
                              <div>
                                <div className="text-gray-500">Beginning</div>
                                <div className="font-semibold text-red-600">{report.beginning_count}</div>
                              </div>
                            </div>

                            <div className="text-sm text-gray-600">
                              Generated: {new Date(report.generated_date).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">View Full Report</Button>
                            <Button size="sm">Download PDF</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
