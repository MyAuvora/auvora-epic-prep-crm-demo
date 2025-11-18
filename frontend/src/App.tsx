import { useState } from 'react'
import { AdminDashboard } from './components/AdminDashboard'
import { TeacherDashboard } from './components/TeacherDashboard'
import { ParentDashboard } from './components/ParentDashboard'
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
        {currentRole === 'admin' && <AdminDashboard />}
        {currentRole === 'teacher' && <TeacherDashboard staffId={selectedUserId} />}
        {currentRole === 'parent' && <ParentDashboard parentId={selectedUserId} />}
      </main>
    </div>
  )
}

export default App
