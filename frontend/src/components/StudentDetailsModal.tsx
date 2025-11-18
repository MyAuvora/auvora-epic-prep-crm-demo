import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Student {
  student_id: string;
  first_name: string;
  last_name: string;
  grade: string;
  session: string;
  room: string;
  family_id: string;
  attendance_present_count: number;
  attendance_absent_count: number;
  attendance_tardy_count: number;
  overall_grade_flag: string;
  ixl_status_flag: string;
  overall_risk_flag: string;
}

interface Grade {
  subject: string;
  grade_value: string;
}

interface IXLSummary {
  weekly_hours: number;
  skills_practiced_this_week: number;
  skills_mastered_total: number;
  math_proficiency: string;
  ela_proficiency: string;
  recent_skills: string[];
  last_active_date: string;
}

interface StudentDetailsModalProps {
  studentId: string;
  onClose: () => void;
}

export function StudentDetailsModal({ studentId, onClose }: StudentDetailsModalProps) {
  const [student, setStudent] = useState<Student | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [ixl, setIxl] = useState<IXLSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        
        const [studentRes, gradesRes, ixlRes] = await Promise.all([
          fetch(`${apiUrl}/api/students/${studentId}`),
          fetch(`${apiUrl}/api/grades/${studentId}`),
          fetch(`${apiUrl}/api/ixl/${studentId}`)
        ]);

        const studentData = await studentRes.json();
        const gradesData = await gradesRes.json();
        const ixlData = await ixlRes.json();

        setStudent(studentData);
        setGrades(gradesData);
        setIxl(ixlData);
      } catch (error) {
        console.error('Error fetching student details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <CardContent className="p-8 text-center">
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!student) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-amber-600 to-amber-700 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">
              {student.first_name} {student.last_name}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-amber-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Grade</p>
              <p className="text-lg font-semibold">{student.grade}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Session</p>
              <p className="text-lg font-semibold">{student.session}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Room</p>
              <p className="text-lg font-semibold">{student.room}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Risk Status</p>
              <p className={`text-lg font-semibold ${
                student.overall_risk_flag === 'At risk' ? 'text-red-600' :
                student.overall_risk_flag === 'Watch' ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {student.overall_risk_flag}
              </p>
            </div>
          </div>

          {/* Attendance */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Attendance</h3>
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Present</p>
                  <p className="text-2xl font-bold text-green-600">{student.attendance_present_count}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Absent</p>
                  <p className="text-2xl font-bold text-red-600">{student.attendance_absent_count}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Tardy</p>
                  <p className="text-2xl font-bold text-yellow-600">{student.attendance_tardy_count}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Grades */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Current Grades</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {grades.map((grade, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">{grade.subject}</p>
                    <p className="text-3xl font-bold text-amber-600">{grade.grade_value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-3">
              <p className="text-sm text-gray-600">Overall Status</p>
              <p className={`text-lg font-semibold ${
                student.overall_grade_flag === 'Failing' ? 'text-red-600' :
                student.overall_grade_flag === 'Needs attention' ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {student.overall_grade_flag}
              </p>
            </div>
          </div>

          {/* IXL Progress */}
          {ixl && (
            <div>
              <h3 className="text-lg font-semibold mb-3">IXL Progress</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">Weekly Hours</p>
                    <p className="text-2xl font-bold text-amber-600">{ixl.weekly_hours}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">Skills Practiced</p>
                    <p className="text-2xl font-bold text-blue-600">{ixl.skills_practiced_this_week}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">Total Mastered</p>
                    <p className="text-2xl font-bold text-green-600">{ixl.skills_mastered_total}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">Last Active</p>
                    <p className="text-sm font-semibold">{new Date(ixl.last_active_date).toLocaleDateString()}</p>
                  </CardContent>
                </Card>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Math Proficiency</p>
                  <p className={`font-semibold ${
                    ixl.math_proficiency === 'Needs attention' ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {ixl.math_proficiency}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ELA Proficiency</p>
                  <p className={`font-semibold ${
                    ixl.ela_proficiency === 'Needs attention' ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {ixl.ela_proficiency}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Recent Skills</p>
                <div className="flex flex-wrap gap-2">
                  {ixl.recent_skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
