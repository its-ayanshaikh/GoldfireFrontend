"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2 } from "lucide-react"
import { useToast } from "../../../hooks/use-toast"
import OverlayModal from "./OverlayModal"

export default function SubcategorySelection({ 
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
  const [subcategories, setSubcategories] = useState([])
  const [subcategoriesData, setSubcategoriesData] = useState([])
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false)
  const [subcategoriesError, setSubcategoriesError] = useState(null)
  
  const [modalState, setModalState] = useState({
    open: false,
    type: "",
    value: "",
    editIndex: -1,
    isLoading: false,
  })

  const categoryName = productData.selectedCategory !== null ? categories[productData.selectedCategory] : null

  // Fetch subcategories from API when category changes
  useEffect(() => {
    if (productData.selectedCategory !== null && categories.length > 0 && categoriesData.length > 0) {
      fetchSubcategories(categoryName)
    }
  }, [productData.selectedCategory, categories, categoriesData])

  const fetchSubcategories = async (categoryName) => {
    try {
      const token = localStorage.getItem('access_token')
      setSubcategoriesLoading(true)
      setSubcategoriesError(null)

      const categoryObj = categoriesData.find(cat => cat.name === categoryName)
      
      if (categoryObj) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/categories/${categoryObj.id}/subcategories/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'omit',
        })

        if (response.ok) {
          const data = await response.json()
          setSubcategoriesData(data)
          setSubcategories(data.map(subcat => subcat.name))
        } else {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
      }
      
    } catch (error) {
      console.error('Error fetching subcategories:', error)
      setSubcategoriesError(error.message)
      setSubcategories([])
    } finally {
      setSubcategoriesLoading(false)
    }
  }

  const createSubcategory = async (categoryName, subcategoryName) => {
    try {
      const token = localStorage.getItem('access_token')
      const categoryObj = categoriesData.find(cat => cat.name === categoryName)
      
      if (categoryObj) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/subcategories/create/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'omit',
          body: JSON.stringify({
            name: subcategoryName,
            category: categoryObj.id
          })
        })

        if (response.ok) {
          await fetchSubcategories(categoryName)
          toast({
            title: "Success",
            description: `Subcategory "${subcategoryName}" created successfully.`,
          })
          return true
        }
      }
      return false
      
    } catch (error) {
      console.error('Error creating subcategory:', error)
      toast({
        title: "Error",
        description: "Failed to create subcategory",
        variant: "destructive",
      })
      return false
    }
  }

  const updateSubcategory = async (oldName, newName) => {
    try {
      const token = localStorage.getItem('access_token')
      const subcategoryObj = subcategoriesData.find(subcat => subcat.name === oldName)
      
      if (subcategoryObj) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/subcategories/${subcategoryObj.id}/update/`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'omit',
          body: JSON.stringify({ name: newName })
        })

        if (response.ok) {
          await fetchSubcategories(categoryName)
          toast({
            title: "Success",
            description: `Subcategory updated successfully.`,
          })
          return true
        }
      }
      return false
      
    } catch (error) {
      console.error('Error updating subcategory:', error)
      toast({
        title: "Error",
        description: "Failed to update subcategory",
        variant: "destructive",
      })
      return false
    }
  }

  const deleteSubcategory = async (subcategoryName) => {
    try {
      const token = localStorage.getItem('access_token')
      const subcategoryObj = subcategoriesData.find(subcat => subcat.name === subcategoryName)
      
      if (subcategoryObj) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/subcategories/${subcategoryObj.id}/delete/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'omit'
        })

        if (response.ok) {
          await fetchSubcategories(categoryName)
          toast({
            title: "Success",
            description: `Subcategory deleted successfully.`,
          })
          return true
        }
      }
      return false
      
    } catch (error) {
      console.error('Error deleting subcategory:', error)
      toast({
        title: "Error",
        description: "Failed to delete subcategory",
        variant: "destructive",
      })
      return false
    }
  }

  const handleModalSave = async () => {
    const { type, value, editIndex } = modalState
    const trimmedValue = value.trim()

    if (!trimmedValue && type !== "delete") return

    setModalState(prev => ({ ...prev, isLoading: true }))

    try {
      if (type === "add") {
        await createSubcategory(categoryName, trimmedValue)
      } else if (type === "edit") {
        const oldName = subcategories[editIndex]
        await updateSubcategory(oldName, trimmedValue)
      } else if (type === "delete") {
        const subcategoryName = subcategories[editIndex]
        await deleteSubcategory(subcategoryName)
      }
      closeModal()
    } catch (error) {
      console.error('Modal save error:', error)
    } finally {
      setModalState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const openModal = (type, value = "", index = -1) => {
    setModalState({ open: true, type, value, editIndex: index, isLoading: false })
  }

  const closeModal = () => {
    setModalState({ open: false, type: "", value: "", editIndex: -1, isLoading: false })
  }

  const handleSubcategorySelect = (subcategory) => {
    // Find the subcategory ID from subcategoriesData
    const subcategoryObj = subcategoriesData.find(subcat => subcat.name === subcategory)
    
    // If changing subcategory, clear subsequent data
    if (productData.selectedSubcategory !== subcategory) {
      updateProductData({ 
        selectedSubcategory: subcategory,
        selectedSubcategoryId: subcategoryObj?.id || null,
        // Clear subsequent selections
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
      })
    } else {
      updateProductData({ 
        selectedSubcategory: subcategory,
        selectedSubcategoryId: subcategoryObj?.id || null
      })
    }
    setTimeout(() => nextStep(), 300)
  }

  const filteredSubs = subcategories.filter((s) => 
    s.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Subcategory</h2>
          <p className="text-sm text-muted-foreground">
            Category: <span className="font-medium text-foreground">{categoryName}</span>
          </p>
          {subcategoriesLoading && (
            <p className="text-xs text-muted-foreground">Loading subcategories...</p>
          )}
          {subcategoriesError && (
            <p className="text-xs text-red-500">Error: {subcategoriesError}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            className="w-full max-w-xs rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search subcategory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button size="sm" onClick={() => openModal("add")}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {filteredSubs.map((sub, idx) => {
          const isActive = productData.selectedSubcategory === sub
          return (
            <Card
              key={sub}
              role="button"
              tabIndex={0}
              onClick={() => handleSubcategorySelect(sub)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  handleSubcategorySelect(sub)
                }
              }}
              className={`cursor-pointer hover:shadow-sm transition ${
                isActive ? "border-2 border-primary" : ""
              }`}
            >
              <CardHeader className="py-2 px-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm flex-1">{sub}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      tabIndex={-1}
                      onClick={(e) => {
                        e.stopPropagation()
                        openModal("edit", sub, idx)
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 hover:bg-destructive/10"
                      tabIndex={-1}
                      onClick={(e) => {
                        e.stopPropagation()
                        openModal("delete", sub, idx)
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
        <div className="text-xs text-muted-foreground">Click on a subcategory to continue</div>
      </div>

      <OverlayModal
        open={modalState.open}
        title={
          modalState.type === "add"
            ? "Add Subcategory"
            : modalState.type === "edit"
              ? "Edit Subcategory"
              : "Delete Subcategory"
        }
        value={modalState.value}
        onChange={(val) => setModalState(prev => ({ ...prev, value: val }))}
        onClose={closeModal}
        onSave={handleModalSave}
        placeholder={
          modalState.type === "delete"
            ? `Are you sure you want to delete "${modalState.value}"?`
            : "Enter subcategory name"
        }
        isDeleteMode={modalState.type === "delete"}
        isLoading={modalState.isLoading}
      />
    </div>
  )
}