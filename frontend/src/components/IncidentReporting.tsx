import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, User, FileText, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Incident {
  incident_id: string;
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
}

interface IncidentReportingProps {
  role: 'admin' | 'teacher' | 'parent';
  studentId?: string;
  userId?: string;
}

export const IncidentReporting: React.FC<IncidentReportingProps> = ({ role, studentId, userId }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newIncident, setNewIncident] = useState({
    student_id: studentId || '',
    incident_type: 'Behavioral',
    severity: 'Low',
    description: '',
    action_taken: '',
    parent_notified: false,
    followup_required: false
  });

  useEffect(() => {
    fetchIncidents();
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

  const handleAddIncident = async () => {
    if (!userId) return;
    
    try {
      const now = new Date();
      await fetch(`${API_URL}/api/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: `inc_${Date.now()}`,
          reported_by_staff_id: userId,
          date: now.toISOString().split('T')[0],
          time: now.toTimeString().split(' ')[0].substring(0, 5),
          ...newIncident
        })
      });
      
      setShowAddModal(false);
      setNewIncident({
        student_id: studentId || '',
        incident_type: 'Behavioral',
        severity: 'Low',
        description: '',
        action_taken: '',
        parent_notified: false,
        followup_required: false
      });
      fetchIncidents();
    } catch (error) {
      console.error('Error adding incident:', error);
    }
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

  const highSeverityIncidents = incidents.filter(i => i.severity === 'High');
  const otherIncidents = incidents.filter(i => i.severity !== 'High');

  if (loading) {
    return <div className="text-center py-8">Loading incidents...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Incident Reports</h2>
        <div className="flex gap-2">
          {(role === 'admin' || role === 'teacher') && (
            <Button onClick={() => setShowAddModal(true)} className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Incident
            </Button>
          )}
          {role === 'admin' && (
            <>
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

      {highSeverityIncidents.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4 text-red-600">High Priority Incidents</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {highSeverityIncidents.map((incident) => (
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
                    <p className="text-gray-700 line-clamp-2">{incident.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
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

      {otherIncidents.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">All Incidents</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {otherIncidents.map((incident) => (
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
                    <p className="text-gray-700 line-clamp-2">{incident.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
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

      {incidents.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">No incidents reported</p>
        </div>
      )}

      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
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
                      <p className="text-sm font-medium">Reported By</p>
                      <p className="text-sm text-gray-600">Staff ID: {selectedIncident.reported_by_staff_id}</p>
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
              Document an incident that occurred with a student
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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

            {!studentId && (
              <div>
                <Label htmlFor="student_id">Student ID</Label>
                <Input
                  id="student_id"
                  value={newIncident.student_id}
                  onChange={(e) => setNewIncident({ ...newIncident, student_id: e.target.value })}
                  placeholder="Enter student ID"
                />
              </div>
            )}

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

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="parent_notified"
                  checked={newIncident.parent_notified}
                  onCheckedChange={(checked) => setNewIncident({ ...newIncident, parent_notified: checked as boolean })}
                />
                <Label htmlFor="parent_notified" className="text-sm font-normal cursor-pointer">
                  Parent has been notified
                </Label>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddIncident}
              className="bg-amber-600 hover:bg-amber-700"
              disabled={!newIncident.student_id || !newIncident.description || !newIncident.action_taken}
            >
              Report Incident
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
