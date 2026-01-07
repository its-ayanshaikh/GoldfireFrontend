"use client"

import ProductSteps from "./product/ProductSteps"

const ProductAdd = ({ initialData = null, onClose = null, onSaved = null, editMode = false }) => {
  return (
    <ProductSteps 
      initialData={initialData}
      onClose={onClose}
      onSaved={onSaved}
      editMode={editMode}
    />
  )
}

export default ProductAdd