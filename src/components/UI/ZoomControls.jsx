import useStore from '../../store/useStore'

const ZoomControls = () => {
  const zoomIn = useStore((state) => state.zoomIn)
  const zoomOut = useStore((state) => state.zoomOut)
  const panLeft = useStore((state) => state.panLeft)
  const panRight = useStore((state) => state.panRight)

  const btnClass = "w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded transition-colors text-gray-600 hover:text-gray-800"

  return (
    <div className="absolute bottom-2 left-2 flex items-center gap-0.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-1 py-0.5 z-20">
      <button onClick={panRight} className={btnClass} title="→">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button onClick={zoomOut} className={btnClass} title="−">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
      <button onClick={zoomIn} className={btnClass} title="+">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
      <button onClick={panLeft} className={btnClass} title="←">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}

export default ZoomControls
