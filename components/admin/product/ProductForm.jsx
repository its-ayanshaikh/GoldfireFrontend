"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "../../ui/button"
import { ChevronLeft, Plus, X, Check, Trash2, Search } from "lucide-react"
import { useToast } from "../../../hooks/use-toast"

// Categories that have variants (Sub Brand + Model)
const VARIANT_CATEGORIES = ["Cover", "Tuffun", "Camera Ring"]

export default function ProductForm({
    productData,
    updateProductData,
    prevStep,
    categories,
    categoriesData,
    editMode,
    onClose,
    onSaved,
    resetForm
}) {
    
    const { toast } = useToast()
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)

    // Modal states for adding new model/subbrand
    const [showModelModal, setShowModelModal] = useState(false)
    const [showSubBrandModal, setShowSubBrandModal] = useState(false)
    const [newModelName, setNewModelName] = useState("")
    const [newSubBrandName, setNewSubBrandName] = useState("")
    const [isAddingSubBrand, setIsAddingSubBrand] = useState(false)
    const [isAddingModel, setIsAddingModel] = useState(false)

    // Model dropdown state
    const [activeModelDropdown, setActiveModelDropdown] = useState(null)
    const [selectedSubBrandForModel, setSelectedSubBrandForModel] = useState(null)
    const [modelSearchTerm, setModelSearchTerm] = useState("")

    // HSN & Commission data
    const [hsnCommissionData, setHsnCommissionData] = useState(null)

    // API data states
    const [models, setModels] = useState([])
    const [modelsLoading, setModelsLoading] = useState(false)
    const [subBrands, setSubBrands] = useState([])
    const [subBrandsLoading, setSubBrandsLoading] = useState(false)

    const categoryName = productData.selectedCategory !== null && categories && categories.length > 0 
        ? categories[productData.selectedCategory] 
        : null
    const hasVariants = categoryName ? VARIANT_CATEGORIES.includes(categoryName) : false

    // Fetch HSN & Commission data when category changes (only in create mode)
    useEffect(() => {
        if (!editMode && productData.selectedCategory !== null && categoriesData && categoriesData.length > 0) {
            // Get actual category ID from categoriesData using selectedCategory as index
            const categoryData = categoriesData[productData.selectedCategory]
            if (categoryData?.id) {
                fetchHsnCommissionData(categoryData.id)
            }
        }
    }, [productData.selectedCategory, categoriesData, editMode])

    // Fetch SubBrands from API when subcategory is selected
    useEffect(() => {
        console.log('🔍 SubBrands useEffect check:', {
            selectedSubcategoryId: productData.selectedSubcategoryId,
            hasVariants,
            editMode,
            variantsLength: productData.variants?.length
        })
        
        // In edit mode with variants
        if (editMode && productData.variants && productData.variants.length > 0) {
            if (productData.selectedSubcategoryId) {
                console.log('🔥 Edit mode - Fetching SubBrands for subcategoryId:', productData.selectedSubcategoryId)
                fetchSubBrands(productData.selectedSubcategoryId)
            }
            return
        }
        
        // Normal flow - fetch when hasVariants and subcategoryId available
        if (hasVariants && productData.selectedSubcategoryId) {
            console.log('🔥 Normal mode - Fetching SubBrands for subcategoryId:', productData.selectedSubcategoryId)
            fetchSubBrands(productData.selectedSubcategoryId)
        }
    }, [hasVariants, productData.selectedSubcategoryId, editMode, productData.variants?.length])

    const fetchHsnCommissionData = async (categoryIndex) => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'
            const token = localStorage.getItem('access_token')
            
            console.log('🔥 Fetching HSN & Commission data for category:', categoryIndex)
            
            const response = await fetch(`${baseUrl}/api/product/${categoryIndex}/hsn&comission/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            })
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
            
            const data = await response.json()
            console.log('✅ HSN & Commission API Response:', data)
            setHsnCommissionData(data)
            
            // Prefill HSN only (in edit mode, commission comes from product details)
            const updateData = {
                productForm: {
                    ...productData.productForm,
                    hsn: data.hsn?.hsn_code || ""
                }
            }
            
            // In create mode, also prefill commission
            if (!editMode) {
                updateData.productForm.commissionType = data.commission?.type === "percentage" ? "percent" : "fixed"
                updateData.productForm.commissionValue = data.commission?.value || ""
            }
            
            updateProductData(updateData)
            
        } catch (error) {
            console.error('❌ Error fetching HSN & Commission:', error)
            setHsnCommissionData(null)
        }
    }

    const fetchSubBrands = async (subcategoryId) => {
        if (!subcategoryId) {
            setSubBrands([])
            return
        }
        
        try {
            setSubBrandsLoading(true)
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'
            const token = localStorage.getItem('access_token')
            
            console.log('🔥 Fetching sub-brands for subcategory:', subcategoryId)
            
            const response = await fetch(`${baseUrl}/api/product/subbrands/${subcategoryId}/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            })
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
            
            const data = await response.json()
            console.log('✅ SubBrands API Response:', data)
            setSubBrands(data)
            
        } catch (error) {
            console.error('❌ Error fetching sub-brands:', error)
            setSubBrands([])
        } finally {
            setSubBrandsLoading(false)
        }
    }

    // Fetch Models by SubBrand ID
    const fetchModels = async (subBrandId) => {
        if (!subBrandId) {
            setModels([])
            return
        }
        
        try {
            setModelsLoading(true)
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'
            const token = localStorage.getItem('access_token')
            
            console.log('🔥 Fetching models for sub-brand:', subBrandId)
            
            const response = await fetch(`${baseUrl}/api/product/models/${subBrandId}/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            })
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
            
            const data = await response.json()
            console.log('✅ Models API Response:', data)
            setModels(data)
            
        } catch (error) {
            console.error('❌ Error fetching models:', error)
            setModels([])
        } finally {
            setModelsLoading(false)
        }
    }

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!hasVariants) return
            if (e.ctrlKey && e.key === 'm') {
                e.preventDefault()
                // Only open model modal if a sub-brand is selected
                if (selectedSubBrandForModel) {
                    setShowModelModal(true)
                } else {
                    toast({ title: "Select Sub Brand", description: "Please select a sub-brand first", variant: "destructive" })
                }
            }
            if (e.ctrlKey && e.key === 'b') {
                e.preventDefault()
                setShowSubBrandModal(true)
            }
            if (e.key === 'Escape') {
                setShowModelModal(false)
                setShowSubBrandModal(false)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [hasVariants, selectedSubBrandForModel, toast])

    // Get available sub-brands - SubBrand available until ALL its models are selected across variants
    const getAvailableSubBrands = useCallback((currentVariantId) => {
        return subBrands.filter(sb => {
            // Get all variants that have this sub-brand selected (except current one)
            const variantsWithThisSubBrand = (productData.variants || [])
                .filter(v => v.id !== currentVariantId && parseInt(v.subBrandId) === sb.id)
            
            // If no other variant has this sub-brand, it's available
            if (variantsWithThisSubBrand.length === 0) return true
            
            // Get all selected model IDs for this sub-brand across all variants
            const allSelectedModelIds = variantsWithThisSubBrand
                .flatMap(v => v.selectedModels || [])
            
            // Get total models for this sub-brand from API (we need to check if all are selected)
            // SubBrand is available if not all models are selected yet
            const subBrandModels = models.filter(m => m.subbrand === sb.id)
            
            // If we don't have models loaded for this subbrand, keep it available
            if (subBrandModels.length === 0) return true
            
            // Check if all models are selected
            const allModelsSelected = subBrandModels.every(m => allSelectedModelIds.includes(m.id))
            
            return !allModelsSelected
        })
    }, [productData.variants, subBrands, models])

    // Get remaining models for a sub-brand (exclude models already selected in other variants with same sub-brand)
    const getRemainingModelsForSubBrand = useCallback((subBrandId, currentVariantId) => {
        // Get all selected model IDs for this sub-brand in OTHER variants
        const selectedModelIdsInOtherVariants = (productData.variants || [])
            .filter(v => v.id !== currentVariantId && parseInt(v.subBrandId) === parseInt(subBrandId))
            .flatMap(v => v.selectedModels || [])
        
        // Return models that are NOT selected in other variants
        return models.filter(m => !selectedModelIdsInOtherVariants.includes(m.id))
    }, [productData.variants, models])

    // Add new variant row
    const addVariant = useCallback(() => {
        const newVariant = {
            id: `variant_${(productData.variants || []).length}_${Math.random().toString(36).substring(2, 9)}`,
            subBrandId: "",
            subBrandName: "",
            selectedModels: [],
            selectedModelNames: [],
            sellingPrice: "",
            minSellingPrice: "",
            minQtyAlert: "5"
        }
        updateProductData({
            variants: [...(productData.variants || []), newVariant]
        })
    }, [productData.variants, updateProductData])

    // Update variant
    const updateVariant = useCallback((variantId, field, value) => {
        const updatedVariants = (productData.variants || []).map(v => {
            if (v.id === variantId) {
                const updated = { ...v, [field]: value }
                
                if (field === 'subBrandId') {
                    const subBrand = subBrands.find(sb => sb.id === parseInt(value))
                    updated.subBrandName = subBrand?.name || ""
                    // Clear selected models when sub-brand changes
                    updated.selectedModels = []
                    updated.selectedModelNames = []
                    // Fetch models for new sub-brand
                    if (value) {
                        fetchModels(value)
                    }
                }
                
                return updated
            }
            return v
        })
        updateProductData({ variants: updatedVariants })
    }, [productData.variants, updateProductData, subBrands])

    // Toggle model selection in variant
    const toggleModelInVariant = useCallback((variantId, modelId) => {
        const updatedVariants = (productData.variants || []).map(v => {
            if (v.id === variantId) {
                const selectedModels = v.selectedModels || []
                const selectedModelNames = v.selectedModelNames || []
                const model = models.find(m => m.id === modelId)
                
                if (selectedModels.includes(modelId)) {
                    return {
                        ...v,
                        selectedModels: selectedModels.filter(id => id !== modelId),
                        selectedModelNames: selectedModelNames.filter(name => name !== model?.name)
                    }
                } else {
                    return {
                        ...v,
                        selectedModels: [...selectedModels, modelId],
                        selectedModelNames: [...selectedModelNames, model?.name || ""]
                    }
                }
            }
            return v
        })
        updateProductData({ variants: updatedVariants })
    }, [productData.variants, updateProductData, models])

    // Remove variant
    const removeVariant = useCallback((variantId) => {
        updateProductData({
            variants: (productData.variants || []).filter(v => v.id !== variantId)
        })
    }, [productData.variants, updateProductData])

    // Add new model via API
    const handleAddModel = async () => {
        if (!newModelName.trim() || !selectedSubBrandForModel) return
        
        try {
            setIsAddingModel(true)
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'
            const token = localStorage.getItem('access_token')
            
            console.log('🔥 Creating new model:', newModelName.trim())
            
            const response = await fetch(`${baseUrl}/api/product/models/create/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    name: newModelName.trim(),
                    subbrand: parseInt(selectedSubBrandForModel)
                })
            })
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
            
            const newModel = await response.json()
            console.log('✅ Model created:', newModel)
            
            setModels(prev => [...prev, newModel])
            setNewModelName("")
            setShowModelModal(false)
            toast({ title: "Model Added", description: `"${newModel.data.name}" added successfully` })
            
            // Refresh models list
            fetchModels(selectedSubBrandForModel)
            
        } catch (error) {
            console.error('❌ Error creating model:', error)
            toast({ title: "Error", description: "Failed to add model", variant: "destructive" })
        } finally {
            setIsAddingModel(false)
        }
    }

    // Add new sub-brand via API
    const handleAddSubBrand = async () => {
        if (!newSubBrandName.trim()) return
        
        // Check if subcategory is selected from steps
        if (!productData.selectedSubcategoryId) {
            toast({ title: "Error", description: "Please select a subcategory first in previous steps", variant: "destructive" })
            return
        }
        
        try {
            setIsAddingSubBrand(true)
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'
            const token = localStorage.getItem('access_token')
            
            console.log('🔥 Creating new sub-brand:', newSubBrandName.trim())
            console.log('📦 With subcategory ID:', productData.selectedSubcategoryId)
            
            const response = await fetch(`${baseUrl}/api/product/subbrands/create/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    name: newSubBrandName.trim(),
                    subcategory: productData.selectedSubcategoryId
                })
            })
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
            
            const newSubBrand = await response.json()
            console.log('✅ SubBrand created:', newSubBrand)
            
            setSubBrands(prev => [...prev, newSubBrand])
            setNewSubBrandName("")
            setShowSubBrandModal(false)
            toast({ title: "Sub Brand Added", description: `"${newSubBrand.name}" added successfully` })
            
        } catch (error) {
            console.error('❌ Error creating sub-brand:', error)
            toast({ title: "Error", description: "Failed to add sub-brand", variant: "destructive" })
        } finally {
            setIsAddingSubBrand(false)
        }
    }

    // Open model dropdown and fetch models for that variant's sub-brand
    const openModelDropdown = (variantId) => {
        const variant = (productData.variants || []).find(v => v.id === variantId)
        if (variant?.subBrandId) {
            setSelectedSubBrandForModel(variant.subBrandId)
            fetchModels(variant.subBrandId)
            setActiveModelDropdown(variantId)
            setModelSearchTerm("") // Reset search when opening
        } else {
            toast({ title: "Select Sub Brand", description: "Please select a sub-brand first", variant: "destructive" })
        }
    }

    // Close model dropdown and reset search
    const closeModelDropdown = () => {
        setActiveModelDropdown(null)
        setModelSearchTerm("")
    }

    // Filter models based on search term AND show only remaining models for the sub-brand
    const filteredModels = (() => {
        // Get remaining models for the active variant's sub-brand
        const variant = (productData.variants || []).find(v => v.id === activeModelDropdown)
        if (!variant?.subBrandId) return []
        
        const remainingModels = getRemainingModelsForSubBrand(variant.subBrandId, activeModelDropdown)
        
        // Also include models already selected in THIS variant (so user can deselect them)
        const currentVariantSelectedModels = variant.selectedModels || []
        const modelsToShow = models.filter(m => 
            remainingModels.some(rm => rm.id === m.id) || currentVariantSelectedModels.includes(m.id)
        )
        
        // Apply search filter
        return modelsToShow.filter(model => 
            model?.name?.toLowerCase().includes(modelSearchTerm.toLowerCase())
        )
    })()

    const handleFinalSave = async () => {
        setIsSaving(true)
        setSaveSuccess(false)

        try {
            if (!productData.productForm.name.trim()) {
                throw new Error('Product name is required')
            }

            if (hasVariants) {
                if (!productData.variants || productData.variants.length === 0) {
                    throw new Error('At least one variant is required')
                }
                for (const variant of productData.variants) {
                    if (!variant.selectedModels || variant.selectedModels.length === 0) {
                        throw new Error('At least one model is required for all variants')
                    }
                    if (!variant.sellingPrice || parseFloat(variant.sellingPrice) <= 0) {
                        throw new Error('Valid selling price is required for all variants')
                    }
                }
            } else {
                if (!productData.productForm.sellingPrice || parseFloat(productData.productForm.sellingPrice) <= 0) {
                    throw new Error('Valid selling price is required')
                }
            }

            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'
            const token = localStorage.getItem('access_token')

            // Get actual category ID from categoriesData
            const categoryData = categoriesData[productData.selectedCategory]
            const categoryId = categoryData?.id

            if (!categoryId) {
                throw new Error('Invalid category selected')
            }

            let payload = {
                name: productData.productForm.name.trim(),
                category: categoryId,
                status: "active"
            }

            // Add subcategory if available
            if (productData.selectedSubcategoryId) {
                payload.subcategory = productData.selectedSubcategoryId
            }

            // Add type (Watch Belt type or Glass Type - both use same key)
            const typeId = productData.selectedTypeId || productData.selectedGlassTypeId
            if (typeId) {
                payload.type = typeId
            }

            // Add brand if available
            if (productData.selectedBrandId) {
                payload.brand = productData.selectedBrandId
            }

            // Add warranty info
            payload.is_warranty_item = productData.hasWarranty || false
            if (productData.hasWarranty && productData.warrantyMonths) {
                payload.warranty_period = parseInt(productData.warrantyMonths)
            }

            // Add commission info (for both variants and simple products)
            payload.commission_type = productData.productForm.commissionType === "percent" ? "percentage" : "fixed"
            payload.commission_value = parseFloat(productData.productForm.commissionValue) || 0
            
            console.log('💰 Commission info:', {
                commissionType: productData.productForm.commissionType,
                commissionValue: productData.productForm.commissionValue,
                payloadType: payload.commission_type,
                payloadValue: payload.commission_value
            })

            // Handle variants vs simple product
            if (hasVariants) {
                // Variants payload - one variant per subbrand with multiple models
                payload.variants = productData.variants.map(variant => ({
                    subbrand: parseInt(variant.subBrandId),
                    model: variant.selectedModels.map(id => parseInt(id)), // Array of model IDs
                    selling_price: parseFloat(variant.sellingPrice),
                    minimum_selling_price: parseFloat(variant.minSellingPrice) || 0,
                    minimum_quantity: parseInt(variant.minQtyAlert) || 5
                }))
            } else {
                // Simple product payload
                payload.selling_price = parseFloat(productData.productForm.sellingPrice)
                payload.minimum_selling_price = parseFloat(productData.productForm.minSellingPrice) || 0
                payload.minimum_quantity = parseInt(productData.productForm.minQtyAlert) || 5
            }

            console.log('🔥 Saving product with payload:', payload)
            console.log('📝 Edit mode:', editMode)
            console.log('🆔 Product ID:', productData.productId)

            // Use different endpoint for create vs update
            const url = editMode && productData.productId 
                ? `${baseUrl}/api/product/update/${productData.productId}/`
                : `${baseUrl}/api/product/create/`
            
            const method = editMode && productData.productId ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
            }

            const result = await response.json()
            console.log(`✅ Product ${editMode ? 'updated' : 'created'} successfully:`, result)

            setSaveSuccess(true)
            toast({
                title: "Success",
                description: `Product "${productData.productForm.name}" ${editMode ? 'updated' : 'created'} successfully!`,
            })

            if (typeof onSaved === "function") {
                onSaved({
                    category: categoryName,
                    subcategory: productData.selectedSubcategory,
                    gender: productData.selectedGender,
                    brand: productData.selectedBrand,
                    form: productData.productForm,
                    variants: productData.variants
                })
            }

            setTimeout(() => {
                setSaveSuccess(false)
                if (!editMode) resetForm()
                if (typeof onClose === "function") onClose()
            }, 2000)

        } catch (error) {
            console.error('❌ Error saving product:', error)
            setSaveSuccess(false)
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setIsSaving(false)
        }
    }


    return (
        <div className="space-y-6">
            {/* Header with selection summary */}
            <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-foreground mb-2">Product Details</h3>
                <div className="flex flex-wrap gap-2 text-sm">
                    {categoryName && (
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded">{categoryName}</span>
                    )}
                    {productData.selectedSubcategory && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">{productData.selectedSubcategory}</span>
                    )}
                    {productData.selectedGender && (
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded capitalize">{productData.selectedGender}</span>
                    )}
                    {productData.selectedBrand && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded">{productData.selectedBrand}</span>
                    )}
                </div>
            </div>

            {/* Main Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Product Name */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Product Name *</label>
                    <input
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                        value={productData.productForm.name}
                        onChange={(e) => updateProductData({
                            productForm: { ...productData.productForm, name: e.target.value }
                        })}
                        placeholder="Enter product name"
                    />
                </div>

                {/* HSN Code */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">HSN Code</label>
                    <input
                        type="text"
                        className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground outline-none cursor-not-allowed"
                        value={productData.productForm.hsn || (hsnCommissionData?.hsn?.hsn_code || "")}
                        readOnly
                        disabled
                    />
                    {hsnCommissionData?.hsn && (
                        <p className="text-xs text-muted-foreground">
                            {hsnCommissionData.hsn.category}
                        </p>
                    )}
                </div>

                {/* Warranty */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <span>Warranty</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={productData.hasWarranty}
                                onChange={(e) => updateProductData({
                                    hasWarranty: e.target.checked,
                                    warrantyMonths: e.target.checked ? productData.warrantyMonths : ""
                                })}
                            />
                            <div className="w-9 h-5 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </label>
                    {productData.hasWarranty && (
                        <select
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                            value={productData.warrantyMonths}
                            onChange={(e) => updateProductData({ warrantyMonths: e.target.value })}
                        >
                            <option value="">Select period</option>
                            <option value="3">3 Months</option>
                            <option value="6">6 Months</option>
                            <option value="9">9 Months</option>
                            <option value="12">12 Months</option>
                        </select>
                    )}
                </div>
            </div>

            {/* Commission Section */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Commission</label>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        type="button"
                        size="sm"
                        variant={productData.productForm.commissionType === "fixed" ? "default" : "secondary"}
                        onClick={() => updateProductData({
                            productForm: { ...productData.productForm, commissionType: "fixed" }
                        })}
                    >
                        ₹
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant={productData.productForm.commissionType === "percent" ? "default" : "secondary"}
                        onClick={() => updateProductData({
                            productForm: { ...productData.productForm, commissionType: "percent" }
                        })}
                    >
                        %
                    </Button>
                    <input
                        type="number"
                        className="w-32 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                        value={productData.productForm.commissionValue || ""}
                        onChange={(e) => updateProductData({
                            productForm: { ...productData.productForm, commissionValue: e.target.value }
                        })}
                        placeholder={productData.productForm.commissionType === "percent" ? "%" : "₹"}
                    />
                </div>
            </div>

            {/* VARIANT CATEGORIES: Cover, Tuffun, Camera Ring */}
            {hasVariants ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-md font-semibold text-foreground">Product Variants</h4>
                            <p className="text-xs text-muted-foreground">
                                Add model-wise variants • <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+B</kbd> New Sub Brand • <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+M</kbd> New Model
                            </p>
                        </div>
                        <Button size="sm" onClick={addVariant}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Variant
                        </Button>
                    </div>

                    {/* Variants Table */}
                    {(productData.variants || []).length > 0 ? (
                        <div className="border border-border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="text-left px-3 py-2 font-medium text-foreground">Sub Brand</th>
                                            <th className="text-left px-3 py-2 font-medium text-foreground">Models *</th>
                                            <th className="text-left px-3 py-2 font-medium text-foreground w-28">Selling Price *</th>
                                            <th className="text-left px-3 py-2 font-medium text-foreground w-28">Min Selling Price</th>
                                            <th className="text-left px-3 py-2 font-medium text-foreground w-24">Min Qty Alert</th>
                                            <th className="text-center px-3 py-2 font-medium text-foreground w-14"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {(productData.variants || []).map((variant) => (
                                            <tr key={variant.id} className="hover:bg-muted/20">
                                                {/* Sub Brand */}
                                                <td className="px-3 py-2">
                                                    <div className="flex items-center gap-1">
                                                        <select
                                                            className="flex-1 rounded border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                                                            value={variant.subBrandId}
                                                            onChange={(e) => updateVariant(variant.id, 'subBrandId', e.target.value)}
                                                            disabled={subBrandsLoading}
                                                        >
                                                            <option value="">Select</option>
                                                            {getAvailableSubBrands(variant.id).map((sb) => (
                                                                <option key={sb.id} value={sb.id}>{sb.name}</option>
                                                            ))}
                                                        </select>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 shrink-0"
                                                            onClick={() => setShowSubBrandModal(true)}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </td>

                                                {/* Model Multi-Select */}
                                                <td className="px-3 py-2">
                                                    <div className="flex items-center gap-1">
                                                        <div className="flex-1">
                                                            <div className="min-h-[34px] rounded border border-border bg-background px-2 py-1.5 text-sm outline-none focus-within:ring-1 focus-within:ring-primary">
                                                                {/* Selected Models Display */}
                                                                {variant.selectedModelNames && variant.selectedModelNames.length > 0 ? (
                                                                    <div className="flex flex-wrap gap-1 mb-1">
                                                                        {variant.selectedModelNames.map((modelName, idx) => (
                                                                            <span key={idx} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs">
                                                                                {modelName}
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        const modelId = models.find(m => m.name === modelName)?.id
                                                                                        if (modelId) toggleModelInVariant(variant.id, modelId)
                                                                                    }}
                                                                                    className="hover:bg-primary/20 rounded"
                                                                                >
                                                                                    <X className="h-3 w-3" />
                                                                                </button>
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-muted-foreground text-sm py-1">
                                                                        {variant.subBrandId ? "Select models..." : "Select sub-brand first"}
                                                                    </div>
                                                                )}
                                                                
                                                                {/* Add Models Button */}
                                                                {variant.subBrandId && (
                                                                    <button
                                                                        type="button"
                                                                        className="cursor-pointer text-xs text-primary hover:text-primary/80"
                                                                        onClick={() => openModelDropdown(variant.id)}
                                                                    >
                                                                        + Add Models
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 shrink-0"
                                                            onClick={() => {
                                                                const variant = (productData.variants || []).find(v => v.id === variant.id)
                                                                if (variant?.subBrandId) {
                                                                    setSelectedSubBrandForModel(variant.subBrandId)
                                                                    setShowModelModal(true)
                                                                } else {
                                                                    toast({ title: "Select Sub Brand", description: "Please select a sub-brand first", variant: "destructive" })
                                                                }
                                                            }}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </td>

                                                {/* Selling Price */}
                                                <td className="px-3 py-2">
                                                    <div className="relative">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹</span>
                                                        <input
                                                            type="number"
                                                            className="w-full rounded border border-border bg-background pl-5 pr-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                                                            value={variant.sellingPrice}
                                                            onChange={(e) => updateVariant(variant.id, 'sellingPrice', e.target.value)}
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </td>

                                                {/* Min Selling Price */}
                                                <td className="px-3 py-2">
                                                    <div className="relative">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹</span>
                                                        <input
                                                            type="number"
                                                            className="w-full rounded border border-border bg-background pl-5 pr-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                                                            value={variant.minSellingPrice}
                                                            onChange={(e) => updateVariant(variant.id, 'minSellingPrice', e.target.value)}
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </td>

                                                {/* Min Qty Alert */}
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                                                        value={variant.minQtyAlert}
                                                        onChange={(e) => updateVariant(variant.id, 'minQtyAlert', e.target.value)}
                                                        placeholder="5"
                                                    />
                                                </td>

                                                {/* Delete */}
                                                <td className="px-3 py-2 text-center">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                                        onClick={() => removeVariant(variant.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="border border-dashed border-border rounded-lg p-8 text-center">
                            <p className="text-muted-foreground mb-3">No variants added yet</p>
                            <Button variant="outline" size="sm" onClick={addVariant}>
                                <Plus className="h-4 w-4 mr-1" />
                                Add First Variant
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                /* NON-VARIANT CATEGORIES: Simple pricing fields */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Selling Price *</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                            <input
                                type="number"
                                className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                                value={productData.productForm.sellingPrice || ""}
                                onChange={(e) => updateProductData({
                                    productForm: { ...productData.productForm, sellingPrice: e.target.value }
                                })}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Min Selling Price</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                            <input
                                type="number"
                                className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                                value={productData.productForm.minSellingPrice || ""}
                                onChange={(e) => updateProductData({
                                    productForm: { ...productData.productForm, minSellingPrice: e.target.value }
                                })}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Min Qty Alert</label>
                        <input
                            type="number"
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                            value={productData.productForm.minQtyAlert || ""}
                            onChange={(e) => updateProductData({
                                productForm: { ...productData.productForm, minQtyAlert: e.target.value }
                            })}
                            placeholder="5"
                        />
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-xs text-muted-foreground">
                    {hasVariants ? `${(productData.variants || []).length} variant(s)` : "Simple product"}
                </div>
                <div className="flex gap-2">
                    {!editMode && (
                        <Button variant="secondary" onClick={prevStep}>
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Back
                        </Button>
                    )}
                    <Button onClick={handleFinalSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save Product"}
                        {saveSuccess && <Check className="h-4 w-4 ml-1" />}
                    </Button>
                </div>
            </div>

            {/* Model Selection Modal */}
            {activeModelDropdown && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Select Models</h3>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closeModelDropdown}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        
                        {/* Search Input */}
                        {!modelsLoading && models.length > 0 && (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="search"
                                    className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Search models..."
                                    value={modelSearchTerm}
                                    onChange={(e) => setModelSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        )}
                        
                        <div className="max-h-60 overflow-y-auto space-y-2">
                            {modelsLoading ? (
                                <div className="text-center py-4 text-muted-foreground">Loading models...</div>
                            ) : filteredModels.length === 0 ? (
                                <div className="text-center py-4 text-muted-foreground text-sm">
                                    {modelSearchTerm ? `No models found for "${modelSearchTerm}"` : "No models found"}
                                </div>
                            ) : (
                                filteredModels.map((model) => {
                                    const variant = (productData.variants || []).find(v => v.id === activeModelDropdown)
                                    const isSelected = variant?.selectedModels?.includes(model.id) || false
                                    return (
                                        <label key={model.id} className="flex items-center gap-3 p-2 hover:bg-muted rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 accent-primary"
                                                checked={isSelected}
                                                onChange={() => toggleModelInVariant(activeModelDropdown, model.id)}
                                            />
                                            <span className="text-sm">{model.name}</span>
                                        </label>
                                    )
                                })
                            )}
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={closeModelDropdown}>Done</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Model Modal */}
            {showModelModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Add New Model</h3>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowModelModal(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Model Name</label>
                            <input
                                type="text"
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                                value={newModelName}
                                onChange={(e) => setNewModelName(e.target.value)}
                                placeholder="e.g., iPhone 16 Pro Max"
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter' && !isAddingModel) handleAddModel() }}
                                disabled={isAddingModel}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setShowModelModal(false)} disabled={isAddingModel}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddModel} disabled={!newModelName.trim() || isAddingModel}>
                                {isAddingModel ? "Adding..." : "Add Model"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Sub Brand Modal */}
            {showSubBrandModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Add New Sub Brand</h3>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSubBrandModal(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Sub Brand Name</label>
                            <input
                                type="text"
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                                value={newSubBrandName}
                                onChange={(e) => setNewSubBrandName(e.target.value)}
                                placeholder="e.g., Ultra Premium"
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter' && !isAddingSubBrand) handleAddSubBrand() }}
                                disabled={isAddingSubBrand}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setShowSubBrandModal(false)} disabled={isAddingSubBrand}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddSubBrand} disabled={!newSubBrandName.trim() || isAddingSubBrand}>
                                {isAddingSubBrand ? "Adding..." : "Add Sub Brand"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
