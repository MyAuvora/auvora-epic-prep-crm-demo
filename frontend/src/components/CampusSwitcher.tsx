import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';

interface Campus {
  campus_id: string;
  organization_id: string;
  name: string;
  location: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
}

interface CampusSwitcherProps {
  onCampusChange: (campusId: string | null) => void;
  selectedCampusId: string | null;
}

export function CampusSwitcher({ onCampusChange, selectedCampusId }: CampusSwitcherProps) {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampuses();
  }, []);

  const fetchCampuses = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/campuses`);
      const data = await response.json();
      setCampuses(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching campuses:', error);
      setLoading(false);
    }
  };

  const handleCampusChange = (value: string) => {
    if (value === 'all') {
      onCampusChange(null);
    } else {
      onCampusChange(value);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Building2 className="w-4 h-4" />
        <span>Loading campuses...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="w-4 h-4 text-gray-600" />
      <Select value={selectedCampusId || 'all'} onValueChange={handleCampusChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select campus" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Campuses</SelectItem>
          {campuses.map((campus) => (
            <SelectItem key={campus.campus_id} value={campus.campus_id}>
              {campus.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
