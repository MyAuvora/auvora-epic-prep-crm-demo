import { useState, useEffect } from 'react'
import { GripVertical, Eye, EyeOff, RotateCcw, Settings2 } from 'lucide-react'

interface Widget {
  id: string
  label: string
  visible: boolean
  order: number
}

const DEFAULT_WIDGETS: Widget[] = [
  { id: 'stats-cards', label: 'Key Metrics (Students, Families, Balance, Attendance)', visible: true, order: 0 },
  { id: 'alert-cards', label: 'Alert Cards (At-Risk, IXL Behind, Overdue)', visible: true, order: 1 },
  { id: 'billing-overview', label: 'Billing Status Overview', visible: true, order: 2 },
  { id: 'activity-feed', label: 'Recent Activity Feed', visible: true, order: 3 },
  { id: 'bible-verse', label: 'Daily Bible Verse', visible: true, order: 4 },
]

const STORAGE_KEY = 'auvora-dashboard-widgets'

interface DashboardWidgetsProps {
  children: (config: { visibleWidgets: string[]; isCustomizing: boolean }) => React.ReactNode
}

export function DashboardWidgets({ children }: DashboardWidgetsProps) {
  const [widgets, setWidgets] = useState<Widget[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) return JSON.parse(stored)
    } catch {}
    return DEFAULT_WIDGETS
  })
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets))
  }, [widgets])

  const visibleWidgets = widgets
    .filter(w => w.visible)
    .sort((a, b) => a.order - b.order)
    .map(w => w.id)

  const toggleWidget = (id: string) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w))
  }

  const resetToDefault = () => {
    setWidgets(DEFAULT_WIDGETS)
  }

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx)
  }

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (draggedIdx === null || draggedIdx === idx) return
    const sorted = [...widgets].sort((a, b) => a.order - b.order)
    const draggedItem = sorted[draggedIdx]
    sorted.splice(draggedIdx, 1)
    sorted.splice(idx, 0, draggedItem)
    const reordered = sorted.map((w, i) => ({ ...w, order: i }))
    setWidgets(reordered)
    setDraggedIdx(idx)
  }

  const handleDragEnd = () => {
    setDraggedIdx(null)
  }

  return (
    <div>
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setIsCustomizing(!isCustomizing)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            isCustomizing
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          {isCustomizing ? 'Done' : 'Customize'}
        </button>
      </div>

      {isCustomizing && (
        <div className="mb-4 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900">Dashboard Widgets</h4>
            <button
              onClick={resetToDefault}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-3">Drag to reorder. Click the eye to show/hide widgets.</p>
          <div className="space-y-1">
            {[...widgets].sort((a, b) => a.order - b.order).map((widget, idx) => (
              <div
                key={widget.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-colors cursor-move ${
                  draggedIdx === idx ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className={`text-sm flex-1 ${widget.visible ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                  {widget.label}
                </span>
                <button
                  onClick={() => toggleWidget(widget.id)}
                  className={`p-1 rounded ${widget.visible ? 'text-blue-600 hover:bg-blue-100' : 'text-gray-400 hover:bg-gray-200'}`}
                >
                  {widget.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {children({ visibleWidgets, isCustomizing })}
    </div>
  )
}
