import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import * as d3 from 'd3'
import useStore from '../../store/useStore'
import { calculateOptimalLayout } from '../../services/layoutEngine'
import { getColorForLocation, createLocationGradient } from '../../utils/colorMapping'
import ZoomControls from '../UI/ZoomControls'

// Historical periods with pastel colors
const HISTORICAL_PERIODS = [
  { name: 'העת העתיקה', start: -4000, end: 476, color: 'rgba(255, 230, 200, 0.25)' },
  { name: 'ימי הביניים', start: 476, end: 1500, color: 'rgba(210, 228, 205, 0.25)' },
  { name: 'רנסנס', start: 1500, end: 1600, color: 'rgba(225, 215, 240, 0.25)' },
  { name: 'נאורות', start: 1600, end: 1800, color: 'rgba(255, 245, 210, 0.25)' },
  { name: 'העידן המודרני', start: 1800, end: 1900, color: 'rgba(215, 230, 245, 0.25)' },
  { name: 'המאה ה-20', start: 1900, end: 2000, color: 'rgba(240, 218, 218, 0.25)' },
  { name: 'המאה ה-21', start: 2000, end: 2100, color: 'rgba(218, 235, 245, 0.25)' },
]

// Track last right-click for double-right-click detection
let lastRightClick = { id: null, time: 0 }
// Suppress context menu briefly after double-right-click hide
let suppressContextMenuUntil = 0

/**
 * Sticky year ruler component (used for top and bottom)
 */
