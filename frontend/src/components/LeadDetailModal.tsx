import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users, Mail, Phone, Calendar, GraduationCap, MapPin, CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Lead {
  lead_id: string;
  campus_id: string;
  parent_first_name: string;
  parent_last_name: string;
  email: string;
  phone: string;
  child_first_name: string;
  child_last_name: string;
  child_dob: string;
  desired_grade: string;
  desired_start_date: string;
  stage: string;
  source: string;
  created_date: string;
  last_contact_date: string | null;
  tour_date: string | null;
  notes: string;
  assigned_to: string | null;
  family_id?: string | null;
  enrollment_data?: Record<string, unknown> | null;
}

interface Campus {
  campus_id: string;
  name: string;
  location: string;
}

interface LeadDetailModalProps {
  open: boolean;
  onClose: () => void;
  lead: Lead | null;
  mode: 'view' | 'update-stage';
  onLeadUpdated: () => void;
}

const stages = ['New', 'Contact', 'Contacted', 'Tour Scheduled', 'Tour Complete', 'Enrolling', 'Enrolled', 'Lost'];

const getStageColor = (stage: string) => {
  const colors: Record<string, string> = {
    'New': 'bg-blue-100 text-blue-800',
    'Contact': 'bg-cyan-100 text-cyan-800',
    'Contacted': 'bg-purple-100 text-purple-800',
    'Tour Scheduled': 'bg-yellow-100 text-yellow-800',
    'Tour Complete': 'bg-orange-100 text-orange-800',
    'Enrolling': 'bg-indigo-100 text-indigo-800',
    'Enrolled': 'bg-emerald-100 text-emerald-800',
    'Lost': 'bg-red-100 text-red-800'
  };
  return colors[stage] || 'bg-gray-100 text-gray-800';
};

