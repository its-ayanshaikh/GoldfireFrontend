"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { Building2, ChevronLeft, ChevronRight, Check } from "lucide-react"
import CategorySelection from "./CategorySelection"
import SubcategorySelection from "./SubcategorySelection"
import GenderSelection from "./GenderSelection"
import BrandSelection from "./BrandSelection"
import SubBrandSelection from "./SubBrandSelection"
import ModelSelection from "./ModelSelection"
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
        selectedBrand: null,
        selectedBrandId: null,
        selectedSubBrand: null,
        selectedSubBrandId: null,
        selectedModel: null,
        selectedModelId: null,
        selectedGlassType: null,
        selectedGlassTypeId: null,
        selectedType: null,
        selectedTypeId: null,
        productForm: {
            name: "",
            hsn: "",
            vendor: "",
            minSellingPrice: "",
            purchasePrice: "",
            sellingPrice: "",
            minQtyAlert: "",
            commissionType: "fixed",
            commissionValue: "",
            selectedBranches: [],
            branchQuantities: {},
            chargerType: "",
            cableType: "",
            capacity: "",
            selectedModels: [],
        },
        serialNumbers: [],
        hasWarranty: false,
        warrantyMonths: ""
    })

    // Categories from API
    const [categories, setCategories] = useState([])
    const [categoriesData, setCategoriesData] = useState([])

    // Load initial data for edit mode - wait for categories to be loaded
    useEffect(() => {
        if (initialData && editMode && categoriesData.length > 0) {
            console.log('Edit mode initialData:', initialData)
            console.log('Available categories:', categoriesData)

            // Find category index based on category name
            const categoryIndex = categoriesData.findIndex(cat => cat.name === initialData.category)
            console.log('Found category index:', categoryIndex, 'for category:', initialData.category)

            // Set product data with correct category index
            setProductData(prev => ({
                ...prev,
                productId: initialData.id || null, // Product ID for update API
                selectedCategory: categoryIndex >= 0 ? categoryIndex : 0,
                selectedSubcategory: initialData.subcategory || null,
                selectedGender: initialData.gender || null,
                selectedBrand: initialData.brand || null,
                selectedSubBrand: initialData.subBrand || null,
                selectedModel: initialData.model || null,
                selectedGlassType: initialData.glassType || null,
                selectedType: initialData.type || null,
                productForm: { ...prev.productForm, ...(initialData.form || {}) },
                serialNumbers: initialData.form?.serialNumbers || [],
                hasWarranty: initialData.form?.hasWarranty || false,
                warrantyMonths: initialData.form?.warrantyMonths || ""
            }))

            // In edit mode, go directly to the Form step
            if (initialData.category) {
                const stepCount = getStepCountForCategory(initialData.category)
                console.log('Setting step to:', stepCount, 'for category:', initialData.category)
                setCurrentStep(stepCount) // Go to final Form step
                setUnlockedStep(stepCount)
            }
        }
    }, [initialData, editMode, categoriesData])

    // Fetch categories from API
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const token = localStorage.getItem('access_token')
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/categories/`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    credentials: 'omit',
                })

                if (response.ok) {
                    const data = await response.json()
                    setCategoriesData(data)
                    setCategories(data.map(category => category.name))
                }
            } catch (error) {
                console.error('Error fetching categories:', error)
            }
        }

        fetchCategories()
    }, [])

    const updateProductData = (data) => {
        setProductData(prev => ({ ...prev, ...data }))
    }

    // Clear subsequent step data when going back to earlier steps
    const clearSubsequentData = (fromStep) => {
        const clearedData = { ...productData }

        // If changing category, clear everything
        if (fromStep <= 1) {
            clearedData.selectedSubcategory = null
            clearedData.selectedSubcategoryId = null
            clearedData.selectedGender = null
            clearedData.selectedBrand = null
            clearedData.selectedBrandId = null
            clearedData.selectedSubBrand = null
            clearedData.selectedSubBrandId = null
            clearedData.selectedModel = null
            clearedData.selectedModelId = null
            clearedData.selectedGlassType = null
            clearedData.selectedGlassTypeId = null
            clearedData.selectedType = null
            clearedData.selectedTypeId = null
            clearedData.productForm = {
                name: "",
                hsn: "",
                vendor: "",
                minSellingPrice: "",
                purchasePrice: "",
                sellingPrice: "",
                minQtyAlert: "",
                commissionType: "fixed",
                commissionValue: "",
                selectedBranches: [],
                branchQuantities: {},
                chargerType: "",
                cableType: "",
                capacity: "",
                selectedModels: [],
            }
            clearedData.serialNumbers = []
            clearedData.hasWarranty = false
            clearedData.warrantyMonths = ""
        }
        // If changing subcategory, clear brand and subsequent data
        else if (fromStep <= 2) {
            clearedData.selectedBrand = null
            clearedData.selectedBrandId = null
            clearedData.selectedSubBrand = null
            clearedData.selectedSubBrandId = null
            clearedData.selectedModel = null
            clearedData.selectedModelId = null
            clearedData.selectedGlassType = null
            clearedData.selectedGlassTypeId = null
            clearedData.selectedType = null
            clearedData.selectedTypeId = null
        }
        // If changing gender, clear brand and subsequent data
        else if (fromStep <= 3) {
            clearedData.selectedBrand = null
            clearedData.selectedBrandId = null
            clearedData.selectedSubBrand = null
            clearedData.selectedSubBrandId = null
            clearedData.selectedModel = null
            clearedData.selectedModelId = null
            clearedData.selectedGlassType = null
            clearedData.selectedGlassTypeId = null
            clearedData.selectedType = null
            clearedData.selectedTypeId = null
        }
        // If changing brand, clear subbrand and subsequent data
        else if (fromStep <= 4) {
            clearedData.selectedSubBrand = null
            clearedData.selectedSubBrandId = null
            clearedData.selectedModel = null
            clearedData.selectedModelId = null
            clearedData.selectedGlassType = null
            clearedData.selectedGlassTypeId = null
            clearedData.selectedType = null
            clearedData.selectedTypeId = null
        }
        // If changing subbrand, clear model and subsequent data
        else if (fromStep <= 5) {
            clearedData.selectedModel = null
            clearedData.selectedModelId = null
        }

        setProductData(clearedData)
    }

    const getFlowSteps = () => {
        // In edit mode, if we have initialData category, use that
        let categoryName = null
        if (editMode && initialData?.category) {
            categoryName = initialData.category
        } else if (productData.selectedCategory !== null && categories.length > 0) {
            categoryName = categories[productData.selectedCategory]
        }

        if (!categoryName) return ["Category"]

        switch (categoryName) {
            case "Cover":
                return ["Category", "Subcategory", "Gender", "Brand", "Sub-brand", "Model", "Form"]
            case "Tuffun":
                return ["Category", "Subcategory", "Glass Type", "Brand", "Form"]
            case "Earphone":
            case "Headphone":
                return ["Category", "Subcategory", "Brand", "Form"]
            case "Buds":
                return ["Category", "Brand", "Form"]
            case "Charger":
            case "Power Bank":
            case "Speaker":
            case "Wireless Charger":
            case "Cable":
            case "Pencil":
                return ["Category", "Subcategory", "Brand", "Form"]
            case "Watch":
                return ["Category", "Gender", "Brand", "Form"]
            case "Keyboard":
                return ["Category", "Subcategory", "Brand", "Form"]
            case "Camera Ring":
                return ["Category", "Subcategory", "Brand", "Model", "Sub-brand", "Form"]
            case "Watch Belt":
                return ["Category", "Subcategory", "Gender", "Type", "Brand", "Form"]
            case "Water Pouch":
                return ["Category", "Brand", "Form"]
            case "Stand":
                return ["Category", "Subcategory", "Brand", "Form"]
            case "Lamination":
                return ["Category", "Subcategory", "Form"]
            case "Magsafe Accesories":
                return ["Category", "Subcategory", "Brand", "Form"]
            default:
                return ["Category", "Form"]
        }
    }

    const getStepCountForCategory = (categoryName) => {
        switch (categoryName) {
            case "Cover": return 7
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
            case "Camera Ring": return 6
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
        if (currentStep < flowSteps.length) {
            setCurrentStep(currentStep + 1)
            setUnlockedStep(Math.max(unlockedStep, currentStep + 1))
        }
    }

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const goToStep = (stepNum) => {
        // Only allow backward navigation (going to previous completed steps)
        if (stepNum < currentStep) {
            // Clear subsequent step data when going back
            clearSubsequentData(stepNum)
            setCurrentStep(stepNum)
            // Reset unlocked step to current step + 1 to force re-completion
            setUnlockedStep(stepNum + 1)
        }
    }

    const resetForm = () => {
        setProductData({
            selectedCategory: null,
            selectedSubcategory: null,
            selectedSubcategoryId: null,
            selectedGender: null,
            selectedBrand: null,
            selectedBrandId: null,
            selectedSubBrand: null,
            selectedSubBrandId: null,
            selectedModel: null,
            selectedModelId: null,
            selectedGlassType: null,
            selectedGlassTypeId: null,
            selectedType: null,
            selectedTypeId: null,
            productForm: {
                name: "",
                hsn: "",
                vendor: "",
                minSellingPrice: "",
                purchasePrice: "",
                sellingPrice: "",
                minQtyAlert: "",
                commissionType: "fixed",
                commissionValue: "",
                selectedBranches: [],
                branchQuantities: {},
                chargerType: "",
                cableType: "",
                capacity: "",
                selectedModels: [],
            },
            serialNumbers: [],
            hasWarranty: false,
            warrantyMonths: ""
        })
        setCurrentStep(1)
        setUnlockedStep(1)
    }

    const renderCurrentStep = () => {
        const commonProps = {
            productData,
            updateProductData,
            nextStep,
            prevStep,
            currentStep,
            totalSteps: flowSteps.length,
            categories,
            categoriesData,
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
            case "Sub-brand":
                return <SubBrandSelection {...commonProps} />
            case "Model":
                return <ModelSelection {...commonProps} />
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

            {/* Step Progress - Compact with Names */}
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
                                    // Only allow backward navigation
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
                                    // Only allow backward navigation
                                    if (currentStep > index + 1) {
                                        goToStep(index + 1)
                                    }
                                }}
                                title={currentStep > index + 1 ? `Go back to ${step}` : step}
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
                // In edit mode, show form directly
                <ProductForm
                    productData={productData}
                    updateProductData={updateProductData}
                    prevStep={prevStep}
                    currentStep={currentStep}
                    totalSteps={flowSteps.length}
                    categories={categories}
                    categoriesData={categoriesData}
                    editMode={editMode}
                    onClose={onClose}
                    onSaved={onSaved}
                    resetForm={resetForm}
                />
            ) : (
                renderCurrentStep()
            )}

        </div >
    )
}