const YearRuler = ({ width, margin, zoomState }) => {
  const ticks = useMemo(() => {
    if (width <= 0) return []
    const innerWidth = width - margin.left - margin.right
    const scale = d3.scaleLinear()
      .domain([zoomState.startYear, zoomState.endYear])
      .range([margin.left, margin.left + innerWidth])
    return scale.ticks(10).map(year => ({
      year,
      x: scale(year)
    }))
  }, [width, margin, zoomState])

  return (
    <div
      className="sticky z-10 bg-gray-50 border-b border-gray-200 flex-shrink-0"
      style={{ width }}
    >
      <svg width={width} height={28}>
        {ticks.map(({ year, x }) => (
          <g key={year}>
            <line x1={x} y1={20} x2={x} y2={28} stroke="#ccc" />
            <text x={x} y={16} textAnchor="middle" fill="#666" fontSize="11px">
              {year}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

const TimelineCanvas = () => {
  const svgRef = useRef(null)
  const containerRef = useRef(null)
  const scrollRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [contentHeight, setContentHeight] = useState(0)

  // Background drag state
  const isDraggingBg = useRef(false)
  const dragStartX = useRef(0)
  const dragStartYear = useRef(0)
  const dragStartEndYear = useRef(0)

  // Item vertical drag state
  const isDraggingItem = useRef(false)
  const dragItemId = useRef(null)
  const dragItemStartY = useRef(0)
  const dragItemMouseStartY = useRef(0)

  const people = useStore((state) => state.people)
  const events = useStore((state) => state.events)
  const categories = useStore((state) => state.categories)
  const locations = useStore((state) => state.locations)
  const zoomState = useStore((state) => state.zoomState)
  const parallelLines = useStore((state) => state.parallelLines)
  const showTooltip = useStore((state) => state.showTooltip)
  const hideTooltip = useStore((state) => state.hideTooltip)
  const showContextMenu = useStore((state) => state.showContextMenu)
  const openDetailPanel = useStore((state) => state.openDetailPanel)
  const setZoomRange = useStore((state) => state.setZoomRange)
  const markingMode = useStore((state) => state.markingMode)
  const highlightedItems = useStore((state) => state.highlightedItems)
  const toggleHighlight = useStore((state) => state.toggleHighlight)
  const dragOffsets = useStore((state) => state.dragOffsets)
  const setDragOffset = useStore((state) => state.setDragOffset)
  const setDragOffsets = useStore((state) => state.setDragOffsets)
  const toggleItemVisibility = useStore((state) => state.toggleItemVisibility)
  const setVerticalScale = useStore((state) => state.setVerticalScale)

  // Handle resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateDimensions = () => {
      const { width, height } = container.getBoundingClientRect()
      if (width > 0 && height > 0) {
        setDimensions({ width, height })
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions()
    })

    resizeObserver.observe(container)
    updateDimensions()

    window.addEventListener('resize', updateDimensions)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateDimensions)
    }
  }, [])

  // Vertical scale from zoomState
  const verticalScale = zoomState.verticalScale || 1.0

  // Main drawing effect
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { width } = dimensions
    const margin = { top: 10, right: 50, bottom: 10, left: 50 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = dimensions.height - margin.top - margin.bottom

    // Create defs for glow filter
    const defs = svg.append('defs')

    // Glow filter for highlighted items
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%')
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur')
    const feMerge = filter.append('feMerge')
    feMerge.append('feMergeNode').attr('in', 'coloredBlur')
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    // Create main group
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Create scales
    const xScale = d3
      .scaleLinear()
      .domain([zoomState.startYear, zoomState.endYear])
      .range([0, innerWidth])

    const yearRange = zoomState.endYear - zoomState.startYear

    // Scaled row spacing
    const scaledRowSpacing = MIN_ROW_SPACING * verticalScale

    // View context for name-aware layout
    const viewContext = {
      viewportWidth: innerWidth,
      yearRange: yearRange
    }

    // Group items by category and calculate layout
    const visibleCategories = categories.filter((c) => c.visible)

    let currentY = 0
    const categoryData = []

    visibleCategories.forEach((category) => {
      const categoryPeople = people.filter(
        (p) =>
          p.categories.includes(category.id) &&
          !p.visibility.isHidden &&
          p.categories[0] === category.id
      )

      // All events belong to "events" category
      const categoryEvents = category.id === 'events'
        ? events.filter((e) => !e.visibility.isHidden)
        : []

      calculateOptimalLayout([...categoryPeople, ...categoryEvents], category.id, viewContext)

      const maxY = Math.max(
        ...categoryPeople.map((p) => p.position.y || 0),
        ...categoryEvents.map((e) => e.position.y || 0),
        0
      )

      categoryData.push({
        category,
        categoryPeople,
        categoryEvents,
        startY: currentY
      })

      currentY += (maxY * verticalScale) + (100 * verticalScale)
    })

    const actualContentHeight = Math.max(innerHeight, currentY)

    // Draw historical period background bands
    drawHistoricalPeriods(g, xScale, actualContentHeight, yearRange)

    // Draw vertical grid lines
    drawGridLines(g, xScale, innerWidth, actualContentHeight)

    // Draw parallel lines if active
    if (parallelLines.isVisible) {
      drawParallelLines(g, xScale, actualContentHeight, parallelLines)
    }

    // Build a map of all visible items with their effective Y positions (for drag-swap)
    const allVisibleItems = []
    categoryData.forEach(({ category, categoryPeople, categoryEvents, startY }) => {
      categoryPeople.forEach((person) => {
        const dragOff = dragOffsets[person.id] || 0
        allVisibleItems.push({
          id: person.id,
          type: 'person',
          categoryId: category.id,
          baseY: startY + ((person.position.y || 0) * verticalScale) + (40 * verticalScale),
          effectiveY: startY + ((person.position.y || 0) * verticalScale) + (40 * verticalScale) + (dragOff * verticalScale),
          birth: person.birth,
          death: person.death,
          start_year: person.birth,
          end_year: person.death,
          isPinned: person.position?.isPinned || false,
        })
      })
      categoryEvents.forEach((evt) => {
        const dragOff = dragOffsets[evt.id] || 0
        allVisibleItems.push({
          id: evt.id,
          type: 'event',
          categoryId: category.id,
          baseY: startY + ((evt.position.y || 0) * verticalScale) + (40 * verticalScale),
          effectiveY: startY + ((evt.position.y || 0) * verticalScale) + (40 * verticalScale) + (dragOff * verticalScale),
          start_year: evt.start_year,
          end_year: evt.end_year,
          isPinned: false,
        })
      })
    })

    // Handlers object
    const handlers = {
      showTooltip,
      hideTooltip,
      showContextMenu,
      openDetailPanel,
      markingMode,
      toggleHighlight,
      highlightedItems,
      setDragOffset,
      setDragOffsets,
      dragOffsets,
      allVisibleItems,
      toggleItemVisibility,
    }

    // Draw all categories
    categoryData.forEach(({ category, categoryPeople, categoryEvents, startY }) => {
      g.append('text')
        .attr('x', -10)
        .attr('y', startY + 20 * verticalScale)
        .attr('text-anchor', 'end')
        .attr('font-size', `${Math.max(9, 14 * verticalScale)}px`)
        .attr('font-weight', 'bold')
        .attr('fill', category.color)
        .text(category.name)

      categoryPeople.forEach((person) => {
        drawPersonLine(g, person, xScale, startY, locations, handlers, yearRange, defs, verticalScale)
      })

      categoryEvents.forEach((evt) => {
        drawEventBar(g, evt, xScale, startY, locations, handlers, yearRange, verticalScale)
      })
    })

    const totalContentHeight = currentY + margin.top + margin.bottom
    setContentHeight(totalContentHeight)
  }, [
    dimensions, people, events, categories, locations, zoomState,
    parallelLines, showTooltip, hideTooltip, showContextMenu,
    openDetailPanel, markingMode, highlightedItems, toggleHighlight,
    dragOffsets, setDragOffset, setDragOffsets, toggleItemVisibility, verticalScale
  ])

  // Wheel handler - improved trackpad support
  const handleWheel = useCallback((e) => {
    const ZOOM_SENSITIVITY = 0.002
    const PAN_SENSITIVITY = 0.8

    if (e.ctrlKey || e.metaKey) {
      // Pinch-to-zoom on trackpad - affects BOTH axes
      e.preventDefault()
      e.stopPropagation()

      const zoomDelta = e.deltaY * ZOOM_SENSITIVITY
      const currentRange = zoomState.endYear - zoomState.startYear
      const newRange = currentRange * (1 + zoomDelta)

      // Zoom toward mouse position (horizontal)
      const rect = containerRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left - 50 // margin.left
      const mouseRatio = mouseX / (rect.width - 100) // innerWidth
      const mouseYear = zoomState.startYear + currentRange * mouseRatio

      const newStartYear = Math.round(mouseYear - newRange * mouseRatio)
      const newEndYear = Math.round(mouseYear + newRange * (1 - mouseRatio))

      const MIN_RANGE = 10
      const MAX_RANGE = zoomState.maxYear - zoomState.minYear

      if (newRange >= MIN_RANGE && newRange <= MAX_RANGE) {
        setZoomRange(
          Math.max(zoomState.minYear, newStartYear),
          Math.min(zoomState.maxYear, newEndYear)
        )
      }

      // Also adjust vertical scale in sync
      const vScale = (zoomState.verticalScale || 1.0) * (1 - zoomDelta)
      setVerticalScale(vScale)
    } else if (Math.abs(e.deltaX) > 2 || (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 0.5 && Math.abs(e.deltaX) > 1)) {
      // Horizontal swipe - pan timeline
      e.preventDefault()
      e.stopPropagation()
      const currentRange = zoomState.endYear - zoomState.startYear
      const yearShift = Math.round((e.deltaX * PAN_SENSITIVITY * currentRange) / 1000)

      const newStartYear = zoomState.startYear + yearShift
      const newEndYear = zoomState.endYear + yearShift

      if (newStartYear >= zoomState.minYear && newEndYear <= zoomState.maxYear) {
        setZoomRange(newStartYear, newEndYear)
      }
    }
    // Vertical scroll: let browser handle it naturally (don't prevent default)
  }, [zoomState, setZoomRange, setVerticalScale])

  // Background drag panning (mousedown on empty space)
  const dragStartY = useRef(0)
  const dragStartScrollTop = useRef(0)

  const handleMouseDown = useCallback((e) => {
    // Only start drag on primary button and on empty space (SVG background)
    if (e.button !== 0) return
    const target = e.target
    // Only initiate drag if clicking on SVG, g, line, or rect.period-bg (background elements)
    const isBackground = target.tagName === 'svg' ||
      (target.tagName === 'g' && !target.closest('.person-line') && !target.closest('.event-bar')) ||
      (target.tagName === 'line') ||
      (target.tagName === 'rect' && target.classList.contains('period-bg'))

    if (!isBackground) return

    isDraggingBg.current = true
    dragStartX.current = e.clientX
    dragStartY.current = e.clientY
    dragStartYear.current = zoomState.startYear
    dragStartEndYear.current = zoomState.endYear
    dragStartScrollTop.current = scrollRef.current ? scrollRef.current.scrollTop : 0
    e.preventDefault()
    document.body.style.cursor = 'grabbing'
  }, [zoomState])

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingBg.current) return

    const deltaX = e.clientX - dragStartX.current
    const deltaY = e.clientY - dragStartY.current
    const { width } = dimensions
    const innerWidth = width - 100 // margins
    const currentRange = dragStartEndYear.current - dragStartYear.current

    // Horizontal: convert pixel delta to year delta (drag right = go back in time)
    const yearDelta = -(deltaX / innerWidth) * currentRange

    const newStart = Math.round(dragStartYear.current + yearDelta)
    const newEnd = Math.round(dragStartEndYear.current + yearDelta)

    if (newStart >= zoomState.minYear && newEnd <= zoomState.maxYear) {
      setZoomRange(newStart, newEnd)
    }

    // Vertical: scroll the SVG container (drag down = scroll up, like moving a canvas)
    if (scrollRef.current) {
      scrollRef.current.scrollTop = dragStartScrollTop.current - deltaY
    }
  }, [dimensions, zoomState.minYear, zoomState.maxYear, setZoomRange])

  const handleMouseUp = useCallback(() => {
    if (isDraggingBg.current) {
      isDraggingBg.current = false
      document.body.style.cursor = ''
    }
  }, [])

  // Register event handlers
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    container.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp])

  const margin = { top: 10, right: 50, bottom: 10, left: 50 }

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative bg-gray-50 flex flex-col"
      style={{ cursor: 'default' }}
    >
      {/* Top sticky ruler */}
      <YearRuler width={dimensions.width} margin={margin} zoomState={zoomState} />

      {/* Scrollable SVG content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <svg ref={svgRef} width={dimensions.width} height={Math.max(dimensions.height - 56, contentHeight)} />
      </div>

      {/* Bottom sticky ruler */}
      <YearRuler width={dimensions.width} margin={margin} zoomState={zoomState} />

      <ZoomControls />

      {/* Marking mode button */}
      <MarkingModeButton />
    </div>
  )
}

