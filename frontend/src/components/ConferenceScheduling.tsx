import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Conference {
  conference_id: string;
  student_id: string;
  parent_id: string;
  staff_id: string;
  date_time: string;
  location: string;
  status: string;
  notes: string;
}

interface Staff {
  staff_id: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface Student {
  student_id: string;
  first_name: string;
  last_name: string;
  grade: string;
}

interface ConferenceSchedulingProps {
  parentId: string;
  students: Student[];
}

export function ConferenceScheduling({ parentId, students }: ConferenceSchedulingProps) {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('In-person');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        
        const [conferencesRes, staffRes] = await Promise.all([
          fetch(`${apiUrl}/api/conferences?parent_id=${parentId}`),
          fetch(`${apiUrl}/api/staff`)
        ]);

        const conferencesData = await conferencesRes.json();
        const staffData = await staffRes.json();

        setConferences(conferencesData);
        setStaff(staffData.filter((s: Staff) => s.role === 'Teacher'));
      } catch (error) {
        console.error('Error fetching conference data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [parentId]);

  const handleScheduleConference = async () => {
    if (!selectedStudent || !selectedTeacher || !selectedDate || !selectedTime) {
      alert('Please fill in all fields');
      return;
    }

    alert('Conference scheduled successfully! (Demo mode - not persisted)');
    setShowScheduleForm(false);
    setSelectedStudent('');
    setSelectedTeacher('');
    setSelectedDate('');
    setSelectedTime('');
  };

  const upcomingConferences = conferences.filter(c => c.status === 'Scheduled');
  const pastConferences = conferences.filter(c => c.status === 'Completed');

  if (loading) {
    return <div className="p-4">Loading conferences...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Schedule New Conference Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Parent-Teacher Conferences</h2>
        <Button
          onClick={() => setShowScheduleForm(!showScheduleForm)}
          className="bg-amber-600 hover:bg-amber-700"
        >
          {showScheduleForm ? 'Cancel' : 'Schedule New Conference'}
        </Button>
      </div>

      {/* Schedule Form */}
      {showScheduleForm && (
        <Card className="border-amber-600">
          <CardHeader className="bg-amber-50">
            <CardTitle>Schedule a Conference</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Child</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Choose a child...</option>
                {students.map(student => (
                  <option key={student.student_id} value={student.student_id}>
                    {student.first_name} {student.last_name} - Grade {student.grade}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Select Teacher</label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Choose a teacher...</option>
                {staff.map(teacher => (
                  <option key={teacher.staff_id} value={teacher.staff_id}>
                    {teacher.first_name} {teacher.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-2 border rounded"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Time</label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Choose a time...</option>
                  <option value="08:00">8:00 AM</option>
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="13:00">1:00 PM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="16:00">4:00 PM</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="In-person">In-person</option>
                <option value="Zoom">Zoom</option>
                <option value="Phone">Phone</option>
              </select>
            </div>

            <Button
              onClick={handleScheduleConference}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              Schedule Conference
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Conferences */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Upcoming Conferences</h3>
        {upcomingConferences.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              No upcoming conferences scheduled
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {upcomingConferences.map(conference => {
              const student = students.find(s => s.student_id === conference.student_id);
              const teacher = staff.find(s => s.staff_id === conference.staff_id);
              
              return (
                <Card key={conference.conference_id} className="border-l-4 border-l-amber-600">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-amber-600" />
                          <span className="font-semibold">
                            {student?.first_name} {student?.last_name}
                          </span>
                          <span className="text-gray-500">with</span>
                          <span className="font-semibold">
                            {teacher?.first_name} {teacher?.last_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(conference.date_time).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(conference.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {conference.location}
                          </div>
                        </div>
                        {conference.notes && (
                          <p className="text-sm text-gray-600 mt-2">{conference.notes}</p>
                        )}
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        {conference.status}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Conferences */}
      {pastConferences.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Past Conferences</h3>
          <div className="space-y-4">
            {pastConferences.map(conference => {
              const student = students.find(s => s.student_id === conference.student_id);
              const teacher = staff.find(s => s.staff_id === conference.staff_id);
              
              return (
                <Card key={conference.conference_id} className="border-l-4 border-l-gray-400">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-gray-600" />
                          <span className="font-semibold">
                            {student?.first_name} {student?.last_name}
                          </span>
                          <span className="text-gray-500">with</span>
                          <span className="font-semibold">
                            {teacher?.first_name} {teacher?.last_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(conference.date_time).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(conference.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {conference.location}
                          </div>
                        </div>
                        {conference.notes && (
                          <p className="text-sm text-gray-600 mt-2">{conference.notes}</p>
                        )}
                      </div>
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                        {conference.status}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
