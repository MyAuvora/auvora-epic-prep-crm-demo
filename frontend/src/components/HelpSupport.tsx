import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HelpCircle, Mail, Phone, MessageSquare, Book, Video, FileText } from 'lucide-react'
import { useState } from 'react'

interface HelpSupportProps {
  isOpen: boolean
  onClose: () => void
}

export function HelpSupport({ isOpen, onClose }: HelpSupportProps) {
  const [activeTab, setActiveTab] = useState<'contact' | 'resources'>('contact')
  const [supportForm, setSupportForm] = useState({
    subject: '',
    category: 'technical',
    message: ''
  })

  const handleSubmitTicket = () => {
    if (!supportForm.subject || !supportForm.message) {
      alert('Please fill in all required fields')
      return
    }
    alert('Support ticket submitted successfully! Our team will respond within 24 hours.')
    setSupportForm({ subject: '', category: 'technical', message: '' })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-2xl max-h-[80vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5" />
            <span>Help & Support</span>
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex space-x-1 border-b mt-4">
          <button
            onClick={() => setActiveTab('contact')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'contact'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Contact Support
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'resources'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Resources
          </button>
        </div>

        {/* Contact Support Tab */}
        {activeTab === 'contact' && (
          <div className="space-y-6 mt-4">
            {/* Quick Contact Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Email Support</h3>
                    <p className="text-xs text-gray-600">support@epicprep.com</p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Phone Support</h3>
                    <p className="text-xs text-gray-600">(850) 555-HELP</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Ticket Form */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>Submit a Support Ticket</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={supportForm.subject}
                    onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                    placeholder="Brief description of your issue"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={supportForm.category}
                    onChange={(e) => setSupportForm({ ...supportForm, category: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="technical">Technical Issue</option>
                    <option value="billing">Billing Question</option>
                    <option value="account">Account Management</option>
                    <option value="feature">Feature Request</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="message">Message *</Label>
                  <textarea
                    id="message"
                    value={supportForm.message}
                    onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                    placeholder="Please describe your issue in detail..."
                    rows={5}
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSubmitTicket}>Submit Ticket</Button>
                </div>
              </div>
            </div>

            {/* Support Hours */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-sm text-blue-900 mb-2">Support Hours</h4>
              <p className="text-xs text-blue-800">
                Monday - Friday: 8:00 AM - 6:00 PM CT<br />
                Saturday: 9:00 AM - 2:00 PM CT<br />
                Sunday: Closed
              </p>
              <p className="text-xs text-blue-700 mt-2">
                Emergency support available 24/7 for critical issues
              </p>
            </div>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* User Guide */}
              <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Book className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">User Guide</h3>
                    <p className="text-xs text-gray-600 mt-1">
                      Comprehensive documentation on all CRM features
                    </p>
                  </div>
                </div>
              </div>

              {/* Video Tutorials */}
              <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Video className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Video Tutorials</h3>
                    <p className="text-xs text-gray-600 mt-1">
                      Step-by-step video guides for common tasks
                    </p>
                  </div>
                </div>
              </div>

              {/* Knowledge Base */}
              <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Knowledge Base</h3>
                    <p className="text-xs text-gray-600 mt-1">
                      FAQs and troubleshooting articles
                    </p>
                  </div>
                </div>
              </div>

              {/* Release Notes */}
              <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Release Notes</h3>
                    <p className="text-xs text-gray-600 mt-1">
                      Latest updates and new features
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Quick Tips</h3>
              <div className="space-y-2">
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-sm font-medium">Keyboard Shortcuts</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Press <kbd className="px-2 py-1 bg-white border rounded">Ctrl+K</kbd> to open quick search
                  </p>
                </div>
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-sm font-medium">Export Data</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Most tables have an export button to download data as CSV
                  </p>
                </div>
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-sm font-medium">Mobile App</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Download our mobile app for iOS and Android for on-the-go access
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
