import useStore from '../../store/useStore'

const Header = () => {
  const toggleSidebar = useStore((state) => state.toggleSidebar)
  const openAddModal = useStore((state) => state.openAddModal)
  const openImportModal = useStore((state) => state.openImportModal)
  const exportData = useStore((state) => state.exportData)
  const isSaving = useStore((state) => state.isSaving)
  const lastSynced = useStore((state) => state.lastSynced)

  const handleExportJSON = () => {
    const data = exportData()
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `timeline_data_${new Date().toISOString().split('T')[0]}.json`
    a.click()

    URL.revokeObjectURL(url)
  }

  const handleDownloadGuide = () => {
    const a = document.createElement('a')
    a.href = '/IMPORT_GUIDE.md'
    a.download = 'Timeline_Import_Guide.md'
    a.click()
  }

  return (
    <header className="bg-white shadow-soft border-b border-gray-soft backdrop-blur-sm relative z-50">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Logo and title */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-3 hover:bg-pastel-blue-light/20 rounded-2xl transition-all duration-200 hover:shadow-soft"
            title="הצג/הסתר פאנל צדדי"
          >
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <h1 className="text-2xl font-bold bg-gradient-to-r from-pastel-blue to-pastel-purple bg-clip-text text-transparent">
            Timeline Visualizer
          </h1>

          {/* Sync status */}
          <div className="text-xs text-gray-400 mr-3">
            {isSaving ? (
              <span className="flex items-center gap-1">
                <span className="animate-spin w-3 h-3 border-2 border-pastel-blue border-t-transparent rounded-full inline-block" />
                שומר...
              </span>
            ) : lastSynced ? (
              <span>נשמר</span>
            ) : null}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {/* Add button */}
          <div className="relative group">
            <button className="px-6 py-3 bg-gradient-to-r from-pastel-blue to-pastel-blue-light text-white rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft-md flex items-center gap-2 font-semibold">
              <span>הוסף חדש</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* Dropdown */}
            <div className="absolute left-0 mt-2 w-52 bg-white border-2 border-gray-300 rounded-2xl shadow-soft-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999] overflow-hidden">
              <button
                onClick={() => openAddModal('person')}
                className="w-full px-5 py-3 text-right hover:bg-pastel-blue-light/20 transition-all duration-200 font-medium text-gray-800 first:rounded-t-2xl"
              >
                הוסף אדם
              </button>
              <button
                onClick={() => openAddModal('event')}
                className="w-full px-5 py-3 text-right hover:bg-pastel-blue-light/20 transition-all duration-200 font-medium text-gray-800 last:rounded-b-2xl"
              >
                הוסף אירוע
              </button>
            </div>
          </div>

          {/* Import button */}
          <div className="relative group">
            <button className="px-6 py-3 bg-gradient-to-r from-pastel-green to-emerald-300 text-white rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft-md flex items-center gap-2 font-semibold">
              <span>ייבוא</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </button>

            {/* Dropdown */}
            <div className="absolute left-0 mt-2 w-60 bg-white border-2 border-gray-300 rounded-2xl shadow-soft-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999] overflow-hidden">
              <button
                onClick={() => openImportModal('wikipedia')}
                className="w-full px-5 py-3 text-right hover:bg-pastel-green/20 transition-all duration-200 font-medium text-gray-800 first:rounded-t-2xl"
              >
                ייבוא מ-Wikipedia
              </button>
              <button
                onClick={() => openImportModal('json')}
                className="w-full px-5 py-3 text-right hover:bg-pastel-green/20 transition-all duration-200 font-medium text-gray-800"
              >
                ייבוא קבוצתי (JSON)
              </button>
              <button
                onClick={handleDownloadGuide}
                className="w-full px-5 py-3 text-right hover:bg-pastel-green/20 transition-all duration-200 font-medium text-gray-800 last:rounded-b-2xl border-t border-gray-300"
              >
                📖 הורד מדריך ייבוא
              </button>
            </div>
          </div>

          {/* Export button */}
          <div className="relative group">
            <button className="px-6 py-3 bg-gradient-to-r from-pastel-purple to-purple-400 text-white rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft-md flex items-center gap-2 font-semibold">
              <span>ייצוא</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </button>

            {/* Dropdown */}
            <div className="absolute left-0 mt-2 w-52 bg-white border-2 border-gray-300 rounded-2xl shadow-soft-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999] overflow-hidden">
              <button
                onClick={handleExportJSON}
                className="w-full px-5 py-3 text-right hover:bg-pastel-purple/20 transition-all duration-200 font-medium text-gray-800 rounded-2xl"
              >
                ייצוא לJSON
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
