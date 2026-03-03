import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, MessageSquare, Bell, Send, Calendar, Users } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface MessageTemplate {
  template_id: string;
  name: string;
  trigger_type: string;
  communication_type: string;
  subject: string;
  body: string;
  active: boolean;
  created_date: string;
}

interface BroadcastMessage {
  broadcast_id: string;
  campus_id: string | null;
  sender_id: string;
  communication_type: string;
  subject: string;
  body: string;
  recipient_type: string;
  recipient_count: number;
  status: string;
  scheduled_date: string | null;
  sent_date: string | null;
  created_date: string;
}

interface AutomatedAlert {
  alert_id: string;
  trigger_type: string;
  student_id: string;
  family_id: string;
  triggered_date: string;
  message_sent: boolean;
  message_content: string;
  communication_type: string;
}

interface CommunicationAutomationProps {
  selectedCampusId: string | null;
}

export default function CommunicationAutomation({ selectedCampusId }: CommunicationAutomationProps) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([]);
  const [alerts, setAlerts] = useState<AutomatedAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
    fetchBroadcasts();
    fetchAlerts();
  }, [selectedCampusId]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${API_URL}/api/communications/templates`);
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchBroadcasts = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCampusId) params.append('campus_id', selectedCampusId);
      
      const url = `${API_URL}/api/communications/broadcasts${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      setBroadcasts(data);
    } catch (error) {
      console.error('Error fetching broadcasts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/communications/alerts`);
      const data = await response.json();
      setAlerts(data.slice(0, 10));
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Scheduled': 'bg-yellow-100 text-yellow-800',
      'Sent': 'bg-green-100 text-green-800',
      'Failed': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getCommunicationTypeIcon = (type: string) => {
    switch (type) {
      case 'Email':
        return <Mail className="h-4 w-4" />;
      case 'SMS':
        return <MessageSquare className="h-4 w-4" />;
      case 'App Notification':
        return <Bell className="h-4 w-4" />;
      default:
        return <Send className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <div className="p-6">Loading communication automation...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Communication Automation</h2>
          <p className="text-gray-500">Manage templates, broadcasts, and automated alerts</p>
        </div>
        <Button>Create Broadcast</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
            <Mail className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.filter(t => t.active).length}</div>
            <p className="text-xs text-gray-500">Message templates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Broadcasts Sent</CardTitle>
            <Send className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{broadcasts.filter(b => b.status === 'Sent').length}</div>
            <p className="text-xs text-gray-500">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automated Alerts</CardTitle>
            <Bell className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-gray-500">Recent alerts</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="broadcasts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="broadcasts">Broadcast Messages</TabsTrigger>
          <TabsTrigger value="templates">Message Templates</TabsTrigger>
          <TabsTrigger value="alerts">Automated Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="broadcasts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Broadcast Messages</CardTitle>
              <CardDescription>Send messages to groups of parents</CardDescription>
            </CardHeader>
            <CardContent>
              {broadcasts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No broadcast messages found
                </div>
              ) : (
                <div className="space-y-3">
                  {broadcasts.map(broadcast => (
                    <Card key={broadcast.broadcast_id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg">{broadcast.subject}</h3>
                              <Badge className={getStatusColor(broadcast.status)}>
                                {broadcast.status}
                              </Badge>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                {getCommunicationTypeIcon(broadcast.communication_type)}
                                <span>{broadcast.communication_type}</span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>Recipients: {broadcast.recipient_type} ({broadcast.recipient_count})</span>
                              </div>
                              {broadcast.sent_date && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>Sent: {new Date(broadcast.sent_date).toLocaleDateString()}</span>
                                </div>
                              )}
                              {broadcast.scheduled_date && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>Scheduled: {new Date(broadcast.scheduled_date).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>

                            <p className="text-sm text-gray-600 line-clamp-2">{broadcast.body}</p>
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">View</Button>
                            {broadcast.status === 'Draft' && (
                              <Button size="sm">Send</Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Message Templates</CardTitle>
              <CardDescription>Automated message templates for common scenarios</CardDescription>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No templates found
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map(template => (
                    <Card key={template.template_id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg">{template.name}</h3>
                              <Badge variant={template.active ? "default" : "secondary"}>
                                {template.active ? 'Active' : 'Inactive'}
                              </Badge>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                {getCommunicationTypeIcon(template.communication_type)}
                                <span>{template.communication_type}</span>
                              </div>
                            </div>
                            
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Trigger:</span> {template.trigger_type}
                            </div>

                            <div className="text-sm">
                              <span className="font-medium">Subject:</span> {template.subject}
                            </div>

                            <p className="text-sm text-gray-600 line-clamp-2">{template.body}</p>
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">Edit</Button>
                            <Button variant="outline" size="sm">
                              {template.active ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automated Alerts</CardTitle>
              <CardDescription>Recent automated alerts triggered by system events</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No automated alerts found
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map(alert => (
                    <Card key={alert.alert_id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">{alert.trigger_type}</Badge>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                {getCommunicationTypeIcon(alert.communication_type)}
                                <span>{alert.communication_type}</span>
                              </div>
                              <Badge variant={alert.message_sent ? "default" : "secondary"}>
                                {alert.message_sent ? 'Sent' : 'Pending'}
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-gray-600">
                              <Calendar className="h-4 w-4 inline mr-1" />
                              {new Date(alert.triggered_date).toLocaleString()}
                            </div>

                            <p className="text-sm text-gray-600">{alert.message_content}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
