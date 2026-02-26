import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Mail, Phone, Briefcase, ArrowLeft, MapPin, FileText, Upload, Download, Trash2, Edit, User, DollarSign, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface EmploymentAgreement {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  status: 'signed' | 'pending' | 'expired';
}

interface Staff {
  staff_id: string;
  first_name: string;
  last_name: string;
  role: string;
  email: string;
  phone?: string;
  assigned_rooms?: string[];
  campus_id: string;
  hire_date?: string;
  department?: string;
  employment_type?: string;
  hourly_rate?: number;
  salary?: number;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  date_of_birth?: string;
  ssn_last_four?: string;
  notes?: string;
  employment_agreements?: EmploymentAgreement[];
}

interface StaffManagementProps {
  campusId?: string;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({ campusId }) => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showFullProfile, setShowFullProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedStaff, setEditedStaff] = useState<Staff | null>(null);
  const [newStaff, setNewStaff] = useState({
    first_name: '',
    last_name: '',
    role: 'Coach',
    email: '',
    phone: '',
    assigned_rooms: [] as string[],
    campus_id: campusId || 'pace'
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
        role: 'Coach',
        email: '',
        phone: '',
        assigned_rooms: [],
        campus_id: campusId || 'pace'
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
      'Coach': 'bg-teal-100 text-teal-800',
      'Assistant': 'bg-gray-100 text-gray-800'
    };
    return colors[role] || colors['Coach'];
  };

  const handleStaffClick = (member: Staff) => {
    setSelectedStaff(member);
    setEditedStaff(member);
    setShowFullProfile(true);
  };

  const handleBackToList = () => {
    setShowFullProfile(false);
    setSelectedStaff(null);
    setIsEditing(false);
    setEditedStaff(null);
  };

  const handleSaveStaff = async () => {
    if (!editedStaff) return;
    setIsEditing(false);
    setSelectedStaff(editedStaff);
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      'signed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'expired': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const mockAgreements: EmploymentAgreement[] = [
    { id: '1', name: 'Employment Contract', type: 'Contract', uploadDate: '2024-01-15', status: 'signed' },
    { id: '2', name: 'Non-Disclosure Agreement', type: 'NDA', uploadDate: '2024-01-15', status: 'signed' },
    { id: '3', name: 'Background Check Authorization', type: 'Authorization', uploadDate: '2024-01-10', status: 'signed' },
    { id: '4', name: 'W-4 Tax Form', type: 'Tax Form', uploadDate: '2024-01-15', status: 'signed' },
    { id: '5', name: 'Direct Deposit Authorization', type: 'Banking', uploadDate: '2024-01-15', status: 'signed' },
  ];

  const getLocationName = (campusId: string) => {
    const locations: Record<string, string> = {
      'pace': 'Pace',
      'navarre': 'Navarre',
      'crestview_north': 'Crestview North',
      'crestview_main_street': 'Crestview Main Street'
    };
    return locations[campusId] || campusId;
  };

  const groupedStaff = {
    leadership: staff.filter(s => ['Owner', 'Director', 'Manager'].includes(s.role)),
    admin: staff.filter(s => s.role === 'Admin'),
    teachers: staff.filter(s => s.role === 'Coach'),
    assistants: staff.filter(s => s.role === 'Assistant')
  };

  if (loading) {
    return <div className="text-center py-8">Loading staff...</div>;
  }

  if (showFullProfile && selectedStaff) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBackToList} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Staff List
          </Button>
        </div>

        <div className="bg-gradient-to-r from-blue-900 to-red-600 rounded-lg p-6 text-white">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold">
              {selectedStaff.first_name[0]}{selectedStaff.last_name[0]}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{selectedStaff.first_name} {selectedStaff.last_name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge className="bg-white/20 text-white border-white/30">{selectedStaff.role}</Badge>
                <span className="text-white/80">|</span>
                <span className="text-white/80">{getLocationName(selectedStaff.campus_id || 'pace')}</span>
              </div>
              <div className="flex items-center gap-4 mt-3 text-white/80 text-sm">
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {selectedStaff.email}
                </div>
                {selectedStaff.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {selectedStaff.phone}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" onClick={() => setIsEditing(!isEditing)}>
                <Edit className="w-4 h-4 mr-2" />
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="compensation">Compensation</TabsTrigger>
            <TabsTrigger value="agreements">Agreements</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>First Name</Label>
                          <Input value={editedStaff?.first_name || ''} onChange={(e) => setEditedStaff(prev => prev ? {...prev, first_name: e.target.value} : null)} />
                        </div>
                        <div>
                          <Label>Last Name</Label>
                          <Input value={editedStaff?.last_name || ''} onChange={(e) => setEditedStaff(prev => prev ? {...prev, last_name: e.target.value} : null)} />
                        </div>
                      </div>
                      <div>
                        <Label>Date of Birth</Label>
                        <Input type="date" value={editedStaff?.date_of_birth || ''} onChange={(e) => setEditedStaff(prev => prev ? {...prev, date_of_birth: e.target.value} : null)} />
                      </div>
                      <div>
                        <Label>SSN (Last 4 digits)</Label>
                        <Input value={editedStaff?.ssn_last_four || ''} maxLength={4} placeholder="XXXX" onChange={(e) => setEditedStaff(prev => prev ? {...prev, ssn_last_four: e.target.value} : null)} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-500">Full Name</span>
                        <span className="font-medium">{selectedStaff.first_name} {selectedStaff.last_name}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-500">Date of Birth</span>
                        <span className="font-medium">{selectedStaff.date_of_birth || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-500">SSN (Last 4)</span>
                        <span className="font-medium">{selectedStaff.ssn_last_four ? `XXX-XX-${selectedStaff.ssn_last_four}` : 'Not provided'}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div>
                        <Label>Email</Label>
                        <Input type="email" value={editedStaff?.email || ''} onChange={(e) => setEditedStaff(prev => prev ? {...prev, email: e.target.value} : null)} />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input value={editedStaff?.phone || ''} onChange={(e) => setEditedStaff(prev => prev ? {...prev, phone: e.target.value} : null)} />
                      </div>
                      <div>
                        <Label>Address</Label>
                        <Input value={editedStaff?.address || ''} placeholder="Street Address" onChange={(e) => setEditedStaff(prev => prev ? {...prev, address: e.target.value} : null)} />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label>City</Label>
                          <Input value={editedStaff?.city || ''} onChange={(e) => setEditedStaff(prev => prev ? {...prev, city: e.target.value} : null)} />
                        </div>
                        <div>
                          <Label>State</Label>
                          <Input value={editedStaff?.state || ''} onChange={(e) => setEditedStaff(prev => prev ? {...prev, state: e.target.value} : null)} />
                        </div>
                        <div>
                          <Label>ZIP</Label>
                          <Input value={editedStaff?.zip || ''} onChange={(e) => setEditedStaff(prev => prev ? {...prev, zip: e.target.value} : null)} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-500">Email</span>
                        <span className="font-medium">{selectedStaff.email}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-500">Phone</span>
                        <span className="font-medium">{selectedStaff.phone || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-500">Address</span>
                        <span className="font-medium text-right">
                          {selectedStaff.address ? (
                            <>
                              {selectedStaff.address}<br />
                              {selectedStaff.city}, {selectedStaff.state} {selectedStaff.zip}
                            </>
                          ) : 'Not provided'}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Contact Name</Label>
                        <Input value={editedStaff?.emergency_contact_name || ''} onChange={(e) => setEditedStaff(prev => prev ? {...prev, emergency_contact_name: e.target.value} : null)} />
                      </div>
                      <div>
                        <Label>Phone Number</Label>
                        <Input value={editedStaff?.emergency_contact_phone || ''} onChange={(e) => setEditedStaff(prev => prev ? {...prev, emergency_contact_phone: e.target.value} : null)} />
                      </div>
                      <div>
                        <Label>Relationship</Label>
                        <Input value={editedStaff?.emergency_contact_relationship || ''} onChange={(e) => setEditedStaff(prev => prev ? {...prev, emergency_contact_relationship: e.target.value} : null)} />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-sm">Contact Name</span>
                        <span className="font-medium">{selectedStaff.emergency_contact_name || 'Not provided'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-sm">Phone Number</span>
                        <span className="font-medium">{selectedStaff.emergency_contact_phone || 'Not provided'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-sm">Relationship</span>
                        <span className="font-medium">{selectedStaff.emergency_contact_relationship || 'Not provided'}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            {isEditing && (
              <div className="flex justify-end mt-4">
                <Button onClick={handleSaveStaff} className="bg-red-600 hover:bg-red-700">Save Changes</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="employment" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Employment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div>
                        <Label>Role</Label>
                        <Select value={editedStaff?.role || ''} onValueChange={(value) => setEditedStaff(prev => prev ? {...prev, role: value} : null)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Owner">Owner</SelectItem>
                            <SelectItem value="Director">Director</SelectItem>
                            <SelectItem value="Manager">Manager</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Coach">Coach</SelectItem>
                            <SelectItem value="Assistant">Assistant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Department</Label>
                        <Input value={editedStaff?.department || ''} onChange={(e) => setEditedStaff(prev => prev ? {...prev, department: e.target.value} : null)} />
                      </div>
                      <div>
                        <Label>Location</Label>
                        <Select value={editedStaff?.campus_id || ''} onValueChange={(value) => setEditedStaff(prev => prev ? {...prev, campus_id: value} : null)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pace">Pace</SelectItem>
                            <SelectItem value="navarre">Navarre</SelectItem>
                            <SelectItem value="crestview_north">Crestview North</SelectItem>
                            <SelectItem value="crestview_main_street">Crestview Main Street</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Employment Type</Label>
                        <Select value={editedStaff?.employment_type || ''} onValueChange={(value) => setEditedStaff(prev => prev ? {...prev, employment_type: value} : null)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full_time">Full-Time</SelectItem>
                            <SelectItem value="part_time">Part-Time</SelectItem>
                            <SelectItem value="contractor">Contractor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Hire Date</Label>
                        <Input type="date" value={editedStaff?.hire_date || ''} onChange={(e) => setEditedStaff(prev => prev ? {...prev, hire_date: e.target.value} : null)} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-500">Role</span>
                        <Badge className={getRoleBadgeColor(selectedStaff.role)}>{selectedStaff.role}</Badge>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-500">Department</span>
                        <span className="font-medium">{selectedStaff.department || 'General'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-500">Location</span>
                        <span className="font-medium">{getLocationName(selectedStaff.campus_id || 'pace')}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-500">Employment Type</span>
                        <span className="font-medium">{selectedStaff.employment_type === 'full_time' ? 'Full-Time' : selectedStaff.employment_type === 'part_time' ? 'Part-Time' : selectedStaff.employment_type || 'Full-Time'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-500">Hire Date</span>
                        <span className="font-medium">{selectedStaff.hire_date || 'Not provided'}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Assignments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">Primary Location</span>
                      <span className="font-medium">{getLocationName(selectedStaff.campus_id || 'pace')}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">Assigned Rooms</span>
                      <span className="font-medium">{selectedStaff.assigned_rooms?.join(', ') || 'None assigned'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            {isEditing && (
              <div className="flex justify-end mt-4">
                <Button onClick={handleSaveStaff} className="bg-red-600 hover:bg-red-700">Save Changes</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="compensation" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Compensation Details
                </CardTitle>
                <CardDescription>Salary and payment information (visible to admins only)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Hourly Rate ($)</Label>
                      <Input type="number" value={editedStaff?.hourly_rate || ''} onChange={(e) => setEditedStaff(prev => prev ? {...prev, hourly_rate: parseFloat(e.target.value)} : null)} />
                    </div>
                    <div>
                      <Label>Annual Salary ($)</Label>
                      <Input type="number" value={editedStaff?.salary || ''} onChange={(e) => setEditedStaff(prev => prev ? {...prev, salary: parseFloat(e.target.value)} : null)} />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-gray-500 text-sm">Hourly Rate</div>
                      <div className="text-2xl font-bold">${selectedStaff.hourly_rate?.toFixed(2) || '0.00'}/hr</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-gray-500 text-sm">Annual Salary</div>
                      <div className="text-2xl font-bold">${selectedStaff.salary?.toLocaleString() || '0'}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            {isEditing && (
              <div className="flex justify-end mt-4">
                <Button onClick={handleSaveStaff} className="bg-red-600 hover:bg-red-700">Save Changes</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="agreements" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Employment Agreements
                    </CardTitle>
                    <CardDescription>Contracts, NDAs, and other employment documents</CardDescription>
                  </div>
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockAgreements.map((agreement) => (
                    <div key={agreement.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <div className="font-medium">{agreement.name}</div>
                          <div className="text-sm text-gray-500">
                            {agreement.type} • Uploaded {new Date(agreement.uploadDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusBadgeColor(agreement.status)}>
                          {agreement.status.charAt(0).toUpperCase() + agreement.status.slice(1)}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notes & Comments</CardTitle>
                <CardDescription>Internal notes about this staff member</CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea 
                    className="min-h-[200px]" 
                    placeholder="Add notes about this employee..."
                    value={editedStaff?.notes || ''}
                    onChange={(e) => setEditedStaff(prev => prev ? {...prev, notes: e.target.value} : null)}
                  />
                ) : (
                  <div className="min-h-[200px] p-4 bg-gray-50 rounded-lg">
                    {selectedStaff.notes || 'No notes added yet.'}
                  </div>
                )}
              </CardContent>
            </Card>
            {isEditing && (
              <div className="flex justify-end mt-4">
                <Button onClick={handleSaveStaff} className="bg-red-600 hover:bg-red-700">Save Changes</Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Staff Management</h2>
          <p className="text-gray-600 mt-1">Manage coaches and staff members</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-red-600 hover:bg-red-700">
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
            <Briefcase className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupedStaff.admin.length}</div>
            <p className="text-xs text-gray-500">Administrative staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coaches</CardTitle>
            <Users className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupedStaff.teachers.length}</div>
            <p className="text-xs text-gray-500">Coaching staff</p>
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
              <Card 
                key={member.staff_id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleStaffClick(member)}
              >
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

            {/* Coaches Section */}
            {groupedStaff.teachers.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Coaches</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groupedStaff.teachers.map((teacher) => (
              <Card 
                key={teacher.staff_id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleStaffClick(teacher)}
              >
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
              <Card 
                key={member.staff_id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleStaffClick(member)}
              >
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
              Add a new coach or staff member to the system
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
                  <SelectItem value="Coach">Coach</SelectItem>
                  <SelectItem value="Assistant">Assistant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Select value={newStaff.campus_id} onValueChange={(value) => setNewStaff({ ...newStaff, campus_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pace">Pace</SelectItem>
                  <SelectItem value="navarre">Navarre</SelectItem>
                  <SelectItem value="crestview_north">Crestview North</SelectItem>
                  <SelectItem value="crestview_main_street">Crestview Main Street</SelectItem>
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
              className="bg-red-600 hover:bg-red-700"
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
