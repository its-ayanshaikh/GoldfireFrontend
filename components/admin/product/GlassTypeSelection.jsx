"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { Plus, Edit, Trash2, Search } from "lucide-react"
import { useToast } from "../../../hooks/use-toast"
import OverlayModal from "./OverlayModal"

export default function GlassTypeSelection({ 
  productData, 
  updateProductData, 
  nextStep, 
  categories,
  categoriesData
}) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [glassTypes, setGlassTypes] = useState([])
  const [glassTypesData, setGlassTypesData] = useState([])
  const [glassTypesLoading, setGlassTypesLoading] = useState(false)
  
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

  // Fetch glass types from API when category changes
  useEffect(() => {
    if (categoryId) {
      fetchGlassTypes(categoryId)
    }
  }, [categoryId])

  const fetchGlassTypes = async (catId) => {
    try {
      setGlassTypesLoading(true)
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'
      const token = localStorage.getItem('access_token')
      
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
      setGlassTypesData(data)
      setGlassTypes(data.map(type => type.name))
      
    } catch (error) {
      console.error('Error fetching glass types:', error)
      setGlassTypesData([])
      setGlassTypes([])
    } finally {
      setGlassTypesLoading(false)
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
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        
        const newGlassType = await response.json()
        setGlassTypesData(prev => [...prev, newGlassType])
        setGlassTypes(prev => [...prev, newGlassType.name])
        toast({ title: "Success", description: `Glass type "${trimmedValue}" added.` })
        setTimeout(() => fetchGlassTypes(categoryId), 500)
        
      } else if (type === "edit") {
        const glassTypeToEdit = glassTypesData[editIndex]
        const response = await fetch(`${baseUrl}/api/product/type/update/${glassTypeToEdit.id}/`, {
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
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        
        const updatedGlassType = await response.json()
        setGlassTypesData(prev => prev.map((t, i) => i === editIndex ? updatedGlassType : t))
        setGlassTypes(prev => prev.map((t, i) => i === editIndex ? updatedGlassType.name : t))
        toast({ title: "Success", description: "Glass type updated." })
        setTimeout(() => fetchGlassTypes(categoryId), 500)
        
      } else if (type === "delete") {
        const glassTypeToDelete = glassTypesData[editIndex]
        const response = await fetch(`${baseUrl}/api/product/type/delete/${glassTypeToDelete.id}/`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        })
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        
        setGlassTypesData(prev => prev.filter((_, i) => i !== editIndex))
        setGlassTypes(prev => prev.filter((_, i) => i !== editIndex))
        toast({ title: "Success", description: "Glass type deleted." })
      }
      closeModal()
    } catch (error) {
      console.error('Modal save error:', error)
      toast({ 
        title: "Error", 
        description: `Failed to ${type} glass type. Please try again.`,
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

  const handleGlassTypeSelect = (glassType) => {
    const typeObj = glassTypesData.find(t => t.name === glassType)
    updateProductData({ 
      selectedGlassType: glassType,
      selectedGlassTypeId: typeObj?.id || null
    })
    setTimeout(() => nextStep(), 300)
  }

  const filteredGlassTypes = glassTypes.filter((t) => 
    t.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Loading state
  if (glassTypesLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Glass Type</h2>
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
          <p className="text-muted-foreground">Loading glass types from API...</p>
        </div>
      </div>
    )
  }


  // Main render - includes modal for both empty and non-empty states
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Glass Type</h2>
          <p className="text-sm text-muted-foreground">
            Category: <span className="font-medium text-foreground">{categoryName}</span>
            {productData.selectedSubcategory && (
              <span> • Subcategory: <span className="font-medium text-foreground">{productData.selectedSubcategory}</span></span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {glassTypes.length > 0 && (
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
                placeholder="Search glass type..."
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
      {glassTypes.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl font-normal text-muted-foreground tracking-tight mb-4">
            <Plus className="h-12 w-12 mx-auto text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-2">No glass types found</p>
          <p className="text-sm text-muted-foreground mb-4">
            Add the first glass type for {categoryName}
          </p>
          <Button onClick={() => openModal("add")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Glass Type
          </Button>
        </div>
      ) : (
        <>
          {/* Glass Types Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredGlassTypes.map((type, idx) => {
              const isActive = productData.selectedGlassType === type
              return (
                <Card
                  key={type}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleGlassTypeSelect(type)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      handleGlassTypeSelect(type)
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
            <div className="text-xs text-muted-foreground">Click on a glass type to continue</div>
          </div>
        </>
      )}

      {/* Modal - Always rendered */}
      <OverlayModal
        open={modalState.open}
        title={
          modalState.type === "add"
            ? "Add Glass Type"
            : modalState.type === "edit"
              ? "Edit Glass Type"
              : "Delete Glass Type"
        }
        value={modalState.value}
        onChange={(val) => setModalState(prev => ({ ...prev, value: val }))}
        onClose={closeModal}
        onSave={handleModalSave}
        placeholder={
          modalState.type === "delete"
            ? `Are you sure you want to delete "${modalState.value}"?`
            : "Enter glass type name"
        }
        isDeleteMode={modalState.type === "delete"}
        isLoading={modalState.isLoading}
      />
    </div>
  )
}
