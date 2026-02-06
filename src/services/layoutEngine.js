import { hasTimeOverlap } from '../utils/dateUtils'

const MIN_SPACING = 35 // Minimum pixels between lines

// Approximate character width for Hebrew/Latin text at 11px font
const CHAR_WIDTH_PX = 7
const LABEL_PADDING_PX = 16 // Extra padding around label

/**
 * Estimate the pixel width of a label
 */
const estimateLabelWidth = (item) => {
  const name = item.short_name || item.name || ''
  return name.length * CHAR_WIDTH_PX + LABEL_PADDING_PX
}

/**
 * Convert pixel width to year span based on viewport context
 */
const pixelsToYears = (px, viewportWidth, yearRange) => {
  if (!viewportWidth || !yearRange || viewportWidth <= 0) return 0
  return (px / viewportWidth) * yearRange
}

/**
 * Get the effective time range of an item, accounting for label width
 */
const getEffectiveTimeRange = (item, viewportWidth, yearRange) => {
  const itemStart = item.birth || item.start_year
  const itemEnd = item.death || item.end_year || new Date().getFullYear()

  if (!viewportWidth || !yearRange) {
    return { start: itemStart, end: itemEnd }
  }

  const labelWidthPx = estimateLabelWidth(item)
  const labelYears = pixelsToYears(labelWidthPx, viewportWidth, yearRange)

  // Center of the item in years
  const itemCenter = (itemStart + itemEnd) / 2
  const itemSpanYears = itemEnd - itemStart

  // The effective span is the max of the item's actual span and the label width
  const effectiveSpan = Math.max(itemSpanYears, labelYears)
  const effectiveStart = itemCenter - effectiveSpan / 2
  const effectiveEnd = itemCenter + effectiveSpan / 2

  return { start: effectiveStart, end: effectiveEnd }
}

/**
 * Calculate optimal layout for items
 * @param {Array} items - items to layout
 * @param {string} categoryId - category identifier
 * @param {object} viewContext - optional {viewportWidth, yearRange} for name-aware layout
 */
export const calculateOptimalLayout = (items, categoryId, viewContext) => {
  // Sort by start year
  const sortedItems = [...items].sort((a, b) => {
    const startA = a.birth || a.start_year
    const startB = b.birth || b.start_year
    return startA - startB
  })

  const rows = []
  const viewportWidth = viewContext?.viewportWidth || 0
  const yearRange = viewContext?.yearRange || 0

  for (const item of sortedItems) {
    // Skip hidden items
    if (item.visibility?.isHidden) continue

    // If manually placed, keep position
    if (item.position?.isManuallyPlaced) {
      continue
    }

    // Find lowest row where item doesn't overlap
    let placedInRow = false

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      if (canFitInRow(item, rows[rowIndex], viewportWidth, yearRange)) {
        rows[rowIndex].items.push(item)
        item.position.y = rowIndex * MIN_SPACING
        placedInRow = true
        break
      }
    }

    // Create new row if needed
    if (!placedInRow) {
      const newRow = {
        index: rows.length,
        items: [item]
      }
      rows.push(newRow)
      item.position.y = newRow.index * MIN_SPACING
    }
  }

  return rows
}

/**
 * Check if item can fit in row without overlap (including label width)
 */
const canFitInRow = (item, row, viewportWidth, yearRange) => {
  const itemRange = getEffectiveTimeRange(item, viewportWidth, yearRange)

  for (const existingItem of row.items) {
    const existingRange = getEffectiveTimeRange(existingItem, viewportWidth, yearRange)

    if (hasTimeOverlap(itemRange.start, itemRange.end, existingRange.start, existingRange.end)) {
      return false
    }
  }

  return true
}

/**
 * Handle collisions during drag
 */
export const handleCollisions = (draggedItem, allItems) => {
  const MIN_Y_SPACING = MIN_SPACING

  for (const otherItem of allItems) {
    if (otherItem.id === draggedItem.id) continue
    if (otherItem.position?.isPinned) continue // Pinned items don't move

    // Check time overlap
    const draggedStart = draggedItem.birth || draggedItem.start_year
    const draggedEnd = draggedItem.death || draggedItem.end_year || new Date().getFullYear()
    const otherStart = otherItem.birth || otherItem.start_year
    const otherEnd = otherItem.death || otherItem.end_year || new Date().getFullYear()

    const hasTimeOverlapBool = hasTimeOverlap(draggedStart, draggedEnd, otherStart, otherEnd)

    if (hasTimeOverlapBool) {
      // Check Y distance
      const yDistance = Math.abs(draggedItem.position.y - otherItem.position.y)

      if (yDistance < MIN_Y_SPACING) {
        // Push other item
        if (draggedItem.position.y < otherItem.position.y) {
          otherItem.position.y = draggedItem.position.y + MIN_Y_SPACING
        } else {
          otherItem.position.y = draggedItem.position.y - MIN_Y_SPACING
        }
      }
    }
  }
}

/**
 * Get category offset (for grouping)
 */
export const getCategoryOffset = (category, categories) => {
  const index = categories.findIndex((c) => c.id === category)
  return index * 150 // 150px spacing between categories
}
