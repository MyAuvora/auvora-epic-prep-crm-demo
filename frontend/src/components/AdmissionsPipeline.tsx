import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, TrendingUp, Calendar, Phone, Mail } from 'lucide-react';
import { AddLeadModal } from './AddLeadModal';
import { LeadDetailModal } from './LeadDetailModal';

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
}

interface PipelineSummary {
  total_leads: number;
  stage_counts: Record<string, number>;
  conversion_rate: number;
}

interface AdmissionsPipelineProps {
  selectedCampusId: string | null;
}

export default function AdmissionsPipeline({ selectedCampusId }: AdmissionsPipelineProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [summary, setSummary] = useState<PipelineSummary | null>(null);
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadModalMode, setLeadModalMode] = useState<'view' | 'update-stage'>('view');
  const [showLeadDetailModal, setShowLeadDetailModal] = useState(false);

  useEffect(() => {
    fetchLeads();
    fetchSummary();
  }, [selectedCampusId, selectedStage]);

  const fetchLeads = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCampusId) params.append('campus_id', selectedCampusId);
      if (selectedStage !== 'all') params.append('stage', selectedStage);
      
      const url = `${API_URL}/api/admissions/leads${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      setLeads(data);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCampusId) params.append('campus_id', selectedCampusId);
      
      const url = `${API_URL}/api/admissions/pipeline-summary${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'New Inquiry': 'bg-blue-100 text-blue-800',
      'Contacted': 'bg-purple-100 text-purple-800',
      'Tour Scheduled': 'bg-yellow-100 text-yellow-800',
      'Toured': 'bg-orange-100 text-orange-800',
      'Application Submitted': 'bg-indigo-100 text-indigo-800',
      'Accepted': 'bg-green-100 text-green-800',
      'Enrolled': 'bg-emerald-100 text-emerald-800',
      'Lost': 'bg-red-100 text-red-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const stages = ['New Inquiry', 'Contacted', 'Tour Scheduled', 'Toured', 'Application Submitted', 'Accepted', 'Enrolled', 'Lost'];

  if (loading) {
    return <div className="p-6">Loading admissions pipeline...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Admissions Pipeline</h2>
          <p className="text-gray-500">Track leads from inquiry to enrollment</p>
        </div>
        <Button onClick={() => setShowAddLeadModal(true)}>Add New Lead</Button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_leads}</div>
              <p className="text-xs text-gray-500">Active inquiries</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.conversion_rate}%</div>
              <p className="text-xs text-gray-500">Inquiry to enrollment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enrolled</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.stage_counts['Enrolled'] || 0}</div>
              <p className="text-xs text-gray-500">Successfully enrolled</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pipeline Stages</CardTitle>
          <CardDescription>View leads by stage in the admissions process</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedStage} onValueChange={setSelectedStage}>
            <TabsList className="grid grid-cols-4 lg:grid-cols-9 mb-4">
              <TabsTrigger value="all">All ({leads.length})</TabsTrigger>
              {stages.map(stage => (
                <TabsTrigger key={stage} value={stage}>
                  {stage.split(' ')[0]} ({summary?.stage_counts[stage] || 0})
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedStage} className="space-y-4">
              {leads.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No leads found for this stage
                </div>
              ) : (
                <div className="space-y-3">
                  {leads.map(lead => (
                    <Card key={lead.lead_id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg">
                                {lead.child_first_name} {lead.child_last_name}
                              </h3>
                              <Badge className={getStageColor(lead.stage)}>
                                {lead.stage}
                              </Badge>
                              <Badge variant="outline">Grade {lead.desired_grade}</Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>Parent: {lead.parent_first_name} {lead.parent_last_name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <span>{lead.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>{lead.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Start: {new Date(lead.desired_start_date).toLocaleDateString()}</span>
                              </div>
                            </div>

                            {lead.tour_date && (
                              <div className="flex items-center gap-2 text-sm text-blue-600">
                                <Calendar className="h-4 w-4" />
                                <span>Tour scheduled: {new Date(lead.tour_date).toLocaleDateString()}</span>
                              </div>
                            )}

                            <p className="text-sm text-gray-600 italic">{lead.notes}</p>
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedLead(lead);
                                setLeadModalMode('view');
                                setShowLeadDetailModal(true);
                              }}
                            >
                              View
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => {
                                setSelectedLead(lead);
                                setLeadModalMode('update-stage');
                                setShowLeadDetailModal(true);
                              }}
                            >
                              Update Stage
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AddLeadModal
        open={showAddLeadModal}
        onClose={() => setShowAddLeadModal(false)}
        onLeadAdded={() => {
          fetchLeads();
          fetchSummary();
          setSelectedStage('all');
        }}
        selectedCampusId={selectedCampusId}
      />

      <LeadDetailModal
        open={showLeadDetailModal}
        onClose={() => {
          setShowLeadDetailModal(false);
          setSelectedLead(null);
        }}
        lead={selectedLead}
        mode={leadModalMode}
        onLeadUpdated={() => {
          fetchLeads();
          fetchSummary();
        }}
      />
    </div>
  );
}
