import { useState } from 'react'
import useStore from '../../store/useStore'

const AddPersonModal = () => {
  const addModalOpen = useStore((state) => state.addModalOpen)
  const addModalType = useStore((state) => state.addModalType)
  const closeAddModal = useStore((state) => state.closeAddModal)
  const addPerson = useStore((state) => state.addPerson)
  const categories = useStore((state) => state.categories)
  const locations = useStore((state) => state.locations)

  const [formData, setFormData] = useState({
    name: '',
    birth: '',
    death: '',
    categories: [],
    primary_location: '',
    secondary_location: '',
    location_change_year: '',
    description: ''
  })

  if (!addModalOpen || addModalType !== 'person') {
    return null
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const newPerson = {
      id: `${formData.name.toLowerCase().replace(/\s+/g, '_')}_${formData.birth}`,
      name: formData.name,
      birth: parseInt(formData.birth),
      death: formData.death ? parseInt(formData.death) : null,
      categories: formData.categories,
      primary_location: formData.primary_location,
      secondary_location: formData.secondary_location || null,
      location_change_year: formData.location_change_year ? parseInt(formData.location_change_year) : null,
      wikidata_id: null,
      wikipedia_url: null,
      image_url: null,
      description: formData.description
    }

    addPerson(newPerson)
    closeAddModal()

    // Reset form
    setFormData({
      name: '',
      birth: '',
      death: '',
      categories: [],
      primary_location: '',
      secondary_location: '',
      location_change_year: '',
      description: ''
    })
  }

  const handleCategoryToggle = (categoryId) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter((c) => c !== categoryId)
        : [...prev.categories, categoryId]
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">הוסף אדם חדש</h2>
          <button
            onClick={closeAddModal}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <FormField label="שם *" required>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="שנת לידה *" required>
              <input
                type="number"
                value={formData.birth}
                onChange={(e) => setFormData({ ...formData, birth: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </FormField>

            <FormField label="שנת מוות">
              <input
                type="number"
                value={formData.death}
                onChange={(e) => setFormData({ ...formData, death: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>
          </div>

          <FormField label="קטגוריות *" required>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <label
                  key={cat.id}
                  className={`px-3 py-1 border rounded-lg cursor-pointer transition-colors ${
                    formData.categories.includes(cat.id)
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(cat.id)}
                    onChange={() => handleCategoryToggle(cat.id)}
                    className="sr-only"
                  />
                  {cat.name}
                </label>
              ))}
            </div>
          </FormField>

          <FormField label="מיקום עיקרי *" required>
            <select
              value={formData.primary_location}
              onChange={(e) => setFormData({ ...formData, primary_location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">בחר מיקום</option>
              {Object.entries(locations).map(([key, loc]) => (
                <option key={key} value={key}>
                  {loc.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="תיאור">
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
          </FormField>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={closeAddModal}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              הוסף
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const FormField = ({ label, required, children }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      {label}
    </label>
    {children}
  </div>
)

export default AddPersonModal
