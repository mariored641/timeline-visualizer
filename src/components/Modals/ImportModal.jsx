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
  } else if (importModalType === 'json-paste') {
    return <JSONPasteImport />
  }

  return null
}

const WikipediaImport = () => {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [entityType, setEntityType] = useState('person') // 'person' | 'event'

  const closeImportModal = useStore((state) => state.closeImportModal)
  const addPerson = useStore((state) => state.addPerson)
  const addEvent = useStore((state) => state.addEvent)
  const categories = useStore((state) => state.categories)
  const locations = useStore((state) => state.locations)

  const handleFetch = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get Wikidata ID + language
      const result = await wikidataService.getWikidataIdFromWikipediaUrl(url)
      if (!result || !result.wikidataId) {
        throw new Error('לא נמצא מזהה Wikidata')
      }
      const { wikidataId, lang } = result

      // Fetch entity data
      const entityData = await wikidataService.fetchEntityData(wikidataId, lang)
      if (!entityData) {
        throw new Error('לא ניתן לשלוף נתונים')
      }

      const detectedType = entityData.entityType || 'person'
      setEntityType(detectedType)

      if (detectedType === 'event') {
        setData({
          name: entityData.name,
          start_year: entityData.start_year,
          end_year: entityData.end_year,
          location: entityData.location,
          wikidata_id: wikidataId,
          wikipedia_url: url,
          image_url: entityData.image,
          description: entityData.description
        })
      } else {
        setData({
          name: entityData.name,
          short_name: '',
          birth: entityData.birth,
          death: entityData.death,
          categories: entityData.occupations,
          primary_location: entityData.birthPlace || entityData.citizenship,
          wikidata_id: wikidataId,
          wikipedia_url: url,
          image_url: entityData.image,
          description: entityData.description
        })
      }
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
      let cats
      if (prev.categories.includes(catId)) {
        cats = prev.categories.filter(c => c !== catId)
      } else {
        // Remove 'other' when user selects a real category
        cats = [...prev.categories.filter(c => c !== 'other'), catId]
      }
      return { ...prev, categories: cats.length > 0 ? cats : prev.categories }
    })
  }

  const handleTypeChange = (newType) => {
    setEntityType(newType)
    // Reset type-specific fields when switching
    if (newType === 'event') {
      setData(prev => ({
        name: prev.name,
        start_year: prev.birth || prev.start_year || null,
        end_year: prev.death || prev.end_year || null,
        location: prev.primary_location || prev.location || null,
        wikidata_id: prev.wikidata_id,
        wikipedia_url: prev.wikipedia_url,
        image_url: prev.image_url,
        description: prev.description
      }))
    } else {
      setData(prev => ({
        name: prev.name,
        short_name: prev.short_name || '',
        birth: prev.start_year || prev.birth || null,
        death: prev.end_year || prev.death || null,
        categories: prev.categories || ['other'],
        primary_location: prev.location || prev.primary_location || null,
        wikidata_id: prev.wikidata_id,
        wikipedia_url: prev.wikipedia_url,
        image_url: prev.image_url,
        description: prev.description
      }))
    }
  }

  const handleConfirm = () => {
    if (!data) return

    if (entityType === 'event') {
      const newEvent = {
        id: `${data.name.toLowerCase().replace(/\s+/g, '_')}_${data.start_year}`,
        name: data.name,
        start_year: data.start_year,
        end_year: data.end_year || null,
        category: 'events',
        location: data.location || null,
        wikidata_id: data.wikidata_id,
        wikipedia_url: data.wikipedia_url,
        description: data.description,
        position: { y: null, isManuallyPlaced: false },
        visibility: { isHidden: false }
      }
      addEvent(newEvent)
    } else {
      const newPerson = {
        id: `${data.name.toLowerCase().replace(/\s+/g, '_')}_${data.birth}`,
        ...data,
        categories: (data.categories || []).filter(c => c !== 'other'),
        short_name: data.short_name || null,
        secondary_location: null,
        location_change_year: null
      }
      addPerson(newPerson)
    }

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

              {/* Entity type selector */}
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700 text-sm">סוג:</span>
                <div className="flex rounded-lg overflow-hidden border border-gray-300">
                  <button
                    onClick={() => handleTypeChange('person')}
                    className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                      entityType === 'person'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    אדם
                  </button>
                  <button
                    onClick={() => handleTypeChange('event')}
                    className={`px-4 py-1.5 text-sm font-medium transition-colors border-r border-gray-300 ${
                      entityType === 'event'
                        ? 'bg-orange-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    ארוע
                  </button>
                </div>
              </div>

              {data.image_url && (
                <div className="flex justify-center">
                  <img src={data.image_url} alt={data.name} className="w-32 h-32 object-cover rounded-lg" />
                </div>
              )}

              <div className="space-y-3">
                {/* Name - editable (always shown) */}
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-700 min-w-[80px] text-sm">שם:</span>
                  <input
                    type="text"
                    value={data.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {entityType === 'person' ? (
                  <>
                    {/* Short name */}
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-700 min-w-[80px] text-sm">שם קצר:</span>
                      <input
                        type="text"
                        value={data.short_name || ''}
                        onChange={(e) => updateField('short_name', e.target.value)}
                        placeholder="כינוי / שם מקוצר"
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>

                    {/* Birth year */}
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-700 min-w-[80px] text-sm">שנת לידה:</span>
                      <input
                        type="number"
                        value={data.birth || ''}
                        onChange={(e) => updateField('birth', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>

                    {/* Death year */}
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

                    {/* Categories */}
                    <div className="flex items-start gap-3">
                      <span className="font-semibold text-gray-700 min-w-[80px] text-sm pt-1">קטגוריות:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {categories.filter(c => c.id !== 'events').map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => toggleCategory(cat.id)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                              (data.categories || []).includes(cat.id)
                                ? 'text-white shadow-sm'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                            style={(data.categories || []).includes(cat.id) ? { backgroundColor: cat.color } : {}}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Location */}
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
                  </>
                ) : (
                  <>
                    {/* Start year */}
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-700 min-w-[80px] text-sm">שנת התחלה:</span>
                      <input
                        type="number"
                        value={data.start_year || ''}
                        onChange={(e) => updateField('start_year', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>

                    {/* End year */}
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-700 min-w-[80px] text-sm">שנת סיום:</span>
                      <input
                        type="number"
                        value={data.end_year || ''}
                        onChange={(e) => updateField('end_year', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="ריק = ארוע חד-פעמי"
                        className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-700 min-w-[80px] text-sm">מיקום:</span>
                      <select
                        value={data.location || ''}
                        onChange={(e) => updateField('location', e.target.value || null)}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      >
                        <option value="">לא ידוע</option>
                        {Object.entries(locations).map(([id, loc]) => (
                          <option key={id} value={id}>{loc.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Description - editable (always shown) */}
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
                className={`w-full px-6 py-3 text-white rounded-lg transition-colors ${
                  entityType === 'event'
                    ? 'bg-orange-500 hover:bg-orange-600'
                    : 'bg-green-500 hover:bg-green-600'
                }`}
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

const JSONPasteImport = () => {
  const [jsonText, setJsonText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [validation, setValidation] = useState(null)
  const [success, setSuccess] = useState(null)
  const [preview, setPreview] = useState(null)

  const closeImportModal = useStore((state) => state.closeImportModal)
  const importBulkData = useStore((state) => state.importBulkData)
  const people = useStore((state) => state.people)
  const events = useStore((state) => state.events)

  const handleParse = () => {
    setError(null)
    setValidation(null)
    setPreview(null)

    if (!jsonText.trim()) {
      setError('אנא הדבק טקסט JSON')
      return
    }

    try {
      let data
      try {
        data = JSON.parse(jsonText)
      } catch (parseErr) {
        throw new Error(`שגיאה בפענוח JSON: ${parseErr.message}`)
      }

      if (!data || typeof data !== 'object') {
        throw new Error('הטקסט חייב להכיל אובייקט JSON תקין')
      }

      // Validate
      const validationResult = validateImportData(data)

      if (!validationResult.isValid) {
        setError(validationResult.errors.join('\n'))
        return
      }

      // Show preview
      const peopleCount = data.people ? data.people.length : 0
      const eventsCount = data.events ? data.events.length : 0
      setPreview({ data, peopleCount, eventsCount })

    } catch (err) {
      setError(`שגיאה: ${err.message}`)
    }
  }

  const handleImport = () => {
    if (!preview) return

    setLoading(true)

    try {
      // Check duplicates
      const duplicates = checkDuplicates(preview.data, people, events)

      if (duplicates.length > 0) {
        setValidation({
          data: preview.data,
          duplicates
        })
        setLoading(false)
        return
      }

      importBulkData(preview.data, 'skip')
      setSuccess(`ייבוא הושלם בהצלחה! נוספו ${preview.peopleCount} אנשים ו-${preview.eventsCount} אירועים.`)

      setTimeout(() => {
        closeImportModal()
      }, 2000)
    } catch (err) {
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

    setTimeout(() => {
      closeImportModal()
    }, 2000)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">ייבוא מטקסט (JSON)</h2>
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
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700">
              💡 הדבק כאן את טקסט ה-JSON שקיבלת מ-Claude או ממקור אחר.
              לא צריך להוריד קובץ - פשוט העתק-הדבק!
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              הדבק טקסט JSON
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value)
                setPreview(null)
                setError(null)
                setSuccess(null)
                setValidation(null)
              }}
              placeholder={'{\n  "people": [\n    {\n      "id": "example_1900",\n      "name": "שם לדוגמה",\n      "birth": 1900,\n      "death": 1980,\n      "categories": ["science"],\n      "primary_location": "israel"\n    }\n  ]\n}'}
              rows={10}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-y"
              dir="ltr"
              style={{ minHeight: '180px' }}
            />
          </div>

          {!preview && !success && (
            <button
              onClick={handleParse}
              disabled={!jsonText.trim()}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              בדוק ואמת
            </button>
          )}

          {preview && !success && !validation && (
            <div className="space-y-3">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-bold text-blue-800 mb-2">תצוגה מקדימה:</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  {preview.peopleCount > 0 && (
                    <p>👤 {preview.peopleCount} אנשים: {preview.data.people.map(p => p.name).join(', ')}</p>
                  )}
                  {preview.eventsCount > 0 && (
                    <p>📅 {preview.eventsCount} אירועים: {preview.data.events.map(e => e.name).join(', ')}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleImport}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300"
                >
                  {loading ? 'מייבא...' : 'אשר וייבא'}
                </button>
                <button
                  onClick={() => { setPreview(null) }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  חזור
                </button>
              </div>
            </div>
          )}

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
