import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Bell, Globe, Clock, Save } from 'lucide-react'

interface AccountSettingsProps {
  isOpen: boolean
  onClose: () => void
  currentRole: 'admin' | 'teacher' | 'parent'
}

export function AccountSettings({ isOpen, onClose, currentRole }: AccountSettingsProps) {
  const [activeTab, setActiveTab] = useState<'password' | 'notifications' | 'preferences'>('password')
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [notifications, setNotifications] = useState({
    emailAttendance: true,
    emailGrades: true,
    emailAnnouncements: true,
    emailBilling: currentRole === 'parent' || currentRole === 'admin',
    emailIncidents: true,
    smsAttendance: false,
    smsGrades: false,
    smsAnnouncements: false,
    smsBilling: false,
    smsIncidents: true
  })

  const [preferences, setPreferences] = useState({
    timezone: 'America/Chicago',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12-hour',
    language: 'English'
  })

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!')
      return
    }
    if (passwordData.newPassword.length < 8) {
      alert('Password must be at least 8 characters long!')
      return
    }
    alert('Password changed successfully!')
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
  }

  const handleNotificationsSave = () => {
    alert('Notification preferences saved successfully!')
  }

  const handlePreferencesSave = () => {
    alert('Display preferences saved successfully!')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-2xl max-h-[80vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Lock className="w-5 h-5" />
            <span>Account Settings</span>
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex space-x-1 border-b mt-4">
          <button
            onClick={() => setActiveTab('password')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'password'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Password
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'notifications'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'preferences'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Preferences
          </button>
        </div>

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long</p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handlePasswordChange} className="flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>Change Password</span>
              </Button>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 mt-4">
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span>Email Notifications</span>
              </h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={notifications.emailAttendance}
                    onChange={(e) => setNotifications({ ...notifications, emailAttendance: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Attendance alerts</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={notifications.emailGrades}
                    onChange={(e) => setNotifications({ ...notifications, emailGrades: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Grade updates</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={notifications.emailAnnouncements}
                    onChange={(e) => setNotifications({ ...notifications, emailAnnouncements: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Announcements</span>
                </label>
                {(currentRole === 'parent' || currentRole === 'admin') && (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={notifications.emailBilling}
                      onChange={(e) => setNotifications({ ...notifications, emailBilling: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Billing & payment reminders</span>
                  </label>
                )}
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={notifications.emailIncidents}
                    onChange={(e) => setNotifications({ ...notifications, emailIncidents: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Incident reports</span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">SMS Notifications</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={notifications.smsAttendance}
                    onChange={(e) => setNotifications({ ...notifications, smsAttendance: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Attendance alerts</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={notifications.smsGrades}
                    onChange={(e) => setNotifications({ ...notifications, smsGrades: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Grade updates</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={notifications.smsAnnouncements}
                    onChange={(e) => setNotifications({ ...notifications, smsAnnouncements: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Announcements</span>
                </label>
                {(currentRole === 'parent' || currentRole === 'admin') && (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={notifications.smsBilling}
                      onChange={(e) => setNotifications({ ...notifications, smsBilling: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Billing & payment reminders</span>
                  </label>
                )}
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={notifications.smsIncidents}
                    onChange={(e) => setNotifications({ ...notifications, smsIncidents: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Incident reports</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleNotificationsSave} className="flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>Save Preferences</span>
              </Button>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="timezone" className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Timezone</span>
              </Label>
              <select
                id="timezone"
                value={preferences.timezone}
                onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="dateFormat">Date Format</Label>
              <select
                id="dateFormat"
                value={preferences.dateFormat}
                onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            <div>
              <Label htmlFor="timeFormat">Time Format</Label>
              <select
                id="timeFormat"
                value={preferences.timeFormat}
                onChange={(e) => setPreferences({ ...preferences, timeFormat: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="12-hour">12-hour (AM/PM)</option>
                <option value="24-hour">24-hour</option>
              </select>
            </div>

            <div>
              <Label htmlFor="language" className="flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>Language</span>
              </Label>
              <select
                id="language"
                value={preferences.language}
                onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
              </select>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handlePreferencesSave} className="flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>Save Preferences</span>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
