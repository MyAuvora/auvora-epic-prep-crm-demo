import { useState, useEffect } from 'react'
import { Bell, Pin, Eye, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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

interface AnnouncementRead {
  read_id: string
  announcement_id: string
  user_id: string
  read_date: string
}

interface ParentAnnouncementFeedProps {
  userId: string
  campusId: string
}

export function ParentAnnouncementFeed({ userId, campusId }: ParentAnnouncementFeedProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [readAnnouncements, setReadAnnouncements] = useState<Set<string>>(new Set())
  const [expandedAnnouncement, setExpandedAnnouncement] = useState<string | null>(null)

  useEffect(() => {
    fetchAnnouncements()
    fetchReadStatus()
  }, [campusId, userId])

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(`${API_URL}/api/announcements?campus_id=${campusId}&status=Published`)
      const data = await response.json()
      
      const now = new Date()
      const activeAnnouncements = data.filter((a: Announcement) => {
        if (!a.expires_date) return true
        return new Date(a.expires_date) > now
      })
      
      setAnnouncements(activeAnnouncements)
    } catch (error) {
      console.error('Error fetching announcements:', error)
    }
  }

  const fetchReadStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/announcement-reads`)
      const data: AnnouncementRead[] = await response.json()
      const userReads = data.filter(r => r.user_id === userId).map(r => r.announcement_id)
      setReadAnnouncements(new Set(userReads))
    } catch (error) {
      console.error('Error fetching read status:', error)
    }
  }

  const handleMarkAsRead = async (announcementId: string) => {
    if (readAnnouncements.has(announcementId)) return

    try {
      await fetch(`${API_URL}/api/announcements/${announcementId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      })

      setReadAnnouncements(prev => new Set([...prev, announcementId]))
    } catch (error) {
      console.error('Error marking announcement as read:', error)
    }
  }

  const handleToggleExpand = (announcementId: string) => {
    if (expandedAnnouncement === announcementId) {
      setExpandedAnnouncement(null)
    } else {
      setExpandedAnnouncement(announcementId)
      handleMarkAsRead(announcementId)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'General': return 'bg-blue-100 text-blue-800'
      case 'Academic': return 'bg-green-100 text-green-800'
      case 'Events': return 'bg-purple-100 text-purple-800'
      case 'Emergency': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const pinnedAnnouncements = announcements.filter(a => a.is_pinned)
  const regularAnnouncements = announcements.filter(a => !a.is_pinned)
  const unreadCount = announcements.filter(a => !readAnnouncements.has(a.announcement_id)).length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
          <p className="text-gray-600">Stay updated with school news</p>
        </div>
        {unreadCount > 0 && (
          <Badge className="bg-red-500 text-white">
            {unreadCount} Unread
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Announcements</CardTitle>
            <Bell className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{announcements.length}</div>
            <p className="text-xs text-gray-500">Active announcements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
            <p className="text-xs text-gray-500">Need your attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pinned</CardTitle>
            <Pin className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pinnedAnnouncements.length}</div>
            <p className="text-xs text-gray-500">Important updates</p>
          </CardContent>
        </Card>
      </div>

      {pinnedAnnouncements.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pin className="h-5 w-5 text-blue-600" />
              Pinned Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pinnedAnnouncements.map((announcement) => (
                <div
                  key={announcement.announcement_id}
                  className="bg-white border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleToggleExpand(announcement.announcement_id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {!readAnnouncements.has(announcement.announcement_id) && (
                          <div className="h-2 w-2 bg-red-500 rounded-full" />
                        )}
                        <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                      </div>
                      {expandedAnnouncement === announcement.announcement_id ? (
                        <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{announcement.content}</p>
                      ) : (
                        <p className="text-sm text-gray-600 line-clamp-2">{announcement.content}</p>
                      )}
                    </div>
                    <Badge className={getCategoryColor(announcement.category)}>
                      {announcement.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(announcement.published_date || '').toLocaleDateString()}
                    </div>
                    {expandedAnnouncement !== announcement.announcement_id && (
                      <Button variant="link" size="sm" className="h-auto p-0 text-blue-600">
                        Read more
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {regularAnnouncements.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No announcements at this time.</p>
            ) : (
              regularAnnouncements.map((announcement) => (
                <div
                  key={announcement.announcement_id}
                  className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleToggleExpand(announcement.announcement_id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {!readAnnouncements.has(announcement.announcement_id) && (
                          <div className="h-2 w-2 bg-red-500 rounded-full" />
                        )}
                        <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                      </div>
                      {expandedAnnouncement === announcement.announcement_id ? (
                        <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{announcement.content}</p>
                      ) : (
                        <p className="text-sm text-gray-600 line-clamp-2">{announcement.content}</p>
                      )}
                    </div>
                    <Badge className={getCategoryColor(announcement.category)}>
                      {announcement.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(announcement.published_date || '').toLocaleDateString()}
                    </div>
                    {announcement.expires_date && (
                      <div className="flex items-center gap-1">
                        Expires: {new Date(announcement.expires_date).toLocaleDateString()}
                      </div>
                    )}
                    {expandedAnnouncement !== announcement.announcement_id && (
                      <Button variant="link" size="sm" className="h-auto p-0 text-blue-600">
                        Read more
                      </Button>
                    )}
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
