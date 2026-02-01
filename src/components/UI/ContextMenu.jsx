import { useEffect } from 'react'
import useStore from '../../store/useStore'

const ContextMenu = () => {
  const contextMenu = useStore((state) => state.contextMenu)
  const hideContextMenu = useStore((state) => state.hideContextMenu)
  const openDetailPanel = useStore((state) => state.openDetailPanel)
  const addToComparison = useStore((state) => state.addToComparison)
  const toggleItemPin = useStore((state) => state.toggleItemPin)
  const toggleItemVisibility = useStore((state) => state.toggleItemVisibility)
  const showParallelLines = useStore((state) => state.showParallelLines)
  const deletePerson = useStore((state) => state.deletePerson)
  const deleteEvent = useStore((state) => state.deleteEvent)

  useEffect(() => {
    const handleClick = () => hideContextMenu()
    const handleEscape = (e) => {
      if (e.key === 'Escape') hideContextMenu()
    }

    if (contextMenu.visible) {
      document.addEventListener('click', handleClick)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [contextMenu.visible, hideContextMenu])

  if (!contextMenu.visible || !contextMenu.item) {
    return null
  }

  const item = contextMenu.item
  const type = item.birth ? 'person' : 'event'

  const menuItems = [
    {
      icon: '⚖️',
      label: 'הוסף להשוואה',
      action: () => {
        addToComparison(item.id, type)
        hideContextMenu()
      },
      enabled: !item.visibility?.isInComparison
    },
    {
      icon: '📌',
      label: item.position?.isPinned ? 'בטל נעיצה' : 'נעץ במקום',
      action: () => {
        toggleItemPin(item.id, type)
        hideContextMenu()
      },
      enabled: type === 'person'
    },
    {
      icon: '📏',
      label: 'הצג קווים מקבילים',
      action: () => {
        showParallelLines(item)
        hideContextMenu()
      }
    },
    {
      icon: '🔗',
      label: 'פתח בוויקיפדיה',
      action: () => {
        if (item.wikipedia_url) {
          window.open(item.wikipedia_url, '_blank')
        }
        hideContextMenu()
      },
      enabled: !!item.wikipedia_url
    },
    {
      icon: '✏️',
      label: 'ערוך',
      action: () => {
        openDetailPanel(item)
        hideContextMenu()
      }
    },
    {
      icon: '🚫',
      label: 'הסתר זמנית',
      action: () => {
        toggleItemVisibility(item.id, type)
        hideContextMenu()
      }
    },
    {
      icon: '🗑️',
      label: 'מחק',
      action: () => {
        if (window.confirm(`האם אתה בטוח שברצונך למחוק את "${item.name}"?`)) {
          if (type === 'person') {
            deletePerson(item.id)
          } else {
            deleteEvent(item.id)
          }
        }
        hideContextMenu()
      },
      style: 'danger'
    }
  ]

  return (
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[200px]"
      style={{
        left: `${contextMenu.x}px`,
        top: `${contextMenu.y}px`
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems
        .filter((item) => item.enabled !== false)
        .map((menuItem, index) => (
          <button
            key={index}
            onClick={menuItem.action}
            className={`w-full px-4 py-2 text-right hover:bg-gray-100 transition-colors flex items-center gap-3 ${
              menuItem.style === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
            }`}
          >
            <span>{menuItem.icon}</span>
            <span className="text-sm">{menuItem.label}</span>
          </button>
        ))}
    </div>
  )
}

export default ContextMenu
