import { useState } from 'react'
import useStore from '../../store/useStore'

const AddEventModal = () => {
  const addModalOpen = useStore((state) => state.addModalOpen)
  const addModalType = useStore((state) => state.addModalType)
  const closeAddModal = useStore((state) => state.closeAddModal)
  const addEvent = useStore((state) => state.addEvent)
  const locations = useStore((state) => state.locations)

  const [formData, setFormData] = useState({
    name: '',
    start_year: '',
    end_year: '',
    location: '',
    description: ''
  })

  if (!addModalOpen || addModalType !== 'event') {
    return null
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const newEvent = {
      id: `${formData.name.toLowerCase().replace(/\s+/g, '_')}_${formData.start_year}`,
      name: formData.name,
      start_year: parseInt(formData.start_year),
      end_year: formData.end_year ? parseInt(formData.end_year) : null,
      category: 'events',
      location: formData.location,
      wikidata_id: null,
      wikipedia_url: null,
      description: formData.description
    }

    addEvent(newEvent)
    closeAddModal()

    // Reset form
    setFormData({
      name: '',
      start_year: '',
      end_year: '',
      location: '',
      description: ''
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">הוסף אירוע חדש</h2>
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
          <FormField label="שם האירוע *" required>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="שנת התחלה *" required>
              <input
                type="number"
                value={formData.start_year}
                onChange={(e) => setFormData({ ...formData, start_year: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </FormField>

            <FormField label="שנת סיום">
              <input
                type="number"
                value={formData.end_year}
                onChange={(e) => setFormData({ ...formData, end_year: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>
          </div>

          <FormField label="מיקום *" required>
            <select
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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

export default AddEventModal
