"use client"

import CartItem from "./CartItem"

const Cart = ({ items, onUpdateQuantity, onRemoveItem, compact = false, gstEnabled = false, onSerialUpdate, onSalespersonUpdate }) => {
  return (
    <div className={compact ? "flex-1 p-2" : "flex-1 p-4"}>
      <h2 className={compact ? "text-base font-semibold mb-2" : "text-lg font-semibold mb-4"}>
        Cart ({items.length})
      </h2>

      {items.length === 0 ? (
        <div className={compact ? "text-center text-gray-500 mt-4 text-sm" : "text-center text-gray-500 mt-8"}>
          No items in cart
        </div>
      ) : (
        <div className={compact ? "space-y-1" : "space-y-2"}>
          {items.map((item, index) => (
            <CartItem 
              key={item.serialNumber ? `${item.id}-${item.serialNumber}` : `${item.id}-${index}`} 
              item={item} 
              onUpdateQuantity={onUpdateQuantity} 
              onRemove={onRemoveItem}
              compact={compact}
              gstEnabled={gstEnabled}
              onSerialUpdate={onSerialUpdate}
              onSalespersonUpdate={onSalespersonUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Cart
