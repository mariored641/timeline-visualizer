import { useState } from 'react'
import useStore from '../../store/useStore'
import wikidataService from '../../services/wikidataService'
import { validateImportData, checkDuplicates } from '../../services/importExportService'

const ImportModal = () => {
  const importModalOpen = useStore((state) => state.importModalOpen)
  const importModalType = useStore((state) => state.importModalType)
  const closeImportModal = useStore((state) => state.closeImportModal)

  if (!importModalOpen) return null

  if (importModalType === 'wikipedia') {
    return <WikipediaImport />
  } else if (importModalType === 'json') {
    return <JSONImport />
  }

  return null
}

const WikipediaImport = () => {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const closeImportModal = useStore((state) => state.closeImportModal)
  const addPerson = useStore((state) => state.addPerson)
  const categories = useStore((state) => state.categories)
  const locations = useStore((state) => state.locations)

  const handleFetch = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get Wikidata ID
      const wikidataId = await wikidataService.getWikidataIdFromWikipediaUrl(url)
      if (!wikidataId) {
        throw new Error('לא נמצא מזהה Wikidata')
      }

      // Fetch entity data
      const entityData = await wikidataService.fetchEntityData(wikidataId)
      if (!entityData) {
        throw new Error('לא ניתן לשלוף נתונים')
      }

      // Set data for preview
      setData({
        name: entityData.name,
        birth: entityData.birth,
        death: entityData.death,
        categories: entityData.occupations,
        primary_location: entityData.birthPlace || entityData.citizenship,
        wikidata_id: wikidataId,
        wikipedia_url: url,
        image_url: entityData.image,
        description: entityData.description
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }))
  }

  const toggleCategory = (catId) => {
    setData(prev => {
      const cats = prev.categories.includes(catId)
        ? prev.categories.filter(c => c !== catId)
        : [...prev.categories, catId]
      return { ...prev, categories: cats.length > 0 ? cats : prev.categories }
    })
  }

  const handleConfirm = () => {
    if (!data) return

    const newPerson = {
      id: `${data.name.toLowerCase().replace(/\s+/g, '_')}_${data.birth}`,
      ...data,
      secondary_location: null,
      location_change_year: null
    }

    addPerson(newPerson)
    closeImportModal()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">ייבוא מ-Wikipedia</h2>
          <button
            onClick={closeImportModal}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              כתובת URL של ויקיפדיה
            </label>
            <input
              type="text"
              placeholder="https://en.wikipedia.org/wiki/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleFetch}
            disabled={loading || !url}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'טוען...' : 'שלוף נתונים'}
          </button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {data && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-bold text-gray-800">אישור ועריכת נתונים</h3>

              {data.image_url && (
                <div className="flex justify-center">
                  <img src={data.image_url} alt={data.name} className="w-32 h-32 object-cover rounded-lg" />
                </div>
              )}

              <div className="space-y-3">
                {/* Name - editable */}
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-700 min-w-[80px] text-sm">שם:</span>
                  <input
                    type="text"
                    value={data.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* Birth year - editable */}
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-700 min-w-[80px] text-sm">שנת לידה:</span>
                  <input
                    type="number"
                    value={data.birth || ''}
                    onChange={(e) => updateField('birth', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* Death year - editable */}
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-700 min-w-[80px] text-sm">שנת פטירה:</span>
                  <input
                    type="number"
                    value={data.death || ''}
                    onChange={(e) => updateField('death', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="ריק = עדיין חי"
                    className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* Categories - toggleable pills */}
                <div className="flex items-start gap-3">
                  <span className="font-semibold text-gray-700 min-w-[80px] text-sm pt-1">קטגוריות:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.filter(c => c.id !== 'events').map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                          data.categories.includes(cat.id)
                            ? 'text-white shadow-sm'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        style={data.categories.includes(cat.id) ? { backgroundColor: cat.color } : {}}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location - dropdown */}
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-700 min-w-[80px] text-sm">מיקום:</span>
                  <select
                    value={data.primary_location || ''}
                    onChange={(e) => updateField('primary_location', e.target.value || null)}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">לא ידוע</option>
                    {Object.entries(locations).map(([id, loc]) => (
                      <option key={id} value={id}>{loc.name}</option>
                    ))}
                  </select>
                </div>

                {/* Description - editable */}
                <div className="flex items-start gap-3">
                  <span className="font-semibold text-gray-700 min-w-[80px] text-sm pt-1">תיאור:</span>
                  <textarea
                    value={data.description || ''}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={2}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                </div>
              </div>

              <button
                onClick={handleConfirm}
                className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                אשר והוסף
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const JSONImport = () => {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [validation, setValidation] = useState(null)
  const [success, setSuccess] = useState(null)

  const closeImportModal = useStore((state) => state.closeImportModal)
  const importBulkData = useStore((state) => state.importBulkData)
  const people = useStore((state) => state.people)
  const events = useStore((state) => state.events)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type === 'application/json') {
      setFile(selectedFile)
      setError(null)
    } else {
      setError('אנא בחר קובץ JSON')
    }
  }

  const handleImport = async () => {
    if (!file) return

    setLoading(true)
    setError(null)
    setValidation(null)

    try {
      const text = await file.text()

      // Parse JSON with better error handling
      let data
      try {
        data = JSON.parse(text)
      } catch (parseErr) {
        throw new Error(`שגיאה בפענוח JSON: ${parseErr.message}`)
      }

      // Check if data is an object
      if (!data || typeof data !== 'object') {
        throw new Error('הקובץ חייב להכיל אובייקט JSON תקין')
      }

      // Validate
      const validationResult = validateImportData(data)

      if (!validationResult.isValid) {
        setError(validationResult.errors.join('\n'))
        setLoading(false)
        return
      }

      // Check duplicates
      const duplicates = checkDuplicates(data, people, events)

      if (duplicates.length > 0) {
        setValidation({
          data,
          duplicates
        })
        setLoading(false)
        return
      }

      // Import
      const peopleCount = data.people ? data.people.length : 0
      const eventsCount = data.events ? data.events.length : 0

      importBulkData(data, 'skip')

      setSuccess(`ייבוא הושלם בהצלחה! נוספו ${peopleCount} אנשים ו-${eventsCount} אירועים.`)

      // Close modal after 2 seconds
      setTimeout(() => {
        closeImportModal()
      }, 2000)
    } catch (err) {
      console.error('Import error:', err)
      setError(`שגיאה בייבוא: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmWithDuplicates = (strategy) => {
    if (!validation) return

    const peopleCount = validation.data.people ? validation.data.people.length : 0
    const eventsCount = validation.data.events ? validation.data.events.length : 0

    importBulkData(validation.data, strategy)

    setSuccess(`ייבוא הושלם בהצלחה! נוספו ${peopleCount} אנשים ו-${eventsCount} אירועים.`)

    // Close modal after 2 seconds
    setTimeout(() => {
      closeImportModal()
    }, 2000)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">ייבוא קבוצתי (JSON)</h2>
          <button
            onClick={closeImportModal}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              בחר קובץ JSON
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {file && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">קובץ נבחר: {file.name}</p>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={loading || !file}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'מייבא...' : 'ייבא'}
          </button>

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 whitespace-pre-wrap text-sm">
              {error}
            </div>
          )}

          {validation && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-bold text-gray-800">נמצאו כפילויות</h3>
              <p className="text-sm text-gray-600">
                נמצאו {validation.duplicates.length} פריטים שכבר קיימים במערכת. מה תרצה לעשות?
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => handleConfirmWithDuplicates('skip')}
                  className="w-full px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  דלג על כפילויות
                </button>
                <button
                  onClick={() => handleConfirmWithDuplicates('overwrite')}
                  className="w-full px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  דרוס את הקיימים
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const InfoRow = ({ label, value }) => (
  <div className="flex gap-3">
    <span className="font-semibold text-gray-700 min-w-[100px]">{label}:</span>
    <span className="text-gray-600">{value}</span>
  </div>
)

export default ImportModal
