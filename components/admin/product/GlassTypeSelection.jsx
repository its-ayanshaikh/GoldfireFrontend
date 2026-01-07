"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2 } from "lucide-react"
import { useToast } from "../../../hooks/use-toast"
import OverlayModal from "./OverlayModal"

export default function GlassTypeSelection({ 
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
  const [types, setTypes] = useState([])
  const [typesData, setTypesData] = useState([])
  const [typesLoading, setTypesLoading] = useState(false)
  const [typesError, setTypesError] = useState(null)
  
  const [modalState, setModalState] = useState({
    open: false,
    type: "",
    value: "",
    editIndex: -1,
    isLoading: false,
  })

  const categoryName = productData.selectedCategory !== null ? categories[productData.selectedCategory] : null

  // Fetch types when category changes
  useEffect(() => {
    if (productData.selectedCategory !== null && categories.length > 0 && categoriesData.length > 0) {
      fetchTypes()
    }
  }, [productData.selectedCategory, categories, categoriesData])

  const fetchTypes = async () => {
    try {
      const token = localStorage.getItem('access_token')
      setTypesLoading(true)
      setTypesError(null)

      const categoryObj = categoriesData.find(cat => cat.name === categoryName)
      if (!categoryObj) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/type/list/${categoryObj.id}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })

      if (response.ok) {
        const data = await response.json()
        setTypesData(data)
        setTypes(data.map(type => type.name))
      } else {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
    } catch (error) {
      console.error('Error fetching types:', error)
      setTypesError(error.message)
      setTypes([])
    } finally {
      setTypesLoading(false)
    }
  }

  const createType = async (typeName) => {
    try {
      const token = localStorage.getItem('access_token')
      const categoryObj = categoriesData.find(cat => cat.name === categoryName)
      
      if (categoryObj) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/type/create/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'omit',
          body: JSON.stringify({
            name: typeName,
            category: categoryObj.id
          })
        })

        if (response.ok) {
          await fetchTypes()
          toast({
            title: "Success",
            description: `Glass type "${typeName}" created successfully.`,
          })
          return true
        }
      }
      return false
      
    } catch (error) {
      console.error('Error creating type:', error)
      toast({
        title: "Error",
        description: "Failed to create glass type",
        variant: "destructive",
      })
      return false
    }
  }

  const updateType = async (typeId, newName) => {
    try {
      const token = localStorage.getItem('access_token')

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/type/update/${typeId}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
        body: JSON.stringify({ name: newName })
      })

      if (response.ok) {
        await fetchTypes()
        toast({
          title: "Success",
          description: `Glass type updated successfully.`,
        })
        return true
      }
      return false
      
    } catch (error) {
      console.error('Error updating type:', error)
      toast({
        title: "Error",
        description: "Failed to update glass type",
        variant: "destructive",
      })
      return false
    }
  }

  const deleteType = async (typeId) => {
    try {
      const token = localStorage.getItem('access_token')

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/type/delete/${typeId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })

      if (response.ok) {
        await fetchTypes()
        toast({
          title: "Success",
          description: "Glass type deleted successfully.",
        })
        return true
      }
      return false
      
    } catch (error) {
      console.error('Error deleting type:', error)
      toast({
        title: "Error",
        description: "Failed to delete glass type",
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
        await createType(trimmedValue)
      } else if (type === "edit") {
        const typeObj = typesData.find(t => t.name === types[editIndex])
        if (typeObj) {
          await updateType(typeObj.id, trimmedValue)
        }
      } else if (type === "delete") {
        const typeObj = typesData.find(t => t.name === types[editIndex])
        if (typeObj) {
          await deleteType(typeObj.id)
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
    setModalState({ open: true, type, value, editIndex: index, isLoading: false })
  }

  const closeModal = () => {
    setModalState({ open: false, type: "", value: "", editIndex: -1, isLoading: false })
  }

  const handleGlassTypeSelect = (glassType) => {
    // Find the glass type ID from typesData
    const typeObj = typesData.find(t => t.name === glassType)
    updateProductData({ 
      selectedGlassType: glassType,
      selectedGlassTypeId: typeObj?.id || null
    })
    setTimeout(() => nextStep(), 300)
  }

  const filteredTypes = types.filter((t) => 
    t.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Glass Type</h2>
          <p className="text-sm text-muted-foreground">
            Category: <span className="font-medium text-foreground">{categoryName}</span>
            {productData.selectedBrand && (
              <span> | Brand: <span className="font-medium text-foreground">{productData.selectedBrand}</span></span>
            )}
          </p>
          {typesLoading && (
            <p className="text-xs text-muted-foreground">Loading types...</p>
          )}
          {typesError && (
            <p className="text-xs text-red-500">Error: {typesError}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            className="w-full max-w-xs rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search glass type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button size="sm" onClick={() => openModal("add")}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filteredTypes.map((type, idx) => {
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