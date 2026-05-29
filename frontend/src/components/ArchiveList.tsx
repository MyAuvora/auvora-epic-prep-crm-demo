import { useState, useEffect } from 'react';
import { Archive, RotateCcw, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ArchivedStudent {
  student_id: string;
  first_name: string;
  last_name: string;
  grade: string;
  session: string;
  family_id: string;
  status: string;
}

interface ArchivedFamily {
  family_id: string;
  family_name: string;
  student_ids: string[];
  monthly_tuition_amount: number;
  current_balance: number;
  archived: boolean;
}

interface ArchiveListProps {
  onStudentClick?: (studentId: string) => void;
  onFamilyClick?: (familyId: string) => void;
}

export function ArchiveList({ onStudentClick, onFamilyClick }: ArchiveListProps) {
  const [archivedStudents, setArchivedStudents] = useState<ArchivedStudent[]>([]);
  const [archivedFamilies, setArchivedFamilies] = useState<ArchivedFamily[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'families' | 'students'>('families');

  const fetchArchived = async () => {
    setLoading(true);
    try {
      const [studentsRes, familiesRes] = await Promise.all([
        fetch(`${API_URL}/api/students?include_archived=true`),
        fetch(`${API_URL}/api/families?include_archived=true`)
      ]);
      const allStudents = await studentsRes.json();
      const allFamilies = await familiesRes.json();
      setArchivedStudents(allStudents.filter((s: ArchivedStudent) => s.status === 'Archived'));
      setArchivedFamilies(allFamilies.filter((f: ArchivedFamily) => f.archived));
    } catch (error) {
      console.error('Error fetching archived data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchived();
  }, []);

  const handleRestoreStudent = async (studentId: string) => {
    await fetch(`${API_URL}/api/students/${studentId}/restore`, { method: 'PUT' });
    fetchArchived();
  };

  const handleRestoreFamily = async (familyId: string) => {
    await fetch(`${API_URL}/api/families/${familyId}/restore`, { method: 'PUT' });
    fetchArchived();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading archived accounts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Archive className="h-7 w-7 text-gray-600" />
          <h2 className="text-3xl font-bold text-gray-900">Archive</h2>
        </div>
        <div className="text-sm text-gray-500">
          {archivedFamilies.length} families • {archivedStudents.length} students archived
        </div>
      </div>

      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setTab('families')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'families'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="inline h-4 w-4 mr-1" />
          Families ({archivedFamilies.length})
        </button>
        <button
          onClick={() => setTab('students')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'students'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <User className="inline h-4 w-4 mr-1" />
          Students ({archivedStudents.length})
        </button>
      </div>

      {tab === 'families' && (
        <div className="space-y-3">
          {archivedFamilies.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <Archive className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No archived families</p>
              </CardContent>
            </Card>
          ) : (
            archivedFamilies.map((family) => (
              <Card key={family.family_id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4 flex items-center justify-between">
                  <div
                    className="flex items-center space-x-4 cursor-pointer flex-1"
                    onClick={() => onFamilyClick?.(family.family_id)}
                  >
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <Users className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{family.family_name}</p>
                      <p className="text-sm text-gray-500">
                        {family.student_ids.length} student{family.student_ids.length !== 1 ? 's' : ''} •
                        Balance: ${family.current_balance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestoreFamily(family.family_id)}
                    className="text-green-600 border-green-300 hover:bg-green-50"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Restore
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === 'students' && (
        <div className="space-y-3">
          {archivedStudents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <Archive className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No archived students</p>
              </CardContent>
            </Card>
          ) : (
            archivedStudents.map((student) => (
              <Card key={student.student_id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4 flex items-center justify-between">
                  <div
                    className="flex items-center space-x-4 cursor-pointer flex-1"
                    onClick={() => onStudentClick?.(student.student_id)}
                  >
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{student.first_name} {student.last_name}</p>
                      <p className="text-sm text-gray-500">
                        Grade {student.grade} • {student.session}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestoreStudent(student.student_id)}
                    className="text-green-600 border-green-300 hover:bg-green-50"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Restore
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
