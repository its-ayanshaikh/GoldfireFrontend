"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2, Image } from "lucide-react"
import { useToast } from "../../../hooks/use-toast"
import OverlayModal from "./OverlayModal"

export default function SubBrandSelection({ 
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
  const [subBrands, setSubBrands] = useState([])
  const [subBrandsData, setSubBrandsData] = useState([])
  const [subBrandsLoading, setSubBrandsLoading] = useState(false)
  const [subBrandsError, setSubBrandsError] = useState(null)
  
  const [modalState, setModalState] = useState({
    open: false,
    type: "",
    value: "",
    imageFile: null,
    imagePreview: "",
    editIndex: -1,
    isLoading: false,
  })

  // Fetch sub-brands when subcategory changes
  useEffect(() => {
    if (productData.selectedSubcategory) {
      fetchSubBrands()
    }
  }, [productData.selectedSubcategory])

  const fetchSubBrands = async () => {
    try {
      const token = localStorage.getItem('access_token')
      setSubBrandsLoading(true)
      setSubBrandsError(null)

      // Find subcategory ID
      const categoryName = categories[productData.selectedCategory]
      const categoryObj = categoriesData.find(cat => cat.name === categoryName)
      
      if (!categoryObj) return

      // Get subcategory ID from API
      const subcatResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/categories/${categoryObj.id}/subcategories/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })

      if (subcatResponse.ok) {
        const subcatData = await subcatResponse.json()
        const subcategoryObj = subcatData.find(subcat => subcat.name === productData.selectedSubcategory)
        
        if (subcategoryObj) {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/subbrands/${subcategoryObj.id}/`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            credentials: 'omit',
          })

          if (response.ok) {
            const data = await response.json()
            setSubBrandsData(data)
            setSubBrands(data.map(subBrand => subBrand.name))
          }
        }
      }
      
    } catch (error) {
      console.error('Error fetching sub-brands:', error)
      setSubBrandsError(error.message)
      setSubBrands([])
    } finally {
      setSubBrandsLoading(false)
    }
  }

  const createSubBrand = async (subBrandName, imageFile = null) => {
    try {
      const token = localStorage.getItem('access_token')
      const categoryName = categories[productData.selectedCategory]
      const categoryObj = categoriesData.find(cat => cat.name === categoryName)
      
      // Get subcategory ID
      const subcatResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/categories/${categoryObj.id}/subcategories/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })

      if (subcatResponse.ok) {
        const subcatData = await subcatResponse.json()
        const subcategoryObj = subcatData.find(subcat => subcat.name === productData.selectedSubcategory)
        
        if (subcategoryObj) {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/subbrands/create/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            credentials: 'omit',
            body: (() => {
              const formData = new FormData()
              formData.append('name', subBrandName)
              formData.append('category', categoryObj.id)
              formData.append('subcategory', subcategoryObj.id)
              if (imageFile) {
                formData.append('image', imageFile)
              }
              return formData
            })()
          })

          if (response.ok) {
            await fetchSubBrands()
            toast({
              title: "Success",
              description: `Sub-brand "${subBrandName}" created successfully.`,
            })
            return true
          }
        }
      }
      return false
      
    } catch (error) {
      console.error('Error creating sub-brand:', error)
      toast({
        title: "Error",
        description: "Failed to create sub-brand",
        variant: "destructive",
      })
      return false
    }
  }

  const updateSubBrand = async (subBrandId, newName, imageFile = null) => {
    try {
      const token = localStorage.getItem('access_token')
      
      const formData = new FormData()
      formData.append('name', newName)
      if (imageFile !== null) {
        formData.append('image', imageFile)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/subbrands/update/${subBrandId}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'omit',
        body: formData
      })

      if (response.ok) {
        await fetchSubBrands()
        toast({
          title: "Success",
          description: `Sub-brand updated successfully.`,
        })
        return true
      }
      return false
      
    } catch (error) {
      console.error('Error updating sub-brand:', error)
      toast({
        title: "Error",
        description: "Failed to update sub-brand",
        variant: "destructive",
      })
      return false
    }
  }

  const deleteSubBrand = async (subBrandId) => {
    try {
      const token = localStorage.getItem('access_token')

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/subbrands/delete/${subBrandId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })

      if (response.ok) {
        await fetchSubBrands()
        toast({
          title: "Success",
          description: "Sub-brand deleted successfully.",
        })
        return true
      }
      return false
      
    } catch (error) {
      console.error('Error deleting sub-brand:', error)
      toast({
        title: "Error",
        description: "Failed to delete sub-brand",
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
        await createSubBrand(trimmedValue, imageFile)
      } else if (type === "edit") {
        const subBrandObj = subBrandsData.find(subBrand => subBrand.name === subBrands[editIndex])
        if (subBrandObj) {
          await updateSubBrand(subBrandObj.id, trimmedValue, imageFile)
        }
      } else if (type === "delete") {
        const subBrandObj = subBrandsData.find(subBrand => subBrand.name === subBrands[editIndex])
        if (subBrandObj) {
          await deleteSubBrand(subBrandObj.id)
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
      const subBrandObj = subBrandsData.find(subBrand => subBrand.name === subBrands[index])
      imagePreview = subBrandObj?.image
        ? (subBrandObj.image.startsWith('http')
            ? subBrandObj.image
            : `${process.env.NEXT_PUBLIC_API_BASE_URL}${subBrandObj.image}`)
        : ""
    }
    setModalState({ open: true, type, value, imageFile: null, imagePreview, editIndex: index, isLoading: false })
  }

  const closeModal = () => {
    setModalState({ open: false, type: "", value: "", imageFile: null, imagePreview: "", editIndex: -1, isLoading: false })
  }

  const handleSubBrandSelect = (subBrand) => {
    // Find the sub-brand ID from subBrandsData
    const subBrandObj = subBrandsData.find(sb => sb.name === subBrand)
    
    // If changing sub-brand, clear subsequent data
    if (productData.selectedSubBrand !== subBrand) {
      updateProductData({ 
        selectedSubBrand: subBrand,
        selectedSubBrandId: subBrandObj?.id || null,
        // Clear subsequent selections
        selectedModel: null,
        selectedModelId: null,
      })
    } else {
      updateProductData({ 
        selectedSubBrand: subBrand,
        selectedSubBrandId: subBrandObj?.id || null
      })
    }
    setTimeout(() => nextStep(), 300)
  }

  const filteredSubBrands = subBrands.filter((sb) => 
    sb.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Sub-brand</h2>
          <p className="text-sm text-muted-foreground">
            Brand: <span className="font-medium text-foreground">{productData.selectedBrand}</span>
            {productData.selectedSubcategory && (
              <span> | Subcategory: <span className="font-medium text-foreground">{productData.selectedSubcategory}</span></span>
            )}
          </p>
          {subBrandsLoading && (
            <p className="text-xs text-muted-foreground">Loading sub-brands...</p>
          )}
          {subBrandsError && (
            <p className="text-xs text-red-500">Error: {subBrandsError}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            className="w-full max-w-xs rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search sub-brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button size="sm" onClick={() => openModal("add")}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {filteredSubBrands.map((subBrand, idx) => {
          const isActive = productData.selectedSubBrand === subBrand
          return (
            <Card
              key={subBrand}
              role="button"
              tabIndex={0}
              onClick={() => handleSubBrandSelect(subBrand)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  handleSubBrandSelect(subBrand)
                }
              }}
              className={`cursor-pointer hover:shadow-sm transition ${
                isActive ? "border-2 border-primary" : ""
              }`}
            >
              <CardHeader className="py-2 px-3">
                <div className="flex flex-col items-center text-center space-y-2">
                  {(() => {
                    const subBrandObj = subBrandsData.find(sb => sb.name === subBrand)
                    return subBrandObj?.image ? (
                      <img 
                        src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${subBrandObj.image}`}
                        alt={subBrand}
                        className="w-8 h-8 object-contain rounded"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                        <Image className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )
                  })()}
                  <CardTitle className="text-xs leading-tight">{subBrand}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5"
                      tabIndex={-1}
                      onClick={(e) => {
                        e.stopPropagation()
                        openModal("edit", subBrand, idx)
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
                        openModal("delete", subBrand, idx)
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
        <div className="text-xs text-muted-foreground">Click on a sub-brand to continue</div>
      </div>

      <OverlayModal
        open={modalState.open}
        title={
          modalState.type === "add"
            ? "Add Sub-brand"
            : modalState.type === "edit"
              ? "Edit Sub-brand"
              : "Delete Sub-brand"
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
            : "Enter sub-brand name"
        }
        isDeleteMode={modalState.type === "delete"}
        isLoading={modalState.isLoading}
      />
    </div>
  )
}