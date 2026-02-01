/**
 * Import/Export Service
 */

export const validateImportData = (data) => {
  const errors = []

  if (!data.people && !data.events) {
    errors.push('הקובץ חייב להכיל people או events')
  }

  // Validate people
  if (data.people) {
    data.people.forEach((person, i) => {
      const prefix = `אדם #${i + 1} (${person.name || 'ללא שם'})`

      if (!person.name) {
        errors.push(`${prefix}: חסר שם`)
      }

      if (!person.birth) {
        errors.push(`${prefix}: חסרה שנת לידה`)
      }

      if (person.birth && person.death && person.birth > person.death) {
        errors.push(`${prefix}: שנת לידה גדולה משנת מוות`)
      }

      if (!person.categories || person.categories.length === 0) {
        errors.push(`${prefix}: חסרה לפחות קטגוריה אחת`)
      }

      if (!person.primary_location) {
        errors.push(`${prefix}: חסר מיקום עיקרי`)
      }
    })
  }

  // Validate events
  if (data.events) {
    data.events.forEach((event, i) => {
      const prefix = `אירוע #${i + 1} (${event.name || 'ללא שם'})`

      if (!event.name) {
        errors.push(`${prefix}: חסר שם`)
      }

      if (!event.start_year) {
        errors.push(`${prefix}: חסרה שנת התחלה`)
      }

      if (event.start_year && event.end_year && event.start_year > event.end_year) {
        errors.push(`${prefix}: שנת התחלה גדולה משנת סיום`)
      }
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const checkDuplicates = (data, existingPeople, existingEvents) => {
  const duplicates = []

  // Check people
  if (data.people) {
    data.people.forEach((person) => {
      const existing = existingPeople.find((p) => p.id === person.id)
      if (existing) {
        duplicates.push({
          type: 'person',
          id: person.id,
          name: person.name,
          existing,
          new: person
        })
      }
    })
  }

  // Check events
  if (data.events) {
    data.events.forEach((event) => {
      const existing = existingEvents.find((e) => e.id === event.id)
      if (existing) {
        duplicates.push({
          type: 'event',
          id: event.id,
          name: event.name,
          existing,
          new: event
        })
      }
    })
  }

  return duplicates
}

export const normalizePersonData = (person) => {
  return {
    ...person,
    position: {
      y: null,
      isManuallyPlaced: false,
      isPinned: false
    },
    visibility: {
      isHidden: false,
      isInComparison: false
    }
  }
}

export const normalizeEventData = (event) => {
  return {
    ...event,
    position: {
      y: null,
      isManuallyPlaced: false
    },
    visibility: {
      isHidden: false
    }
  }
}
