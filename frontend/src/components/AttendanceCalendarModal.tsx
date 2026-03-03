import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface AttendanceRecord {
  attendance_id: string;
  student_id: string;
  date: string;
  status: 'Present' | 'Absent' | 'Tardy';
  session: string;
}

interface AttendanceCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

export const AttendanceCalendarModal: React.FC<AttendanceCalendarModalProps> = ({
  isOpen,
  onClose,
  studentId,
  studentName
}) => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && studentId) {
      fetchAttendance();
    }
  }, [isOpen, studentId, currentMonth]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/attendance/${studentId}`);
      if (!response.ok) {
        console.error('Failed to fetch attendance:', response.status);
        setAttendanceRecords([]);
        return;
      }
      const data = await response.json();
      setAttendanceRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getAttendanceForDate = (date: Date): AttendanceRecord | undefined => {
    const dateString = date.toISOString().split('T')[0];
    return attendanceRecords.find(record => record.date === dateString);
  };

  const getColorForStatus = (status: string | undefined): string => {
    if (!status) return 'bg-gray-100 text-gray-400';
    switch (status) {
      case 'Present':
        return 'bg-green-500 text-white hover:bg-green-600';
      case 'Tardy':
        return 'bg-yellow-500 text-white hover:bg-yellow-600';
      case 'Absent':
        return 'bg-red-500 text-white hover:bg-red-600';
      default:
        return 'bg-gray-100 text-gray-400';
    }
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="aspect-square p-1"></div>
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      const attendance = getAttendanceForDate(date);
      const isPastDate = date < today;
      const isToday = date.getTime() === today.getTime();
      const isFutureDate = date > today;

      days.push(
        <div
          key={day}
          className={`aspect-square p-1 border rounded-md flex flex-col items-center justify-center text-xs font-medium transition-colors ${
            isFutureDate
              ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
              : attendance
              ? getColorForStatus(attendance.status)
              : isPastDate
              ? 'bg-gray-100 text-gray-400'
              : 'bg-white text-gray-700'
          } ${isToday ? 'ring-2 ring-amber-500' : ''}`}
          title={attendance ? `${attendance.status} - ${attendance.session}` : isFutureDate ? 'Future date' : 'No record'}
        >
          <span className="text-[11px]">{day}</span>
          {attendance && (
            <span className="text-[9px] sm:text-[10px] mt-0.5">{attendance.status[0]}</span>
          )}
        </div>
      );
    }

    return days;
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[80vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CalendarIcon className="w-4 h-4" />
            Attendance Calendar - {studentName}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Color-coded attendance history for the selected month
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={previousMonth} className="h-8 px-2 text-sm">
              ← Previous
            </Button>
            <h3 className="text-base font-semibold">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <Button variant="outline" onClick={nextMonth} className="h-8 px-2 text-sm">
              Next →
            </Button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 justify-center text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Tardy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-gray-100 border rounded"></div>
              <span>No Record</span>
            </div>
          </div>

          {/* Calendar Grid */}
          {loading ? (
            <div className="text-center py-6 text-sm">Loading attendance...</div>
          ) : (
            <div className="space-y-1">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-gray-600">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {renderCalendar()}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-semibold mb-2 text-sm">Summary for {monthNames[currentMonth.getMonth()]}</h4>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-green-600 font-semibold">
                  {attendanceRecords.filter(r => 
                    r.status === 'Present' && 
                    new Date(r.date).getMonth() === currentMonth.getMonth() &&
                    new Date(r.date).getFullYear() === currentMonth.getFullYear()
                  ).length}
                </span> Present
              </div>
              <div>
                <span className="text-yellow-600 font-semibold">
                  {attendanceRecords.filter(r => 
                    r.status === 'Tardy' && 
                    new Date(r.date).getMonth() === currentMonth.getMonth() &&
                    new Date(r.date).getFullYear() === currentMonth.getFullYear()
                  ).length}
                </span> Tardy
              </div>
              <div>
                <span className="text-red-600 font-semibold">
                  {attendanceRecords.filter(r => 
                    r.status === 'Absent' && 
                    new Date(r.date).getMonth() === currentMonth.getMonth() &&
                    new Date(r.date).getFullYear() === currentMonth.getFullYear()
                  ).length}
                </span> Absent
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
