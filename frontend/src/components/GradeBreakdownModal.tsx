import React, { useState, useEffect } from 'react';
import { GraduationCap, FileText, BookOpen, Beaker } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Assignment {
  assignment_id: string;
  student_id: string;
  subject: string;
  assignment_type: string;
  title: string;
  grade: string;
  points_earned: number;
  points_possible: number;
  date_assigned: string;
  date_submitted: string;
}

interface GradeBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  subject: string;
  overallGrade: string;
}

export const GradeBreakdownModal: React.FC<GradeBreakdownModalProps> = ({
  isOpen,
  onClose,
  studentId,
  subject,
  overallGrade
}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && studentId && subject) {
      fetchAssignments();
    }
  }, [isOpen, studentId, subject]);

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/grade-assignments?student_id=${studentId}&subject=${subject}`);
      const data = await response.json();
      setAssignments(data.sort((a: Assignment, b: Assignment) => 
        new Date(b.date_submitted).getTime() - new Date(a.date_submitted).getTime()
      ));
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Test':
        return <FileText className="w-4 h-4" />;
      case 'Project':
        return <Beaker className="w-4 h-4" />;
      case 'Homework':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <GraduationCap className="w-4 h-4" />;
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade === 'A' || grade === 'A+' || grade === 'A-') return 'text-green-600';
    if (grade === 'B' || grade === 'B+' || grade === 'B-') return 'text-blue-600';
    if (grade === 'C' || grade === 'C+' || grade === 'C-') return 'text-yellow-600';
    if (grade === 'D' || grade === 'D+' || grade === 'D-') return 'text-orange-600';
    return 'text-red-600';
  };

  const getTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Test': 'bg-red-100 text-red-800',
      'Project': 'bg-purple-100 text-purple-800',
      'Homework': 'bg-blue-100 text-blue-800',
      'Quiz': 'bg-yellow-100 text-yellow-800',
      'Classwork': 'bg-green-100 text-green-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const groupedAssignments = {
    tests: assignments.filter(a => a.assignment_type === 'Test'),
    projects: assignments.filter(a => a.assignment_type === 'Project'),
    homework: assignments.filter(a => a.assignment_type === 'Homework'),
    quizzes: assignments.filter(a => a.assignment_type === 'Quiz'),
    classwork: assignments.filter(a => a.assignment_type === 'Classwork')
  };

  const calculateAverage = (items: Assignment[]) => {
    if (items.length === 0) return 'N/A';
    const total = items.reduce((sum, item) => sum + (item.points_earned / item.points_possible) * 100, 0);
    return (total / items.length).toFixed(1) + '%';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <GraduationCap className="w-6 h-6" />
            {subject} Grade Breakdown
          </DialogTitle>
          <DialogDescription>
            Overall Grade: <span className={`font-bold text-lg ${getGradeColor(overallGrade)}`}>{overallGrade}</span>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">Loading assignments...</div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{calculateAverage(groupedAssignments.tests)}</div>
                  <p className="text-xs text-gray-500">{groupedAssignments.tests.length} tests</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{calculateAverage(groupedAssignments.projects)}</div>
                  <p className="text-xs text-gray-500">{groupedAssignments.projects.length} projects</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Homework</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{calculateAverage(groupedAssignments.homework)}</div>
                  <p className="text-xs text-gray-500">{groupedAssignments.homework.length} assignments</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Quizzes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{calculateAverage(groupedAssignments.quizzes)}</div>
                  <p className="text-xs text-gray-500">{groupedAssignments.quizzes.length} quizzes</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Classwork</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{calculateAverage(groupedAssignments.classwork)}</div>
                  <p className="text-xs text-gray-500">{groupedAssignments.classwork.length} items</p>
                </CardContent>
              </Card>
            </div>

            {/* All Assignments List */}
            <div>
              <h3 className="text-lg font-semibold mb-4">All Assignments</h3>
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.assignment_id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full">
                        {getTypeIcon(assignment.assignment_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{assignment.title}</p>
                          <Badge className={getTypeBadgeColor(assignment.assignment_type)}>
                            {assignment.assignment_type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          Submitted: {formatDate(assignment.date_submitted)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getGradeColor(assignment.grade)}`}>
                        {assignment.grade}
                      </div>
                      <p className="text-sm text-gray-500">
                        {assignment.points_earned}/{assignment.points_possible} pts
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {assignments.length === 0 && (
              <div className="text-center py-8">
                <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No assignments found for this subject</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
