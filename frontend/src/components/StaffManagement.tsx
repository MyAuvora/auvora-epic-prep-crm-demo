import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Mail, Phone, Briefcase } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Staff {
  staff_id: string;
  first_name: string;
  last_name: string;
  role: string;
  email: string;
  phone?: string;
  assigned_rooms?: string[];
  campus_id: string;
}

interface StaffManagementProps {
  campusId?: string;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({ campusId }) => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newStaff, setNewStaff] = useState({
    first_name: '',
    last_name: '',
    role: 'Teacher',
    email: '',
    phone: '',
    assigned_rooms: [] as string[],
    campus_id: campusId || 'campus_pace'
  });

  useEffect(() => {
    fetchStaff();
  }, [campusId]);

  const fetchStaff = async () => {
    try {
      const url = campusId 
        ? `${API_URL}/api/staff?campus_id=${campusId}`
        : `${API_URL}/api/staff`;
      const response = await fetch(url);
      const data = await response.json();
      setStaff(data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    try {
      await fetch(`${API_URL}/api/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: `staff_${Date.now()}`,
          ...newStaff
        })
      });
      
      setShowAddModal(false);
      setNewStaff({
        first_name: '',
        last_name: '',
        role: 'Teacher',
        email: '',
        phone: '',
        assigned_rooms: [],
        campus_id: campusId || 'campus_pace'
      });
      fetchStaff();
    } catch (error) {
      console.error('Error adding staff:', error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      'Owner': 'bg-purple-100 text-purple-800',
      'Director': 'bg-blue-100 text-blue-800',
      'Manager': 'bg-green-100 text-green-800',
      'Admin': 'bg-amber-100 text-amber-800',
      'Teacher': 'bg-teal-100 text-teal-800',
      'Assistant': 'bg-gray-100 text-gray-800'
    };
    return colors[role] || colors['Teacher'];
  };

  const groupedStaff = {
    leadership: staff.filter(s => ['Owner', 'Director', 'Manager'].includes(s.role)),
    admin: staff.filter(s => s.role === 'Admin'),
    teachers: staff.filter(s => s.role === 'Teacher'),
    assistants: staff.filter(s => s.role === 'Assistant')
  };

  if (loading) {
    return <div className="text-center py-8">Loading staff...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Staff Management</h2>
          <p className="text-gray-600 mt-1">Manage teachers and staff members</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-amber-600 hover:bg-amber-700">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leadership</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupedStaff.leadership.length}</div>
            <p className="text-xs text-gray-500">Owners, Directors, Managers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Briefcase className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupedStaff.admin.length}</div>
            <p className="text-xs text-gray-500">Administrative staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <Users className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupedStaff.teachers.length}</div>
            <p className="text-xs text-gray-500">Teaching staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assistants</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupedStaff.assistants.length}</div>
            <p className="text-xs text-gray-500">Support staff</p>
          </CardContent>
        </Card>
      </div>

      {/* Leadership Section */}
      {groupedStaff.leadership.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Leadership Team</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groupedStaff.leadership.map((member) => (
              <Card key={member.staff_id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">
                      {member.first_name} {member.last_name}
                    </CardTitle>
                    <Badge className={getRoleBadgeColor(member.role)}>{member.role}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{member.email}</span>
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Teachers Section */}
      {groupedStaff.teachers.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Teachers</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groupedStaff.teachers.map((teacher) => (
              <Card key={teacher.staff_id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">
                      {teacher.first_name} {teacher.last_name}
                    </CardTitle>
                    <Badge className={getRoleBadgeColor(teacher.role)}>{teacher.role}</Badge>
                  </div>
                  {teacher.assigned_rooms && teacher.assigned_rooms.length > 0 && (
                    <CardDescription>
                      {teacher.assigned_rooms.join(', ')}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{teacher.email}</span>
                    </div>
                    {teacher.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{teacher.phone}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Admin & Assistants Section */}
      {(groupedStaff.admin.length > 0 || groupedStaff.assistants.length > 0) && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Administrative & Support Staff</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...groupedStaff.admin, ...groupedStaff.assistants].map((member) => (
              <Card key={member.staff_id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">
                      {member.first_name} {member.last_name}
                    </CardTitle>
                    <Badge className={getRoleBadgeColor(member.role)}>{member.role}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{member.email}</span>
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Staff Member</DialogTitle>
            <DialogDescription>
              Add a new teacher or staff member to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={newStaff.first_name}
                  onChange={(e) => setNewStaff({ ...newStaff, first_name: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={newStaff.last_name}
                  onChange={(e) => setNewStaff({ ...newStaff, last_name: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={newStaff.role} onValueChange={(value) => setNewStaff({ ...newStaff, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Owner">Owner</SelectItem>
                  <SelectItem value="Director">Director</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Teacher">Teacher</SelectItem>
                  <SelectItem value="Assistant">Assistant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newStaff.email}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                placeholder="john.doe@epicprep.com"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={newStaff.phone}
                onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddStaff}
              className="bg-amber-600 hover:bg-amber-700"
              disabled={!newStaff.first_name || !newStaff.last_name || !newStaff.email}
            >
              Add Staff Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
