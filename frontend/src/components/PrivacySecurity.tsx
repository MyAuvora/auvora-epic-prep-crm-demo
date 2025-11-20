import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Shield, Eye, Lock, Download, Trash2, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

interface PrivacySecurityProps {
  isOpen: boolean
  onClose: () => void
}

export function PrivacySecurity({ isOpen, onClose }: PrivacySecurityProps) {
  const [activeTab, setActiveTab] = useState<'privacy' | 'security' | 'data'>('privacy')
  
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'school',
    showEmail: false,
    showPhone: false,
    allowMessages: true,
    shareAttendance: true,
    shareGrades: true
  })

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: '30',
    allowMultipleSessions: true
  })

  const handlePrivacySave = () => {
    alert('Privacy settings saved successfully!')
  }

  const handleSecuritySave = () => {
    alert('Security settings saved successfully!')
  }

  const handleDownloadData = () => {
    alert('Your data export has been initiated. You will receive an email with a download link within 24 hours.')
  }

  const handleDeleteAccount = () => {
    const confirmed = confirm(
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.'
    )
    if (confirmed) {
      alert('Account deletion request submitted. Our team will process this within 7 business days.')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-2xl max-h-[80vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Privacy & Security</span>
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex space-x-1 border-b mt-4">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'privacy'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Privacy
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Security
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'data'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Data & Privacy
          </button>
        </div>

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div className="space-y-6 mt-4">
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>Profile Visibility</span>
              </h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="school"
                    checked={privacySettings.profileVisibility === 'school'}
                    onChange={(e) => setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value })}
                  />
                  <div>
                    <span className="text-sm font-medium">School Community</span>
                    <p className="text-xs text-gray-600">Visible to all staff and parents at your school</p>
                  </div>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="staff"
                    checked={privacySettings.profileVisibility === 'staff'}
                    onChange={(e) => setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value })}
                  />
                  <div>
                    <span className="text-sm font-medium">Staff Only</span>
                    <p className="text-xs text-gray-600">Visible only to school staff members</p>
                  </div>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={privacySettings.profileVisibility === 'private'}
                    onChange={(e) => setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value })}
                  />
                  <div>
                    <span className="text-sm font-medium">Private</span>
                    <p className="text-xs text-gray-600">Only visible to administrators</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Contact Information</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={privacySettings.showEmail}
                    onChange={(e) => setPrivacySettings({ ...privacySettings, showEmail: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Show email address in profile</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={privacySettings.showPhone}
                    onChange={(e) => setPrivacySettings({ ...privacySettings, showPhone: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Show phone number in profile</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={privacySettings.allowMessages}
                    onChange={(e) => setPrivacySettings({ ...privacySettings, allowMessages: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Allow direct messages from other users</span>
                </label>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Data Sharing</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={privacySettings.shareAttendance}
                    onChange={(e) => setPrivacySettings({ ...privacySettings, shareAttendance: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Share attendance data with authorized staff</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={privacySettings.shareGrades}
                    onChange={(e) => setPrivacySettings({ ...privacySettings, shareGrades: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Share grade data with authorized staff</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handlePrivacySave}>Save Privacy Settings</Button>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6 mt-4">
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center space-x-2">
                <Lock className="w-4 h-4" />
                <span>Authentication</span>
              </h3>
              <div className="space-y-3">
                <div className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Two-Factor Authentication</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.twoFactorAuth}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, twoFactorAuth: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                <div className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Login Alerts</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Get notified when someone logs into your account
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.loginAlerts}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, loginAlerts: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Session Management</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Session Timeout</label>
                  <select
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                    <option value="never">Never</option>
                  </select>
                  <p className="text-xs text-gray-600 mt-1">
                    Automatically log out after period of inactivity
                  </p>
                </div>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={securitySettings.allowMultipleSessions}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, allowMultipleSessions: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Allow multiple active sessions</span>
                </label>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-sm text-blue-900 mb-2">Active Sessions</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-medium text-blue-900">Current Session</p>
                    <p className="text-blue-700">Chrome on Windows • Last active: Now</p>
                  </div>
                  <span className="text-green-600 font-medium">Active</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleSecuritySave}>Save Security Settings</Button>
            </div>
          </div>
        )}

        {/* Data & Privacy Tab */}
        {activeTab === 'data' && (
          <div className="space-y-6 mt-4">
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Download Your Data</span>
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Request a copy of all your data stored in the system. This includes profile information, 
                messages, documents, and activity history.
              </p>
              <Button onClick={handleDownloadData} variant="outline" className="flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Request Data Export</span>
              </Button>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Data Retention</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  We retain your data for as long as your account is active. After account deletion, 
                  most data is removed within 30 days, though some information may be retained for 
                  legal and compliance purposes.
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Privacy Policy</h3>
              <p className="text-sm text-gray-600 mb-3">
                Review our privacy policy to understand how we collect, use, and protect your data.
              </p>
              <Button variant="outline" size="sm">
                View Privacy Policy
              </Button>
            </div>

            <div className="border-t pt-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2 flex items-center space-x-2 text-red-900">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Danger Zone</span>
                </h3>
                <p className="text-sm text-red-800 mb-3">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button 
                  onClick={handleDeleteAccount}
                  variant="destructive"
                  className="flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Account</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
