import useStore from '../../store/useStore'

const DetailPanel = () => {
  const detailPanelOpen = useStore((state) => state.detailPanelOpen)
  const detailPanelItem = useStore((state) => state.detailPanelItem)
  const closeDetailPanel = useStore((state) => state.closeDetailPanel)

  if (!detailPanelOpen || !detailPanelItem) {
    return null
  }

  const item = detailPanelItem
  const isPerson = !!item.birth

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">{item.name}</h2>
          <button
            onClick={closeDetailPanel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Image */}
          {item.image_url && (
            <div className="flex justify-center">
              <img
                src={item.image_url}
                alt={item.name}
                className="w-48 h-48 object-cover rounded-lg shadow-md"
              />
            </div>
          )}

          {/* Details */}
          <div className="space-y-3">
            {isPerson ? (
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

            {item.description && (
              <DetailRow
                label="תיאור"
                value={item.description}
              />
            )}
          </div>

          {/* Wikipedia link */}
          {item.wikipedia_url && (
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
          )}
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

export default DetailPanel
