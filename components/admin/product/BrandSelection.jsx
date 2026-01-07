"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2, Image } from "lucide-react"
import { useToast } from "../../../hooks/use-toast"
import OverlayModal from "./OverlayModal"

export default function BrandSelection({
  productData,
  updateProductData,
  nextStep,
  prevStep,
  categories,
  categoriesData,
  editMode
}) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [brands, setBrands] = useState([])
  const [brandsData, setBrandsData] = useState([])
  const [brandsLoading, setBrandsLoading] = useState(false)
  const [brandsError, setBrandsError] = useState(null)

  const [modalState, setModalState] = useState({
    open: false,
    type: "",
    value: "",
    imageFile: null,
    imagePreview: "",
    editIndex: -1,
    isLoading: false,
  })

  const categoryName = productData.selectedCategory !== null ? categories[productData.selectedCategory] : null

  // Fetch brands from API when category changes
  useEffect(() => {
    if (productData.selectedCategory !== null && categories.length > 0 && categoriesData.length > 0) {
      fetchBrands(categoryName)
    }
  }, [productData.selectedCategory, categories, categoriesData])

  const fetchBrands = async (categoryName) => {
    try {
      const token = localStorage.getItem('access_token')
      setBrandsLoading(true)
      setBrandsError(null)

      const categoryObj = categoriesData.find(cat => cat.name === categoryName)
      if (!categoryObj) {
        throw new Error('Category not found')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/brand/category/${categoryObj.id}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })

      if (response.ok) {
        const data = await response.json()
        setBrandsData(data)
        setBrands(data.map(brand => brand.name))
      } else {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

    } catch (error) {
      console.error('Error fetching brands:', error)
      setBrandsError(error.message)
      setBrands([])
    } finally {
      setBrandsLoading(false)
    }
  }

  const createBrand = async (categoryName, brandName, imageFile = null) => {
    try {
      const token = localStorage.getItem('access_token')
      const categoryObj = categoriesData.find(cat => cat.name === categoryName)

      if (categoryObj) {
        const formData = new FormData()
        formData.append('name', brandName)
        formData.append('category', categoryObj.id)

        if (imageFile) {
          formData.append('image', imageFile)
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/brand/create/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'omit',
          body: formData
        })

        if (response.ok) {
          await fetchBrands(categoryName)
          toast({
            title: "Success",
            description: `Brand "${brandName}" created successfully.`,
          })
          return true
        }
      }
      return false

    } catch (error) {
      console.error('Error creating brand:', error)
      toast({
        title: "Error",
        description: "Failed to create brand",
        variant: "destructive",
      })
      return false
    }
  }

  const updateBrand = async (brandId, newBrandName, imageFile = null) => {
    try {
      const token = localStorage.getItem('access_token')

      const formData = new FormData()
      formData.append('name', newBrandName)

      if (imageFile !== null) {
        formData.append('image', imageFile)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/brand/update/${brandId}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'omit',
        body: formData
      })

      if (response.ok) {
        await fetchBrands(categoryName)
        toast({
          title: "Success",
          description: `Brand updated successfully.`,
        })
        return true
      }
      return false

    } catch (error) {
      console.error('Error updating brand:', error)
      toast({
        title: "Error",
        description: "Failed to update brand",
        variant: "destructive",
      })
      return false
    }
  }

  const deleteBrand = async (brandId) => {
    try {
      const token = localStorage.getItem('access_token')

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/brand/delete/${brandId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })

      if (response.ok) {
        await fetchBrands(categoryName)
        toast({
          title: "Success",
          description: "Brand deleted successfully.",
        })
        return true
      }
      return false

    } catch (error) {
      console.error('Error deleting brand:', error)
      toast({
        title: "Error",
        description: "Failed to delete brand",
        variant: "destructive",
      })
      return false
    }
  }

  const handleModalSave = async () => {
    const { type, value, imageFile, editIndex } = modalState
    const trimmedValue = value.trim()

    if (!trimmedValue && type !== "delete") return

    setModalState(prev => ({ ...prev, isLoading: true }))

    try {
      if (type === "add") {
        await createBrand(categoryName, trimmedValue, imageFile)
      } else if (type === "edit") {
        const brandObj = brandsData.find(brand => brand.name === brands[editIndex])
        if (brandObj) {
          await updateBrand(brandObj.id, trimmedValue, imageFile)
        }
      } else if (type === "delete") {
        const brandObj = brandsData.find(brand => brand.name === brands[editIndex])
        if (brandObj) {
          await deleteBrand(brandObj.id)
        }
      }
      closeModal()
    } catch (error) {
      console.error('Modal save error:', error)
    } finally {
      setModalState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const openModal = (type, value = "", index = -1) => {
    let imagePreview = ""
    if (type === "edit" && index >= 0) {
      const brandObj = brandsData.find(brand => brand.name === brands[index])
      imagePreview = brandObj?.image
        ? (brandObj.image.startsWith('http')
          ? brandObj.image
          : `${process.env.NEXT_PUBLIC_API_BASE_URL}${brandObj.image}`)
        : ""
    }
    setModalState({ open: true, type, value, imageFile: null, imagePreview, editIndex: index, isLoading: false })
  }

  const closeModal = () => {
    setModalState({ open: false, type: "", value: "", imageFile: null, imagePreview: "", editIndex: -1, isLoading: false })
  }

  const handleBrandSelect = (brand) => {
    // Find the brand ID from brandsData
    const brandObj = brandsData.find(b => b.name === brand)

    // If changing brand, clear subsequent data
    if (productData.selectedBrand !== brand) {
      updateProductData({
        selectedBrand: brand,
        selectedBrandId: brandObj?.id || null,
        // Clear subsequent selections
        selectedSubBrand: null,
        selectedSubBrandId: null,
        selectedModel: null,
        selectedModelId: null,
        selectedGlassType: null,
        selectedGlassTypeId: null,
        selectedType: null,
        selectedTypeId: null,
      })
    } else {
      updateProductData({
        selectedBrand: brand,
        selectedBrandId: brandObj?.id || null
      })
    }
    setTimeout(() => nextStep(), 300)
  }

  const filteredBrands = brands.filter((b) =>
    b.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Brand</h2>
          <p className="text-sm text-muted-foreground">
            Category: <span className="font-medium text-foreground">{categoryName}</span>
            {productData.selectedSubcategory && (
              <span> | Subcategory: <span className="font-medium text-foreground">{productData.selectedSubcategory}</span></span>
            )}
          </p>
          {brandsLoading && (
            <p className="text-xs text-muted-foreground">Loading brands...</p>
          )}
          {brandsError && (
            <p className="text-xs text-red-500">Error: {brandsError}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            className="w-full max-w-xs rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button size="sm" onClick={() => openModal("add")}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {filteredBrands.map((brand, idx) => {
          const isActive = productData.selectedBrand === brand
          const brandObj = brandsData.find(b => b.name === brand)
          return (
            <Card
              key={brand}
              role="button"
              tabIndex={0}
              onClick={() => handleBrandSelect(brand)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  handleBrandSelect(brand)
                }
              }}
              className={`cursor-pointer hover:shadow-sm transition ${isActive ? "border-2 border-primary" : ""
                }`}
            >
              <CardHeader className="py-2 px-3">
                <div className="flex flex-col items-center text-center space-y-2">
                  {brandObj?.image ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${brandObj.image}`}
                      alt={brand}
                      className="w-8 h-8 object-contain rounded"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                      <Image className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <CardTitle className="text-xs leading-tight">{brand}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5"
                      tabIndex={-1}
                      onClick={(e) => {
                        e.stopPropagation()
                        openModal("edit", brand, idx)
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5 hover:bg-destructive/10"
                      tabIndex={-1}
                      onClick={(e) => {
                        e.stopPropagation()
                        openModal("delete", brand, idx)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )
        })}
      </div>

      <div className="text-center">
        <div className="text-xs text-muted-foreground">Click on a brand to continue</div>
      </div>

      <OverlayModal
        open={modalState.open}
        title={
          modalState.type === "add"
            ? "Add Brand"
            : modalState.type === "edit"
              ? "Edit Brand"
              : "Delete Brand"
        }
        value={modalState.value}
        onChange={(val) => setModalState(prev => ({ ...prev, value: val }))}
        imageFile={modalState.imageFile}
        imagePreview={modalState.imagePreview}
        onImageChange={(file) => setModalState(prev => ({ ...prev, imageFile: file, imagePreview: file ? "" : prev.imagePreview }))}
        showImageUpload={modalState.type !== "delete"}
        onClose={closeModal}
        onSave={handleModalSave}
        placeholder={
          modalState.type === "delete"
            ? `Are you sure you want to delete "${modalState.value}"?`
            : "Enter brand name"
        }
        isDeleteMode={modalState.type === "delete"}
        isLoading={modalState.isLoading}
      />
    </div>
  )
}