/**
 * Marking mode toggle button
 */
const MarkingModeButton = () => {
  const markingMode = useStore((state) => state.markingMode)
  const toggleMarkingMode = useStore((state) => state.toggleMarkingMode)
  const highlightedItems = useStore((state) => state.highlightedItems)
  const clearHighlights = useStore((state) => state.clearHighlights)

  return (
    <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
      <button
        onClick={toggleMarkingMode}
        className={`px-3 py-2 rounded-lg text-xs font-semibold shadow-md transition-all ${
          markingMode
            ? 'bg-yellow-400 text-yellow-900 ring-2 ring-yellow-500 animate-pulse'
            : 'bg-white text-gray-600 hover:bg-gray-100'
        }`}
        title={markingMode ? 'מצב סימון פעיל - לחץ לביטול' : 'הפעל מצב סימון'}
      >
        {markingMode ? '✦ סימון פעיל' : '✦ סמן'}
      </button>
      {highlightedItems.length > 0 && (
        <button
          onClick={clearHighlights}
          className="px-3 py-1 rounded-lg text-xs bg-white text-gray-500 hover:bg-gray-100 shadow-md"
          title="נקה סימונים"
        >
          נקה ({highlightedItems.length})
        </button>
      )}
    </div>
  )
}

/**
 * Draw historical period background bands
 */
