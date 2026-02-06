import useStore from '../../store/useStore'

const ZoomControls = () => {
  const zoomIn = useStore((state) => state.zoomIn)
  const zoomOut = useStore((state) => state.zoomOut)
  const zoomInHorizontal = useStore((state) => state.zoomInHorizontal)
  const zoomOutHorizontal = useStore((state) => state.zoomOutHorizontal)
  const zoomInVertical = useStore((state) => state.zoomInVertical)
  const zoomOutVertical = useStore((state) => state.zoomOutVertical)
  const panLeft = useStore((state) => state.panLeft)
  const panRight = useStore((state) => state.panRight)
  const clearDragOffsets = useStore((state) => state.clearDragOffsets)
  const compactLayout = useStore((state) => state.compactLayout)

  const btnClass = "w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded transition-colors text-gray-600 hover:text-gray-800"
  const smallBtnClass = "w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-gray-700 text-[10px] font-bold"

  return (
    <div className="absolute bottom-2 left-2 flex flex-col gap-1 z-20">
      {/* Main navigation row */}
      <div className="flex items-center gap-0.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-1 py-0.5">
        <button onClick={panRight} className={btnClass} title="← הזז שמאלה">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button onClick={zoomOut} className={btnClass} title="− התרחק (כללי)">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button onClick={zoomIn} className={btnClass} title="+ התקרב (כללי)">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button onClick={panLeft} className={btnClass} title="← הזז ימינה">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Axis-specific zoom row */}
      <div className="flex items-center gap-0.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-1 py-0.5">
        {/* Horizontal zoom */}
        <button onClick={zoomOutHorizontal} className={smallBtnClass} title="התרחק אופקית (שנים)">
          ↔−
        </button>
        <button onClick={zoomInHorizontal} className={smallBtnClass} title="התקרב אופקית (שנים)">
          ↔+
        </button>
        <div className="w-px h-4 bg-gray-300 mx-0.5" />
        {/* Vertical zoom */}
        <button onClick={zoomOutVertical} className={smallBtnClass} title="התרחק אנכית (קטגוריות)">
          ↕−
        </button>
        <button onClick={zoomInVertical} className={smallBtnClass} title="התקרב אנכית (קטגוריות)">
          ↕+
        </button>
      </div>

      {/* Layout tools row */}
      <div className="flex items-center gap-0.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-1 py-0.5">
        <button onClick={clearDragOffsets} className={btnClass} title="אפס פריסה (בטל גרירות)">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button onClick={compactLayout} className={btnClass} title="דחוס שורות ריקות">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16M12 3v3m0 12v3M8 3l4 3 4-3M8 21l4-3 4 3" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default ZoomControls
