"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle } from "../../ui/card"
import { Badge } from "../../ui/badge"

import {
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
  Magnet,
  Search
} from "lucide-react"

export default function CategorySelection({
  productData,
  updateProductData,
  nextStep,
  categories,
  categoriesLoading = false
}) {
  const [searchTerm, setSearchTerm] = useState("")

  // Category icons mapping
  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      'Cover': Smartphone,
      'Tuffun': Shield,
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

  const handleCategorySelect = (categoryIndex) => {
    console.log('🔥 CATEGORY SELECTED! 🔥')
    console.log('Selected categoryIndex:', categoryIndex)
    console.log('Category name:', categories[categoryIndex])
    console.log('Current productData.selectedCategory:', productData.selectedCategory)
    console.log('nextStep function:', nextStep)
    
    if (productData.selectedCategory !== categoryIndex) {
      console.log('Updating category and clearing data...')
      updateProductData({
        selectedCategory: categoryIndex,
        selectedSubcategory: null,
        selectedSubcategoryId: null,
        selectedGender: null,
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
    } else {
      console.log('Same category selected, just updating...')
      updateProductData({ selectedCategory: categoryIndex })
    }
    
    console.log('Calling nextStep in 300ms...')
    setTimeout(() => {
      console.log('🚀 NextStep called!')
      try {
        nextStep()
        console.log('✅ NextStep executed successfully!')
      } catch (error) {
        console.error('❌ NextStep failed:', error)
      }
    }, 300)
  }

  const filteredCategories = categories.filter((c) =>
    c.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <p className="text-muted-foreground">Loading categories from API...</p>
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="p-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-50 rounded-full">
                <Search className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <p className="text-muted-foreground mb-2">No categories found</p>
            <p className="text-sm text-muted-foreground">
              Please check your API connection or contact administrator
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Choose product category</p>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Cover, Tuffun, Camera Ring have variants
            </span>
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {filteredCategories.map((cat) => {
          const actualIdx = categories.indexOf(cat)
          const isActive = productData.selectedCategory === actualIdx
          const hasVariants = ["Cover", "Tuffun", "Camera Ring"].includes(cat)
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
                  {hasVariants && (
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" title="Has variants"></div>
                  )}
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
