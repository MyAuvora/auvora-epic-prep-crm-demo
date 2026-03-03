import { useState, useEffect } from 'react'
import { useUser, useAuth, SignedIn, SignedOut } from '@clerk/clerk-react'
import { EnhancedAdminDashboard } from './components/EnhancedAdminDashboard'
import { TeacherDashboard } from './components/TeacherDashboard'
import { EnhancedParentDashboard } from './components/EnhancedParentDashboard'
import { Header } from './components/Header'
import { ErrorBoundary } from './components/ErrorBoundary'
import { TermsOfService } from './components/TermsOfService'
import { PrivacyPolicy } from './components/PrivacyPolicy'
import { SignInPage } from './components/SignInPage'
import { SignUpPage } from './components/SignUpPage'

type Role = 'admin' | 'teacher' | 'parent'
type Page = 'dashboard' | 'terms' | 'privacy'

function AuthenticatedApp() {
  const { user } = useUser()
  const [currentRole, setCurrentRole] = useState<Role>('admin')
  const [selectedUserId, setSelectedUserId] = useState<string>('staff_1')
  const [searchNavigation, setSearchNavigation] = useState<{ type: 'student' | 'family'; id: string } | null>(null)
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  // Get role from Clerk user metadata or default to admin for demo
  useEffect(() => {
    if (user) {
      const userRole = user.publicMetadata?.role as Role
      if (userRole && ['admin', 'teacher', 'parent'].includes(userRole)) {
        setCurrentRole(userRole)
        if (userRole === 'admin') {
          setSelectedUserId('staff_1')
        } else if (userRole === 'teacher') {
          setSelectedUserId('staff_4')
        } else {
          setSelectedUserId('parent_1')
        }
      }
    }
  }, [user])

  const handleRoleChange = (role: Role) => {
    setCurrentRole(role)
    setSearchNavigation(null)
    if (role === 'admin') {
      setSelectedUserId('staff_1')
    } else if (role === 'teacher') {
      setSelectedUserId('staff_4')
    } else {
      setSelectedUserId('parent_1')
    }
  }

  const handleSearchSelect = (type: 'student' | 'family', id: string) => {
    setSearchNavigation({ type, id })
  }

  // Render Terms of Service page
  if (currentPage === 'terms') {
    return (
      <ErrorBoundary>
        <TermsOfService onBack={() => setCurrentPage('dashboard')} />
      </ErrorBoundary>
    );
  }

  // Render Privacy Policy page
  if (currentPage === 'privacy') {
    return (
      <ErrorBoundary>
        <PrivacyPolicy onBack={() => setCurrentPage('dashboard')} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header 
          currentRole={currentRole} 
          onRoleChange={handleRoleChange}
          onSearchSelect={handleSearchSelect}
        />
        
        <main className="flex-1">
          {currentRole === 'admin' && <EnhancedAdminDashboard searchNavigation={searchNavigation} onClearSearch={() => setSearchNavigation(null)} />}
          {currentRole === 'teacher' && <TeacherDashboard staffId={selectedUserId} searchNavigation={searchNavigation} onClearSearch={() => setSearchNavigation(null)} />}
          {currentRole === 'parent' && <EnhancedParentDashboard parentId={selectedUserId} />}
        </main>

        {/* Footer with Terms and Privacy links */}
        <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
              <p className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} Auvora LLC. All rights reserved.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentPage('terms')}
                  className="text-sm text-gray-500 hover:text-[#0A2463] transition-colors"
                >
                  Terms of Service
                </button>
                <button
                  onClick={() => setCurrentPage('privacy')}
                  className="text-sm text-gray-500 hover:text-[#0A2463] transition-colors"
                >
                  Privacy Policy
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  )
}

function App() {
  const { isSignedIn } = useAuth()
  const [hashPath, setHashPath] = useState(window.location.hash)

  useEffect(() => {
    const handleHashChange = () => setHashPath(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // If signed-in user navigates to sign-up, redirect them to dashboard
  useEffect(() => {
    if (isSignedIn && hashPath.startsWith('#/sign-up')) {
      window.location.hash = ''
    }
  }, [isSignedIn, hashPath])

  // Handle hash-based routing for sign-up (only for unauthenticated users)
  // Use isSignedIn === false to avoid flashing sign-up page during Clerk loading
  if (hashPath.startsWith('#/sign-up') && isSignedIn === false) {
    return <SignUpPage />
  }

  return (
    <>
      <SignedOut>
        <SignInPage />
      </SignedOut>
      <SignedIn>
        <AuthenticatedApp />
      </SignedIn>
    </>
  )
}

export default App
