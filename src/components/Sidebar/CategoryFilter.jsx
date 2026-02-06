import { useState, useRef } from 'react'
import useStore from '../../store/useStore'

const CategoryFilter = () => {
  const categories = useStore((state) => state.categories)
  const toggleCategoryVisibility = useStore((state) => state.toggleCategoryVisibility)
  const reorderCategories = useStore((state) => state.reorderCategories)
  const [dragIndex, setDragIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)

  const handleDragStart = (e, index) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverIndex(index)
  }

  const handleDrop = (e, toIndex) => {
    e.preventDefault()
    if (dragIndex !== null && dragIndex !== toIndex) {
      reorderCategories(dragIndex, toIndex)
    }
    setDragIndex(null)
    setOverIndex(null)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    setOverIndex(null)
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">קטגוריות</h3>

      <div className="space-y-1">
        {categories.map((category, index) => (
          <div
            key={category.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
              dragIndex === index ? 'opacity-40 scale-95' : ''
            } ${
              overIndex === index && dragIndex !== index
                ? 'border-t-2 border-blue-400'
                : 'border-t-2 border-transparent'
            } hover:bg-gray-50`}
          >
            {/* Drag handle */}
            <span className="drag-handle text-gray-300 hover:text-gray-500 text-sm select-none" title="גרור לשינוי סדר">
              ⋮⋮
            </span>

            <input
              type="checkbox"
              checked={category.visible}
              onChange={() => toggleCategoryVisibility(category.id)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />

            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: category.color }}
            />

            <span className="flex-1 text-sm text-gray-700">{category.name}</span>

            <span className="text-xs text-gray-400">
              ({getCategoryCount(category.id)})
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const getCategoryCount = (categoryId) => {
  const people = useStore.getState().people
  const events = useStore.getState().events

  const peopleCount = people.filter((p) =>
    p.categories.includes(categoryId)
  ).length

  // All events belong to "events" category only
  const eventsCount = categoryId === 'events' ? events.length : 0

  return peopleCount + eventsCount
}

export default CategoryFilter
