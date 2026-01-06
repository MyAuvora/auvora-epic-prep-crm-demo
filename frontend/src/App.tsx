import { useState } from 'react'
import { EnhancedAdminDashboard } from './components/EnhancedAdminDashboard'
import { TeacherDashboard } from './components/TeacherDashboard'
import { EnhancedParentDashboard } from './components/EnhancedParentDashboard'
import { Header } from './components/Header'
import { ErrorBoundary } from './components/ErrorBoundary'

type Role = 'admin' | 'teacher' | 'parent'

function App() {
  const [currentRole, setCurrentRole] = useState<Role>('admin')
  const [selectedUserId, setSelectedUserId] = useState<string>('staff_1')
  const [searchNavigation, setSearchNavigation] = useState<{ type: 'student' | 'family'; id: string } | null>(null)

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

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Header 
          currentRole={currentRole} 
          onRoleChange={handleRoleChange}
          onSearchSelect={handleSearchSelect}
        />
        
        <main>
          {currentRole === 'admin' && <EnhancedAdminDashboard searchNavigation={searchNavigation} onClearSearch={() => setSearchNavigation(null)} />}
          {currentRole === 'teacher' && <TeacherDashboard staffId={selectedUserId} searchNavigation={searchNavigation} onClearSearch={() => setSearchNavigation(null)} />}
          {currentRole === 'parent' && <EnhancedParentDashboard parentId={selectedUserId} />}
        </main>
      </div>
    </ErrorBoundary>
  )
}

export default App
