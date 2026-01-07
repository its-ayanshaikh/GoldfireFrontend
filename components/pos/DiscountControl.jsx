"use client"

const DiscountControl = ({ discount, onChange, compact = false }) => {
  const handleTypeChange = (type) => {
    onChange({ ...discount, type })
  }

  const handleValueChange = (value) => {
    const numValue = Number.parseFloat(value) || 0
    // Ensure discount value is not negative
    const finalValue = Math.max(0, numValue)
    onChange({ ...discount, value: finalValue })
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <div className="flex items-center border border-gray-300 rounded overflow-hidden">
          <button
            onClick={() => handleTypeChange("%")}
            className={`px-2 py-1 text-xs transition-colors ${
              discount.type === "%" ? "bg-black text-white" : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            %
          </button>
          <button
            onClick={() => handleTypeChange("fixed")}
            className={`px-2 py-1 text-xs transition-colors ${
              discount.type === "fixed" ? "bg-black text-white" : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            ₹
          </button>
        </div>

        <input
          type="number"
          value={discount.value}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder="0"
          className="w-12 px-1 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent"
        />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">Discount:</label>

      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
        <button
          onClick={() => handleTypeChange("%")}
          className={`px-3 py-2 text-sm transition-colors ${
            discount.type === "%" ? "bg-black text-white" : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          %
        </button>
        <button
          onClick={() => handleTypeChange("fixed")}
          className={`px-3 py-2 text-sm transition-colors ${
            discount.type === "fixed" ? "bg-black text-white" : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          ₹
        </button>
      </div>

      <input
        type="number"
        value={discount.value}
        onChange={(e) => handleValueChange(e.target.value)}
        placeholder="0"
        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
      />
    </div>
  )
}

export default DiscountControl
