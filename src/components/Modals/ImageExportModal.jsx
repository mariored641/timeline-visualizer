import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import useStore from '../../store/useStore'
import { exportTimelineAsImage, getRecommendedResolution, RESOLUTION_PRESETS } from '../../services/imageExportService'

const ImageExportModal = ({ isOpen, onClose }) => {
  const people = useStore((state) => state.people)
  const events = useStore((state) => state.events)
  const categories = useStore((state) => state.categories)
  const locations = useStore((state) => state.locations)
  const zoomState = useStore((state) => state.zoomState)
  const dragOffsets = useStore((state) => state.dragOffsets)

  // Default to current view
  const [selectedCategories, setSelectedCategories] = useState(() =>
    categories.filter(c => c.visible).map(c => c.id)
  )
  const [startYear, setStartYear] = useState(zoomState.startYear)
  const [endYear, setEndYear] = useState(zoomState.endYear)
  const [resolutionPreset, setResolutionPreset] = useState('recommended')
  const [customWidth, setCustomWidth] = useState(2560)
  const [customHeight, setCustomHeight] = useState(1440)
  const [isExporting, setIsExporting] = useState(false)
  const [displayMode, setDisplayMode] = useState('current') // 'current' = what's on screen, 'all' = all data
  const previewCanvasRef = useRef(null)

  // Sync defaults when modal opens
  useEffect(() => {
    if (isOpen) {
      setStartYear(zoomState.startYear)
      setEndYear(zoomState.endYear)
      setSelectedCategories(categories.filter(c => c.visible).map(c => c.id))
      setDisplayMode('current')
    }
  }, [isOpen])

  const recommended = useMemo(() => {
    return getRecommendedResolution(endYear - startYear, selectedCategories.length)
  }, [startYear, endYear, selectedCategories.length])

  const getResolution = useCallback(() => {
    if (resolutionPreset === 'custom') {
      return { width: customWidth, height: customHeight }
    }
    if (resolutionPreset === 'recommended') {
      return recommended
    }
    const preset = RESOLUTION_PRESETS.find(p => p.id === resolutionPreset)
    return preset ? { width: preset.width, height: preset.height } : recommended
  }, [resolutionPreset, customWidth, customHeight, recommended])

  // Get filtered data based on display mode
  const getExportData = useCallback(() => {
    let exportPeople = people
    let exportEvents = events

    if (displayMode === 'current') {
      // Only include non-hidden items
      exportPeople = people.filter(p => !p.visibility?.isHidden)
      exportEvents = events.filter(e => !e.visibility?.isHidden)
    }

    return { exportPeople, exportEvents }
  }, [people, events, displayMode])

  const toggleCategory = (catId) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    )
  }

  // Render preview
  useEffect(() => {
    if (!isOpen || !previewCanvasRef.current || selectedCategories.length === 0) return

    const canvas = previewCanvasRef.current
    const ctx = canvas.getContext('2d')

    // Preview at a fixed small size
    const previewWidth = 500
    const previewHeight = 280

    canvas.width = previewWidth
    canvas.height = previewHeight

    const { exportPeople, exportEvents } = getExportData()

    // Simple preview rendering
    ctx.fillStyle = '#fafafa'
    ctx.fillRect(0, 0, previewWidth, previewHeight)

    const margin = { top: 25, right: 30, bottom: 15, left: 30 }
    const innerW = previewWidth - margin.left - margin.right
    const innerH = previewHeight - margin.top - margin.bottom

    const yearRange = endYear - startYear
    if (yearRange <= 0) return

    const xScale = (year) => margin.left + ((year - startYear) / yearRange) * innerW

    // Grid lines
    ctx.strokeStyle = '#ddd'
    ctx.lineWidth = 0.5
    ctx.setLineDash([3, 3])
    const tickCount = Math.max(3, Math.min(10, Math.floor(yearRange / 50)))
    const tickStep = yearRange / tickCount
    for (let i = 0; i <= tickCount; i++) {
      const year = Math.round(startYear + i * tickStep)
      const x = xScale(year)
      ctx.beginPath()
      ctx.moveTo(x, margin.top)
      ctx.lineTo(x, previewHeight - margin.bottom)
      ctx.stroke()

      // Year label
      ctx.fillStyle = '#999'
      ctx.font = '9px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(year, x, margin.top - 5)
    }
    ctx.setLineDash([])

    // Draw items by category
    const visibleCats = categories.filter(c => selectedCategories.includes(c.id))
    let currentY = margin.top + 5
    const rowH = Math.max(4, Math.min(12, innerH / Math.max(1, visibleCats.length) / 8))

    visibleCats.forEach(cat => {
      const catPeople = exportPeople.filter(
        p => p.categories?.includes(cat.id) && p.categories[0] === cat.id
      )
      const catEvents = cat.id === 'events' ? exportEvents : []

      // Category label
      ctx.fillStyle = cat.color
      ctx.font = `bold ${Math.max(7, rowH)}px sans-serif`
      ctx.textAlign = 'right'
      ctx.fillText(cat.name, margin.left - 3, currentY + rowH)

      let rowY = currentY
      // Draw people bars
      catPeople.forEach(person => {
        const x1 = xScale(person.birth)
        const x2 = xScale(person.death || new Date().getFullYear())
        if (x2 > margin.left && x1 < previewWidth - margin.right) {
          ctx.fillStyle = cat.color + '99'
          ctx.fillRect(
            Math.max(x1, margin.left),
            rowY,
            Math.max(Math.min(x2, previewWidth - margin.right) - Math.max(x1, margin.left), 1),
            rowH - 1
          )
        }
        rowY += rowH
      })

      // Draw event bars/dots
      catEvents.forEach(evt => {
        const isSingle = !evt.end_year || evt.end_year === evt.start_year
        if (isSingle) {
          const cx = xScale(evt.start_year)
          if (cx > margin.left && cx < previewWidth - margin.right) {
            ctx.beginPath()
            ctx.arc(cx, rowY + rowH / 2, Math.max(2, rowH / 3), 0, Math.PI * 2)
            ctx.fillStyle = cat.color + 'CC'
            ctx.fill()
          }
        } else {
          const x1 = xScale(evt.start_year)
          const x2 = xScale(evt.end_year)
          if (x2 > margin.left && x1 < previewWidth - margin.right) {
            ctx.fillStyle = cat.color + '99'
            ctx.fillRect(
              Math.max(x1, margin.left),
              rowY,
              Math.max(Math.min(x2, previewWidth - margin.right) - Math.max(x1, margin.left), 1),
              rowH - 1
            )
          }
        }
        rowY += rowH
      })

      currentY = rowY + rowH * 2
    })

  }, [isOpen, selectedCategories, startYear, endYear, displayMode, getExportData, categories])

  const handleExport = async () => {
    if (selectedCategories.length === 0) return
    setIsExporting(true)
    try {
      const { width, height } = getResolution()
      const { exportPeople, exportEvents } = getExportData()
      await exportTimelineAsImage({
        people: exportPeople,
        events: exportEvents,
        categories,
        locations,
        selectedCategories,
        startYear,
        endYear,
        width,
        height,
      })
      onClose()
    } catch (err) {
      console.error('Export failed:', err)
      alert('שגיאה בייצוא התמונה')
    } finally {
      setIsExporting(false)
    }
  }

  if (!isOpen) return null

  const resolution = getResolution()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">ייצוא לתמונה</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Display mode toggle */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">מקור נתונים:</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setDisplayMode('current')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  displayMode === 'current'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                תצוגה נוכחית
              </button>
              <button
                onClick={() => setDisplayMode('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  displayMode === 'all'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                כל הנתונים
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {displayMode === 'current'
                ? 'ייצוא רק מה שמוצג כרגע (ללא פריטים מוסתרים)'
                : 'ייצוא כל הנתונים כולל פריטים מוסתרים'}
            </p>
          </div>

          {/* Preview */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">תצוגה מקדימה:</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              <canvas
                ref={previewCanvasRef}
                className="w-full"
                style={{ height: '180px', imageRendering: 'auto' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category selection */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">קטגוריות:</h3>
              <div className="flex flex-wrap gap-1.5">
                {categories.map(cat => (
                  <label key={cat.id} className="flex items-center gap-1 text-xs cursor-pointer px-1.5 py-0.5 rounded border border-gray-200 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                      className="rounded border-gray-300 w-3 h-3"
                    />
                    <span style={{ color: cat.color }}>{cat.name}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setSelectedCategories(categories.map(c => c.id))}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  הכל
                </button>
                <button
                  onClick={() => setSelectedCategories([])}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  נקה
                </button>
              </div>
            </div>

            {/* Year range */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">טווח שנים:</h3>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    value={startYear}
                    onChange={(e) => setStartYear(Number(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                <span className="text-gray-400 text-sm">–</span>
                <div className="flex-1">
                  <input
                    type="number"
                    value={endYear}
                    onChange={(e) => setEndYear(Number(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              </div>
              <button
                onClick={() => { setStartYear(zoomState.startYear); setEndYear(zoomState.endYear) }}
                className="text-xs text-blue-600 hover:text-blue-700 mt-1"
              >
                טווח נוכחי
              </button>
            </div>
          </div>

          {/* Resolution */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">רזולוציה:</h3>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="radio" name="resolution" value="recommended"
                  checked={resolutionPreset === 'recommended'}
                  onChange={() => setResolutionPreset('recommended')}
                  className="text-blue-600"
                />
                <span>מומלץ ({recommended.width}x{recommended.height})</span>
              </label>
              {RESOLUTION_PRESETS.filter(p => p.id !== 'custom').map(preset => (
                <label key={preset.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio" name="resolution" value={preset.id}
                    checked={resolutionPreset === preset.id}
                    onChange={() => setResolutionPreset(preset.id)}
                    className="text-blue-600"
                  />
                  <span>{preset.label}</span>
                </label>
              ))}
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="radio" name="resolution" value="custom"
                  checked={resolutionPreset === 'custom'}
                  onChange={() => setResolutionPreset('custom')}
                  className="text-blue-600"
                />
                <span>מותאם</span>
              </label>
            </div>
            {resolutionPreset === 'custom' && (
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="number" value={customWidth}
                  onChange={(e) => setCustomWidth(Number(e.target.value))}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <span className="text-gray-400 text-xs">x</span>
                <input
                  type="number" value={customHeight}
                  onChange={(e) => setCustomHeight(Number(e.target.value))}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {resolution.width}x{resolution.height} px
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
          >
            ביטול
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || selectedCategories.length === 0}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                מייצא...
              </span>
            ) : (
              'ייצא תמונה'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImageExportModal
