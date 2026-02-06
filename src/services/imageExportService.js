/**
 * Image Export Service
 * Renders timeline as a PNG image using offscreen SVG → Canvas
 */

import * as d3 from 'd3'
import { getColorForLocation, createLocationGradient } from '../utils/colorMapping'
import { calculateOptimalLayout } from './layoutEngine'

const HISTORICAL_PERIODS = [
  { name: 'העת העתיקה', start: -4000, end: 476, color: 'rgba(255, 230, 200, 0.25)' },
  { name: 'ימי הביניים', start: 476, end: 1500, color: 'rgba(210, 228, 205, 0.25)' },
  { name: 'רנסנס', start: 1500, end: 1600, color: 'rgba(225, 215, 240, 0.25)' },
  { name: 'נאורות', start: 1600, end: 1800, color: 'rgba(255, 245, 210, 0.25)' },
  { name: 'העידן המודרני', start: 1800, end: 1900, color: 'rgba(215, 230, 245, 0.25)' },
  { name: 'המאה ה-20', start: 1900, end: 2000, color: 'rgba(240, 218, 218, 0.25)' },
  { name: 'המאה ה-21', start: 2000, end: 2100, color: 'rgba(218, 235, 245, 0.25)' },
]

/**
 * Calculate recommended resolution based on scope
 */
export const getRecommendedResolution = (yearRange, categoryCount) => {
  const widthFactor = Math.max(1, yearRange / 100)
  const heightFactor = Math.max(1, categoryCount)
  const baseWidth = Math.min(8000, Math.max(2000, widthFactor * 40))
  const baseHeight = Math.min(6000, Math.max(800, heightFactor * 400))
  return { width: Math.round(baseWidth), height: Math.round(baseHeight) }
}

/**
 * Resolution presets
 */
export const RESOLUTION_PRESETS = [
  { label: 'נמוכה (HD)', id: 'low', width: 1920, height: 1080 },
  { label: 'בינונית (2K)', id: 'medium', width: 2560, height: 1440 },
  { label: 'גבוהה (4K)', id: 'high', width: 3840, height: 2160 },
  { label: 'מותאם אישית', id: 'custom', width: 0, height: 0 },
]

/**
 * Export the timeline as a PNG image
 */
