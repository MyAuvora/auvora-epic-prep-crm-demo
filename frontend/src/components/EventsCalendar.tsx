import React, { useState, useEffect } from 'react';
import { MapPin, Clock, DollarSign, FileText, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EventCommitmentWorkflow } from './EventCommitmentWorkflow';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Event {
  event_id: string;
  campus_id: string;
  title: string;
  description: string;
  event_type: string;
  date: string;
  time: string;
  location: string;
  capacity?: number;
  registered_count?: number;
  permission_slip_content?: string | null;
  payment_description?: string | null;
  requires_rsvp: boolean;
  requires_permission_slip: boolean;
  requires_payment: boolean;
  payment_amount: number | null;
  created_by_staff_id: string;
}

interface EventRSVP {
  rsvp_id: string;
  event_id: string;
  family_id: string;
  parent_id: string;
  student_ids: string[];
  status: string;
  response_date: string | null;
}

interface EventsCalendarProps {
  role: 'admin' | 'teacher' | 'parent';
  familyId?: string;
  userId?: string;
}

export const EventsCalendar: React.FC<EventsCalendarProps> = ({ role, familyId, userId: _userId }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [rsvps, setRsvps] = useState<EventRSVP[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [workflowEvent, setWorkflowEvent] = useState<Event | null>(null);

  useEffect(() => {
    fetchEvents();
    if (familyId) {
      fetchRSVPs();
    }
  }, [familyId]);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/events`);
      const data = await response.json();
      setEvents(data.sort((a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRSVPs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rsvps?family_id=${familyId}`);
      const data = await response.json();
      setRsvps(data);
    } catch (error) {
      console.error('Error fetching RSVPs:', error);
    }
  };

  const handleRSVP = async (eventId: string, status: string) => {
    if (!familyId) return;

    if (status === 'Attending') {
      const event = events.find(e => e.event_id === eventId);
      if (event && (event.requires_permission_slip || event.requires_payment)) {
        setWorkflowEvent(event);
        setShowWorkflowModal(true);
        setSelectedEvent(null); // Close the event details modal
        return;
      }
    }

    try {
      const existingRSVP = rsvps.find(r => r.event_id === eventId);
      
      if (existingRSVP) {
        await fetch(`${API_URL}/api/rsvps/${existingRSVP.rsvp_id}?status=${status}`, {
          method: 'PUT',
        });
      } else {
        await fetch(`${API_URL}/api/rsvps`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rsvp_id: `rsvp_${Date.now()}`,
            event_id: eventId,
            family_id: familyId,
            parent_id: 'parent_1',
            student_ids: [],
            status: status,
            response_date: new Date().toISOString()
          })
        });
      }
      
      fetchRSVPs();
    } catch (error) {
      console.error('Error updating RSVP:', error);
    }
  };

  const handleWorkflowComplete = () => {
    setShowWorkflowModal(false);
    setWorkflowEvent(null);
    fetchRSVPs(); // Refresh RSVPs after workflow completion
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Field Trip': 'bg-blue-100 text-blue-800',
      'School Event': 'bg-green-100 text-green-800',
      'Fundraiser': 'bg-purple-100 text-purple-800',
      'Performance': 'bg-pink-100 text-pink-800',
      'Parent Night': 'bg-yellow-100 text-yellow-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors['Other'];
  };

  const getRSVPStatus = (eventId: string) => {
    const rsvp = rsvps.find(r => r.event_id === eventId);
    return rsvp?.status || 'Pending';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) >= new Date();
  };

  const upcomingEvents = events.filter(e => isUpcoming(e.date));
  const pastEvents = events.filter(e => !isUpcoming(e.date));

  if (loading) {
    return <div className="text-center py-8">Loading events...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
        {upcomingEvents.length === 0 ? (
          <p className="text-gray-500">No upcoming events</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((event) => (
              <Card key={event.event_id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedEvent(event)}>
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <Badge className={getEventTypeColor(event.event_type)}>{event.event_type}</Badge>
                  </div>
                  <CardDescription>{formatDate(event.date)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>{event.location}</span>
                    </div>
                    {event.requires_payment && event.payment_amount && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span>${event.payment_amount.toFixed(2)}</span>
                      </div>
                    )}
                    {event.requires_permission_slip && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span>Permission slip required</span>
                      </div>
                    )}
                    {role === 'parent' && event.requires_rsvp && (
                      <div className="mt-4">
                        <Badge variant={getRSVPStatus(event.event_id) === 'Attending' ? 'default' : 'outline'}>
                          RSVP: {getRSVPStatus(event.event_id)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {pastEvents.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Past Events</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastEvents.map((event) => (
              <Card key={event.event_id} className="opacity-75 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setSelectedEvent(event)}>
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <Badge className={getEventTypeColor(event.event_type)}>{event.event_type}</Badge>
                  </div>
                  <CardDescription>{formatDate(event.date)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-xl max-h-[80vh] overflow-y-auto p-4">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start mb-2">
                  <DialogTitle className="text-2xl">{selectedEvent.title}</DialogTitle>
                  <Badge className={getEventTypeColor(selectedEvent.event_type)}>{selectedEvent.event_type}</Badge>
                </div>
                <DialogDescription>{formatDate(selectedEvent.date)}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-gray-700">{selectedEvent.description}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Time</p>
                      <p className="text-sm text-gray-600">{selectedEvent.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-gray-600">{selectedEvent.location}</p>
                    </div>
                  </div>
                </div>

                {selectedEvent.requires_payment && selectedEvent.payment_amount && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                      <p className="font-medium">Payment Required</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">${selectedEvent.payment_amount.toFixed(2)}</p>
                  </div>
                )}

                {selectedEvent.requires_permission_slip && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-yellow-600" />
                      <p className="font-medium">Permission Slip Required</p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Please sign and return the permission slip before the event.</p>
                  </div>
                )}

                {role === 'parent' && selectedEvent.requires_rsvp && isUpcoming(selectedEvent.date) && (
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={() => handleRSVP(selectedEvent.event_id, 'Attending')}
                      className="flex-1"
                      variant={getRSVPStatus(selectedEvent.event_id) === 'Attending' ? 'default' : 'outline'}
                    >
                      Attending
                    </Button>
                    <Button 
                      onClick={() => handleRSVP(selectedEvent.event_id, 'Not Attending')}
                      className="flex-1"
                      variant={getRSVPStatus(selectedEvent.event_id) === 'Not Attending' ? 'default' : 'outline'}
                    >
                      Not Attending
                    </Button>
                  </div>
                )}

                {role === 'admin' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-gray-600" />
                      <p className="font-medium">RSVP Summary</p>
                    </div>
                    <p className="text-sm text-gray-600">View detailed RSVP list in admin dashboard</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Event Commitment Workflow Modal */}
      {workflowEvent && familyId && (
        <EventCommitmentWorkflow
          isOpen={showWorkflowModal}
          onClose={() => {
            setShowWorkflowModal(false);
            setWorkflowEvent(null);
          }}
          onComplete={handleWorkflowComplete}
          event={workflowEvent}
          familyId={familyId}
          parentId={_userId || 'parent_1'}
        />
      )}
    </div>
  );
};
