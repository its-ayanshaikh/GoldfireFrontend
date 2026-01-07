"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2 } from "lucide-react"
import { useToast } from "../../../hooks/use-toast"
import OverlayModal from "./OverlayModal"

export default function ModelSelection({
  productData,
  updateProductData,
  nextStep,
  prevStep,
  editMode
}) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [models, setModels] = useState([])
  const [modelsData, setModelsData] = useState([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsError, setModelsError] = useState(null)

  const [modalState, setModalState] = useState({
    open: false,
    type: "",
    value: "",
    editIndex: -1,
    isLoading: false,
  })

  // Fetch models when sub-brand changes
  useEffect(() => {
    if (productData.selectedSubBrandId) {
      fetchModels(productData.selectedSubBrandId)
    }
  }, [productData.selectedSubBrandId])

  const fetchModels = async (subBrandId) => {
    try {
      const token = localStorage.getItem('access_token')
      setModelsLoading(true)
      setModelsError(null)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/models/${subBrandId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })

      if (response.ok) {
        const data = await response.json()
        setModelsData(data)
        setModels(data.map(model => model.name))
      } else {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

    } catch (error) {
      console.error('Error fetching models:', error)
      setModelsError(error.message)
      setModels([])
    } finally {
      setModelsLoading(false)
    }
  }

  const createModel = async (modelName) => {
    try {
      const token = localStorage.getItem('access_token')

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/models/create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
        body: JSON.stringify({
          name: modelName,
          subbrand: productData.selectedSubBrandId
        })
      })

      if (response.ok) {
        await fetchModels(productData.selectedSubBrandId)
        toast({
          title: "Success",
          description: `Model "${modelName}" created successfully.`,
        })
        return true
      } else {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

    } catch (error) {
      console.error('Error creating model:', error)
      toast({
        title: "Error",
        description: "Failed to create model",
        variant: "destructive",
      })
      return false
    }
  }

  const updateModel = async (modelId, newName) => {
    try {
      const token = localStorage.getItem('access_token')

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/models/${modelId}/update/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
        body: JSON.stringify({ name: newName })
      })

      if (response.ok) {
        await fetchModels(productData.selectedSubBrandId)
        toast({
          title: "Success",
          description: `Model updated successfully.`,
        })
        return true
      } else {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

    } catch (error) {
      console.error('Error updating model:', error)
      toast({
        title: "Error",
        description: "Failed to update model",
        variant: "destructive",
      })
      return false
    }
  }

  const deleteModel = async (modelId) => {
    try {
      const token = localStorage.getItem('access_token')

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/models/${modelId}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })

      if (response.ok) {
        await fetchModels(productData.selectedSubBrandId)
        toast({
          title: "Success",
          description: "Model deleted successfully.",
        })
        return true
      } else {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

    } catch (error) {
      console.error('Error deleting model:', error)
      toast({
        title: "Error",
        description: "Failed to delete model",
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
        await createModel(trimmedValue)
      } else if (type === "edit") {
        const modelObj = modelsData.find(model => model.name === models[editIndex])
        if (modelObj) {
          await updateModel(modelObj.id, trimmedValue)
        }
      } else if (type === "delete") {
        const modelObj = modelsData.find(model => model.name === models[editIndex])
        if (modelObj) {
          await deleteModel(modelObj.id)
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

  const handleModelSelect = (model) => {
    // Find the model ID from modelsData
    const modelObj = modelsData.find(m => m.name === model)
    updateProductData({ 
      selectedModel: model,
      selectedModelId: modelObj?.id || null
    })
    setTimeout(() => nextStep(), 300)
  }

  const filteredModels = models.filter((m) =>
    m.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Model</h2>
          <p className="text-sm text-muted-foreground">
            Brand: <span className="font-medium text-foreground">{productData.selectedBrand}</span>
            {productData.selectedSubBrand && (
              <span> | Sub-brand: <span className="font-medium text-foreground">{productData.selectedSubBrand}</span></span>
            )}
          </p>
          {modelsLoading && (
            <p className="text-xs text-muted-foreground">Loading models...</p>
          )}
          {modelsError && (
            <p className="text-xs text-red-500">Error: {modelsError}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            className="w-full max-w-xs rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button size="sm" onClick={() => openModal("add")}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {filteredModels.map((model, idx) => {
          const isActive = productData.selectedModel === model
          return (
            <Card
              key={model}
              role="button"
              tabIndex={0}
              onClick={() => handleModelSelect(model)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  handleModelSelect(model)
                }
              }}
              className={`cursor-pointer hover:shadow-sm transition ${isActive ? "border-2 border-primary" : ""
                }`}
            >
              <CardHeader className="py-2 px-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm flex-1">{model}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      tabIndex={-1}
                      onClick={(e) => {
                        e.stopPropagation()
                        openModal("edit", model, idx)
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
                        openModal("delete", model, idx)
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
        <div className="text-xs text-muted-foreground">Click on a model to continue</div>
      </div>

      <OverlayModal
        open={modalState.open}
        title={
          modalState.type === "add"
            ? "Add Model"
            : modalState.type === "edit"
              ? "Edit Model"
              : "Delete Model"
        }
        value={modalState.value}
        onChange={(val) => setModalState(prev => ({ ...prev, value: val }))}
        onClose={closeModal}
        onSave={handleModalSave}
        placeholder={
          modalState.type === "delete"
            ? `Are you sure you want to delete "${modalState.value}"?`
            : "Enter model name"
        }
        isDeleteMode={modalState.type === "delete"}
        isLoading={modalState.isLoading}
      />
    </div>
  )
}