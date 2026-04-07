import React, { useState, useEffect } from 'react';
import { Heart, Phone, User, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface HealthRecord {
  health_record_id: string;
  student_id: string;
  allergies: string[];
  medications: string[];
  medical_conditions: string[];
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  physician_name: string | null;
  physician_phone: string | null;
  last_updated: string;
}

interface Student {
  student_id: string;
  first_name: string;
  last_name: string;
  grade: string;
}

interface HealthRecordsProps {
  role: 'owner' | 'admin' | 'coach' | 'parent';
  studentId?: string;
  userId?: string;
}

export const HealthRecords: React.FC<HealthRecordsProps> = ({ role, studentId, userId: _userId }) => {
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthRecords();
    if (role !== 'parent') {
      fetchStudents();
    }
  }, [studentId]);

  const fetchHealthRecords = async () => {
    try {
      const url = studentId 
        ? `${API_URL}/api/health-records?student_id=${studentId}`
        : `${API_URL}/api/health-records`;
      const response = await fetch(url);
      const data = await response.json();
      setHealthRecords(data);
    } catch (error) {
      console.error('Error fetching health records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/students`);
      if (!response.ok) {
        console.error('Failed to fetch students:', response.status);
        setStudents([]);
        return;
      }
      const data = await response.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.student_id === studentId);
    return student ? `${student.first_name} ${student.last_name}` : 'Unknown Student';
  };

  const getStudentGrade = (studentId: string) => {
    const student = students.find(s => s.student_id === studentId);
    return student ? student.grade : '';
  };

  const hasAllergies = (record: HealthRecord) => {
    return record.allergies.length > 0 && !record.allergies.includes('None');
  };

  const hasMedications = (record: HealthRecord) => {
    return record.medications.length > 0 && !record.medications.includes('None');
  };

  const hasMedicalConditions = (record: HealthRecord) => {
    return record.medical_conditions.length > 0 && !record.medical_conditions.includes('None');
  };

  const hasAlerts = (record: HealthRecord) => {
    return hasAllergies(record) || hasMedications(record) || hasMedicalConditions(record);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const recordsWithAlerts = healthRecords.filter(hasAlerts);
  const recordsWithoutAlerts = healthRecords.filter(r => !hasAlerts(r));

  if (loading) {
    return <div className="text-center py-8">Loading health records...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Health Records</h2>
        {(role === 'owner' || role === 'admin') && (
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-red-50 text-red-800">
              {recordsWithAlerts.length} With Alerts
            </Badge>
            <Badge variant="outline">
              {healthRecords.length} Total
            </Badge>
          </div>
        )}
      </div>

      {recordsWithAlerts.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4 text-red-600">Students with Medical Alerts</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recordsWithAlerts.map((record) => (
              <Card 
                key={record.health_record_id} 
                className="hover:shadow-lg transition-shadow cursor-pointer border-red-200"
                onClick={() => setSelectedRecord(record)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      {role === 'parent' ? 'Health Information' : getStudentName(record.student_id)}
                    </CardTitle>
                    {role !== 'parent' && (
                      <Badge variant="outline">{getStudentGrade(record.student_id)}</Badge>
                    )}
                  </div>
                  <CardDescription>Last updated: {formatDate(record.last_updated)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {hasAllergies(record) && (
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-red-700">Allergies:</p>
                          <p className="text-gray-700">{record.allergies.filter(a => a !== 'None').join(', ')}</p>
                        </div>
                      </div>
                    )}
                    {hasMedications(record) && (
                      <div className="flex items-start gap-2">
                        <Heart className="w-4 h-4 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-700">Medications:</p>
                          <p className="text-gray-700">{record.medications.filter(m => m !== 'None').join(', ')}</p>
                        </div>
                      </div>
                    )}
                    {hasMedicalConditions(record) && (
                      <div className="flex items-start gap-2">
                        <Heart className="w-4 h-4 text-purple-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-purple-700">Conditions:</p>
                          <p className="text-gray-700">{record.medical_conditions.filter(c => c !== 'None').join(', ')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {recordsWithoutAlerts.length > 0 && role !== 'parent' && (
        <div>
          <h3 className="text-xl font-semibold mb-4">All Health Records</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recordsWithoutAlerts.map((record) => (
              <Card 
                key={record.health_record_id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedRecord(record)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">{getStudentName(record.student_id)}</CardTitle>
                    <Badge variant="outline">{getStudentGrade(record.student_id)}</Badge>
                  </div>
                  <CardDescription>Last updated: {formatDate(record.last_updated)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Heart className="w-4 h-4" />
                    <span>No medical alerts</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {healthRecords.length === 0 && (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">No health records available</p>
        </div>
      )}

      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-xl max-h-[80vh] overflow-y-auto p-4">
          {selectedRecord && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start mb-2">
                  <DialogTitle className="text-2xl flex items-center gap-2">
                    <Heart className="w-6 h-6 text-red-500" />
                    {role === 'parent' ? 'Health Information' : getStudentName(selectedRecord.student_id)}
                  </DialogTitle>
                  {hasAlerts(selectedRecord) && (
                    <Badge className="bg-red-100 text-red-800">Medical Alerts</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">Last updated: {formatDate(selectedRecord.last_updated)}</p>
              </DialogHeader>
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${hasAllergies(selectedRecord) ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className={`w-5 h-5 ${hasAllergies(selectedRecord) ? 'text-red-600' : 'text-gray-500'}`} />
                    <p className="font-medium">Allergies</p>
                  </div>
                  <p className={hasAllergies(selectedRecord) ? 'text-red-700' : 'text-gray-600'}>
                    {selectedRecord.allergies.join(', ')}
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${hasMedications(selectedRecord) ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className={`w-5 h-5 ${hasMedications(selectedRecord) ? 'text-blue-600' : 'text-gray-500'}`} />
                    <p className="font-medium">Medications</p>
                  </div>
                  <p className={hasMedications(selectedRecord) ? 'text-blue-700' : 'text-gray-600'}>
                    {selectedRecord.medications.join(', ')}
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${hasMedicalConditions(selectedRecord) ? 'bg-purple-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className={`w-5 h-5 ${hasMedicalConditions(selectedRecord) ? 'text-purple-600' : 'text-gray-500'}`} />
                    <p className="font-medium">Medical Conditions</p>
                  </div>
                  <p className={hasMedicalConditions(selectedRecord) ? 'text-purple-700' : 'text-gray-600'}>
                    {selectedRecord.medical_conditions.join(', ')}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium mb-3">Emergency Contact</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">
                        {selectedRecord.emergency_contact_name} ({selectedRecord.emergency_contact_relationship})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{selectedRecord.emergency_contact_phone}</span>
                    </div>
                  </div>
                </div>

                {selectedRecord.physician_name && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium mb-3">Physician Information</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{selectedRecord.physician_name}</span>
                      </div>
                      {selectedRecord.physician_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{selectedRecord.physician_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
