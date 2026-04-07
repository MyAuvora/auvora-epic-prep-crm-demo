import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, Phone, MapPin, Building, Save, Edit2 } from 'lucide-react'

interface ProfileInformationProps {
  isOpen: boolean
  onClose: () => void
  currentRole: 'owner' | 'admin' | 'coach' | 'parent'
}

export function ProfileInformation({ isOpen, onClose, currentRole }: ProfileInformationProps) {
  const [isEditing, setIsEditing] = useState(false)
  
  const getDefaultProfile = () => {
    switch (currentRole) {
      case 'owner':
        return {
          firstName: 'Owner',
          lastName: 'User',
          email: 'owner@epicprep.com',
          phone: '(850) 555-0100',
          address: '123 School St, Pace, FL 32571',
          campus: 'All Campuses',
          role: 'Owner',
          department: 'Administration',
          emergencyContact: 'N/A',
          emergencyPhone: 'N/A'
        }
      case 'admin':
        return {
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@epicprep.com',
          phone: '(850) 555-0101',
          address: '123 School St, Pace, FL 32571',
          campus: 'Pace Campus',
          role: 'Administrator',
          department: 'Administration',
          emergencyContact: 'N/A',
          emergencyPhone: 'N/A'
        }
      case 'coach':
        return {
          firstName: 'Pam',
          lastName: 'Riffle',
          email: 'priffle@epicprep.com',
          phone: '(850) 555-0102',
          address: '456 Coach Ave, Pace, FL 32571',
          campus: 'Pace Campus',
          role: 'Coach',
          department: 'Elementary Education',
          emergencyContact: 'John Riffle',
          emergencyPhone: '(850) 555-0199'
        }
      case 'parent':
        return {
          firstName: 'Parent',
          lastName: 'User',
          email: 'parent@epicprep.com',
          phone: '(850) 555-0103',
          address: '789 Parent Rd, Crestview, FL 32536',
          campus: 'Crestview Campus',
          role: 'Parent',
          department: 'N/A',
          emergencyContact: 'Emergency Contact',
          emergencyPhone: '(850) 555-0198'
        }
    }
  }

  const [profile, setProfile] = useState(getDefaultProfile())

  const handleSave = () => {
    setIsEditing(false)
    alert('Profile updated successfully!')
  }

  const handleCancel = () => {
    setIsEditing(false)
    setProfile(getDefaultProfile())
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-2xl max-h-[80vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Profile Information</span>
            </span>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit</span>
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Profile Photo */}
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            {isEditing && (
              <Button variant="outline" size="sm">
                Upload Photo
              </Button>
            )}
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>First Name</span>
              </Label>
              <Input
                id="firstName"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="lastName" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Last Name</span>
              </Label>
              <Input
                id="lastName"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>Phone</span>
              </Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address" className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Address</span>
              </Label>
              <Input
                id="address"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="campus" className="flex items-center space-x-2">
                <Building className="w-4 h-4" />
                <span>Campus</span>
              </Label>
              <Input
                id="campus"
                value={profile.campus}
                disabled
                className="mt-1 bg-gray-50"
              />
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={profile.role}
                disabled
                className="mt-1 bg-gray-50"
              />
            </div>

            {currentRole !== 'parent' && currentRole !== 'coach' && (
              <div className="md:col-span-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={profile.department}
                  disabled
                  className="mt-1 bg-gray-50"
                />
              </div>
            )}
          </div>

          {/* Emergency Contact */}
          {currentRole !== 'owner' && currentRole !== 'admin' && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyContact">Contact Name</Label>
                  <Input
                    id="emergencyContact"
                    value={profile.emergencyContact}
                    onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="emergencyPhone">Contact Phone</Label>
                  <Input
                    id="emergencyPhone"
                    value={profile.emergencyPhone}
                    onChange={(e) => setProfile({ ...profile, emergencyPhone: e.target.value })}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
