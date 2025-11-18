import { useState } from 'react'
import { EnhancedAdminDashboard } from './components/EnhancedAdminDashboard'
import { TeacherDashboard } from './components/TeacherDashboard'
import { EnhancedParentDashboard } from './components/EnhancedParentDashboard'
import { Header } from './components/Header'

type Role = 'admin' | 'teacher' | 'parent'

function App() {
  const [currentRole, setCurrentRole] = useState<Role>('admin')
  const [selectedUserId, setSelectedUserId] = useState<string>('staff_1')

  const handleRoleChange = (role: Role) => {
    setCurrentRole(role)
    if (role === 'admin') {
      setSelectedUserId('staff_1')
    } else if (role === 'teacher') {
      setSelectedUserId('staff_4')
    } else {
      setSelectedUserId('parent_1')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentRole={currentRole} 
        onRoleChange={handleRoleChange}
      />
      
      <main>
        {currentRole === 'admin' && <EnhancedAdminDashboard />}
        {currentRole === 'teacher' && <TeacherDashboard staffId={selectedUserId} />}
        {currentRole === 'parent' && <EnhancedParentDashboard parentId={selectedUserId} />}
      </main>
    </div>
  )
}

export default App
