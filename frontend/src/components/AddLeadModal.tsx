import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Campus {
  campus_id: string;
  name: string;
  location: string;
}

interface AddLeadModalProps {
  open: boolean;
  onClose: () => void;
  onLeadAdded: () => void;
  selectedCampusId?: string | null;
}

export function AddLeadModal({ open, onClose, onLeadAdded, selectedCampusId }: AddLeadModalProps) {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    campus_id: selectedCampusId || '',
    parent_first_name: '',
    parent_last_name: '',
    email: '',
    phone: '',
    child_first_name: '',
    child_last_name: '',
    child_dob: '',
    desired_grade: '',
    desired_start_date: new Date().toISOString().split('T')[0],
    stage: 'New Inquiry',
    source: 'Website',
    notes: ''
  });

  useEffect(() => {
    if (open) {
      fetchCampuses();
      if (selectedCampusId) {
        setFormData(prev => ({ ...prev, campus_id: selectedCampusId }));
      }
    }
  }, [open, selectedCampusId]);

  const fetchCampuses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/campuses`);
      const data = await response.json();
      setCampuses(data);
    } catch (error) {
      console.error('Error fetching campuses:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const leadId = `lead_${Date.now()}`;
      const leadData = {
        lead_id: leadId,
        campus_id: formData.campus_id || (campuses.length > 0 ? campuses[0].campus_id : 'campus_1'),
        parent_first_name: formData.parent_first_name,
        parent_last_name: formData.parent_last_name,
        email: formData.email,
        phone: formData.phone,
        child_first_name: formData.child_first_name,
        child_last_name: formData.child_last_name,
        child_dob: formData.child_dob,
        desired_grade: formData.desired_grade,
        desired_start_date: formData.desired_start_date,
        stage: formData.stage,
        source: formData.source,
        created_date: new Date().toISOString().split('T')[0],
        last_contact_date: null,
        tour_date: null,
        notes: formData.notes,
        assigned_to: null
      };

      const response = await fetch(`${API_URL}/api/admissions/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to add lead');
      }

      onLeadAdded();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error adding lead:', error);
      alert(error instanceof Error ? error.message : 'Failed to add lead');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      campus_id: selectedCampusId || '',
      parent_first_name: '',
      parent_last_name: '',
      email: '',
      phone: '',
      child_first_name: '',
      child_last_name: '',
      child_dob: '',
      desired_grade: '',
      desired_start_date: new Date().toISOString().split('T')[0],
      stage: 'New Inquiry',
      source: 'Website',
      notes: ''
    });
  };

  const sources = ['Website', 'Referral', 'Social Media', 'Walk-in', 'Event', 'Other'];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-2xl max-h-[85vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add New Lead
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border-b pb-2 mb-2">
            <h3 className="font-medium text-gray-700">Parent/Guardian Information</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parent_first_name">Parent First Name *</Label>
              <Input
                id="parent_first_name"
                value={formData.parent_first_name}
                onChange={(e) => setFormData({ ...formData, parent_first_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent_last_name">Parent Last Name *</Label>
              <Input
                id="parent_last_name"
                value={formData.parent_last_name}
                onChange={(e) => setFormData({ ...formData, parent_last_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="border-b pb-2 mb-2 mt-4">
            <h3 className="font-medium text-gray-700">Child Information</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="child_first_name">Child First Name *</Label>
              <Input
                id="child_first_name"
                value={formData.child_first_name}
                onChange={(e) => setFormData({ ...formData, child_first_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="child_last_name">Child Last Name *</Label>
              <Input
                id="child_last_name"
                value={formData.child_last_name}
                onChange={(e) => setFormData({ ...formData, child_last_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="child_dob">Child Date of Birth *</Label>
              <Input
                id="child_dob"
                type="date"
                value={formData.child_dob}
                onChange={(e) => setFormData({ ...formData, child_dob: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desired_grade">Desired Grade *</Label>
              <Select value={formData.desired_grade} onValueChange={(value) => setFormData({ ...formData, desired_grade: value })}>
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
              <Label htmlFor="desired_start_date">Desired Start Date *</Label>
              <Input
                id="desired_start_date"
                type="date"
                value={formData.desired_start_date}
                onChange={(e) => setFormData({ ...formData, desired_start_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campus">Campus</Label>
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
          </div>

          <div className="border-b pb-2 mb-2 mt-4">
            <h3 className="font-medium text-gray-700">Lead Details</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Lead Source *</Label>
              <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sources.map((source) => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage">Initial Stage</Label>
              <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New Inquiry">New Inquiry</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Tour Scheduled">Tour Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes about this lead..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
