import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import * as d3 from 'd3'
import useStore from '../../store/useStore'
import { calculateOptimalLayout, getCategoryOffset } from '../../services/layoutEngine'
import { getColorForLocation, createLocationGradient } from '../../utils/colorMapping'
import ZoomControls from '../UI/ZoomControls'

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
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [contentHeight, setContentHeight] = useState(0)
  const [pointers, setPointers] = useState([])
  const [lastPinchDistance, setLastPinchDistance] = useState(null)

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
  const zoomIn = useStore((state) => state.zoomIn)
  const zoomOut = useStore((state) => state.zoomOut)
  const panLeft = useStore((state) => state.panLeft)
  const panRight = useStore((state) => state.panRight)
  const setZoomRange = useStore((state) => state.setZoomRange)

  // Calculate distance between two pointers
  const getDistance = (p1, p2) => {
    const dx = p1.x - p2.x
    const dy = p1.y - p2.y
    return Math.sqrt(dx * dx + dy * dy)
  }

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

  // Main drawing effect
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove() // Clear previous content

    const { width, height } = dimensions
    const margin = { top: 10, right: 50, bottom: 10, left: 50 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    // Create main group
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Create scales
    const xScale = d3
      .scaleLinear()
      .domain([zoomState.startYear, zoomState.endYear])
      .range([0, innerWidth])

    // Group items by category and calculate layout first (to determine total content height)
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

      const categoryEvents = events.filter(
        (e) => e.category === category.id && !e.visibility.isHidden
      )

      // Calculate layout
      calculateOptimalLayout([...categoryPeople, ...categoryEvents], category.id)

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

      currentY += maxY + 100
    })

    // Use the larger of container height or content height for axis lines
    const actualContentHeight = Math.max(innerHeight, currentY)

    // Draw vertical grid lines (axis labels are in sticky rulers)
    drawGridLines(g, xScale, innerWidth, actualContentHeight)

    // Draw parallel lines if active
    if (parallelLines.isVisible) {
      drawParallelLines(g, xScale, actualContentHeight, parallelLines)
    }

    // Now draw all the categories
    categoryData.forEach(({ category, categoryPeople, categoryEvents, startY }) => {
      // Draw category label
      g.append('text')
        .attr('x', -10)
        .attr('y', startY + 20)
        .attr('text-anchor', 'end')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .attr('fill', category.color)
        .text(category.name)

      // Draw people
      categoryPeople.forEach((person) => {
        drawPersonLine(g, person, xScale, startY, locations, {
          showTooltip,
          hideTooltip,
          showContextMenu,
          openDetailPanel
        })
      })

      // Draw events
      categoryEvents.forEach((event) => {
        drawEventBar(g, event, xScale, startY, locations, {
          showTooltip,
          hideTooltip,
          showContextMenu,
          openDetailPanel
        })
      })
    })

    // Set the content height so the SVG can be scrollable
    const totalContentHeight = currentY + margin.top + margin.bottom
    setContentHeight(totalContentHeight)
  }, [
    dimensions,
    people,
    events,
    categories,
    locations,
    zoomState,
    parallelLines,
    showTooltip,
    hideTooltip,
    showContextMenu,
    openDetailPanel
  ])

  // Pointer Down - track new pointer
  const handlePointerDown = useCallback((e) => {
    e.preventDefault()

    setPointers((prevPointers) => {
      const newPointers = [
        ...prevPointers,
        {
          id: e.pointerId,
          x: e.clientX,
          y: e.clientY
        }
      ]

      // If we now have 2 pointers - start pinch
      if (newPointers.length === 2) {
        const distance = getDistance(newPointers[0], newPointers[1])
        setLastPinchDistance(distance)
      }

      return newPointers
    })
  }, [])

  // Pointer Move - handle pinch zoom with smooth sensitivity
  const handlePointerMove = useCallback((e) => {
    e.preventDefault()

    setPointers((prevPointers) => {
      if (prevPointers.length !== 2) return prevPointers

      // Update this pointer's position
      const updatedPointers = prevPointers.map((p) =>
        p.id === e.pointerId ? { id: e.pointerId, x: e.clientX, y: e.clientY } : p
      )

      // Calculate new distance
      const newDistance = getDistance(updatedPointers[0], updatedPointers[1])

      setLastPinchDistance((prevDistance) => {
        if (prevDistance) {
          // Calculate ratio
          const ratio = newDistance / prevDistance

          // Dampen the zoom - reduce sensitivity
          // Apply a smoothing factor: only use a fraction of the ratio change
          const PINCH_SENSITIVITY = 0.3 // Lower = less sensitive, smoother zoom
          const dampedRatio = 1 + (ratio - 1) * PINCH_SENSITIVITY

          // Update year range
          const currentRange = zoomState.endYear - zoomState.startYear
          const newRange = currentRange / dampedRatio
          const center = (zoomState.startYear + zoomState.endYear) / 2

          const newStartYear = Math.round(center - newRange / 2)
          const newEndYear = Math.round(center + newRange / 2)

          // Update zoom state
          setZoomRange(newStartYear, newEndYear)
        }

        return newDistance
      })

      return updatedPointers
    })
  }, [zoomState, setZoomRange])

  // Pointer Up - remove pointer
  const handlePointerUp = useCallback((e) => {
    e.preventDefault()

    setPointers((prevPointers) => {
      const remainingPointers = prevPointers.filter((p) => p.id !== e.pointerId)

      // If less than 2 pointers - end pinch
      if (remainingPointers.length < 2) {
        setLastPinchDistance(null)
      }

      return remainingPointers
    })
  }, [])

  // Wheel handler for trackpad with continuous proportional response
  const handleWheel = useCallback((e) => {
    // Continuous sensitivity settings - direct proportional response
    const ZOOM_SENSITIVITY = 0.002 // How much to zoom per deltaY pixel
    const PAN_SENSITIVITY = 0.8 // Multiplier for pan movement
    const NATURAL_SCROLLING = true // true = Mac/iPhone style, false = traditional

    // Check if this is a pinch gesture (ctrlKey is set for pinch on trackpad)
    if (e.ctrlKey) {
      e.preventDefault()
      e.stopPropagation()
      // Pinch to zoom - continuous zoom based on deltaY magnitude
      const zoomDelta = -e.deltaY * ZOOM_SENSITIVITY

      // Calculate new range
      const currentRange = zoomState.endYear - zoomState.startYear
      const newRange = currentRange * (1 + zoomDelta)
      const center = (zoomState.startYear + zoomState.endYear) / 2

      // Calculate new bounds
      const newStartYear = Math.round(center - newRange / 2)
      const newEndYear = Math.round(center + newRange / 2)

      // Apply limits (minimum 10 years, maximum full range)
      const MIN_RANGE = 10
      const MAX_RANGE = zoomState.maxYear - zoomState.minYear

      if (newRange >= MIN_RANGE && newRange <= MAX_RANGE) {
        setZoomRange(newStartYear, newEndYear)
      }
    } else {
      // Two-finger swipe for panning and zooming
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        // Horizontal pan is dominant - prevent default and handle manually
        e.preventDefault()
        e.stopPropagation()
        const currentRange = zoomState.endYear - zoomState.startYear

        // Natural scrolling direction
        const direction = NATURAL_SCROLLING ? -1 : 1

        // Calculate year shift proportional to deltaX
        const yearShift = Math.round((e.deltaX * direction * PAN_SENSITIVITY * currentRange) / 1000)

        const newStartYear = zoomState.startYear + yearShift
        const newEndYear = zoomState.endYear + yearShift

        // Apply limits
        if (newStartYear >= zoomState.minYear && newEndYear <= zoomState.maxYear) {
          setZoomRange(newStartYear, newEndYear)
        }
      } else {
        // Vertical movement - this should scroll the viewport, not zoom
        // The browser's default scrolling will handle this naturally
        // We don't need to do anything here - just let the event propagate
        return
      }
    }
  }, [zoomState, setZoomRange])

  // Register pointer handlers
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('pointerdown', handlePointerDown)
    container.addEventListener('pointermove', handlePointerMove)
    container.addEventListener('pointerup', handlePointerUp)
    container.addEventListener('pointercancel', handlePointerUp)
    container.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      container.removeEventListener('pointerdown', handlePointerDown)
      container.removeEventListener('pointermove', handlePointerMove)
      container.removeEventListener('pointerup', handlePointerUp)
      container.removeEventListener('pointercancel', handlePointerUp)
      container.removeEventListener('wheel', handleWheel)
    }
  }, [handlePointerDown, handlePointerMove, handlePointerUp, handleWheel])

  const margin = { top: 10, right: 50, bottom: 10, left: 50 }

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative bg-gray-50 flex flex-col"
    >
      {/* Top sticky ruler */}
      <YearRuler width={dimensions.width} margin={margin} zoomState={zoomState} />

      {/* Scrollable SVG content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <svg ref={svgRef} width={dimensions.width} height={Math.max(dimensions.height - 56, contentHeight)} />
      </div>

      {/* Bottom sticky ruler */}
      <YearRuler width={dimensions.width} margin={margin} zoomState={zoomState} />

      <ZoomControls />
    </div>
  )
}