const drawHistoricalPeriods = (g, xScale, height, yearRange) => {
  const visibleStart = xScale.domain()[0]
  const visibleEnd = xScale.domain()[1]

  HISTORICAL_PERIODS.forEach(period => {
    // Only draw if period overlaps visible range
    if (period.end < visibleStart || period.start > visibleEnd) return

    const x1 = Math.max(xScale(period.start), xScale(visibleStart))
    const x2 = Math.min(xScale(period.end), xScale(visibleEnd))

    g.append('rect')
      .attr('class', 'period-bg')
      .attr('x', x1)
      .attr('y', 0)
      .attr('width', x2 - x1)
      .attr('height', height)
      .attr('fill', period.color)
      .attr('pointer-events', 'none')

    // Show period name when zoomed in enough
    if (yearRange <= 2000) {
      const centerX = (x1 + x2) / 2
      g.append('text')
        .attr('x', centerX)
        .attr('y', height - 8)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', 'rgba(0,0,0,0.15)')
        .attr('font-weight', '500')
        .attr('pointer-events', 'none')
        .text(period.name)
    }
  })
}

/**
 * Draw vertical grid lines
 */
const drawGridLines = (g, xScale, width, height) => {
  const ticks = xScale.ticks(10)
  ticks.forEach(tick => {
    g.append('line')
      .attr('x1', xScale(tick))
      .attr('y1', 0)
      .attr('x2', xScale(tick))
      .attr('y2', height)
      .attr('stroke', '#bbb')
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0.5)
      .attr('pointer-events', 'none')
  })
}

/**
 * Draw parallel lines
 */
