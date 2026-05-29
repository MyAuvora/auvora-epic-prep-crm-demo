import { useState, useRef, useEffect } from 'react'
import { Plus, UserPlus, DollarSign, Calendar, MessageSquare, ClipboardList, X, Users } from 'lucide-react'

interface QuickActionsProps {
  currentRole: 'owner' | 'admin' | 'coach' | 'parent'
  onAction: (action: string) => void
}

interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  color: string
  roles: ('owner' | 'admin' | 'coach' | 'parent')[]
}

const ACTIONS: QuickAction[] = [
  {
    id: 'add-student',
    label: 'Add Student',
    icon: <UserPlus className="w-5 h-5" />,
    color: 'bg-blue-500 hover:bg-blue-600',
    roles: ['owner', 'admin']
  },
  {
    id: 'record-payment',
    label: 'Record Payment',
    icon: <DollarSign className="w-5 h-5" />,
    color: 'bg-green-500 hover:bg-green-600',
    roles: ['owner', 'admin']
  },
  {
    id: 'log-attendance',
    label: 'Log Attendance',
    icon: <ClipboardList className="w-5 h-5" />,
    color: 'bg-purple-500 hover:bg-purple-600',
    roles: ['owner', 'admin', 'coach']
  },
  {
    id: 'send-message',
    label: 'Send Message',
    icon: <MessageSquare className="w-5 h-5" />,
    color: 'bg-indigo-500 hover:bg-indigo-600',
    roles: ['owner', 'admin', 'coach', 'parent']
  },
  {
    id: 'create-event',
    label: 'Create Event',
    icon: <Calendar className="w-5 h-5" />,
    color: 'bg-orange-500 hover:bg-orange-600',
    roles: ['owner', 'admin']
  },
  {
    id: 'add-family',
    label: 'Add Family',
    icon: <Users className="w-5 h-5" />,
    color: 'bg-teal-500 hover:bg-teal-600',
    roles: ['owner', 'admin']
  }
]

export function QuickActions({ currentRole, onAction }: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const availableActions = ACTIONS.filter(a => a.roles.includes(currentRole))

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 flex flex-col gap-2 items-end">
          {availableActions.map((action, index) => (
            <button
              key={action.id}
              onClick={() => {
                onAction(action.id)
                setIsOpen(false)
              }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-white shadow-lg transition-all transform ${action.color}`}
              style={{
                animation: `slideUp 0.2s ease-out ${index * 0.05}s both`
              }}
            >
              <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
              {action.icon}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-200 ${
          isOpen ? 'rotate-45 bg-gray-700 hover:bg-gray-800' : ''
        }`}
        style={!isOpen ? { background: 'linear-gradient(135deg, #1e3a5f, #dc3545)' } : {}}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