/**
 * Draw vertical grid lines (year labels are in sticky rulers)
 */
const drawGridLines = (g, xScale, width, height) => {
  const ticks = xScale.ticks(10)
  ticks.forEach(tick => {
    g.append('line')
      .attr('x1', xScale(tick))
      .attr('y1', 0)
      .attr('x2', xScale(tick))
      .attr('y2', height)
      .attr('stroke', '#eee')
      .attr('stroke-dasharray', '2,2')
  })
}

/**
 * Draw parallel lines
 */
const drawParallelLines = (g, xScale, height, parallelLines) => {
  if (!parallelLines.isVisible) return

  const { leftLine, rightLine } = parallelLines

  // Left line
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

  // Right line
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
 * Draw person bar (rounded rectangle like events)
 */
const drawPersonLine = (g, person, xScale, categoryY, locations, handlers) => {
  const y = categoryY + (person.position.y || 0) + 40
  const x1 = xScale(person.birth)
  const x2 = xScale(person.death || new Date().getFullYear())
  const barHeight = 20

  const gradient = createLocationGradient(person, locations)

  // Create person group
  const lineGroup = g.append('g').attr('class', 'person-line')

  let fillAttr
  if (gradient.type === 'gradient') {
    const gradientId = `gradient-${person.id}`
    const svgRoot = d3.select(g.node().ownerSVGElement)
    let defs = svgRoot.select('defs')
    if (defs.empty()) {
      defs = svgRoot.insert('defs', ':first-child')
    }

    const linearGradient = defs
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

  // Draw rounded rectangle
  lineGroup
    .append('rect')
    .attr('x', x1)
    .attr('y', y - barHeight / 2)
    .attr('width', Math.max(x2 - x1, 2))
    .attr('height', barHeight)
    .attr('fill', fillAttr)
    .attr('opacity', 0.7)
    .attr('rx', 4)
    .attr('cursor', 'pointer')
    .on('mouseenter', function (event) {
      d3.select(this).attr('opacity', 0.9)
      handlers.showTooltip(
        event.pageX,
        event.pageY,
        `${person.name}\n${person.birth}–${person.death || 'היום'}`
      )
    })
    .on('mouseleave', function () {
      d3.select(this).attr('opacity', 0.7)
      handlers.hideTooltip()
    })
    .on('click', () => {
      handlers.openDetailPanel(person)
    })
    .on('contextmenu', (event) => {
      event.preventDefault()
      handlers.showContextMenu(event.pageX, event.pageY, person)
    })

  // Name label (centered on the bar)
  lineGroup
    .append('text')
    .attr('x', (x1 + x2) / 2)
    .attr('y', y - barHeight / 2 - 4)
    .attr('text-anchor', 'middle')
    .attr('font-size', '11px')
    .attr('font-weight', '600')
    .attr('fill', '#333')
    .text(person.name)
}

/**
 * Draw event bar
 */
const drawEventBar = (g, event, xScale, categoryY, locations, handlers) => {
  const y = categoryY + (event.position.y || 0) + 40
  const x1 = xScale(event.start_year)
  const x2 = xScale(event.end_year || event.start_year + 1)
  const barHeight = 20

  const color = getColorForLocation(event.location, locations)

  // Create event group
  const eventGroup = g.append('g').attr('class', 'event-bar')

  // Draw bar
  eventGroup
    .append('rect')
    .attr('x', x1)
    .attr('y', y - barHeight / 2)
    .attr('width', Math.max(x2 - x1, 2))
    .attr('height', barHeight)
    .attr('fill', color)
    .attr('opacity', 0.7)
    .attr('rx', 4)
    .attr('cursor', 'pointer')
    .on('mouseenter', function (event) {
      d3.select(this).attr('opacity', 0.9)
      handlers.showTooltip(
        event.pageX,
        event.pageY,
        `${event.name}\n${event.start_year}${
          event.end_year ? `–${event.end_year}` : ''
        }`
      )
    })
    .on('mouseleave', function () {
      d3.select(this).attr('opacity', 0.7)
      handlers.hideTooltip()
    })
    .on('click', () => {
      handlers.openDetailPanel(event)
    })
    .on('contextmenu', (event) => {
      event.preventDefault()
      handlers.showContextMenu(event.pageX, event.pageY, event)
    })

  // Name label above the bar
  eventGroup
    .append('text')
    .attr('x', (x1 + x2) / 2)
    .attr('y', y - barHeight / 2 - 4)
    .attr('text-anchor', 'middle')
    .attr('font-size', '11px')
    .attr('font-weight', '600')
    .attr('fill', '#333')
    .text(event.name)
}

export default TimelineCanvas