const drawParallelLines = (g, xScale, height, parallelLines) => {
  if (!parallelLines.isVisible) return

  const { leftLine, rightLine } = parallelLines

  g.append('line')
    .attr('x1', xScale(leftLine.year))
    .attr('y1', 0)
    .attr('x2', xScale(leftLine.year))
    .attr('y2', height)
    .attr('stroke', '#FF5722')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '5,5')

  g.append('text')
    .attr('x', xScale(leftLine.year) + 5)
    .attr('y', 20)
    .attr('fill', '#FF5722')
    .attr('font-weight', 'bold')
    .attr('font-size', '14px')
    .text(leftLine.label)

  g.append('line')
    .attr('x1', xScale(rightLine.year))
    .attr('y1', 0)
    .attr('x2', xScale(rightLine.year))
    .attr('y2', height)
    .attr('stroke', '#FF5722')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '5,5')

  g.append('text')
    .attr('x', xScale(rightLine.year) + 5)
    .attr('y', 20)
    .attr('fill', '#FF5722')
    .attr('font-weight', 'bold')
    .attr('font-size', '14px')
    .text(rightLine.label)
}

/**
 * Check if two items overlap in time (including label width consideration)
 */
const itemsOverlapInTime = (itemA, itemB) => {
  const startA = itemA.birth || itemA.start_year
  const endA = itemA.death || itemA.end_year || new Date().getFullYear()
  const startB = itemB.birth || itemB.start_year
  const endB = itemB.death || itemB.end_year || new Date().getFullYear()
  return !(endA < startB || startA > endB)
}

const MIN_ROW_SPACING = 35

/**
 * Check if a candidate Y position collides with any already-placed item
 * that overlaps in time with the given item.
 */
const collidesWithPlaced = (item, candidateY, positions, allItems) => {
  for (const [placedId, placedY] of positions) {
    if (Math.abs(placedY - candidateY) < MIN_ROW_SPACING) {
      const placedItem = allItems.find(i => i.id === placedId)
      if (placedItem && itemsOverlapInTime(item, placedItem)) {
        return true
      }
    }
  }
  return false
}

/**
 * Given all items with their original Y positions and the dragged
 * item's snapped target Y, compute where every item should end up.
 */
const computePreviewPositions = (allItems, draggedId, draggedTargetY) => {
  const positions = new Map()

  // Place dragged item first
  positions.set(draggedId, draggedTargetY)

  // Sort others by original Y - process items closest to the drag target first
  const draggedItem = allItems.find(i => i.id === draggedId)
  const dragOriginY = draggedItem ? draggedItem.originalY : draggedTargetY

  const others = allItems
    .filter(item => item.id !== draggedId)
    .sort((a, b) => {
      const distA = Math.abs(a.originalY - dragOriginY)
      const distB = Math.abs(b.originalY - dragOriginY)
      return distA - distB
    })

  // For each other item, find a valid position
  others.forEach(item => {
    // First try: stay at original position
    if (!collidesWithPlaced(item, item.originalY, positions, allItems)) {
      positions.set(item.id, item.originalY)
      return
    }

    // Collision at original spot - search for nearest free row
    for (let offset = 1; offset <= 30; offset++) {
      const tryDown = item.originalY + offset * MIN_ROW_SPACING
      if (!collidesWithPlaced(item, tryDown, positions, allItems)) {
        positions.set(item.id, tryDown)
        return
      }

      const tryUp = item.originalY - offset * MIN_ROW_SPACING
      if (tryUp >= 0 && !collidesWithPlaced(item, tryUp, positions, allItems)) {
        positions.set(item.id, tryUp)
        return
      }
    }

    // Fallback: stay at original
    positions.set(item.id, item.originalY)
  })

  return positions
}

/**
 * Setup smart vertical drag with preview-from-scratch approach.
 */
