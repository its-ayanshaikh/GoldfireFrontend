"use client"

const GSTToggle = ({ enabled, onChange, compact = false }) => {
  if (compact) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-gray-600">GST</span>
        <button
          onClick={() => onChange(!enabled)}
          className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${enabled ? "bg-black" : "bg-gray-300"
            }`}
        >
          <span
            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${enabled ? "translate-x-4" : "translate-x-0.5"
              }`}
          />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">GST:</label>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? "bg-black" : "bg-gray-300"
          }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? "translate-x-6" : "translate-x-1"
            }`}
        />
      </button>

    </div>
  )
}

export default GSTToggle
