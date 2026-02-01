import { hasTimeOverlap } from '../utils/dateUtils'

const MIN_SPACING = 35 // Minimum pixels between lines

/**
 * Calculate optimal layout for items
 */
export const calculateOptimalLayout = (items, categoryId) => {
  // Sort by start year
  const sortedItems = [...items].sort((a, b) => {
    const startA = a.birth || a.start_year
    const startB = b.birth || b.start_year
    return startA - startB
  })

  const rows = []

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
      if (canFitInRow(item, rows[rowIndex])) {
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
 * Check if item can fit in row without overlap
 */
const canFitInRow = (item, row) => {
  const itemStart = item.birth || item.start_year
  const itemEnd = item.death || item.end_year || new Date().getFullYear()

  for (const existingItem of row.items) {
    const existingStart = existingItem.birth || existingItem.start_year
    const existingEnd = existingItem.death || existingItem.end_year || new Date().getFullYear()

    if (hasTimeOverlap(itemStart, itemEnd, existingStart, existingEnd)) {
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
