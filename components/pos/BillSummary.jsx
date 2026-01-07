"use client"

const BillSummary = ({ items, discount, gstEnabled, compact = false }) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const discountAmount = discount.type === "%" ? (subtotal * discount.value) / 100 : discount.value
  const afterDiscount = subtotal - discountAmount

  // Since prices are inclusive, no additional GST calculation needed
  const grandTotal = afterDiscount

  return (
    <div className={compact ? "border-t border-gray-200 p-2 bg-white" : "border-t border-gray-200 p-4 bg-white"}>
      <h3 className={compact ? "font-semibold mb-2 text-sm" : "font-semibold mb-3"}>Bill Summary</h3>

      <div className={compact ? "space-y-1 text-xs" : "space-y-2 text-sm"}>
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>₹{subtotal.toLocaleString()}</span>
        </div>

        {discount.value > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount ({discount.type === "%" ? `${discount.value}%` : "₹" + discount.value}):</span>
            <span>-₹{discountAmount.toLocaleString()}</span>
          </div>
        )}



        <div className={compact ? "border-t border-gray-300 pt-1 flex justify-between font-semibold text-sm" : "border-t border-gray-300 pt-2 flex justify-between font-semibold text-lg"}>
          <span>Grand Total:</span>
          <span>₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}

export default BillSummary
