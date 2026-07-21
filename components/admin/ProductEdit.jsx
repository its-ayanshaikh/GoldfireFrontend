"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "../ui/button"
import { useToast } from "../../hooks/use-toast"
import ProductSteps from "./product/ProductSteps"

export default function ProductEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'
        const token = localStorage.getItem('access_token')

        const response = await fetch(`${baseUrl}/api/product/${id}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log('Product fetched for edit:', data)
        console.log('📦 Subcategory from API:', data.subcategory, data.subcategory_name)
        console.log('📦 Variants from API:', data.variants)

        // Convert API data to form format
        const formattedVariants = data.variants?.map(v => {
          console.log('📦 Processing variant:', v)
          console.log('📦 Variant subbrand_id:', v.subbrand_id, 'subbrand:', v.subbrand)
          console.log('📦 Variant models:', v.models)
          console.log('📦 Variant subcategory_id:', v.subcategory_id)
          
          // CRITICAL: Use the new API response format
          // Backend returns: subbrand_id (numeric), models (array of {id, name}), subcategory_id (numeric)
          const subBrandId = v.subbrand_id || v.subbrand_id === 0 ? v.subbrand_id : null
          const subcategoryId = v.subcategory_id || v.subcategory_id === 0 ? v.subcategory_id : null
          
          // Extract model IDs and names from models array
          const modelIds = v.models?.map(m => m.id) || []
          const modelNames = v.models?.map(m => m.name) || []
          
          console.log('✅ Extracted subBrandId:', subBrandId)
          console.log('✅ Extracted subcategoryId:', subcategoryId)
          console.log('✅ Extracted modelIds:', modelIds)
          console.log('✅ Extracted modelNames:', modelNames)
          
          return {
            id: `variant_${v.variant_id || Math.random().toString(36).substring(2, 9)}`,
            subBrandId: subBrandId?.toString() || "",
            subBrandName: v.subbrand || "",
            subcategoryId: subcategoryId?.toString() || "",
            subcategoryName: v.subcategory_name || "",
            selectedModels: modelIds,
            selectedModelNames: modelNames,
            sellingPrice: v.selling_price?.toString() || "",
            minSellingPrice: v.minimum_selling_price?.toString() || "",
            minQtyAlert: v.minimum_quantity?.toString() || "3"
          }
        }) || []

        // Get subcategory ID and name - priority order:
        // 1. From main product data (data.subcategory)
        // 2. From first variant's subcategory_id (new backend format)
        // 3. Fallback: fetch from subbrand API
        let subcategoryId = data.subcategory
        let subcategoryName = data.subcategory_name
        
        if (!subcategoryId && formattedVariants.length > 0) {
          // Try getting from variant's subcategory_id (new backend format)
          if (formattedVariants[0].subcategoryId) {
            subcategoryId = parseInt(formattedVariants[0].subcategoryId)
            subcategoryName = formattedVariants[0].subcategoryName || subcategoryName
            console.log('✅ Using subcategoryId from variant:', subcategoryId, subcategoryName)
          }
          // Fallback: fetch from subbrand API
          else if (formattedVariants[0].subBrandId) {
            try {
              const subBrandResponse = await fetch(`${baseUrl}/api/product/subbrands/${formattedVariants[0].subBrandId}/`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token && { 'Authorization': `Bearer ${token}` })
                }
              })
              if (subBrandResponse.ok) {
                const subBrandData = await subBrandResponse.json()
                console.log('📦 SubBrand data:', subBrandData)
                
                // Response might be array or single object
                const subBrand = Array.isArray(subBrandData) ? subBrandData[0] : subBrandData
                
                if (subBrand?.subcategory) {
                  subcategoryId = subBrand.subcategory
                  console.log('✅ Extracted subcategoryId from subbrand:', subcategoryId)
                }
              }
            } catch (err) {
              console.error('Error fetching subbrand for subcategory:', err)
            }
          }
        }

        const initialData = {
          id: data.id,
          category: data.category_name,
          categoryId: data.category,
          subcategory: subcategoryName,
          subcategoryId: subcategoryId,
          gender: data.gender,
          brand: data.brand_name,
          brandId: data.brand,
          form: {
            name: data.name || "",
            hsn: data.hsn || data.hsn_code || "",
            sellingPrice: data.selling_price?.toString() || "",
            minSellingPrice: data.minimum_selling_price?.toString() || "",
            minQtyAlert: data.minimum_quantity?.toString() || "1",
            commissionType: data.commission_type === "percentage" ? "percent" : "fixed",
            commissionValue: data.commission_value?.toString() || "",
          },
          hasWarranty: data.is_warranty_item || false,
          warrantyMonths: data.warranty_period?.toString() || "",
          is_variant: data.is_variant || false,
          variants: formattedVariants
        }

        console.log('✅ Final initialData:', initialData)
        console.log('✅ subcategoryId set to:', subcategoryId)
        setProduct(initialData)
      } catch (err) {
        console.error('Error fetching product:', err)
        setError(err.message)
        toast({
          title: "Error",
          description: "Failed to load product data",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchProduct()
    }
  }, [id])

  const handleClose = () => {
    navigate('/admin/product')
  }

  const handleSaved = () => {
    toast({
      title: "Success",
      description: "Product updated successfully"
    })
    navigate('/admin/product')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading product...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={handleClose}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive">Error: {error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="p-4 border-b border-border flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={handleClose}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-xl font-semibold">Edit Product</h1>
      </div>
      
      {product && (
        <ProductSteps
          initialData={product}
          editMode={true}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