export const exportTimelineAsImage = async ({
  people,
  events,
  categories,
  locations,
  selectedCategories,
  startYear,
  endYear,
  width,
  height,
}) => {
  const margin = { top: 40, right: 60, bottom: 40, left: 60 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  // Create offscreen SVG
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-99999px'
  document.body.appendChild(container)

  const svg = d3.select(container)
    .append('svg')
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .attr('width', width)
    .attr('height', height)
    .style('background', '#fafafa')
    .style('font-family', 'Arial, sans-serif')

  const defs = svg.append('defs')
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  const xScale = d3.scaleLinear()
    .domain([startYear, endYear])
    .range([0, innerWidth])

  const yearRange = endYear - startYear

  // Draw period backgrounds
  HISTORICAL_PERIODS.forEach(period => {
    if (period.end < startYear || period.start > endYear) return
    const x1 = Math.max(xScale(period.start), 0)
    const x2 = Math.min(xScale(period.end), innerWidth)
    g.append('rect')
      .attr('x', x1).attr('y', 0)
      .attr('width', x2 - x1).attr('height', innerHeight)
      .attr('fill', period.color)
  })

  // Grid lines
  xScale.ticks(Math.max(5, Math.floor(yearRange / 50))).forEach(tick => {
    g.append('line')
      .attr('x1', xScale(tick)).attr('y1', 0)
      .attr('x2', xScale(tick)).attr('y2', innerHeight)
      .attr('stroke', '#ccc').attr('stroke-dasharray', '3,3').attr('opacity', 0.5)
  })

  // Year ruler at top
  xScale.ticks(Math.max(5, Math.floor(yearRange / 50))).forEach(tick => {
    g.append('text')
      .attr('x', xScale(tick)).attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px').attr('fill', '#666')
      .text(tick)
  })

  // Filter visible categories
  const visibleCategories = categories.filter(c => selectedCategories.includes(c.id))
  const viewContext = { viewportWidth: innerWidth, yearRange }

  let currentY = 0
  visibleCategories.forEach(category => {
    const catPeople = people.filter(
      p => p.categories.includes(category.id) && !p.visibility?.isHidden && p.categories[0] === category.id
    )
    // All events belong to "events" category
    const catEvents = category.id === 'events'
      ? events.filter(e => !e.visibility?.isHidden)
      : []

    calculateOptimalLayout([...catPeople, ...catEvents], category.id, viewContext)

    const maxY = Math.max(
      ...catPeople.map(p => p.position?.y || 0),
      ...catEvents.map(e => e.position?.y || 0),
      0
    )

    // Category label
    g.append('text')
      .attr('x', -10).attr('y', currentY + 20)
      .attr('text-anchor', 'end')
      .attr('font-size', '14px').attr('font-weight', 'bold')
      .attr('fill', category.color)
      .text(category.name)

    // Draw people
    catPeople.forEach(person => {
      const py = currentY + (person.position?.y || 0) + 40
      const px1 = xScale(person.birth)
      const px2 = xScale(person.death || new Date().getFullYear())

      const gradient = createLocationGradient(person, locations)
      let fill
      if (gradient.type === 'gradient') {
        const gid = `exp-grad-${person.id}`
        const lg = defs.append('linearGradient').attr('id', gid).attr('x1', '0%').attr('x2', '100%')
        lg.append('stop').attr('offset', '0%').attr('stop-color', gradient.color1)
        lg.append('stop').attr('offset', `${gradient.transitionPoint}%`).attr('stop-color', gradient.color1)
        lg.append('stop').attr('offset', `${gradient.transitionPoint}%`).attr('stop-color', gradient.color2)
        lg.append('stop').attr('offset', '100%').attr('stop-color', gradient.color2)
        fill = `url(#${gid})`
      } else {
        fill = gradient
      }

      g.append('rect')
        .attr('x', px1).attr('y', py - 10)
        .attr('width', Math.max(px2 - px1, 2)).attr('height', 20)
        .attr('fill', fill).attr('opacity', 0.75).attr('rx', 4)

      const label = yearRange <= 400 ? person.name : (person.short_name || person.name)
      g.append('text')
        .attr('x', (px1 + px2) / 2).attr('y', py - 14)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px').attr('font-weight', '600').attr('fill', '#333')
        .text(label)
    })

    // Draw events
    catEvents.forEach(evt => {
      const ey = currentY + (evt.position?.y || 0) + 40
      const isSingle = !evt.end_year || evt.end_year === evt.start_year
      const color = getColorForLocation(evt.location, locations)

      if (isSingle) {
        g.append('circle')
          .attr('cx', xScale(evt.start_year)).attr('cy', ey)
          .attr('r', 8).attr('fill', color).attr('opacity', 0.8)
          .attr('stroke', '#fff').attr('stroke-width', 1.5)
      } else {
        const ex1 = xScale(evt.start_year)
        const ex2 = xScale(evt.end_year)
        g.append('rect')
          .attr('x', ex1).attr('y', ey - 10)
          .attr('width', Math.max(ex2 - ex1, 2)).attr('height', 20)
          .attr('fill', color).attr('opacity', 0.75).attr('rx', 4)
      }

      const label = yearRange <= 400 ? evt.name : (evt.short_name || evt.name)
      const labelX = isSingle ? xScale(evt.start_year) : (xScale(evt.start_year) + xScale(evt.end_year)) / 2
      g.append('text')
        .attr('x', labelX).attr('y', ey - (isSingle ? 14 : 14))
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px').attr('font-weight', '600').attr('fill', '#333')
        .text(label)
    })

    currentY += maxY + 100
  })

  // Convert SVG to image
  const svgNode = svg.node()
  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(svgNode)
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#fafafa'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0)

      canvas.toBlob(blob => {
        URL.revokeObjectURL(url)
        document.body.removeChild(container)
        if (blob) {
          const downloadUrl = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = downloadUrl
          a.download = `timeline_${startYear}_${endYear}_${new Date().toISOString().split('T')[0]}.png`
          a.click()
          URL.revokeObjectURL(downloadUrl)
          resolve()
        } else {
          reject(new Error('Failed to create image blob'))
        }
      }, 'image/png')
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      document.body.removeChild(container)
      reject(new Error('Failed to load SVG as image'))
    }
    img.src = url
  })
}