const setupVerticalDrag = (group, itemId, handlers) => {
  let startMouseY = 0
  let currentOffset = 0
  let dragStartEffectiveY = 0
  let allCategoryItems = []
  let svgNode = null
  let lastPreview = null

  const drag = d3.drag()
    .clickDistance(5)
    .on('start', function (event) {
      event.sourceEvent.stopPropagation()
      startMouseY = event.y
      currentOffset = handlers.dragOffsets[itemId] || 0
      svgNode = this.ownerSVGElement || this.closest('svg')
      lastPreview = null

      const thisItem = handlers.allVisibleItems.find(it => it.id === itemId)
      if (!thisItem) return

      dragStartEffectiveY = thisItem.effectiveY

      // Snapshot ALL visible items across all categories (frozen)
      allCategoryItems = handlers.allVisibleItems
        .filter(other => !other.isPinned)
        .map(item => ({
          id: item.id,
          originalY: item.effectiveY,
          birth: item.birth,
          death: item.death,
          start_year: item.start_year,
          end_year: item.end_year,
        }))

      d3.select(this).raise()
    })
    .on('drag', function (event) {
      if (!allCategoryItems.length) return

      const deltaY = event.y - startMouseY
      const draggedVisualY = dragStartEffectiveY + deltaY

      // Move the dragged element visually
      d3.select(this).attr('transform', `translate(0, ${deltaY})`).attr('opacity', 0.85)

      // Snap the dragged item's target to nearest row
      const snappedTargetY = Math.round(draggedVisualY / MIN_ROW_SPACING) * MIN_ROW_SPACING

      // Compute full preview from scratch
      const preview = computePreviewPositions(allCategoryItems, itemId, snappedTargetY)

      // Apply preview animations to all non-dragged items
      allCategoryItems.forEach(item => {
        if (item.id === itemId) return
        const previewY = preview.get(item.id)
        if (previewY === undefined) return

        const displacement = previewY - item.originalY
        const lastDisplacement = lastPreview ? (lastPreview.get(item.id) || item.originalY) - item.originalY : 0

        if (Math.abs(displacement - lastDisplacement) > 0.5) {
          const node = d3.select(svgNode).select(`[data-item-id="${item.id}"]`)
          if (!node.empty()) {
            node
              .transition()
              .duration(150)
              .ease(d3.easeQuadOut)
              .attr('transform', `translate(0, ${displacement})`)
          }
        }
      })

      lastPreview = preview
    })
    .on('end', function (event) {
      if (!allCategoryItems.length) {
        d3.select(this).attr('opacity', 1)
        return
      }

      const deltaY = event.y - startMouseY

      if (Math.abs(deltaY) > 3) {
        const draggedVisualY = dragStartEffectiveY + deltaY
        const snappedTargetY = Math.round(draggedVisualY / MIN_ROW_SPACING) * MIN_ROW_SPACING
        const finalPositions = computePreviewPositions(allCategoryItems, itemId, snappedTargetY)

        const batchOffsets = {}
        finalPositions.forEach((newY, id) => {
          const item = allCategoryItems.find(i => i.id === id)
          if (!item) return
          const moveAmount = newY - item.originalY
          if (Math.abs(moveAmount) > 0.5 || id === itemId) {
            const prevOffset = handlers.dragOffsets[id] || 0
            const newOffset = prevOffset + moveAmount
            batchOffsets[id] = Math.round(newOffset / MIN_ROW_SPACING) * MIN_ROW_SPACING
          }
        })

        handlers.setDragOffsets(batchOffsets)
      } else {
        allCategoryItems.forEach(item => {
          if (item.id === itemId) return
          const node = d3.select(svgNode).select(`[data-item-id="${item.id}"]`)
          if (!node.empty()) {
            node.transition().duration(150).attr('transform', 'translate(0, 0)')
          }
        })
      }

      d3.select(this).attr('opacity', 1)
    })

  group.call(drag)
}

/**
 * Handle right-click with double-right-click detection.
 * On double right-click: hide item and suppress any context menu that might
 * fire on the element that takes its place.
 */
const handleRightClick = (e, item, handlers) => {
  e.preventDefault()
  e.stopPropagation()
  const now = Date.now()

  // If we're in suppression window (just did a double-right-click hide), ignore
  if (now < suppressContextMenuUntil) {
    return
  }

  const type = item.birth !== undefined ? 'person' : 'event'

  if (lastRightClick.id === item.id && (now - lastRightClick.time) < 400) {
    // Double right-click on same item: hide temporarily
    handlers.toggleItemVisibility(item.id, type)
    lastRightClick = { id: null, time: 0 }
    // Suppress any context menu events for the next 500ms
    suppressContextMenuUntil = now + 500
  } else {
    // Single right-click: show context menu
    lastRightClick = { id: item.id, time: now }
    handlers.showContextMenu(e.pageX, e.pageY, item)
  }
}

/**
 * Draw person bar
 */
