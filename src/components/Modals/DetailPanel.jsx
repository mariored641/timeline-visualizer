import { useState, useEffect } from 'react'
import useStore from '../../store/useStore'
import wikidataService from '../../services/wikidataService'

const DetailPanel = () => {
  const detailPanelOpen = useStore((state) => state.detailPanelOpen)
  const detailPanelItem = useStore((state) => state.detailPanelItem)
  const detailPanelEditing = useStore((state) => state.detailPanelEditing)
  const closeDetailPanel = useStore((state) => state.closeDetailPanel)
  const toggleDetailEditing = useStore((state) => state.toggleDetailEditing)
  const updatePerson = useStore((state) => state.updatePerson)
  const updateEvent = useStore((state) => state.updateEvent)

  const [editData, setEditData] = useState({})
  const [fetchingImage, setFetchingImage] = useState(false)

  useEffect(() => {
    if (detailPanelItem) {
      setEditData({ ...detailPanelItem })
    }
  }, [detailPanelItem, detailPanelEditing])

  // Auto-fetch image from Wikidata if missing
  // Prefer deriving wikidata_id from wikipedia_url (more reliable than AI-provided wikidata_id)
  useEffect(() => {
    const item = detailPanelItem
    if (!item || item.image_url) return
    if (!item.wikidata_id && !item.wikipedia_url) return

    let cancelled = false
    setFetchingImage(true)

    const fetchImage = async () => {
      try {
        let wikidataId = null

        // Try to get real wikidata_id from wikipedia_url first (most reliable)
        if (item.wikipedia_url) {
          try {
            wikidataId = await wikidataService.getWikidataIdFromWikipediaUrl(item.wikipedia_url)
          } catch {
            // Wikipedia URL didn't resolve, fall back to provided wikidata_id
          }
        }

        // Fall back to provided wikidata_id
        if (!wikidataId) wikidataId = item.wikidata_id
        if (!wikidataId) return null

        // Also save the correct wikidata_id if it was wrong
        const updates = {}
        if (wikidataId !== item.wikidata_id) {
          updates.wikidata_id = wikidataId
        }

        const imageUrl = await wikidataService.fetchImageByWikidataId(wikidataId)
        if (imageUrl) updates.image_url = imageUrl

        return Object.keys(updates).length > 0 ? updates : null
      } catch {
        return null
      }
    }

    fetchImage().then((updates) => {
      if (cancelled || !updates) {
        setFetchingImage(false)
        return
      }
      const isPerson = !!item.birth
      if (isPerson) {
        updatePerson(item.id, updates)
      } else {
        updateEvent(item.id, updates)
      }
      setFetchingImage(false)
    }).catch(() => {
      if (!cancelled) setFetchingImage(false)
    })

    return () => { cancelled = true }
  }, [detailPanelItem?.id])

  if (!detailPanelOpen || !detailPanelItem) {
    return null
  }

  const item = detailPanelItem
  const isPerson = !!item.birth

  const handleSave = () => {
    if (isPerson) {
      updatePerson(item.id, {
        name: editData.name,
        short_name: editData.short_name,
        birth: Number(editData.birth),
        death: editData.death ? Number(editData.death) : null,
        description: editData.description,
        primary_location: editData.primary_location,
        secondary_location: editData.secondary_location,
      })
    } else {
      updateEvent(item.id, {
        name: editData.name,
        short_name: editData.short_name,
        start_year: Number(editData.start_year),
        end_year: editData.end_year ? Number(editData.end_year) : null,
        description: editData.description,
        location: editData.location,
      })
    }
    toggleDetailEditing()
    closeDetailPanel()
  }

  const handleFieldChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            {detailPanelEditing ? (
              <input
                type="text"
                value={editData.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="text-2xl font-bold text-gray-800 border-b-2 border-blue-400 bg-transparent w-full focus:outline-none"
              />
            ) : (
              item.name
            )}
          </h2>
          <div className="flex items-center gap-2">
            {/* Edit button */}
            <button
              onClick={toggleDetailEditing}
              className={`p-2 rounded-lg transition-colors ${
                detailPanelEditing ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title={detailPanelEditing ? 'בטל עריכה' : 'ערוך'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            {/* Close button */}
            <button
              onClick={closeDetailPanel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Image */}
          {item.image_url ? (
            <div className="flex justify-center">
              <img
                src={item.image_url}
                alt={item.name}
                className="w-48 h-48 object-cover rounded-lg shadow-md"
              />
            </div>
          ) : fetchingImage ? (
            <div className="flex justify-center">
              <div className="w-48 h-48 rounded-lg bg-gray-100 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full" />
              </div>
            </div>
          ) : null}

          {/* Details */}
          <div className="space-y-3">
            {isPerson ? (
              <>
                {detailPanelEditing ? (
                  <>
                    <EditRow label="שם מקוצר" value={editData.short_name || ''} onChange={(v) => handleFieldChange('short_name', v)} />
                    <EditRow label="שנת לידה" value={editData.birth || ''} onChange={(v) => handleFieldChange('birth', v)} type="number" />
                    <EditRow label="שנת פטירה" value={editData.death || ''} onChange={(v) => handleFieldChange('death', v)} type="number" placeholder="ריק = בחיים" />
                    <EditRow label="מיקום ראשי" value={editData.primary_location || ''} onChange={(v) => handleFieldChange('primary_location', v)} />
                    <EditRow label="מיקום משני" value={editData.secondary_location || ''} onChange={(v) => handleFieldChange('secondary_location', v)} placeholder="אופציונלי" />
                    <EditRowTextarea label="תיאור" value={editData.description || ''} onChange={(v) => handleFieldChange('description', v)} />
                  </>
                ) : (
                  <>
                    <DetailRow
                      label="תאריכים"
                      value={`${item.birth}${item.death ? `–${item.death}` : '–היום'}`}
                    />
                    <DetailRow
                      label="קטגוריות"
                      value={item.categories.join(', ')}
                    />
                    <DetailRow
                      label="מיקום"
                      value={item.primary_location + (item.secondary_location ? ` → ${item.secondary_location}` : '')}
                    />
                  </>
                )}
              </>
            ) : (
              <>
                {detailPanelEditing ? (
                  <>
                    <EditRow label="שם מקוצר" value={editData.short_name || ''} onChange={(v) => handleFieldChange('short_name', v)} />
                    <EditRow label="שנת התחלה" value={editData.start_year || ''} onChange={(v) => handleFieldChange('start_year', v)} type="number" />
                    <EditRow label="שנת סיום" value={editData.end_year || ''} onChange={(v) => handleFieldChange('end_year', v)} type="number" placeholder="אופציונלי" />
                    <EditRow label="מיקום" value={editData.location || ''} onChange={(v) => handleFieldChange('location', v)} />
                    <EditRowTextarea label="תיאור" value={editData.description || ''} onChange={(v) => handleFieldChange('description', v)} />
                  </>
                ) : (
                  <>
                    <DetailRow
                      label="תקופה"
                      value={`${item.start_year}${item.end_year ? `–${item.end_year}` : ''}`}
                    />
                    <DetailRow
                      label="קטגוריה"
                      value={item.category}
                    />
                    <DetailRow
                      label="מיקום"
                      value={item.location}
                    />
                  </>
                )}
              </>
            )}

            {!detailPanelEditing && item.description && (
              <DetailRow
                label="תיאור"
                value={item.description}
              />
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            {detailPanelEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-semibold"
                >
                  שמור שינויים
                </button>
                <button
                  onClick={toggleDetailEditing}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  ביטול
                </button>
              </>
            ) : (
              item.wikipedia_url && (
                <a
                  href={item.wikipedia_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <span>פתח בוויקיפדיה</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const DetailRow = ({ label, value }) => (
  <div className="flex gap-3">
    <span className="font-semibold text-gray-700 min-w-[100px]">{label}:</span>
    <span className="text-gray-600">{value}</span>
  </div>
)

const EditRow = ({ label, value, onChange, type = 'text', placeholder = '' }) => (
  <div className="flex gap-3 items-center">
    <span className="font-semibold text-gray-700 min-w-[100px]">{label}:</span>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="flex-1 px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
  </div>
)

const EditRowTextarea = ({ label, value, onChange }) => (
  <div className="flex gap-3">
    <span className="font-semibold text-gray-700 min-w-[100px]">{label}:</span>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      className="flex-1 px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
    />
  </div>
)

export default DetailPanel
