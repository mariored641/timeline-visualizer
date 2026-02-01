import useStore from '../../store/useStore'

const HiddenItems = () => {
  const people = useStore((state) => state.people)
  const events = useStore((state) => state.events)
  const toggleItemVisibility = useStore((state) => state.toggleItemVisibility)

  const hiddenPeople = people.filter((p) => p.visibility.isHidden)
  const hiddenEvents = events.filter((e) => e.visibility.isHidden)
  const totalHidden = hiddenPeople.length + hiddenEvents.length

  const unhideAll = () => {
    hiddenPeople.forEach((p) => toggleItemVisibility(p.id, 'person'))
    hiddenEvents.forEach((e) => toggleItemVisibility(e.id, 'event'))
  }

  if (totalHidden === 0) {
    return null
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          מוסתרים ({totalHidden})
        </h3>
        <button
          onClick={unhideAll}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          החזר הכל
        </button>
      </div>

      <div className="space-y-1">
        {hiddenPeople.map((person) => (
          <div
            key={person.id}
            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group"
          >
            <span className="text-sm text-gray-600">{person.name}</span>
            <button
              onClick={() => toggleItemVisibility(person.id, 'person')}
              className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-700 transition-opacity"
              title="הצג בחזרה"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>
          </div>
        ))}

        {hiddenEvents.map((event) => (
          <div
            key={event.id}
            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group"
          >
            <span className="text-sm text-gray-600">
              {event.icon} {event.name}
            </span>
            <button
              onClick={() => toggleItemVisibility(event.id, 'event')}
              className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-700 transition-opacity"
              title="הצג בחזרה"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HiddenItems
