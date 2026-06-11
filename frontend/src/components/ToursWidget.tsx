import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, Clock, User, Phone, Mail } from 'lucide-react';

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
  desired_grade: string;
  stage: string;
  tour_date: string | null;
  tour_campus_id: string | null;
  notes: string;
}

interface ToursWidgetProps {
  campusId: string | null;
}

export function ToursWidget({ campusId }: ToursWidgetProps) {
  const [tours, setTours] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTours = async () => {
    try {
      const params = campusId ? `?campus_id=${campusId}` : '';
      const res = await fetch(`${API_URL}/api/admissions/tours${params}`);
      if (res.ok) {
        const data = await res.json();
        setTours(data);
      }
    } catch (e) {
      console.error('Error fetching tours:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, [campusId]);

  const handleMarkComplete = async (leadId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admissions/tours/${leadId}/complete`, {
        method: 'PUT',
      });
      if (res.ok) {
        fetchTours();
      } else {
        const error = await res.json();
        alert(error.detail || 'Failed to mark tour as complete');
      }
    } catch (e) {
      console.error('Error marking tour complete:', e);
      alert('Failed to mark tour as complete');
    }
  };

  const scheduledTours = tours.filter(t => t.stage === 'Tour Scheduled');
  const completedTours = tours.filter(t => t.stage === 'Tour Complete');

  const formatTourDate = (tourDate: string) => {
    const date = new Date(tourDate);
    const dateStr = date.toLocaleDateString();
    const timeStr = tourDate.includes('T') ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
    return timeStr ? `${dateStr} at ${timeStr}` : dateStr;
  };

  const isUpcoming = (tourDate: string) => {
    return new Date(tourDate) >= new Date(new Date().toDateString());
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Upcoming Tours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">Loading tours...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Tours ({scheduledTours.length} upcoming)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {scheduledTours.length === 0 ? (
          <p className="text-gray-500 text-sm">No upcoming tours scheduled.</p>
        ) : (
          <div className="space-y-4">
            {scheduledTours.map((tour) => (
              <div key={tour.lead_id} className="border rounded-lg p-4 bg-blue-50/50 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {tour.child_first_name} {tour.child_last_name}
                    </h4>
                    <p className="text-sm text-gray-600">Grade: {tour.desired_grade}</p>
                  </div>
                  <Badge className={isUpcoming(tour.tour_date!) ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}>
                    {isUpcoming(tour.tour_date!) ? 'Upcoming' : 'Past Due'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                    {formatTourDate(tour.tour_date!)}
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <User className="h-3.5 w-3.5 text-gray-500" />
                    {tour.parent_first_name} {tour.parent_last_name}
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <Phone className="h-3.5 w-3.5 text-gray-500" />
                    {tour.phone}
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <Mail className="h-3.5 w-3.5 text-gray-500" />
                    {tour.email}
                  </div>
                </div>

                {tour.notes && (
                  <p className="text-xs text-gray-500 italic">Notes: {tour.notes}</p>
                )}

                <Button
                  size="sm"
                  onClick={() => handleMarkComplete(tour.lead_id)}
                  className="mt-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark as Toured
                </Button>
              </div>
            ))}
          </div>
        )}

        {completedTours.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-600 mb-3">Recently Completed ({completedTours.length})</h4>
            <div className="space-y-2">
              {completedTours.slice(0, 3).map((tour) => (
                <div key={tour.lead_id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">{tour.child_first_name} {tour.child_last_name}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {tour.tour_date ? formatTourDate(tour.tour_date) : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
