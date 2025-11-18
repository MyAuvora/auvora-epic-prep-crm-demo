import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, User, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
}

export const IncidentReporting: React.FC<IncidentReportingProps> = ({ role, studentId }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);

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
        {role === 'admin' && (
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-red-50 text-red-800">
              {highSeverityIncidents.length} High Priority
            </Badge>
            <Badge variant="outline">
              {incidents.length} Total
            </Badge>
          </div>
        )}
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
                      <Badge className={getTypeColor(incident.incident_type)} className="text-xs">
                        {incident.incident_type}
                      </Badge>
                      <Badge className={getSeverityColor(incident.severity)} className="text-xs">
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
        <DialogContent className="max-w-2xl">
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
    </div>
  );
};
