import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus } from 'lucide-react';

interface Campus {
  campus_id: string;
  name: string;
  location: string;
}

interface Family {
  family_id: string;
  family_name: string;
}

interface AddStudentModalProps {
  open: boolean;
  onClose: () => void;
  onStudentAdded: () => void;
  selectedCampusId?: string | null;
}

export function AddStudentModal({ open, onClose, onStudentAdded, selectedCampusId }: AddStudentModalProps) {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    campus_id: selectedCampusId || '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    grade: '',
    session: 'Morning',
    room: 'Room 1',
    status: 'Active',
    family_id: '',
    enrollment_start_date: new Date().toISOString().split('T')[0],
    enrollment_end_date: null,
    attendance_present_count: 0,
    attendance_absent_count: 0,
    attendance_tardy_count: 0,
    overall_grade_flag: 'On track',
    ixl_status_flag: 'On track',
    overall_risk_flag: 'None',
    funding_source: 'Out-of-Pocket',
    step_up_percentage: 0
  });

  useEffect(() => {
    if (open) {
      fetchCampuses();
      fetchFamilies();
      if (selectedCampusId) {
        setFormData(prev => ({ ...prev, campus_id: selectedCampusId }));
      }
    }
  }, [open, selectedCampusId]);

  const fetchCampuses = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/campuses`);
      const data = await response.json();
      setCampuses(data);
    } catch (error) {
      console.error('Error fetching campuses:', error);
    }
  };

  const fetchFamilies = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/families`);
      const data = await response.json();
      setFamilies(data);
    } catch (error) {
      console.error('Error fetching families:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const studentId = `student_${Date.now()}`;
      const studentData = {
        ...formData,
        student_id: studentId,
        step_up_percentage: parseInt(formData.step_up_percentage.toString()) || 0
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to add student');
      }

      onStudentAdded();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error adding student:', error);
      alert(error instanceof Error ? error.message : 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      campus_id: selectedCampusId || '',
      first_name: '',
      last_name: '',
      date_of_birth: '',
      grade: '',
      session: 'Morning',
      room: 'Room 1',
      status: 'Active',
      family_id: '',
      enrollment_start_date: new Date().toISOString().split('T')[0],
      enrollment_end_date: null,
      attendance_present_count: 0,
      attendance_absent_count: 0,
      attendance_tardy_count: 0,
      overall_grade_flag: 'On track',
      ixl_status_flag: 'On track',
      overall_risk_flag: 'None',
      funding_source: 'Out-of-Pocket',
      step_up_percentage: 0
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-xl max-h-[80vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add New Student
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth *</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">Grade *</Label>
              <Select value={formData.grade} onValueChange={(value) => setFormData({ ...formData, grade: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((grade) => (
                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campus">Campus *</Label>
              <Select value={formData.campus_id} onValueChange={(value) => setFormData({ ...formData, campus_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select campus" />
                </SelectTrigger>
                <SelectContent>
                  {campuses.map((campus) => (
                    <SelectItem key={campus.campus_id} value={campus.campus_id}>
                      {campus.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="family">Family *</Label>
              <Select value={formData.family_id} onValueChange={(value) => setFormData({ ...formData, family_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select family" />
                </SelectTrigger>
                <SelectContent>
                  {families.map((family) => (
                    <SelectItem key={family.family_id} value={family.family_id}>
                      {family.family_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="session">Session *</Label>
              <Select value={formData.session} onValueChange={(value) => setFormData({ ...formData, session: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Morning">Morning</SelectItem>
                  <SelectItem value="Afternoon">Afternoon</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="room">Room *</Label>
              <Select value={formData.room} onValueChange={(value) => setFormData({ ...formData, room: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Room 1">Room 1</SelectItem>
                  <SelectItem value="Room 2">Room 2</SelectItem>
                  <SelectItem value="Room 3">Room 3</SelectItem>
                  <SelectItem value="Room 4">Room 4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="funding_source">Funding Source *</Label>
              <Select value={formData.funding_source} onValueChange={(value) => setFormData({ ...formData, funding_source: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Step-Up">Step-Up</SelectItem>
                  <SelectItem value="Out-of-Pocket">Out-of-Pocket</SelectItem>
                  <SelectItem value="Mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="step_up_percentage">Step-Up Percentage</Label>
              <Input
                id="step_up_percentage"
                type="number"
                min="0"
                max="100"
                value={formData.step_up_percentage}
                onChange={(e) => setFormData({ ...formData, step_up_percentage: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="enrollment_start_date">Enrollment Start Date *</Label>
              <Input
                id="enrollment_start_date"
                type="date"
                value={formData.enrollment_start_date}
                onChange={(e) => setFormData({ ...formData, enrollment_start_date: e.target.value })}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Student'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
