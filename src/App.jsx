import { useState, useEffect } from 'react'
import useStore from './store/useStore'
import Header from './components/UI/Header'
import Sidebar from './components/Sidebar/Sidebar'
import TimelineCanvas from './components/Timeline/TimelineCanvas'
import Tooltip from './components/UI/Tooltip'
import ContextMenu from './components/UI/ContextMenu'
import DetailPanel from './components/Modals/DetailPanel'
import AddPersonModal from './components/Modals/AddPersonModal'
import AddEventModal from './components/Modals/AddEventModal'
import ImportModal from './components/Modals/ImportModal'

function App() {
  const sidebarOpen = useStore((state) => state.sidebarOpen)
  const isLoading = useStore((state) => state.isLoading)
  const lastSyncError = useStore((state) => state.lastSyncError)
  const initializeFromApi = useStore((state) => state.initializeFromApi)

  // Load data from API on mount + refresh when user returns to tab
  useEffect(() => {
    initializeFromApi()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        initializeFromApi()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Block browser zoom EXCEPT on timeline
  useEffect(() => {
    const preventZoom = (e) => {
      // Allow wheel events on timeline
      const isTimeline = e.target.closest('.timeline-container')
      if (isTimeline) {
        return // Let timeline handle its own zoom
      }

      if (e.ctrlKey) {
        e.preventDefault()
      }
    }

    const preventGesture = (e) => {
      // Allow gestures on timeline
      const isTimeline = e.target.closest('.timeline-container')
      if (isTimeline) {
        return
      }

      e.preventDefault()
    }

    const preventKeys = (e) => {
      if ((e.ctrlKey || e.metaKey) &&
          (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0' || e.keyCode === 187 || e.keyCode === 189)) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }

    document.addEventListener('wheel', preventZoom, { passive: false })
    document.addEventListener('gesturestart', preventGesture, { passive: false })
    document.addEventListener('gesturechange', preventGesture, { passive: false })
    document.addEventListener('gestureend', preventGesture, { passive: false })
    document.addEventListener('keydown', preventKeys, { passive: false })

    return () => {
      document.removeEventListener('wheel', preventZoom)
      document.removeEventListener('gesturestart', preventGesture)
      document.removeEventListener('gesturechange', preventGesture)
      document.removeEventListener('gestureend', preventGesture)
      document.removeEventListener('keydown', preventKeys)
    }
  }, [])


  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-pastel-blue border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500 text-sm">טוען נתונים...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-50" dir="rtl">
      {/* Sync error banner */}
      {lastSyncError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-600 text-center flex-shrink-0">
          {lastSyncError}
        </div>
      )}

      {/* Header - flex-shrink-0 ensures it stays fixed height */}
      <div className="flex-shrink-0">
        <Header />
      </div>

      {/* Main content - flex-1 takes remaining space */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sidebar */}
        {sidebarOpen && <Sidebar />}

        {/* Timeline - flex-1 takes remaining space */}
        <div className="flex-1 overflow-auto min-w-0 timeline-container">
          <TimelineCanvas />
        </div>
      </div>

      {/* Modals and overlays */}
      <Tooltip />
      <ContextMenu />
      <DetailPanel />
      <AddPersonModal />
      <AddEventModal />
      <ImportModal />
    </div>
  )
}

export default App
