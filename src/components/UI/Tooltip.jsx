import useStore from '../../store/useStore'

const Tooltip = () => {
  const tooltip = useStore((state) => state.tooltip)

  if (!tooltip.visible) {
    return null
  }

  return (
    <div
      className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm pointer-events-none"
      style={{
        left: `${tooltip.x + 10}px`,
        top: `${tooltip.y + 10}px`
      }}
    >
      {typeof tooltip.content === 'string'
        ? tooltip.content.split('\n').map((line, i) => (
            <div key={i}>{line}</div>
          ))
        : tooltip.content
      }
    </div>
  )
}

export default Tooltip
