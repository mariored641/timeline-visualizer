/**
 * Get color for location
 */
export const getColorForLocation = (locationId, locations) => {
  return locations[locationId]?.color || '#999999'
}

/**
 * Create gradient for location change
 */
export const createLocationGradient = (item, locations) => {
  if (!item.secondary_location) {
    return getColorForLocation(item.primary_location, locations)
  }

  const color1 = getColorForLocation(item.primary_location, locations)
  const color2 = getColorForLocation(item.secondary_location, locations)

  // If both colors are the same, no need for a gradient
  if (color1 === color2) {
    return color1
  }

  const birthYear = item.birth
  const deathYear = item.death || new Date().getFullYear()
  const changeYear = item.location_change_year || Math.floor((birthYear + deathYear) / 2)

  const transitionPoint = ((changeYear - birthYear) / (deathYear - birthYear)) * 100

  return {
    type: 'gradient',
    color1,
    color2,
    transitionPoint
  }
}

/**
 * Get location name
 */
export const getLocationName = (locationId, locations) => {
  return locations[locationId]?.name || locationId
}
