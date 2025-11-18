import { School, User } from 'lucide-react'

interface HeaderProps {
  currentRole: 'admin' | 'teacher' | 'parent'
  onRoleChange: (role: 'admin' | 'teacher' | 'parent') => void
}

export function Header({ currentRole, onRoleChange }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 bg-amber-600 rounded-lg">
              <School className="w-8 h-8 text-white" />
            </div>
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
            
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
