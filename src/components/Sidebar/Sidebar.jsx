import { useState } from 'react'
import useStore from '../../store/useStore'
import CategoryFilter from './CategoryFilter'
import HiddenItems from './HiddenItems'
import ComparisonList from './ComparisonList'

const Sidebar = () => {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <aside className="w-80 bg-white border-l border-gray-soft shadow-soft-lg flex flex-col overflow-hidden animate-slideIn">
      {/* Header */}
      <div className="p-6 border-b border-gray-soft/30">
        <h2 className="text-xl font-bold bg-gradient-to-r from-pastel-blue to-pastel-purple bg-clip-text text-transparent mb-5">
          סינון והגדרות
        </h2>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="חיפוש..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-5 py-3 pr-12 bg-gray-soft/30 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pastel-blue-light/50 transition-all duration-200 text-gray-700 placeholder-gray-500"
          />
          <svg
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Categories */}
        <div className="bg-gray-soft/20 p-5 rounded-3xl">
          <CategoryFilter />
        </div>

        {/* Time range slider */}
        <div className="bg-gray-soft/20 p-5 rounded-3xl">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">טווח זמן</h3>
          <TimeRangeSlider />
        </div>

        {/* Hidden items */}
        <div className="bg-gray-soft/20 p-5 rounded-3xl">
          <HiddenItems />
        </div>

        {/* Comparison */}
        <div className="bg-gray-soft/20 p-5 rounded-3xl">
          <ComparisonList />
        </div>
      </div>
    </aside>
  )
}

const TimeRangeSlider = () => {
  const zoomState = useStore((state) => state.zoomState)
  const setZoomRange = useStore((state) => state.setZoomRange)

  const handleStartChange = (e) => {
    const newStart = parseInt(e.target.value)
    if (newStart < zoomState.endYear) {
      setZoomRange(newStart, zoomState.endYear)
    }
  }

  const handleEndChange = (e) => {
    const newEnd = parseInt(e.target.value)
    if (newEnd > zoomState.startYear) {
      setZoomRange(zoomState.startYear, newEnd)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{zoomState.startYear}</span>
        <span>{zoomState.endYear}</span>
      </div>

      <div className="space-y-2">
        <input
          type="range"
          min={zoomState.minYear}
          max={zoomState.maxYear}
          value={zoomState.startYear}
          onChange={handleStartChange}
          className="w-full"
        />
        <input
          type="range"
          min={zoomState.minYear}
          max={zoomState.maxYear}
          value={zoomState.endYear}
          onChange={handleEndChange}
          className="w-full"
        />
      </div>
    </div>
  )
}

export default Sidebar
