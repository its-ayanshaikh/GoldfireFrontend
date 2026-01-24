"use client"

import { useState, useEffect } from "react"
import { Building2, ChevronRight, Check } from "lucide-react"
import CategorySelection from "./CategorySelection"
import SubcategorySelection from "./SubcategorySelection"
import GenderSelection from "./GenderSelection"
import BrandSelection from "./BrandSelection"
import GlassTypeSelection from "./GlassTypeSelection"
import TypeSelection from "./TypeSelection"
import ProductForm from "./ProductForm"

export default function ProductSteps({ initialData = null, onClose = null, onSaved = null, editMode = false }) {
    const [currentStep, setCurrentStep] = useState(1)
    const [unlockedStep, setUnlockedStep] = useState(1)

    const [productData, setProductData] = useState({
        selectedCategory: null,
        selectedSubcategory: null,
        selectedSubcategoryId: null,
        selectedGender: null,
        selectedType: null,
        selectedTypeId: null,
        selectedGlassType: null,
        selectedGlassTypeId: null,
        selectedBrand: null,
        selectedBrandId: null,
        productForm: {
            name: "",
            hsn: "",
            sellingPrice: "",
            minSellingPrice: "",
            minQtyAlert: "",
            commissionType: "percent",
            commissionValue: "",
        },
        hasWarranty: false,
        warrantyMonths: "",
        // Product variants - model wise data (for Cover, Tuffun, Camera Ring)
        variants: []
    })

    // Categories from API
    const [categories, setCategories] = useState([])
    const [categoriesData, setCategoriesData] = useState([])
    const [categoriesLoading, setCategoriesLoading] = useState(true)

    // Fetch categories from API
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setCategoriesLoading(true)
                const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'
                const token = localStorage.getItem('access_token')
                
                console.log('🔥 Fetching categories from Django API...')
                console.log('Base URL:', baseUrl)
                console.log('Full API URL:', `${baseUrl}/api/product/categories/`)
                console.log('Token exists:', !!token)
                
                const response = await fetch(`${baseUrl}/api/product/categories/`, {
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
                console.log('✅ Categories API Response:', data)
                console.log('📊 Total categories fetched:', data.length)
                
                // API returns array of objects with id and name (CategorySerializer format)
                setCategoriesData(data)
                setCategories(data.map(cat => cat.name))
                
            } catch (error) {
                console.error('❌ Error fetching categories from Django API:', error)
                // Set empty arrays if API fails
                setCategoriesData([])
                setCategories([])
            } finally {
                setCategoriesLoading(false)
            }
        }

        fetchCategories()
    }, [])

    // Load initial data for edit mode
    useEffect(() => {
        if (initialData && editMode && categoriesData.length > 0) {
            const categoryIndex = categoriesData.findIndex(cat => cat.name === initialData.category)

            console.log('🔄 Loading edit mode data:', {
                subcategoryId: initialData.subcategoryId,
                subcategory: initialData.subcategory,
                variants: initialData.variants?.length
            })

            setProductData(prev => ({
                ...prev,
                productId: initialData.id || null,
                selectedCategory: categoryIndex >= 0 ? categoryIndex : 0,
                selectedSubcategory: initialData.subcategory || null,
                selectedSubcategoryId: initialData.subcategoryId || null,
                selectedGender: initialData.gender || null,
                selectedType: initialData.type || null,
                selectedTypeId: initialData.typeId || null,
                selectedGlassType: initialData.glassType || null,
                selectedGlassTypeId: initialData.glassTypeId || null,
                selectedBrand: initialData.brand || null,
                selectedBrandId: initialData.brandId || null,
                productForm: { 
                    ...prev.productForm, 
                    ...(initialData.form || {}),
                    name: initialData.form?.name || "",
                    hsn: initialData.form?.hsn || "",
                    sellingPrice: initialData.form?.sellingPrice || "",
                    minSellingPrice: initialData.form?.minSellingPrice || "",
                    minQtyAlert: initialData.form?.minQtyAlert || "",
                    commissionType: initialData.form?.commissionType || "percent",
                    commissionValue: initialData.form?.commissionValue || "",
                },
                hasWarranty: initialData.hasWarranty || initialData.form?.hasWarranty || false,
                warrantyMonths: initialData.warrantyMonths || initialData.form?.warrantyMonths || "",
                variants: initialData.variants || []
            }))

            if (initialData.category) {
                const stepCount = getStepCountForCategory(initialData.category)
                setCurrentStep(stepCount)
                setUnlockedStep(stepCount)
            }
        }
    }, [initialData, editMode, categoriesData])

    const updateProductData = (data) => {
        setProductData(prev => ({ ...prev, ...data }))
    }

    const clearSubsequentData = (fromStep) => {
        const clearedData = { ...productData }

        if (fromStep <= 1) {
            clearedData.selectedSubcategory = null
            clearedData.selectedSubcategoryId = null
            clearedData.selectedGender = null
            clearedData.selectedType = null
            clearedData.selectedTypeId = null
            clearedData.selectedGlassType = null
            clearedData.selectedGlassTypeId = null
            clearedData.selectedBrand = null
            clearedData.selectedBrandId = null
            clearedData.productForm = { 
                name: "", 
                hsn: "", 
                sellingPrice: "",
                minSellingPrice: "",
                minQtyAlert: "",
                commissionType: "percent",
                commissionValue: "",
            }
            clearedData.hasWarranty = false
            clearedData.warrantyMonths = ""
            clearedData.variants = []
        } else if (fromStep <= 2) {
            clearedData.selectedGender = null
            clearedData.selectedType = null
            clearedData.selectedTypeId = null
            clearedData.selectedGlassType = null
            clearedData.selectedGlassTypeId = null
            clearedData.selectedBrand = null
            clearedData.selectedBrandId = null
        } else if (fromStep <= 3) {
            clearedData.selectedBrand = null
            clearedData.selectedBrandId = null
        }

        setProductData(clearedData)
    }

    const getFlowSteps = () => {
        let categoryName = null
        if (editMode && initialData?.category) {
            categoryName = initialData.category
        } else if (productData.selectedCategory !== null && categories.length > 0) {
            categoryName = categories[productData.selectedCategory]
        }

        console.log('=== getFlowSteps Debug ===')
        console.log('editMode:', editMode)
        console.log('initialData?.category:', initialData?.category)
        console.log('productData.selectedCategory:', productData.selectedCategory)
        console.log('categories:', categories)
        console.log('categoryName:', categoryName)

        if (!categoryName) {
            console.log('No categoryName, returning default ["Category"]')
            return ["Category"]
        }

        console.log('Determining flow for category:', categoryName)

        // New simplified flow - Cover goes: Category → Subcategory → Gender → Brand → Form
        switch (categoryName) {
            case "Cover":
                console.log('Cover flow: Category → Subcategory → Gender → Brand → Form')
                return ["Category", "Subcategory", "Gender", "Brand", "Form"]
            case "Tuffun":
                console.log('Tuffun flow: Category → Subcategory → Glass Type → Brand → Form')
                return ["Category", "Subcategory", "Glass Type", "Brand", "Form"]
            case "Earphone":
            case "Headphone":
                console.log('Earphone/Headphone flow: Category → Subcategory → Brand → Form')
                return ["Category", "Subcategory", "Brand", "Form"]
            case "Buds":
                console.log('Buds flow: Category → Brand → Form')
                return ["Category", "Brand", "Form"]
            case "Charger":
            case "Power Bank":
            case "Speaker":
            case "Wireless Charger":
            case "Cable":
            case "Pencil":
                console.log('Standard flow: Category → Subcategory → Brand → Form')
                return ["Category", "Subcategory", "Brand", "Form"]
            case "Watch":
                console.log('Watch flow: Category → Gender → Brand → Form')
                return ["Category", "Gender", "Brand", "Form"]
            case "Keyboard":
                console.log('Keyboard flow: Category → Subcategory → Brand → Form')
                return ["Category", "Subcategory", "Brand", "Form"]
            case "Camera Ring":
                console.log('Camera Ring flow: Category → Subcategory → Brand → Form')
                return ["Category", "Subcategory", "Brand", "Form"]
            case "Watch Belt":
                console.log('Watch Belt flow: Category → Subcategory → Gender → Type → Brand → Form')
                return ["Category", "Subcategory", "Gender", "Type", "Brand", "Form"]
            case "Water Pouch":
                console.log('Water Pouch flow: Category → Brand → Form')
                return ["Category", "Brand", "Form"]
            case "Stand":
                console.log('Stand flow: Category → Subcategory → Brand → Form')
                return ["Category", "Subcategory", "Brand", "Form"]
            case "Lamination":
                console.log('Lamination flow: Category → Subcategory → Form')
                return ["Category", "Subcategory", "Form"]
            case "Magsafe Accesories":
                console.log('Magsafe flow: Category → Subcategory → Brand → Form')
                return ["Category", "Subcategory", "Brand", "Form"]
            default:
                console.log('Default flow: Category → Form')
                return ["Category", "Form"]
        }
    }

    const getStepCountForCategory = (categoryName) => {
        switch (categoryName) {
            case "Cover": return 5
            case "Tuffun": return 5
            case "Earphone":
            case "Headphone": return 4
            case "Buds": return 3
            case "Charger":
            case "Power Bank":
            case "Speaker":
            case "Wireless Charger":
            case "Cable":
            case "Pencil": return 4
            case "Watch": return 4
            case "Keyboard": return 4
            case "Camera Ring": return 4
            case "Watch Belt": return 6
            case "Water Pouch": return 3
            case "Stand": return 4
            case "Lamination": return 3
            case "Magsafe Accesories": return 4
            default: return 2
        }
    }

    const flowSteps = getFlowSteps()
    const currentStepName = flowSteps[currentStep - 1]

    const nextStep = () => {
        console.log('=== ProductSteps nextStep ===')
        console.log('Current step:', currentStep)
        console.log('Total steps:', flowSteps.length)
        console.log('Flow steps:', flowSteps)
        
        if (currentStep < flowSteps.length) {
            console.log('Moving to step:', currentStep + 1)
            setCurrentStep(currentStep + 1)
            setUnlockedStep(Math.max(unlockedStep, currentStep + 1))
        } else {
            console.log('Already at last step!')
        }
    }

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const goToStep = (stepNum) => {
        if (stepNum < currentStep) {
            clearSubsequentData(stepNum)
            setCurrentStep(stepNum)
            setUnlockedStep(stepNum + 1)
        }
    }

    const resetForm = () => {
        setProductData({
            selectedCategory: null,
            selectedSubcategory: null,
            selectedSubcategoryId: null,
            selectedGender: null,
            selectedType: null,
            selectedTypeId: null,
            selectedGlassType: null,
            selectedGlassTypeId: null,
            selectedBrand: null,
            selectedBrandId: null,
            productForm: { 
                name: "", 
                hsn: "",
                sellingPrice: "",
                minSellingPrice: "",
                minQtyAlert: "",
                commissionType: "percent",
                commissionValue: "",
            },
            hasWarranty: false,
            warrantyMonths: "",
            variants: []
        })
        setCurrentStep(1)
        setUnlockedStep(1)
    }

    const renderCurrentStep = () => {
        const categoryName = productData.selectedCategory !== null && categories.length > 0 
            ? categories[productData.selectedCategory] 
            : null
            
        const commonProps = {
            productData,
            updateProductData,
            nextStep,
            prevStep,
            currentStep,
            totalSteps: flowSteps.length,
            categories,
            categoriesData,
            categoriesLoading,
            editMode
        }

        switch (currentStepName) {
            case "Category":
                return <CategorySelection {...commonProps} />
            case "Subcategory":
                return <SubcategorySelection {...commonProps} />
            case "Gender":
                return <GenderSelection {...commonProps} />
            case "Brand":
                return <BrandSelection {...commonProps} />
            case "Glass Type":
                return <GlassTypeSelection {...commonProps} />
            case "Type":
                return <TypeSelection {...commonProps} />
            case "Form":
                return <ProductForm {...commonProps} onClose={onClose} onSaved={onSaved} resetForm={resetForm} />
            default:
                return null
        }
    }

    return (
        <div className="p-8 space-y-8 min-h-full w-full max-w-none">
            <div className="flex items-center gap-2">
                <Building2 className="w-6 h-6" />
                <h1 className="text-3xl font-bold text-foreground">
                    {editMode ? "Edit Product" : "Add Product"}
                </h1>
            </div>

            {/* Step Progress */}
            {!editMode && (
                <div className="flex items-center justify-center gap-2 py-3 px-4 bg-muted/30 rounded-lg flex-wrap">
                    {flowSteps.map((step, index) => (
                        <div key={step} className="flex items-center gap-1">
                            <div
                                className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium transition-all ${currentStep > index + 1
                                    ? 'bg-green-600 text-white cursor-pointer hover:bg-green-700'
                                    : currentStep === index + 1
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground'
                                    }`}
                                onClick={() => {
                                    if (currentStep > index + 1) {
                                        goToStep(index + 1)
                                    }
                                }}
                                title={currentStep > index + 1 ? `Go back to ${step}` : step}
                            >
                                {currentStep > index + 1 ? <Check className="w-2.5 h-2.5" /> : index + 1}
                            </div>
                            <span
                                className={`text-xs font-medium transition-all ${currentStep > index + 1
                                    ? 'text-green-600 cursor-pointer hover:text-green-700'
                                    : currentStep === index + 1
                                        ? 'text-primary'
                                        : 'text-muted-foreground'
                                    }`}
                                onClick={() => {
                                    if (currentStep > index + 1) {
                                        goToStep(index + 1)
                                    }
                                }}
                            >
                                {step}
                            </span>
                            {index < flowSteps.length - 1 && (
                                <ChevronRight className="w-3 h-3 text-muted-foreground mx-1" />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Current Step Component */}
            {editMode && initialData ? (
                <ProductForm
                    productData={productData}
                    updateProductData={updateProductData}
                    prevStep={prevStep}
                    currentStep={currentStep}
                    totalSteps={flowSteps.length}
                    categories={categories}
                    categoriesData={categoriesData}
                    categoriesLoading={categoriesLoading}
                    editMode={editMode}
                    onClose={onClose}
                    onSaved={onSaved}
                    resetForm={resetForm}
                />
            ) : (
                renderCurrentStep()
            )}
        </div>
    )
}
