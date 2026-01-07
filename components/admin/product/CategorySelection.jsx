"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle } from "../../ui/card"
import { Badge } from "../../ui/badge"

import {
  X,
  Smartphone,
  Shield,
  Headphones,
  Zap,
  Battery,
  Volume2,
  Wifi,
  Cable,
  Watch,
  Edit3,
  Keyboard,
  Camera,
  Circle,
  Droplets,
  Monitor,
  Layers,
  Magnet
} from "lucide-react"

export default function CategorySelection({
  productData,
  updateProductData,
  nextStep,
  categories,
  categoriesData,
  editMode
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState(null)

  // Category icons mapping
  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      'Cover': Smartphone,
      'Tuff': Shield,
      'Earphone': Headphones,
      'Headphone': Headphones,
      'Buds': Headphones,
      'Charger': Zap,
      'Power Bank': Battery,
      'Speaker': Volume2,
      'Wireless Charger': Wifi,
      'Cable': Cable,
      'Watch': Watch,
      'Pencil': Edit3,
      'Keyboard': Keyboard,
      'Camera Ring': Camera,
      'Watch Belt': Circle,
      'Water Pouch': Droplets,
      'Stand': Monitor,
      'Lamination': Layers,
      'Magsafe Accesories': Magnet
    }

    return iconMap[categoryName] || Shield
  }

  useEffect(() => {
    if (categories.length > 0) {
      setCategoriesLoading(false)
    }
  }, [categories])

  const handleCategorySelect = (categoryIndex) => {
    // If changing category, clear all subsequent data
    if (productData.selectedCategory !== categoryIndex) {
      updateProductData({
        selectedCategory: categoryIndex,
        // Clear all subsequent selections
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
        // Clear form data
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
    } else {
      updateProductData({ selectedCategory: categoryIndex })
    }
    setTimeout(() => nextStep(), 300)
  }

  if (categoriesLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="flex justify-center items-center space-x-1 text-6xl font-normal text-black tracking-tight mb-4">
            <span className="animate-pulse" style={{ animationDelay: '0ms' }}>L</span>
            <span className="animate-pulse" style={{ animationDelay: '200ms' }}>o</span>
            <span className="animate-pulse" style={{ animationDelay: '400ms' }}>a</span>
            <span className="animate-pulse" style={{ animationDelay: '600ms' }}>d</span>
            <span className="animate-pulse" style={{ animationDelay: '800ms' }}>i</span>
            <span className="animate-pulse" style={{ animationDelay: '1000ms' }}>n</span>
            <span className="animate-pulse" style={{ animationDelay: '1200ms' }}>g</span>
          </div>
          <p className="text-muted-foreground">Fetching categories...</p>
        </div>
      </div>
    )
  }

  if (categoriesError) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">
            <X className="h-12 w-12 mx-auto mb-2" />
            <p className="font-medium">Failed to load categories</p>
            <p className="text-sm text-muted-foreground">{categoriesError}</p>
          </div>
        </div>
      </div>
    )
  }

  const filteredCategories = categories.filter((c) =>
    c.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (categories.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="text-yellow-500 mb-4">
            <X className="h-12 w-12 mx-auto mb-2" />
            <p className="font-medium">No categories available</p>
            <p className="text-sm text-muted-foreground">Please check your connection and try again</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Choose product category</p>
        <input
          type="search"
          className="w-full max-w-xs rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
          placeholder="Search category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {filteredCategories.map((cat, idx) => {
          const actualIdx = categories.indexOf(cat)
          const isActive = productData.selectedCategory === actualIdx
          return (
            <Card
              key={cat}
              role="button"
              tabIndex={0}
              onClick={() => handleCategorySelect(actualIdx)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  handleCategorySelect(actualIdx)
                }
              }}
              className={`transition-shadow hover:shadow-sm cursor-pointer ${isActive ? "border-2 border-primary" : ""
                }`}
              aria-pressed={isActive}
            >
              <CardHeader className="py-3 px-3">
                <div className="flex flex-col items-center text-center space-y-2">
                  {(() => {
                    const IconComponent = getCategoryIcon(cat)
                    return <IconComponent className="h-6 w-6 text-primary" />
                  })()}
                  <CardTitle className="text-xs leading-tight">
                    {cat}
                  </CardTitle>
                  {isActive && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      Selected
                    </Badge>
                  )}
                </div>
              </CardHeader>
            </Card>
          )
        })}
      </div>

      <div className="text-center">
        <div className="text-xs text-muted-foreground">Click on a category to continue</div>
      </div>
    </div>
  )
}