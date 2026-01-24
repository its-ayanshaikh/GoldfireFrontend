"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { Plus, Edit, Trash2, Image, Search } from "lucide-react"
import { useToast } from "../../../hooks/use-toast"
import OverlayModal from "./OverlayModal"

export default function BrandSelection({
  productData,
  updateProductData,
  nextStep,
  categories,
  categoriesData
}) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [brands, setBrands] = useState([])
  const [brandsData, setBrandsData] = useState([])
  const [brandsLoading, setBrandsLoading] = useState(false)

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
  const categoryId = productData.selectedCategory !== null && categoriesData.length > 0 
    ? categoriesData[productData.selectedCategory]?.id 
    : null

  // Fetch brands from API when category changes
  useEffect(() => {
    if (categoryId) {
      fetchBrands(categoryId)
    }
  }, [categoryId])

  const fetchBrands = async (catId) => {
    try {
      setBrandsLoading(true)
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'
      const token = localStorage.getItem('access_token')
      
      console.log('🔥 Fetching brands from Django API...')
      console.log('Category ID:', catId)
      console.log('Full API URL:', `${baseUrl}/api/product/brand/category/${catId}/`)
      
      const response = await fetch(`${baseUrl}/api/product/brand/category/${catId}/`, {
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
      console.log('✅ Brands API Response:', data)
      console.log('📊 Total brands fetched:', data.length)
      
      // API returns array of objects with id, name, image, category, category_name
      setBrandsData(data)
      setBrands(data.map(brand => brand.name))
      
    } catch (error) {
      console.error('❌ Error fetching brands from Django API:', error)
      setBrandsData([])
      setBrands([])
    } finally {
      setBrandsLoading(false)
    }
  }

  const handleModalSave = async () => {
    const { type, value, editIndex, imageFile } = modalState
    const trimmedValue = value.trim()

    if (!trimmedValue && type !== "delete") return

    setModalState(prev => ({ ...prev, isLoading: true }))

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'
      const token = localStorage.getItem('access_token')
      
      if (type === "add") {
        console.log('🔥 Creating new brand:', trimmedValue)
        
        // Use FormData for image upload
        const formData = new FormData()
        formData.append('name', trimmedValue)
        formData.append('category', categoryId)
        if (imageFile) {
          formData.append('image', imageFile)
        }
        
        const response = await fetch(`${baseUrl}/api/product/brand/create/`, {
          method: 'POST',
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: formData
        })
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        
        const newBrand = await response.json()
        console.log('✅ Brand created:', newBrand)
        
        setBrandsData(prev => [...prev, newBrand])
        setBrands(prev => [...prev, newBrand.name])
        toast({ title: "Success", description: `Brand "${trimmedValue}" added.` })
        setTimeout(() => fetchBrands(categoryId), 500)
        
      } else if (type === "edit") {
        const brandToEdit = brandsData[editIndex]
        console.log('🔥 Updating brand:', brandToEdit.id, trimmedValue)
        
        // Use FormData for image upload
        const formData = new FormData()
        formData.append('name', trimmedValue)
        formData.append('category', categoryId)
        if (imageFile) {
          formData.append('image', imageFile)
        }
        
        const response = await fetch(`${baseUrl}/api/product/brand/update/${brandToEdit.id}/`, {
          method: 'PUT',
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: formData
        })
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        
        const updatedBrand = await response.json()
        console.log('✅ Brand updated:', updatedBrand)
        
        setBrandsData(prev => prev.map((b, i) => i === editIndex ? updatedBrand : b))
        setBrands(prev => prev.map((b, i) => i === editIndex ? updatedBrand.name : b))
        toast({ title: "Success", description: "Brand updated." })
        setTimeout(() => fetchBrands(categoryId), 500)
        
      } else if (type === "delete") {
        const brandToDelete = brandsData[editIndex]
        console.log('🔥 Deleting brand:', brandToDelete.id)
        
        const response = await fetch(`${baseUrl}/api/product/brand/delete/${brandToDelete.id}/`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        })
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        
        console.log('✅ Brand deleted')
        
        setBrandsData(prev => prev.filter((_, i) => i !== editIndex))
        setBrands(prev => prev.filter((_, i) => i !== editIndex))
        toast({ title: "Success", description: "Brand deleted." })
      }
      closeModal()
    } catch (error) {
      console.error('❌ Modal save error:', error)
      toast({ 
        title: "Error", 
        description: `Failed to ${type} brand. Please try again.`,
        variant: "destructive"
      })
    } finally {
      setModalState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const openModal = (type, value = "", index = -1) => {
    const existingImage = index >= 0 && brandsData[index]?.image ? brandsData[index].image : ""
    setModalState({ 
      open: true, 
      type, 
      value, 
      imageFile: null, 
      imagePreview: existingImage,
      editIndex: index, 
      isLoading: false 
    })
  }

  const closeModal = () => {
    setModalState({ 
      open: false, 
      type: "", 
      value: "", 
      imageFile: null, 
      imagePreview: "",
      editIndex: -1, 
      isLoading: false 
    })
  }

  const handleBrandSelect = (brand) => {
    const brandObj = brandsData.find(b => b.name === brand)
    updateProductData({
      selectedBrand: brand,
      selectedBrandId: brandObj?.id || null,
    })
    setTimeout(() => nextStep(), 300)
  }

  const filteredBrands = brands.filter((b) =>
    b.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Loading state
  if (brandsLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Brand</h2>
            <p className="text-sm text-muted-foreground">
              Category: <span className="font-medium text-foreground">{categoryName}</span>
            </p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="flex justify-center items-center space-x-1 text-4xl font-normal text-black tracking-tight mb-4">
            <span className="animate-pulse" style={{ animationDelay: '0ms' }}>L</span>
            <span className="animate-pulse" style={{ animationDelay: '200ms' }}>o</span>
            <span className="animate-pulse" style={{ animationDelay: '400ms' }}>a</span>
            <span className="animate-pulse" style={{ animationDelay: '600ms' }}>d</span>
            <span className="animate-pulse" style={{ animationDelay: '800ms' }}>i</span>
            <span className="animate-pulse" style={{ animationDelay: '1000ms' }}>n</span>
            <span className="animate-pulse" style={{ animationDelay: '1200ms' }}>g</span>
          </div>
          <p className="text-muted-foreground">Loading brands from API...</p>
        </div>
      </div>
    )
  }


  // Main render
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Brand</h2>
          <p className="text-sm text-muted-foreground">
            Category: <span className="font-medium text-foreground">{categoryName}</span>
            {productData.selectedSubcategory && (
              <span> • Subcategory: <span className="font-medium text-foreground">{productData.selectedSubcategory}</span></span>
            )}
            {productData.selectedGender && (
              <span> • Gender: <span className="font-medium text-foreground capitalize">{productData.selectedGender}</span></span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {brands.length > 0 && (
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
                placeholder="Search brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
          <Button size="sm" onClick={() => openModal("add")}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {brands.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl font-normal text-muted-foreground tracking-tight mb-4">
            <Plus className="h-12 w-12 mx-auto text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-2">No brands found</p>
          <p className="text-sm text-muted-foreground mb-4">
            Add the first brand for {categoryName}
          </p>
          <Button onClick={() => openModal("add")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Brand
          </Button>
        </div>
      ) : (
        <>
          {/* Brands Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {filteredBrands.map((brand, idx) => {
              const brandData = brandsData.find(b => b.name === brand)
              const isActive = productData.selectedBrand === brand
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
                  className={`cursor-pointer hover:shadow-sm transition ${isActive ? "border-2 border-primary" : ""}`}
                >
                  <CardHeader className="py-2 px-3">
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center overflow-hidden">
                        {brandData?.image ? (
                          <img 
                            src={brandData.image} 
                            alt={brand} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Image className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
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
        </>
      )}

      {/* Modal - Always rendered */}
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
        onClose={closeModal}
        onSave={handleModalSave}
        placeholder={
          modalState.type === "delete"
            ? `Are you sure you want to delete "${modalState.value}"?`
            : "Enter brand name"
        }
        isDeleteMode={modalState.type === "delete"}
        isLoading={modalState.isLoading}
        showImageUpload={modalState.type !== "delete"}
        imageFile={modalState.imageFile}
        imagePreview={modalState.imagePreview}
        onImageChange={(file) => setModalState(prev => ({ ...prev, imageFile: file }))}
      />
    </div>
  )
}