const drawPersonLine = (g, person, xScale, categoryY, locations, handlers, yearRange, defs, vScale) => {
  const dragOffset = handlers.dragOffsets[person.id] || 0
  const y = categoryY + ((person.position.y || 0) * vScale) + (40 * vScale) + (dragOffset * vScale)
  const x1 = xScale(person.birth)
  const x2 = xScale(person.death || new Date().getFullYear())
  const barHeight = Math.max(8, 20 * vScale)

  const gradient = createLocationGradient(person, locations)
  const isHighlighted = handlers.highlightedItems.includes(person.id)

  const lineGroup = g.append('g')
    .attr('class', 'person-line')
    .attr('data-item-id', person.id)
    .attr('data-base-transform', '')
    .style('cursor', 'grab')

  let fillAttr
  if (gradient.type === 'gradient') {
    const gradientId = `gradient-${person.id}`
    const svgRoot = d3.select(g.node().ownerSVGElement)
    let svgDefs = svgRoot.select('defs')
    if (svgDefs.empty()) {
      svgDefs = svgRoot.insert('defs', ':first-child')
    }

    const linearGradient = svgDefs
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('x2', '100%')

    linearGradient.append('stop').attr('offset', '0%').attr('stop-color', gradient.color1)
    linearGradient.append('stop').attr('offset', `${gradient.transitionPoint}%`).attr('stop-color', gradient.color1)
    linearGradient.append('stop').attr('offset', `${gradient.transitionPoint}%`).attr('stop-color', gradient.color2)
    linearGradient.append('stop').attr('offset', '100%').attr('stop-color', gradient.color2)

    fillAttr = `url(#${gradientId})`
  } else {
    fillAttr = gradient
  }

  // Glow effect for highlighted items
  if (isHighlighted) {
    lineGroup
      .append('rect')
      .attr('x', x1 - 3)
      .attr('y', y - barHeight / 2 - 3)
      .attr('width', Math.max(x2 - x1, 2) + 6)
      .attr('height', barHeight + 6)
      .attr('fill', 'none')
      .attr('stroke', '#FFD700')
      .attr('stroke-width', 3)
      .attr('rx', 6)
      .attr('filter', 'url(#glow)')
      .attr('class', 'highlight-glow')
  }

  // Draw rounded rectangle
  const rect = lineGroup
    .append('rect')
    .attr('x', x1)
    .attr('y', y - barHeight / 2)
    .attr('width', Math.max(x2 - x1, 2))
    .attr('height', barHeight)
    .attr('fill', fillAttr)
    .attr('opacity', isHighlighted ? 0.95 : 0.7)
    .attr('rx', Math.min(4, barHeight / 4))
    .attr('cursor', 'pointer')
    .on('mouseenter', function (e) {
      d3.select(this).attr('opacity', 0.9)
      handlers.showTooltip(
        e.pageX,
        e.pageY,
        `${person.name}\n${person.birth}–${person.death || 'היום'}`
      )
    })
    .on('mouseleave', function () {
      d3.select(this).attr('opacity', isHighlighted ? 0.95 : 0.7)
      handlers.hideTooltip()
    })
    .on('click', (e) => {
      if (handlers.markingMode) {
        handlers.toggleHighlight(person.id)
      } else {
        handlers.openDetailPanel(person)
      }
    })
    .on('contextmenu', (e) => {
      handleRightClick(e, person, handlers)
    })

  // Name label (3-tier zoom system) - show always for highlighted
  const fontSize = Math.max(7, (isHighlighted ? 12 : 11) * Math.min(vScale, 1.2))
  if ((yearRange <= 1000 || isHighlighted) && vScale >= 0.3) {
    const label = yearRange <= 400 ? person.name : (person.short_name || person.name)
    lineGroup
      .append('text')
      .attr('x', (x1 + x2) / 2)
      .attr('y', y - barHeight / 2 - Math.max(2, 4 * vScale))
      .attr('text-anchor', 'middle')
      .attr('font-size', `${fontSize}px`)
      .attr('font-weight', isHighlighted ? '700' : '600')
      .attr('fill', isHighlighted ? '#B8860B' : '#333')
      .attr('pointer-events', 'none')
      .text(label)
  }

  // Setup vertical drag
  setupVerticalDrag(lineGroup, person.id, handlers)
}

/**
 * Draw event bar (with dot rendering for single-year events)
 */
