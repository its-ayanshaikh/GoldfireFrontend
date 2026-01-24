"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { Plus, Edit, Trash2, Search } from "lucide-react"
import { useToast } from "../../../hooks/use-toast"
import OverlayModal from "./OverlayModal"

export default function SubcategorySelection({ 
  productData, 
  updateProductData, 
  nextStep, 
  categories,
  categoriesData
}) {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [subcategories, setSubcategories] = useState([])
  const [subcategoriesData, setSubcategoriesData] = useState([])
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false)
  
  const [modalState, setModalState] = useState({
    open: false,
    type: "",
    value: "",
    editIndex: -1,
    isLoading: false,
  })

  const categoryName = productData.selectedCategory !== null ? categories[productData.selectedCategory] : null
  const categoryId = productData.selectedCategory !== null && categoriesData.length > 0 
    ? categoriesData[productData.selectedCategory]?.id 
    : null

  // Update URL when category is selected (only once when categoryId changes)
  useEffect(() => {
    if (categoryId) {
      const params = new URLSearchParams(window.location.search)
      const currentCategoryId = params.get('category_id')
      
      // Only update if different
      if (currentCategoryId !== categoryId.toString()) {
        params.set('category_id', categoryId.toString())
        router.push(`?${params.toString()}`, { scroll: false })
      }
    }
  }, [categoryId, router])

  // Fetch subcategories from API when category changes
  useEffect(() => {
    if (categoryId) {
      fetchSubcategories(categoryId)
    }
  }, [categoryId])

  const fetchSubcategories = async (catId) => {
    try {
      setSubcategoriesLoading(true)
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'
      const token = localStorage.getItem('access_token')
      
      console.log('🔥 Fetching subcategories from Django API...')
      console.log('Category ID:', catId)
      console.log('Full API URL:', `${baseUrl}/api/product/categories/${catId}/subcategories/`)
      console.log('Token exists:', !!token)
      
      const response = await fetch(`${baseUrl}/api/product/categories/${catId}/subcategories/`, {
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
      console.log('✅ Subcategories API Response:', data)
      console.log('📊 Total subcategories fetched:', data.length)
      
      // API returns array of objects with id, name, category, category_name
      setSubcategoriesData(data)
      setSubcategories(data.map(subcat => subcat.name))
      
    } catch (error) {
      console.error('❌ Error fetching subcategories from Django API:', error)
      // Set empty arrays if API fails
      setSubcategoriesData([])
      setSubcategories([])
    } finally {
      setSubcategoriesLoading(false)
    }
  }

  const handleModalSave = async () => {
    const { type, value, editIndex } = modalState
    const trimmedValue = value.trim()

    if (!trimmedValue && type !== "delete") return

    setModalState(prev => ({ ...prev, isLoading: true }))

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'
      const token = localStorage.getItem('access_token')
      
      if (type === "add") {
        console.log('🔥 Creating new subcategory:', trimmedValue)
        
        const response = await fetch(`${baseUrl}/api/product/subcategories/create/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({
            name: trimmedValue,
            category: categoryId
          })
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const newSubcat = await response.json()
        console.log('✅ Subcategory created:', newSubcat)
        
        setSubcategoriesData(prev => [...prev, newSubcat])
        setSubcategories(prev => [...prev, newSubcat.name])
        toast({ title: "Success", description: `Subcategory "${trimmedValue}" added.` })
        
        // Refresh subcategories list
        setTimeout(() => fetchSubcategories(categoryId), 500)
        
      } else if (type === "edit") {
        const subcatToEdit = subcategoriesData[editIndex]
        console.log('🔥 Updating subcategory:', subcatToEdit.id, trimmedValue)
        
        const response = await fetch(`${baseUrl}/api/product/subcategories/${subcatToEdit.id}/update/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({
            name: trimmedValue,
            category: categoryId
          })
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const updatedSubcat = await response.json()
        console.log('✅ Subcategory updated:', updatedSubcat)
        
        setSubcategoriesData(prev => prev.map((s, i) => i === editIndex ? updatedSubcat : s))
        setSubcategories(prev => prev.map((s, i) => i === editIndex ? updatedSubcat.name : s))
        toast({ title: "Success", description: "Subcategory updated." })
        
        // Refresh subcategories list
        setTimeout(() => fetchSubcategories(categoryId), 500)
        
      } else if (type === "delete") {
        const subcatToDelete = subcategoriesData[editIndex]
        console.log('🔥 Deleting subcategory:', subcatToDelete.id)
        
        const response = await fetch(`${baseUrl}/api/product/subcategories/${subcatToDelete.id}/delete/`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        console.log('✅ Subcategory deleted')
        
        setSubcategoriesData(prev => prev.filter((_, i) => i !== editIndex))
        setSubcategories(prev => prev.filter((_, i) => i !== editIndex))
        toast({ title: "Success", description: "Subcategory deleted." })
      }
      closeModal()
    } catch (error) {
      console.error('❌ Modal save error:', error)
      toast({ 
        title: "Error", 
        description: `Failed to ${type} subcategory. Please try again.`,
        variant: "destructive"
      })
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
    const subcategoryObj = subcategoriesData.find(subcat => subcat.name === subcategory)
    
    if (productData.selectedSubcategory !== subcategory) {
      updateProductData({ 
        selectedSubcategory: subcategory,
        selectedSubcategoryId: subcategoryObj?.id || null,
        selectedBrand: null,
        selectedBrandId: null,
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

  // Loading state
  if (subcategoriesLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Subcategory</h2>
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
          <p className="text-muted-foreground">Loading subcategories from API...</p>
        </div>
      </div>
    )
  }

  // No subcategories found
  if (subcategories.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Subcategory</h2>
            <p className="text-sm text-muted-foreground">
              Category: <span className="font-medium text-foreground">{categoryName}</span>
            </p>
          </div>
          <Button size="sm" onClick={() => openModal("add")}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
        <Card className="p-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-accent rounded-full">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <p className="text-muted-foreground mb-2">No subcategories found</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add the first subcategory for {categoryName}
            </p>
            <Button onClick={() => openModal("add")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Subcategory
            </Button>
          </div>
        </Card>

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Subcategory</h2>
          <p className="text-sm text-muted-foreground">
            Category: <span className="font-medium text-foreground">{categoryName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
              placeholder="Search subcategory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
