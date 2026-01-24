"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { Plus, Edit, Trash2, Search } from "lucide-react"
import { useToast } from "../../../hooks/use-toast"
import OverlayModal from "./OverlayModal"

export default function TypeSelection({ 
  productData, 
  updateProductData, 
  nextStep, 
  categories,
  categoriesData
}) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [types, setTypes] = useState([])
  const [typesData, setTypesData] = useState([])
  const [typesLoading, setTypesLoading] = useState(false)
  
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

  // Fetch types from API when category changes
  useEffect(() => {
    if (categoryId) {
      fetchTypes(categoryId)
    }
  }, [categoryId])

  const fetchTypes = async (catId) => {
    try {
      setTypesLoading(true)
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'
      const token = localStorage.getItem('access_token')
      
      console.log('🔥 Fetching types from Django API...')
      console.log('Category ID:', catId)
      console.log('Full API URL:', `${baseUrl}/api/product/type/list/${catId}/`)
      console.log('Token exists:', !!token)
      
      const response = await fetch(`${baseUrl}/api/product/type/list/${catId}/`, {
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
      console.log('✅ Types API Response:', data)
      console.log('📊 Total types fetched:', data.length)
      
      // API returns array of objects with id, name, category, category_name
      setTypesData(data)
      setTypes(data.map(type => type.name))
      
    } catch (error) {
      console.error('❌ Error fetching types from Django API:', error)
      // Set empty arrays if API fails
      setTypesData([])
      setTypes([])
    } finally {
      setTypesLoading(false)
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
        console.log('🔥 Creating new type:', trimmedValue)
        
        const response = await fetch(`${baseUrl}/api/product/type/create/`, {
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
        
        const newType = await response.json()
        console.log('✅ Type created:', newType)
        
        setTypesData(prev => [...prev, newType])
        setTypes(prev => [...prev, newType.name])
        toast({ title: "Success", description: `Type "${trimmedValue}" added.` })
        
        // Refresh types list
        setTimeout(() => fetchTypes(categoryId), 500)
        
      } else if (type === "edit") {
        const typeToEdit = typesData[editIndex]
        console.log('🔥 Updating type:', typeToEdit.id, trimmedValue)
        
        const response = await fetch(`${baseUrl}/api/product/type/update/${typeToEdit.id}/`, {
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
        
        const updatedType = await response.json()
        console.log('✅ Type updated:', updatedType)
        
        setTypesData(prev => prev.map((t, i) => i === editIndex ? updatedType : t))
        setTypes(prev => prev.map((t, i) => i === editIndex ? updatedType.name : t))
        toast({ title: "Success", description: "Type updated." })
        
        // Refresh types list
        setTimeout(() => fetchTypes(categoryId), 500)
        
      } else if (type === "delete") {
        const typeToDelete = typesData[editIndex]
        console.log('🔥 Deleting type:', typeToDelete.id)
        
        const response = await fetch(`${baseUrl}/api/product/type/delete/${typeToDelete.id}/`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        console.log('✅ Type deleted')
        
        setTypesData(prev => prev.filter((_, i) => i !== editIndex))
        setTypes(prev => prev.filter((_, i) => i !== editIndex))
        toast({ title: "Success", description: "Type deleted." })
      }
      closeModal()
    } catch (error) {
      console.error('❌ Modal save error:', error)
      toast({ 
        title: "Error", 
        description: `Failed to ${type} type. Please try again.`,
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

  const handleTypeSelect = (type) => {
    const typeObj = typesData.find(t => t.name === type)
    updateProductData({ 
      selectedType: type,
      selectedTypeId: typeObj?.id || null
    })
    setTimeout(() => nextStep(), 300)
  }

  const filteredTypes = types.filter((t) => 
    t.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Loading state
  if (typesLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Type</h2>
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
          <p className="text-muted-foreground">Loading types from API...</p>
        </div>
      </div>
    )
  }

  // No types found
  if (types.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Type</h2>
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
            <p className="text-muted-foreground mb-2">No types found</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add the first type for {categoryName}
            </p>
            <Button onClick={() => openModal("add")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Type
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Type</h2>
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
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
              placeholder="Search type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={() => openModal("add")}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filteredTypes.map((type, idx) => {
          const isActive = productData.selectedType === type
          return (
            <Card
              key={type}
              role="button"
              tabIndex={0}
              onClick={() => handleTypeSelect(type)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  handleTypeSelect(type)
                }
              }}
              className={`cursor-pointer hover:shadow-sm transition ${
                isActive ? "border-2 border-primary" : ""
              }`}
            >
              <CardHeader className="py-2 px-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm flex-1">{type}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      tabIndex={-1}
                      onClick={(e) => {
                        e.stopPropagation()
                        openModal("edit", type, idx)
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
                        openModal("delete", type, idx)
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
        <div className="text-xs text-muted-foreground">Click on a type to continue</div>
      </div>

      <OverlayModal
        open={modalState.open}
        title={
          modalState.type === "add"
            ? "Add Type"
            : modalState.type === "edit"
              ? "Edit Type"
              : "Delete Type"
        }
        value={modalState.value}
        onChange={(val) => setModalState(prev => ({ ...prev, value: val }))}
        onClose={closeModal}
        onSave={handleModalSave}
        placeholder={
          modalState.type === "delete"
            ? `Are you sure you want to delete "${modalState.value}"?`
            : "Enter type name"
        }
        isDeleteMode={modalState.type === "delete"}
        isLoading={modalState.isLoading}
      />
    </div>
  )
}
