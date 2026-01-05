import { useState } from 'react'
import { User, ChevronDown, UserCircle, Settings, HelpCircle, Shield, LogOut, MapPin } from 'lucide-react'
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
  const [showRoleDropdown, setShowRoleDropdown] = useState(false)
  const [showProfileInfo, setShowProfileInfo] = useState(false)
  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const [showHelpSupport, setShowHelpSupport] = useState(false)
  const [showPrivacySecurity, setShowPrivacySecurity] = useState(false)

  const getRoleLabel = (role: 'admin' | 'teacher' | 'parent') => {
    switch (role) {
      case 'admin': return 'Admin'
      case 'teacher': return 'Coach'
      case 'parent': return 'Parent'
    }
  }

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
      {/* Modern Patriot Color Scheme: Royal Blue Gradient (#0A2463 -> #163B9A) with Signal Red (#E63946) accents */}
      <header className="text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #0A2463 0%, #163B9A 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <img 
                src="/epic-logo.jpg" 
                alt="EPIC Prep Academy Logo" 
                className="h-16 w-auto object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-white">EPIC Prep Academy</h1>
                <p className="text-xs italic text-gray-300">"Raising Lions not Sheep"</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Role/Location Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                >
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">{getRoleLabel(currentRole)}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showRoleDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showRoleDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowRoleDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-20 py-2">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-xs font-medium text-gray-500 uppercase">Select View</p>
                      </div>
                      <button
                        onClick={() => {
                          onRoleChange('admin')
                          setShowRoleDropdown(false)
                        }}
                        className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-2 ${
                          currentRole === 'admin' 
                            ? 'text-white font-medium' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        style={currentRole === 'admin' ? { backgroundColor: '#E63946' } : {}}
                      >
                        <MapPin className="w-4 h-4" />
                        <span>Admin</span>
                      </button>
                      <button
                        onClick={() => {
                          onRoleChange('teacher')
                          setShowRoleDropdown(false)
                        }}
                        className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-2 ${
                          currentRole === 'teacher' 
                            ? 'text-white font-medium' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        style={currentRole === 'teacher' ? { backgroundColor: '#E63946' } : {}}
                      >
                        <MapPin className="w-4 h-4" />
                        <span>Coach</span>
                      </button>
                      <button
                        onClick={() => {
                          onRoleChange('parent')
                          setShowRoleDropdown(false)
                        }}
                        className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-2 ${
                          currentRole === 'parent' 
                            ? 'text-white font-medium' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        style={currentRole === 'parent' ? { backgroundColor: '#E63946' } : {}}
                      >
                        <MapPin className="w-4 h-4" />
                        <span>Parent</span>
                      </button>
                      <div className="border-t border-gray-200 mt-2 pt-2 px-4 py-2">
                        <p className="text-xs text-gray-400 italic">Future: Toggle between school locations</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 rounded-lg p-2 transition-colors"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E63946' }}>
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
                          {currentRole === 'admin' ? 'Admin User' : currentRole === 'teacher' ? 'Coach Pam Riffle' : 'Parent User'}
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
