import useStore from '../../store/useStore'

const ComparisonList = () => {
  const comparisonItems = useStore((state) => state.comparisonItems)
  const removeFromComparison = useStore((state) => state.removeFromComparison)
  const clearComparison = useStore((state) => state.clearComparison)
  const showParallelLines = useStore((state) => state.showParallelLines)

  if (comparisonItems.length === 0) {
    return null
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          השוואה ({comparisonItems.length})
        </h3>
        <button
          onClick={clearComparison}
          className="text-xs text-red-600 hover:text-red-700 font-medium"
        >
          נקה הכל
        </button>
      </div>

      <div className="space-y-1">
        {comparisonItems.map(({ id, type, item }) => (
          <div
            key={id}
            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg group"
          >
            <span className="flex-1 text-sm text-gray-700">
              {item.name}
            </span>

            <button
              onClick={() => showParallelLines(item)}
              className="opacity-0 group-hover:opacity-100 p-1 text-blue-600 hover:text-blue-700 transition-opacity"
              title="הצג קווים מקבילים"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </button>

            <button
              onClick={() => removeFromComparison(id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:text-red-700 transition-opacity"
              title="הסר מהשוואה"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ComparisonList