const drawEventBar = (g, evt, xScale, categoryY, locations, handlers, yearRange, vScale) => {
  const dragOffset = handlers.dragOffsets[evt.id] || 0
  const y = categoryY + ((evt.position.y || 0) * vScale) + (40 * vScale) + (dragOffset * vScale)
  const barHeight = Math.max(8, 20 * vScale)

  const color = getColorForLocation(evt.location, locations)
  const isHighlighted = handlers.highlightedItems.includes(evt.id)
  const isSingleYear = !evt.end_year || evt.end_year === evt.start_year

  const eventGroup = g.append('g')
    .attr('class', 'event-bar')
    .attr('data-item-id', evt.id)
    .attr('data-base-transform', '')
    .style('cursor', 'grab')

  if (isSingleYear) {
    // Single-year event: render as a dot
    const cx = xScale(evt.start_year)
    const dotRadius = Math.max(4, 8 * vScale)

    // Glow effect for highlighted
    if (isHighlighted) {
      eventGroup
        .append('circle')
        .attr('cx', cx)
        .attr('cy', y)
        .attr('r', dotRadius + 3)
        .attr('fill', 'none')
        .attr('stroke', '#FFD700')
        .attr('stroke-width', 3)
        .attr('filter', 'url(#glow)')
        .attr('class', 'highlight-glow')
    }

    eventGroup
      .append('circle')
      .attr('cx', cx)
      .attr('cy', y)
      .attr('r', dotRadius)
      .attr('fill', color)
      .attr('opacity', isHighlighted ? 0.95 : 0.8)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .attr('cursor', 'pointer')
      .on('mouseenter', function (e) {
        d3.select(this).attr('opacity', 1).attr('r', dotRadius + 2)
        handlers.showTooltip(
          e.pageX,
          e.pageY,
          `${evt.name}\n${evt.start_year}`
        )
      })
      .on('mouseleave', function () {
        d3.select(this).attr('opacity', isHighlighted ? 0.95 : 0.8).attr('r', dotRadius)
        handlers.hideTooltip()
      })
      .on('click', () => {
        if (handlers.markingMode) {
          handlers.toggleHighlight(evt.id)
        } else {
          handlers.openDetailPanel(evt)
        }
      })
      .on('contextmenu', (e) => {
        handleRightClick(e, evt, handlers)
      })
  } else {
    // Multi-year event: render as rectangle
    const x1 = xScale(evt.start_year)
    const x2 = xScale(evt.end_year)

    // Glow effect for highlighted items
    if (isHighlighted) {
      eventGroup
        .append('rect')
        .attr('x', x1 - 3)
        .attr('y', y - barHeight / 2 - 3)
        .attr('width', Math.max(x2 - x1, 2) + 6)
        .attr('height', barHeight + 6)
        .attr('fill', 'none')
        .attr('stroke', '#FFD700')
        .attr('stroke-width', 3)
        .attr('rx', 6)
        .attr('filter', 'url(#glow)')
        .attr('class', 'highlight-glow')
    }

    eventGroup
      .append('rect')
      .attr('x', x1)
      .attr('y', y - barHeight / 2)
      .attr('width', Math.max(x2 - x1, 2))
      .attr('height', barHeight)
      .attr('fill', color)
      .attr('opacity', isHighlighted ? 0.95 : 0.7)
      .attr('rx', Math.min(4, barHeight / 4))
      .attr('cursor', 'pointer')
      .on('mouseenter', function (e) {
        d3.select(this).attr('opacity', 0.9)
        handlers.showTooltip(
          e.pageX,
          e.pageY,
          `${evt.name}\n${evt.start_year}–${evt.end_year}`
        )
      })
      .on('mouseleave', function () {
        d3.select(this).attr('opacity', isHighlighted ? 0.95 : 0.7)
        handlers.hideTooltip()
      })
      .on('click', () => {
        if (handlers.markingMode) {
          handlers.toggleHighlight(evt.id)
        } else {
          handlers.openDetailPanel(evt)
        }
      })
      .on('contextmenu', (e) => {
        handleRightClick(e, evt, handlers)
      })
  }

  // Name label
  const fontSize = Math.max(7, (isHighlighted ? 12 : 11) * Math.min(vScale, 1.2))
  if ((yearRange <= 1000 || isHighlighted) && vScale >= 0.3) {
    const label = yearRange <= 400 ? evt.name : (evt.short_name || evt.name)
    const labelX = isSingleYear ? xScale(evt.start_year) : (xScale(evt.start_year) + xScale(evt.end_year)) / 2
    eventGroup
      .append('text')
      .attr('x', labelX)
      .attr('y', y - (isSingleYear ? Math.max(5, 10 * vScale) : barHeight / 2) - Math.max(2, 4 * vScale))
      .attr('text-anchor', 'middle')
      .attr('font-size', `${fontSize}px`)
      .attr('font-weight', isHighlighted ? '700' : '600')
      .attr('fill', isHighlighted ? '#B8860B' : '#333')
      .attr('pointer-events', 'none')
      .text(label)
  }

  // Setup vertical drag
  setupVerticalDrag(eventGroup, evt.id, handlers)
}

export default TimelineCanvas
