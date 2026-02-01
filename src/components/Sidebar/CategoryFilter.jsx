import useStore from '../../store/useStore'

const CategoryFilter = () => {
  const categories = useStore((state) => state.categories)
  const toggleCategoryVisibility = useStore((state) => state.toggleCategoryVisibility)

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">קטגוריות</h3>

      <div className="space-y-2">
        {categories.map((category) => (
          <label
            key={category.id}
            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={category.visible}
              onChange={() => toggleCategoryVisibility(category.id)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />

            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: category.color }}
            />

            <span className="flex-1 text-sm text-gray-700">{category.name}</span>

            <span className="text-xs text-gray-400">
              ({getCategoryCount(category.id)})
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

// Helper function to count items in category
const getCategoryCount = (categoryId) => {
  const people = useStore.getState().people
  const events = useStore.getState().events

  const peopleCount = people.filter((p) =>
    p.categories.includes(categoryId)
  ).length

  const eventsCount = events.filter((e) => e.category === categoryId).length

  return peopleCount + eventsCount
}

export default CategoryFilter
