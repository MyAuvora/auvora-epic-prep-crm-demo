import { useState, useEffect, useRef } from 'react'
import { User, ChevronDown, UserCircle, Settings, HelpCircle, Shield, LogOut, MapPin, Search, Users, Home, X } from 'lucide-react'
import { ProfileInformation } from './ProfileInformation'
import { AccountSettings } from './AccountSettings'
import { HelpSupport } from './HelpSupport'
import { PrivacySecurity } from './PrivacySecurity'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface SearchResult {
  type: 'student' | 'family'
  id: string
  name: string
  subtitle: string
}

interface HeaderProps {
  currentRole: 'admin' | 'teacher' | 'parent'
  onRoleChange: (role: 'admin' | 'teacher' | 'parent') => void
  onSearchSelect?: (type: 'student' | 'family', id: string) => void
}

export function Header({ currentRole, onRoleChange, onSearchSelect }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState('Pace')
  const [showProfileInfo, setShowProfileInfo] = useState(false)
  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const [showHelpSupport, setShowHelpSupport] = useState(false)
  const [showPrivacySecurity, setShowPrivacySecurity] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true)
        try {
          const [studentsRes, familiesRes] = await Promise.all([
            fetch(`${API_URL}/api/students`),
            fetch(`${API_URL}/api/families`)
          ])
          const students = await studentsRes.json()
          const families = await familiesRes.json()
          
          const query = searchQuery.toLowerCase()
          const results: SearchResult[] = []
          
          students.forEach((s: any) => {
            const fullName = `${s.first_name} ${s.last_name}`.toLowerCase()
            if (fullName.includes(query)) {
              results.push({
                type: 'student',
                id: s.student_id,
                name: `${s.first_name} ${s.last_name}`,
                subtitle: `Grade ${s.grade} - ${s.session} Session`
              })
            }
          })
          
          families.forEach((f: any) => {
            if (f.family_name.toLowerCase().includes(query)) {
              results.push({
                type: 'family',
                id: f.family_id,
                name: f.family_name,
                subtitle: `${f.student_ids?.length || 0} student(s)`
              })
            }
          })
          
          setSearchResults(results.slice(0, 8))
          setShowSearchResults(true)
        } catch (error) {
          console.error('Search error:', error)
        }
        setIsSearching(false)
      } else {
        setSearchResults([])
        setShowSearchResults(false)
      }
    }, 300)
    
    return () => clearTimeout(searchTimeout)
  }, [searchQuery])

  const handleSearchSelect = (result: SearchResult) => {
    if (onSearchSelect) {
      onSearchSelect(result.type, result.id)
    }
    setSearchQuery('')
    setShowSearchResults(false)
  }

  const handleSignOut= () => {
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
      {/* Blue to Red Gradient Theme with White Lion Logo */}
      <header className="text-white shadow-lg" style={{ background: 'linear-gradient(to right, #1e3a5f 0%, #dc3545 100%)' }}>
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo and Title - Responsive */}
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <img 
                src="/epic-lion-white-64.png" 
                alt="EPIC Prep Academy Logo" 
                className="h-10 sm:h-14 w-auto object-contain flex-shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-base sm:text-2xl font-bold text-white truncate">Prep Academy</h1>
                <p className="text-[10px] sm:text-xs italic text-gray-200 hidden sm:block">"Educating Lions not Sheep"</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-4">
              {/* Global Search Bar - Hidden on mobile */}
              {currentRole !== 'parent' && (
                <div ref={searchRef} className="relative hidden md:block">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search students or families..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                      className="w-48 lg:w-64 pl-10 pr-8 py-2 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('')
                          setShowSearchResults(false)
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                              {showSearchResults && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl z-30 max-h-96 overflow-y-auto">
                                  {isSearching ? (
                                    <div className="p-4 text-center text-gray-500">
                                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                      Searching...
                                    </div>
                                  ) : searchResults.length > 0 ? (
                                    <div className="py-2">
                                      {searchResults.map((result) => (
                                        <button
                                          key={`${result.type}-${result.id}`}
                                          onClick={() => handleSearchSelect(result)}
                                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-0"
                                        >
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                            result.type === 'student' ? 'bg-blue-100' : 'bg-green-100'
                                          }`}>
                                            {result.type === 'student' ? (
                                              <Users className="w-4 h-4 text-blue-600" />
                                            ) : (
                                              <Home className="w-4 h-4 text-green-600" />
                                            )}
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-gray-900">{result.name}</p>
                                            <p className="text-xs text-gray-500">{result.subtitle}</p>
                                          </div>
                                          <span className={`ml-auto text-xs px-2 py-1 rounded ${
                                            result.type === 'student' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                          }`}>
                                            {result.type === 'student' ? 'Student' : 'Family'}
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  ) : searchQuery.length >= 2 ? (
                                    <div className="p-4 text-center text-gray-500">
                                      <p className="text-sm">No results found for "{searchQuery}"</p>
                                      <p className="text-xs mt-1">Try a different search term</p>
                                    </div>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          )}

              {/* Location Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-sm sm:text-base"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                >
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="font-medium truncate max-w-[60px] sm:max-w-none">{selectedLocation}</span>
                  <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform flex-shrink-0 ${showLocationDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showLocationDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowLocationDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-20 py-2">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-xs font-medium text-gray-500 uppercase">Select Location</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedLocation('Pace')
                          setShowLocationDropdown(false)
                        }}
                        className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-2 ${
                          selectedLocation === 'Pace' 
                            ? 'text-white font-medium' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        style={selectedLocation === 'Pace' ? { background: 'linear-gradient(to right, #1e3a5f, #dc3545)' } : {}}
                      >
                        <MapPin className="w-4 h-4" />
                        <span>Pace</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedLocation('Navarre')
                          setShowLocationDropdown(false)
                        }}
                        className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-2 ${
                          selectedLocation === 'Navarre' 
                            ? 'text-white font-medium' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        style={selectedLocation === 'Navarre' ? { background: 'linear-gradient(to right, #1e3a5f, #dc3545)' } : {}}
                      >
                        <MapPin className="w-4 h-4" />
                        <span>Navarre</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedLocation('Crestview North')
                          setShowLocationDropdown(false)
                        }}
                        className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-2 ${
                          selectedLocation === 'Crestview North' 
                            ? 'text-white font-medium' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        style={selectedLocation === 'Crestview North' ? { background: 'linear-gradient(to right, #1e3a5f, #dc3545)' } : {}}
                      >
                        <MapPin className="w-4 h-4" />
                        <span>Crestview North</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedLocation('Crestview Main Street')
                          setShowLocationDropdown(false)
                        }}
                        className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-2 ${
                          selectedLocation === 'Crestview Main Street' 
                            ? 'text-white font-medium' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        style={selectedLocation === 'Crestview Main Street' ? { background: 'linear-gradient(to right, #1e3a5f, #dc3545)' } : {}}
                      >
                        <MapPin className="w-4 h-4" />
                        <span>Crestview Main Street</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-1 sm:space-x-2 rounded-lg p-1 sm:p-2 transition-colors"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E63946' }}>
                    <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300" />
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

                      {/* Account Type Selection (Demo Only) */}
                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <div className="px-4 py-2">
                          <p className="text-xs font-medium text-gray-500 uppercase">Switch View (Demo)</p>
                        </div>
                        <button
                          onClick={() => {
                            onRoleChange('admin')
                            setShowDropdown(false)
                          }}
                          className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-3 ${
                            currentRole === 'admin' 
                              ? 'text-white font-medium' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          style={currentRole === 'admin' ? { background: 'linear-gradient(to right, #1e3a5f, #dc3545)' } : {}}
                        >
                          <User className="w-5 h-5" />
                          <span>Admin View</span>
                        </button>
                        <button
                          onClick={() => {
                            onRoleChange('teacher')
                            setShowDropdown(false)
                          }}
                          className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-3 ${
                            currentRole === 'teacher' 
                              ? 'text-white font-medium' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          style={currentRole === 'teacher' ? { background: 'linear-gradient(to right, #1e3a5f, #dc3545)' } : {}}
                        >
                          <User className="w-5 h-5" />
                          <span>Coach View</span>
                        </button>
                        <button
                          onClick={() => {
                            onRoleChange('parent')
                            setShowDropdown(false)
                          }}
                          className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-3 ${
                            currentRole === 'parent' 
                              ? 'text-white font-medium' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          style={currentRole === 'parent' ? { background: 'linear-gradient(to right, #1e3a5f, #dc3545)' } : {}}
                        >
                          <User className="w-5 h-5" />
                          <span>Parent View</span>
                        </button>
                      </div>

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
