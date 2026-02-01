/**
 * Format year range
 */
export const formatYearRange = (start, end) => {
  if (!end) {
    return `${start}–היום`
  }
  return `${start}–${end}`
}

/**
 * Calculate duration in years
 */
export const calculateDuration = (start, end) => {
  if (!end) {
    return new Date().getFullYear() - start
  }
  return end - start
}

/**
 * Check if two time periods overlap
 */
export const hasTimeOverlap = (start1, end1, start2, end2) => {
  const actualEnd1 = end1 || new Date().getFullYear()
  const actualEnd2 = end2 || new Date().getFullYear()

  return !(actualEnd1 < start2 || start1 > actualEnd2)
}

/**
 * Get current year
 */
export const getCurrentYear = () => {
  return new Date().getFullYear()
}
