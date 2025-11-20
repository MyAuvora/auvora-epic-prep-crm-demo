import { useState } from 'react'
import { User, ChevronDown, UserCircle, Settings, HelpCircle, Shield, LogOut } from 'lucide-react'
import { ProfileInformation } from './ProfileInformation'
import { AccountSettings } from './AccountSettings'
import { HelpSupport } from './HelpSupport'
import { PrivacySecurity } from './PrivacySecurity'

interface HeaderProps {
  currentRole: 'admin' | 'teacher' | 'parent'
  onRoleChange: (role: 'admin' | 'teacher' | 'parent') => void
}

export function Header({ currentRole, onRoleChange }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showProfileInfo, setShowProfileInfo] = useState(false)
  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const [showHelpSupport, setShowHelpSupport] = useState(false)
  const [showPrivacySecurity, setShowPrivacySecurity] = useState(false)

  const handleSignOut = () => {
    setShowDropdown(false)
    alert('Sign out functionality - In production, this would clear your session and redirect to login.')
  }

  const handleMenuItemClick = (action: string) => {
    setShowDropdown(false)
    switch (action) {
      case 'profile':
        setShowProfileInfo(true)
        break
      case 'settings':
        setShowAccountSettings(true)
        break
      case 'help':
        setShowHelpSupport(true)
        break
      case 'privacy':
        setShowPrivacySecurity(true)
        break
      case 'signout':
        handleSignOut()
        break
    }
  }

  return (
    <>
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <img 
                src="/epic-prep-logo.jpg" 
                alt="Epic Prep Academy Logo" 
                className="h-16 w-auto object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-white">Epic Prep Academy</h1>
                <p className="text-sm text-amber-400">Auvora CRM</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => onRoleChange('admin')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentRole === 'admin'
                      ? 'bg-amber-600 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Admin
                </button>
                <button
                  onClick={() => onRoleChange('teacher')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentRole === 'teacher'
                      ? 'bg-amber-600 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Teacher
                </button>
                <button
                  onClick={() => onRoleChange('parent')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentRole === 'parent'
                      ? 'bg-amber-600 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Parent
                </button>
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 hover:bg-gray-700 rounded-lg p-2 transition-colors"
                >
                  <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-300" />
                </button>

                {showDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl z-20 py-2">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">
                          {currentRole === 'admin' ? 'Admin User' : currentRole === 'teacher' ? 'Pam Riffle' : 'Parent User'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {currentRole === 'admin' ? 'admin@epicprep.com' : currentRole === 'teacher' ? 'priffle@epicprep.com' : 'parent@epicprep.com'}
                        </p>
                      </div>

                      <button
                        onClick={() => handleMenuItemClick('profile')}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                      >
                        <UserCircle className="w-5 h-5 text-gray-500" />
                        <span>Profile Information</span>
                      </button>

                      <button
                        onClick={() => handleMenuItemClick('settings')}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                      >
                        <Settings className="w-5 h-5 text-gray-500" />
                        <span>Account Settings</span>
                      </button>

                      <button
                        onClick={() => handleMenuItemClick('help')}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                      >
                        <HelpCircle className="w-5 h-5 text-gray-500" />
                        <span>Help & Support</span>
                      </button>

                      <button
                        onClick={() => handleMenuItemClick('privacy')}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                      >
                        <Shield className="w-5 h-5 text-gray-500" />
                        <span>Privacy & Security</span>
                      </button>

                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <button
                          onClick={() => handleMenuItemClick('signout')}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3"
                        >
                          <LogOut className="w-5 h-5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <ProfileInformation 
        isOpen={showProfileInfo} 
        onClose={() => setShowProfileInfo(false)}
        currentRole={currentRole}
      />
      
      <AccountSettings 
        isOpen={showAccountSettings} 
        onClose={() => setShowAccountSettings(false)}
        currentRole={currentRole}
      />
      
      <HelpSupport 
        isOpen={showHelpSupport} 
        onClose={() => setShowHelpSupport(false)}
      />
      
      <PrivacySecurity 
        isOpen={showPrivacySecurity} 
        onClose={() => setShowPrivacySecurity(false)}
      />
    </>
  )
}