export function LeadDetailModal({ open, onClose, lead, mode, onLeadUpdated }: LeadDetailModalProps) {
  const [selectedStage, setSelectedStage] = useState(lead?.stage || '');
  const [tourDate, setTourDate] = useState(lead?.tour_date?.split('T')[0] || lead?.tour_date || '');
  const [tourTime, setTourTime] = useState(lead?.tour_date?.includes('T') ? lead.tour_date.split('T')[1]?.slice(0, 5) : '');
  const [notes, setNotes] = useState(lead?.notes || '');
  const [loading, setLoading] = useState(false);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [enrollCampusId, setEnrollCampusId] = useState('');
  const [enrollSession, setEnrollSession] = useState('Morning');
  const [enrollRoom, setEnrollRoom] = useState('');
  const [showEnrollForm, setShowEnrollForm] = useState(false);

  useEffect(() => {
    if (lead) {
      setSelectedStage(lead.stage);
      setTourDate(lead.tour_date?.split('T')[0] || lead.tour_date || '');
      setTourTime(lead.tour_date?.includes('T') ? lead.tour_date.split('T')[1]?.slice(0, 5) : '');
      setNotes(lead.notes || '');
      setShowEnrollForm(false);
    }
  }, [lead]);

  useEffect(() => {
    const fetchCampuses = async () => {
      try {
        const res = await fetch(`${API_URL}/api/campuses`);
        if (res.ok) {
          const data = await res.json();
          setCampuses(data);
          if (data.length > 0) setEnrollCampusId(data[0].campus_id);
        }
      } catch (e) {
        console.error('Error fetching campuses:', e);
      }
    };
    fetchCampuses();
  }, []);

  if (!lead) return null;

  const handleUpdateStage = async () => {
    setLoading(true);
    try {
      const combinedTourDate = tourDate ? (tourTime ? `${tourDate}T${tourTime}` : tourDate) : null;
      // Auto-advance to "Tour Scheduled" when a tour date is set and stage is before it
      const preScheduledStages = ['New', 'Contact', 'Contacted'];
      const effectiveStage = (combinedTourDate && preScheduledStages.includes(selectedStage))
        ? 'Tour Scheduled'
        : selectedStage;
      const updatedLead = {
        ...lead,
        stage: effectiveStage,
        tour_date: combinedTourDate,
        notes: notes,
        last_contact_date: new Date().toISOString().split('T')[0]
      };

      const response = await fetch(`${API_URL}/api/admissions/leads/${lead.lead_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLead),
      });

      if (!response.ok) {
        const error = await response.json();
        const detail = error.detail;
        const message = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join(', ') : JSON.stringify(detail) || 'Failed to update lead';
        throw new Error(message);
      }

      onLeadUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating lead:', error);
      alert(error instanceof Error ? error.message : 'Failed to update lead');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeEnrollment = async () => {
    if (!enrollCampusId) {
      alert('Please select a campus');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admissions/leads/${lead.lead_id}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campus_id: enrollCampusId,
          session: enrollSession,
          room: enrollRoom,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to enroll student');
      }

      const result = await response.json();
      alert(result.message || 'Student enrolled successfully!');
      onLeadUpdated();
      onClose();
    } catch (error) {
      console.error('Error enrolling student:', error);
      alert(error instanceof Error ? error.message : 'Failed to enroll student');
    } finally {
      setLoading(false);
    }
  };

  const isEnrollingStage = lead.stage === 'Enrolling';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-2xl max-h-[85vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {showEnrollForm ? 'Finalize Enrollment' : mode === 'view' ? 'Lead Details' : 'Update Lead Stage'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b">
            <h3 className="text-xl font-semibold">
              {lead.child_first_name} {lead.child_last_name}
            </h3>
            <Badge className={getStageColor(lead.stage)}>
              {lead.stage}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 border-b pb-1">Child Information</h4>
              <div className="flex items-center gap-2 text-sm">
                <GraduationCap className="h-4 w-4 text-gray-500" />
                <span>Grade: {lead.desired_grade}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>DOB: {new Date(lead.child_dob).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Desired Start: {new Date(lead.desired_start_date).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 border-b pb-1">Parent/Guardian</h4>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-gray-500" />
                <span>{lead.parent_first_name} {lead.parent_last_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-500" />
                <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">{lead.email}</a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-500" />
                <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">{lead.phone}</a>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 border-b pb-1">Lead Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>Source: {lead.source}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Created: {new Date(lead.created_date).toLocaleDateString()}</span>
              </div>
              {lead.last_contact_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>Last Contact: {new Date(lead.last_contact_date).toLocaleDateString()}</span>
                </div>
              )}
              {lead.tour_date && !showEnrollForm && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Calendar className="h-4 w-4" />
                  <span>Tour: {new Date(lead.tour_date).toLocaleDateString()}{lead.tour_date.includes('T') ? ` at ${new Date(lead.tour_date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}</span>
                </div>
              )}
            </div>
          </div>

          {!showEnrollForm && lead.notes && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700 border-b pb-1">Notes</h4>
              <p className="text-sm text-gray-600 italic">{lead.notes}</p>
            </div>
          )}

          {mode === 'update-stage' && !showEnrollForm && (
            <div className="space-y-4 pt-2 border-t">
              <h4 className="font-medium text-gray-700">Update Information</h4>
              
              <div className="space-y-2">
                <Label htmlFor="stage">Stage</Label>
                <Select value={selectedStage} onValueChange={setSelectedStage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.filter(s => s !== 'Enrolled').map((stage) => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tour_date">Tour Date (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="tour_date"
                    type="date"
                    value={tourDate}
                    onChange={(e) => setTourDate(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    id="tour_time"
                    type="time"
                    value={tourTime}
                    onChange={(e) => setTourTime(e.target.value)}
                    className="flex-1"
                    placeholder="Time"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this lead..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Enrollment Finalization Form */}
          {showEnrollForm && (
            <div className="space-y-4 pt-2 border-t">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h4 className="font-medium text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Finalize Enrollment
                </h4>
                <p className="text-sm text-green-700 mt-1">
                  Assign {lead.child_first_name} to a campus and session to complete enrollment.
                  This will create the student and family accounts in the system.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Campus <span className="text-red-500">*</span></Label>
                <Select value={enrollCampusId} onValueChange={setEnrollCampusId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select campus..." />
                  </SelectTrigger>
                  <SelectContent>
                    {campuses.map((c) => (
                      <SelectItem key={c.campus_id} value={c.campus_id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Session</Label>
                <Select value={enrollSession} onValueChange={setEnrollSession}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Morning">Morning (AM)</SelectItem>
                    <SelectItem value="Afternoon">Afternoon (PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Classroom (optional)</Label>
                <Input
                  value={enrollRoom}
                  onChange={(e) => setEnrollRoom(e.target.value)}
                  placeholder="e.g., Room A, Room 1"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => {
            if (showEnrollForm) {
              setShowEnrollForm(false);
            } else {
              onClose();
            }
          }} disabled={loading}>
            {showEnrollForm ? 'Back' : mode === 'view' ? 'Close' : 'Cancel'}
          </Button>

          {mode === 'update-stage' && !showEnrollForm && (
            <>
              <Button onClick={handleUpdateStage} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              {isEnrollingStage && (
                <Button
                  onClick={() => setShowEnrollForm(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Finalize Enrollment
                </Button>
              )}
            </>
          )}

          {mode === 'view' && isEnrollingStage && (
            <Button
              onClick={() => setShowEnrollForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Finalize Enrollment
            </Button>
          )}

          {showEnrollForm && (
            <Button
              onClick={handleFinalizeEnrollment}
              disabled={loading || !enrollCampusId}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Enrolling...' : 'Complete Enrollment'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
