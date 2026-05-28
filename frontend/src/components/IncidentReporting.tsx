import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, User, FileText, Plus, CheckCircle, XCircle, Send, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Incident {
  incident_id: string;
  campus_id: string;
  student_id: string;
  reported_by_staff_id: string;
  incident_type: string;
  severity: string;
  date: string;
  time: string;
  description: string;
  action_taken: string;
  parent_notified: boolean;
  followup_required: boolean;
  status: 'pending_review' | 'approved' | 'denied' | 'sent_to_parent';
  admin_notes: string;
  reviewed_by_staff_id: string;
}

interface StudentOption {
  student_id: string;
  first_name: string;
  last_name: string;
  grade: string;
}

interface IncidentReportingProps {
  role: 'owner' | 'admin' | 'coach' | 'parent';
  studentId?: string;
  userId?: string;
}

export const IncidentReporting: React.FC<IncidentReportingProps> = ({ role, studentId, userId }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [adminNotes, setAdminNotes] = useState('');
  const [sendToParent, setSendToParent] = useState(false);
  const [newIncident, setNewIncident] = useState({
    student_id: studentId || '',
    incident_type: 'Behavioral',
    severity: 'Low',
    description: '',
    action_taken: '',
    followup_required: false
  });

  useEffect(() => {
    fetchIncidents();
    if (role !== 'parent') {
      fetchStudents();
    }
  }, [studentId]);

  const fetchIncidents = async () => {
    try {
      const url = studentId 
        ? `${API_URL}/api/incidents?student_id=${studentId}`
        : `${API_URL}/api/incidents`;
      const response = await fetch(url);
      const data = await response.json();
      setIncidents(data.sort((a: Incident, b: Incident) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/students`);
      const data = await response.json();
      setStudents(data.map((s: { student_id: string; first_name: string; last_name: string; grade: string }) => ({
        student_id: s.student_id,
        first_name: s.first_name,
        last_name: s.last_name,
        grade: s.grade
      })));
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.student_id === studentId);
    return student ? `${student.first_name} ${student.last_name}` : studentId;
  };

  const handleAddIncident = async () => {
    if (!userId) return;
    
    try {
      const now = new Date();
      const newIncidentData = {
        incident_id: `inc_${Date.now()}`,
        campus_id: '',
        reported_by_staff_id: userId,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0].substring(0, 5),
        status: 'pending_review',
        admin_notes: '',
        reviewed_by_staff_id: '',
        parent_notified: false,
        ...newIncident
      };
      
      const response = await fetch(`${API_URL}/api/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIncidentData)
      });
      
      if (response.ok) {
        setIncidents(prev => [newIncidentData as Incident, ...prev]);
      }
      
      setShowAddModal(false);
      setNewIncident({
        student_id: studentId || '',
        incident_type: 'Behavioral',
        severity: 'Low',
        description: '',
        action_taken: '',
        followup_required: false
      });
      alert('Incident report submitted! It will be reviewed by an administrator.');
    } catch (error) {
      console.error('Error adding incident:', error);
    }
  };

  const updateIncidentOnServer = async (incident: Incident): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/incidents/${incident.incident_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incident)
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating incident:', error);
      return false;
    }
  };

  const handleAdminReview = async (approved: boolean) => {
    if (!selectedIncident || !userId) return;
    
    const newStatus = approved 
      ? (sendToParent ? 'sent_to_parent' : 'approved')
      : 'denied';
    
    const updatedIncident: Incident = {
      ...selectedIncident,
      status: newStatus as Incident['status'],
      admin_notes: adminNotes,
      reviewed_by_staff_id: userId,
      parent_notified: sendToParent
    };
    
    const success = await updateIncidentOnServer(updatedIncident);
    if (!success) {
      alert('Failed to save review. Please try again.');
      return;
    }
    
    setIncidents(prev => prev.map(inc => 
      inc.incident_id === selectedIncident.incident_id ? updatedIncident : inc
    ));
    
    setShowReviewModal(false);
    setSelectedIncident(null);
    setAdminNotes('');
    setSendToParent(false);
    
    if (approved && sendToParent) {
      alert('Incident approved and sent to parent.');
    } else if (approved) {
      alert('Incident approved (not sent to parent).');
    } else {
      alert('Incident denied.');
    }
  };

  const handleSendToParent = async (incident: Incident) => {
    const updatedIncident: Incident = {
      ...incident,
      status: 'sent_to_parent',
      parent_notified: true
    };
    
    const success = await updateIncidentOnServer(updatedIncident);
    if (!success) {
      alert('Failed to send to parent. Please try again.');
      return;
    }
    
    setIncidents(prev => prev.map(inc => 
      inc.incident_id === incident.incident_id ? updatedIncident : inc
    ));
    setSelectedIncident(null);
    alert('Incident report has been sent to the parent.');
  };

  const openReviewModal = (incident: Incident) => {
    setSelectedIncident(incident);
    setAdminNotes(incident.admin_notes || '');
    setSendToParent(false);
    setShowReviewModal(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending_review': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'denied': 'bg-red-100 text-red-800',
      'sent_to_parent': 'bg-blue-100 text-blue-800'
    };
    return colors[status] || colors['pending_review'];
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending_review': 'Pending Review',
      'approved': 'Approved',
      'denied': 'Denied',
      'sent_to_parent': 'Sent to Parent'
    };
    return labels[status] || 'Pending Review';
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      'Low': 'bg-green-100 text-green-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'High': 'bg-red-100 text-red-800'
    };
    return colors[severity] || colors['Low'];
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Behavioral': 'bg-orange-100 text-orange-800',
      'Medical': 'bg-red-100 text-red-800',
      'Safety': 'bg-purple-100 text-purple-800',
      'Academic': 'bg-blue-100 text-blue-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors['Other'];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const pendingIncidents = incidents.filter(i => (i.status || 'pending_review') === 'pending_review');
  const reviewedIncidents = incidents.filter(i => i.status && i.status !== 'pending_review');

  // For parent role, only show incidents sent to them
  const visibleIncidents = role === 'parent' 
    ? incidents.filter(i => i.status === 'sent_to_parent')
    : incidents;

  const highSeverityIncidents = visibleIncidents.filter(i => i.severity === 'High');
  const otherIncidents = visibleIncidents.filter(i => i.severity !== 'High');

  if (loading) {
    return <div className="text-center py-8">Loading incidents...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {role === 'parent' ? 'Incident Notifications' : 'Incident Reports'}
        </h2>
        <div className="flex gap-2">
          {(role === 'owner' || role === 'admin' || role === 'coach') && (
            <Button onClick={() => setShowAddModal(true)} className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" />
              Report Incident
            </Button>
          )}
          {(role === 'owner' || role === 'admin') && (
            <>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                {pendingIncidents.length} Pending Review
              </Badge>
              <Badge variant="outline" className="bg-red-50 text-red-800">
                {highSeverityIncidents.length} High Priority
              </Badge>
              <Badge variant="outline">
                {incidents.length} Total
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Pending Review Section - Admin/Owner only */}
      {(role === 'owner' || role === 'admin') && pendingIncidents.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4 text-yellow-600 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Review ({pendingIncidents.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingIncidents.map((incident) => (
              <Card 
                key={incident.incident_id} 
                className="hover:shadow-lg transition-shadow cursor-pointer border-yellow-200"
                onClick={() => openReviewModal(incident)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {incident.severity === 'High' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                      {incident.incident_type}
                    </CardTitle>
                    <Badge className={getSeverityColor(incident.severity)}>{incident.severity}</Badge>
                  </div>
                  <CardDescription>
                    {formatDate(incident.date)} at {incident.time}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600 font-medium">Student: {getStudentName(incident.student_id)}</p>
                    <p className="text-gray-700 line-clamp-2">{incident.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
                      {incident.followup_required && (
                        <Badge variant="outline" className="text-xs bg-yellow-50">Followup Required</Badge>
                      )}
                    </div>
                    <p className="text-xs text-blue-600 mt-2 font-medium">Click to review →</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* High Priority Section */}
      {highSeverityIncidents.length > 0 && (role !== 'owner' && role !== 'admin' || reviewedIncidents.filter(i => i.severity === 'High').length > 0) && (
        <div>
          <h3 className="text-xl font-semibold mb-4 text-red-600">High Priority Incidents</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(role === 'owner' || role === 'admin' 
              ? reviewedIncidents.filter(i => i.severity === 'High')
              : highSeverityIncidents
            ).map((incident) => (
              <Card 
                key={incident.incident_id} 
                className="hover:shadow-lg transition-shadow cursor-pointer border-red-200"
                onClick={() => setSelectedIncident(incident)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      {incident.incident_type}
                    </CardTitle>
                    <Badge className={getSeverityColor(incident.severity)}>{incident.severity}</Badge>
                  </div>
                  <CardDescription>{formatDate(incident.date)} at {incident.time}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600 font-medium">Student: {getStudentName(incident.student_id)}</p>
                    <p className="text-gray-700 line-clamp-2">{incident.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge className={getStatusColor(incident.status || 'pending_review')}>
                        {getStatusLabel(incident.status || 'pending_review')}
                      </Badge>
                      {incident.parent_notified && (
                        <Badge variant="outline" className="text-xs">Parent Notified</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Other Incidents */}
      {(role === 'owner' || role === 'admin' 
        ? reviewedIncidents.filter(i => i.severity !== 'High').length > 0
        : otherIncidents.length > 0
      ) && (
        <div>
          <h3 className="text-xl font-semibold mb-4">
            {role === 'parent' ? 'Incidents' : 'All Incidents'}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(role === 'owner' || role === 'admin' 
              ? reviewedIncidents.filter(i => i.severity !== 'High')
              : otherIncidents
            ).map((incident) => (
              <Card 
                key={incident.incident_id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedIncident(incident)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">{incident.incident_type}</CardTitle>
                    <div className="flex gap-1">
                      <Badge className={`${getTypeColor(incident.incident_type)} text-xs`}>
                        {incident.incident_type}
                      </Badge>
                      <Badge className={`${getSeverityColor(incident.severity)} text-xs`}>
                        {incident.severity}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{formatDate(incident.date)} at {incident.time}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600 font-medium">Student: {getStudentName(incident.student_id)}</p>
                    <p className="text-gray-700 line-clamp-2">{incident.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge className={getStatusColor(incident.status || 'pending_review')}>
                        {getStatusLabel(incident.status || 'pending_review')}
                      </Badge>
                      {incident.parent_notified && (
                        <Badge variant="outline" className="text-xs">Parent Notified</Badge>
                      )}
                      {incident.followup_required && (
                        <Badge variant="outline" className="text-xs bg-yellow-50">Followup Required</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {visibleIncidents.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">
            {role === 'parent' ? 'No incident notifications' : 'No incidents reported'}
          </p>
        </div>
      )}

      {/* View Incident Detail Modal */}
      <Dialog open={!!selectedIncident && !showReviewModal} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-xl max-h-[80vh] overflow-y-auto p-4">
          {selectedIncident && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start mb-2">
                  <DialogTitle className="text-2xl flex items-center gap-2">
                    {selectedIncident.severity === 'High' && (
                      <AlertTriangle className="w-6 h-6 text-red-500" />
                    )}
                    {selectedIncident.incident_type} Incident
                  </DialogTitle>
                  <div className="flex gap-2">
                    <Badge className={getTypeColor(selectedIncident.incident_type)}>
                      {selectedIncident.incident_type}
                    </Badge>
                    <Badge className={getSeverityColor(selectedIncident.severity)}>
                      {selectedIncident.severity}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Date & Time</p>
                      <p className="text-sm text-gray-600">{formatDate(selectedIncident.date)} at {selectedIncident.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Student</p>
                      <p className="text-sm text-gray-600">{getStudentName(selectedIncident.student_id)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Description</p>
                  <p className="text-gray-700">{selectedIncident.description}</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Action Taken</p>
                  <p className="text-gray-700">{selectedIncident.action_taken}</p>
                </div>

                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Report Status</p>
                  <Badge className={`${getStatusColor(selectedIncident.status || 'pending_review')} text-sm`}>
                    {getStatusLabel(selectedIncident.status || 'pending_review')}
                  </Badge>
                </div>

                {selectedIncident.admin_notes && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">Review Notes</p>
                    <p className="text-gray-700">{selectedIncident.admin_notes}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <div className={`flex-1 p-4 rounded-lg ${selectedIncident.parent_notified ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <p className="text-sm font-medium mb-1">Parent Notification</p>
                    <p className={`text-sm ${selectedIncident.parent_notified ? 'text-green-700' : 'text-gray-600'}`}>
                      {selectedIncident.parent_notified ? 'Parent has been notified' : 'Parent not yet notified'}
                    </p>
                  </div>
                  <div className={`flex-1 p-4 rounded-lg ${selectedIncident.followup_required ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                    <p className="text-sm font-medium mb-1">Followup Status</p>
                    <p className={`text-sm ${selectedIncident.followup_required ? 'text-yellow-700' : 'text-gray-600'}`}>
                      {selectedIncident.followup_required ? 'Followup required' : 'No followup needed'}
                    </p>
                  </div>
                </div>

                {/* Admin can still send to parent from detail view if approved but not yet sent */}
                {(role === 'owner' || role === 'admin') && selectedIncident.status === 'approved' && !selectedIncident.parent_notified && (
                  <div className="border-t pt-4 mt-4">
                    <Button
                      onClick={() => handleSendToParent(selectedIncident)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send to Parent
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Admin Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={() => { setShowReviewModal(false); setSelectedIncident(null); }}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-xl max-h-[80vh] overflow-y-auto p-4">
          {selectedIncident && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Review Incident Report
                </DialogTitle>
                <DialogDescription>
                  Review this incident and decide whether to send it to the student&apos;s parents.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Incident Summary */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{selectedIncident.incident_type} Incident</span>
                    <div className="flex gap-2">
                      <Badge className={getSeverityColor(selectedIncident.severity)}>{selectedIncident.severity}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Student: <span className="font-medium">{getStudentName(selectedIncident.student_id)}</span></p>
                  <p className="text-sm text-gray-600">{formatDate(selectedIncident.date)} at {selectedIncident.time}</p>
                </div>

                <div className="bg-white border p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Description</p>
                  <p className="text-gray-700 text-sm">{selectedIncident.description}</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Action Taken by Coach</p>
                  <p className="text-gray-700 text-sm">{selectedIncident.action_taken}</p>
                </div>

                {/* Admin Notes */}
                <div>
                  <Label htmlFor="admin_notes" className="text-sm font-medium">Review Notes (optional)</Label>
                  <Textarea
                    id="admin_notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about your review decision..."
                    rows={3}
                    className="mt-1"
                  />
                </div>

                {/* Send to Parent Toggle */}
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Send to Parent</p>
                      <p className="text-xs text-gray-600 mt-1">
                        If enabled, the incident report will be visible to the student&apos;s parent account.
                      </p>
                    </div>
                    <Switch
                      checked={sendToParent}
                      onCheckedChange={setSendToParent}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t pt-4 flex gap-3">
                  <Button
                    onClick={() => handleAdminReview(true)}
                    className="bg-green-600 hover:bg-green-700 flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {sendToParent ? 'Approve & Send to Parent' : 'Approve'}
                  </Button>
                  <Button
                    onClick={() => handleAdminReview(false)}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50 flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Deny
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Incident Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-xl max-h-[80vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>Report New Incident</DialogTitle>
            <DialogDescription>
              Document an incident. It will be sent to the campus administrator for review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Student Picker */}
            {!studentId && (
              <div>
                <Label htmlFor="student_id">Student</Label>
                <Select value={newIncident.student_id} onValueChange={(value) => setNewIncident({ ...newIncident, student_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student..." />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.student_id} value={student.student_id}>
                        {student.first_name} {student.last_name} ({student.grade})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="incident_type">Incident Type</Label>
                <Select value={newIncident.incident_type} onValueChange={(value) => setNewIncident({ ...newIncident, incident_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Behavioral">Behavioral</SelectItem>
                    <SelectItem value="Medical">Medical</SelectItem>
                    <SelectItem value="Safety">Safety</SelectItem>
                    <SelectItem value="Academic">Academic</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select value={newIncident.severity} onValueChange={(value) => setNewIncident({ ...newIncident, severity: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newIncident.description}
                onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                placeholder="Describe what happened..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="action_taken">Action Taken</Label>
              <Textarea
                id="action_taken"
                value={newIncident.action_taken}
                onChange={(e) => setNewIncident({ ...newIncident, action_taken: e.target.value })}
                placeholder="Describe the action taken..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="followup_required"
                checked={newIncident.followup_required}
                onCheckedChange={(checked) => setNewIncident({ ...newIncident, followup_required: checked as boolean })}
              />
              <Label htmlFor="followup_required" className="text-sm font-normal cursor-pointer">
                Followup required
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddIncident}
              className="bg-red-600 hover:bg-red-700"
              disabled={!newIncident.student_id || !newIncident.description || !newIncident.action_taken}
            >
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
