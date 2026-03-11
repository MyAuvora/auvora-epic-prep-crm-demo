import { useState, useEffect } from 'react'
import { Plus, Pin, Eye, Check, Bell } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Announcement {
  announcement_id: string
  campus_id: string
  title: string
  content: string
  category: string
  status: string
  created_by: string
  created_by_role: string
  approved_by: string | null
  approved_date: string | null
  published_date: string | null
  expires_date: string | null
  is_pinned: boolean
  target_roles: string[]
}

interface AnnouncementManagementProps {
  role: 'admin' | 'teacher'
  userId: string
  campusId: string
}

export function AnnouncementManagement({ role, userId, campusId }: AnnouncementManagementProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    category: 'General',
    is_pinned: false,
    expires_date: ''
  })

  useEffect(() => {
    fetchAnnouncements()
  }, [campusId])

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(`${API_URL}/api/announcements?campus_id=${campusId}`)
      const data = await response.json()
      setAnnouncements(data)
    } catch (error) {
      console.error('Error fetching announcements:', error)
    }
  }

  const handleCreateAnnouncement = async () => {
    try {
      const announcement: Announcement = {
        announcement_id: `ann_${Date.now()}`,
        campus_id: campusId,
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        category: newAnnouncement.category,
        status: role === 'admin' ? 'Published' : 'Pending Approval',
        created_by: userId,
        created_by_role: role === 'admin' ? 'Director' : 'Coach',
        approved_by: role === 'admin' ? userId : null,
        approved_date: role === 'admin' ? new Date().toISOString().split('T')[0] : null,
        published_date: role === 'admin' ? new Date().toISOString().split('T')[0] : null,
        expires_date: newAnnouncement.expires_date || null,
        is_pinned: newAnnouncement.is_pinned,
        target_roles: ['Parent']
      }

      await fetch(`${API_URL}/api/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcement)
      })

      setIsCreateModalOpen(false)
      setNewAnnouncement({
        title: '',
        content: '',
        category: 'General',
        is_pinned: false,
        expires_date: ''
      })
      fetchAnnouncements()
      
      if (role === 'teacher') {
        alert('Announcement submitted for admin approval!')
      } else {
        alert('Announcement published successfully!')
      }
    } catch (error) {
      console.error('Error creating announcement:', error)
      alert('Error creating announcement')
    }
  }

  const handleApproveAnnouncement = async (announcementId: string) => {
    try {
      await fetch(`${API_URL}/api/announcements/${announcementId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_by: userId })
      })

      alert('Announcement approved and published!')
      fetchAnnouncements()
    } catch (error) {
      console.error('Error approving announcement:', error)
      alert('Error approving announcement')
    }
  }

  const handleTogglePin = async (announcement: Announcement) => {
    try {
      await fetch(`${API_URL}/api/announcements/${announcement.announcement_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...announcement, is_pinned: !announcement.is_pinned })
      })

      fetchAnnouncements()
    } catch (error) {
      console.error('Error toggling pin:', error)
    }
  }

  const publishedAnnouncements = announcements.filter(a => a.status === 'Published')
  const pendingAnnouncements = announcements.filter(a => a.status === 'Pending Approval')

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'General': return 'bg-blue-100 text-blue-800'
      case 'Academic': return 'bg-green-100 text-green-800'
      case 'Events': return 'bg-purple-100 text-purple-800'
      case 'Emergency': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
          <p className="text-gray-600">Manage announcements for parents</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-xl max-h-[80vh] overflow-y-auto p-4">
            <DialogHeader>
              <DialogTitle>Create New Announcement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  placeholder="e.g., Important Update"
                />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  placeholder="Announcement details..."
                  rows={6}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={newAnnouncement.category} onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Academic">Academic</SelectItem>
                      <SelectItem value="Events">Events</SelectItem>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Expires On (Optional)</Label>
                  <Input
                    type="date"
                    value={newAnnouncement.expires_date}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, expires_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pin"
                  checked={newAnnouncement.is_pinned}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, is_pinned: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="pin" className="cursor-pointer">Pin to top</Label>
              </div>
              {role === 'teacher' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <Bell className="inline h-4 w-4 mr-1" />
                    This announcement will require admin approval before being published.
                  </p>
                </div>
              )}
              <Button onClick={handleCreateAnnouncement} className="w-full bg-red-600 hover:bg-red-700">
                {role === 'admin' ? 'Publish Announcement' : 'Submit for Approval'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedAnnouncements.length}</div>
            <p className="text-xs text-gray-500">Visible to parents</p>
          </CardContent>
        </Card>

        {role === 'admin' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Bell className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingAnnouncements.length}</div>
              <p className="text-xs text-gray-500">Awaiting review</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pinned</CardTitle>
            <Pin className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {announcements.filter(a => a.is_pinned).length}
            </div>
            <p className="text-xs text-gray-500">At top of feed</p>
          </CardContent>
        </Card>
      </div>

      {role === 'admin' && pendingAnnouncements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingAnnouncements.map((announcement) => (
                <div key={announcement.announcement_id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
                    </div>
                    <Badge className={getCategoryColor(announcement.category)}>
                      {announcement.category}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-xs text-gray-500">
                      Created by {announcement.created_by_role}
                    </p>
                    <Button
                      onClick={() => handleApproveAnnouncement(announcement.announcement_id)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Approve & Publish
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Published Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {publishedAnnouncements.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No published announcements yet.</p>
            ) : (
              publishedAnnouncements.map((announcement) => (
                <div key={announcement.announcement_id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {announcement.is_pinned && (
                          <Pin className="h-4 w-4 text-blue-600" />
                        )}
                        <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
                    </div>
                    <Badge className={getCategoryColor(announcement.category)}>
                      {announcement.category}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center gap-4">
                      <p className="text-xs text-gray-500">
                        Published: {new Date(announcement.published_date || '').toLocaleDateString()}
                      </p>
                      {announcement.expires_date && (
                        <p className="text-xs text-gray-500">
                          Expires: {new Date(announcement.expires_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => handleTogglePin(announcement)}
                      size="sm"
                      variant="outline"
                    >
                      <Pin className="mr-1 h-3 w-3" />
                      {announcement.is_pinned ? 'Unpin' : 'Pin'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
