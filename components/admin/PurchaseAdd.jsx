"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Separator } from "../ui/separator"
import { Upload, FileText, Image, Calendar, IndianRupee, Building2, X, Check, Plus, Trash2, Search, Edit, Printer } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog"
import { useToast } from "../../hooks/use-toast"
import JsBarcode from "jsbarcode"

export default function PurchaseAdd() {
  const { toast } = useToast()
  const { id } = useParams() // Get purchase ID from URL for edit mode
  const navigate = useNavigate()
  const isEditMode = !!id
  
  console.log('PurchaseAdd rendered - Edit Mode:', isEditMode, 'ID:', id)
  const [purchaseForm, setPurchaseForm] = useState({
    vendor: "",
    billNo: "",
    purchaseDate: "",
    notes: ""
  })

  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  
  // Barcode printing states
  const [showBarcodeDialog, setShowBarcodeDialog] = useState(false)
  const [purchaseResponse, setPurchaseResponse] = useState(null)
  
  // Vendors state
  const [vendors, setVendors] = useState([])
  const [isLoadingVendors, setIsLoadingVendors] = useState(true)
  
  // Products state
  const [products, setProducts] = useState([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  
  // Variants state
  const [variants, setVariants] = useState([])
  const [isLoadingVariants, setIsLoadingVariants] = useState(false)
  
  // Branches state
  const [branches, setBranches] = useState([])
  const [isLoadingBranches, setIsLoadingBranches] = useState(false)
  
  // Purchase items state
  const [purchaseItems, setPurchaseItems] = useState([])
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItemIndex, setEditingItemIndex] = useState(null) // Track which item is being edited
  
  // Item form state
  const [itemForm, setItemForm] = useState({
    product: "",
    variant: "",
    serialNumbers: [], // Multiple serial numbers
    currentSerial: "", // Current input field
    purchasePrice: "",
    branchQty: {}
  })
  
  // Dropdown search states
  const [productSearch, setProductSearch] = useState("")
  const [variantSearch, setVariantSearch] = useState("")
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [showVariantDropdown, setShowVariantDropdown] = useState(false)
  const [productFocusIndex, setProductFocusIndex] = useState(-1)
  const [variantFocusIndex, setVariantFocusIndex] = useState(-1)
  
  const fileInputRef = useRef(null)
  const serialInputRef = useRef(null)
  const productDropdownRef = useRef(null)
  const variantDropdownRef = useRef(null)

  // Fetch vendors from API
  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/vendor/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        credentials: 'omit',
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Vendors fetched:', data)
        setVendors(data.results || data) // Handle both paginated and direct array response
      } else {
        console.error("Failed to fetch vendors")
        toast({
          title: "Error",
          description: "Failed to load vendors",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching vendors:", error)
      toast({
        title: "Error",
        description: "Failed to load vendors",
        variant: "destructive",
      })
    } finally {
      setIsLoadingVendors(false)
    }
  }

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true)
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/dropdown/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        credentials: 'omit',
      })

      console.log("Products response status:", response.status)
      if (response.ok) {
        const data = await response.json()
        console.log("Products data:", data)
        setProducts(data.data || [])
      } else {
        console.error("Products fetch failed:", response.status)
        toast({
          title: "Error",
          description: "Failed to load products",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      })
    } finally {
      setIsLoadingProducts(false)
    }
  }

  // Fetch variants for selected product
  const fetchVariants = async (productId) => {
    try {
      setIsLoadingVariants(true)
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/${productId}/variants/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        credentials: 'omit',
      })

      if (response.ok) {
        const data = await response.json()
        setVariants(data.data || [])
      } else {
        setVariants([])
      }
    } catch (error) {
      console.error("Error fetching variants:", error)
      setVariants([])
    } finally {
      setIsLoadingVariants(false)
    }
  }

  // Fetch branches from API
  const fetchBranches = async () => {
    try {
      setIsLoadingBranches(true)
      const token = localStorage.getItem("access_token")
      console.log("Fetching branches from:", `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/branch/`)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/branch/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        credentials: 'omit',
      })

      console.log("Branch response status:", response.status)
      if (response.ok) {
        const data = await response.json()
        console.log("Branch API full response:", data)
        // Try different response structures
        const branchList = data.results || data.data || data || []
        console.log("Branch list extracted:", branchList)
        setBranches(Array.isArray(branchList) ? branchList : [])
        
        // Initialize branch quantities
        const branchQty = {}
        if (Array.isArray(branchList)) {
          branchList.forEach(branch => {
            branchQty[branch.id] = ""
          })
        }
        setItemForm(prev => ({ ...prev, branchQty }))
      }
    } catch (error) {
      console.error("Error fetching branches:", error)
    } finally {
      setIsLoadingBranches(false)
    }
  }

  // Fetch purchase detail for edit mode
  const fetchPurchaseDetail = async (purchaseId) => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/vendor/purchase/${purchaseId}/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        credentials: 'omit',
      })

      if (response.ok) {
        const data = await response.json()
        const purchase = data.purchase
        console.log('Purchase detail for edit:', purchase)
        
        // Populate form with existing data
        setPurchaseForm({
          vendor: purchase.vendor?.id?.toString() || "",
          billNo: purchase.bill_no || "",
          purchaseDate: purchase.purchase_date || "",
          notes: purchase.notes || ""
        })

        // Populate purchase items
        const items = purchase.items?.map(item => {
          // Convert stocks array to branchQty object
          const branchQty = {}
          item.stocks?.forEach(stock => {
            // API returns 'qty' not 'quantity'
            branchQty[stock.branch?.id] = stock.qty || stock.quantity || 0
          })

          console.log('Item loaded:', {
            productName: item.variant?.name || item.product?.name,
            branchQty: branchQty,
            stocks: item.stocks
          })

          return {
            id: item.id, // Keep item ID for updates
            productId: item.product?.id?.toString() || "", // Add productId
            product: item.product?.id?.toString() || "",
            productName: item.variant?.name || item.product?.name || "",
            variantId: item.variant?.id?.toString() || "", // Add variantId
            variant: item.variant?.id?.toString() || "",
            serialNumbers: item.serial_numbers?.map(sn => 
              typeof sn === 'object' ? sn.serial_number : sn
            ) || [],
            purchasePrice: item.purchase_price || "",
            sellingPrice: item.selling_price || "",
            branchQty: branchQty,
            totalQty: item.qty || 0
          }
        }) || []

        console.log('All items loaded:', items)
        setPurchaseItems(items)

        // Handle existing receipts
        if (purchase.receipts && purchase.receipts.length > 0) {
          const existingFiles = purchase.receipts.map((receipt, index) => ({
            id: receipt.id,
            name: `Document ${index + 1}`,
            url: receipt.receipt,
            isExisting: true
          }))
          setUploadedFiles(existingFiles)
        }

        toast({
          title: "Success",
          description: "Purchase loaded for editing",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to load purchase details",
          variant: "destructive",
        })
        navigate('/admin/purchase')
      }
    } catch (error) {
      console.error("Error fetching purchase detail:", error)
      toast({
        title: "Error",
        description: "Failed to load purchase details",
        variant: "destructive",
      })
      navigate('/admin/purchase')
    }
  }

  // Load vendors, products, branches and set today's date on component mount
  useEffect(() => {
    fetchVendors()
    fetchProducts()
    fetchBranches()
    
    // If edit mode, fetch purchase details
    if (isEditMode && id) {
      fetchPurchaseDetail(id)
    } else {
      // Set today's date on client-side to avoid hydration mismatch
      setPurchaseForm(prev => ({
        ...prev,
        purchaseDate: new Date().toISOString().split('T')[0]
      }))
    }
  }, [id, isEditMode])

  const handleProductChange = (productId) => {
    setItemForm(prev => ({
      ...prev,
      product: productId,
      variant: "",
      serialNumbers: [],
      currentSerial: ""
    }))
    
    const selectedProduct = products.find(p => p.id.toString() === productId)
    if (selectedProduct?.is_variants) {
      fetchVariants(productId)
    } else {
      setVariants([])
    }
    
    setShowProductDropdown(false)
    setProductSearch("")
    setProductFocusIndex(-1)
  }

  const handleVariantChange = (variantId) => {
    setItemForm(prev => ({ ...prev, variant: variantId }))
    setShowVariantDropdown(false)
    setVariantSearch("")
    setVariantFocusIndex(-1)
  }

  // Filter products based on search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  // Filter variants based on search
  const filteredVariants = variants.filter(v => 
    v.name.toLowerCase().includes(variantSearch.toLowerCase())
  )

  // Handle keyboard navigation for product dropdown
  const handleProductKeyDown = (e) => {
    if (!showProductDropdown) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault()
        setShowProductDropdown(true)
        setProductFocusIndex(0)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setProductFocusIndex(prev => 
          prev < filteredProducts.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setProductFocusIndex(prev => prev > 0 ? prev - 1 : 0)
        break
      case 'Enter':
        e.preventDefault()
        if (productFocusIndex >= 0 && filteredProducts[productFocusIndex]) {
          handleProductChange(filteredProducts[productFocusIndex].id.toString())
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowProductDropdown(false)
        setProductFocusIndex(-1)
        break
    }
  }

  // Handle keyboard navigation for variant dropdown
  const handleVariantKeyDown = (e) => {
    if (!showVariantDropdown) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault()
        setShowVariantDropdown(true)
        setVariantFocusIndex(0)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setVariantFocusIndex(prev => 
          prev < filteredVariants.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setVariantFocusIndex(prev => prev > 0 ? prev - 1 : 0)
        break
      case 'Enter':
        e.preventDefault()
        if (variantFocusIndex >= 0 && filteredVariants[variantFocusIndex]) {
          handleVariantChange(filteredVariants[variantFocusIndex].id.toString())
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowVariantDropdown(false)
        setVariantFocusIndex(-1)
        break
    }
  }

  // Reset focus index when search changes
  useEffect(() => {
    setProductFocusIndex(0)
  }, [productSearch])

  useEffect(() => {
    setVariantFocusIndex(0)
  }, [variantSearch])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target)) {
        setShowProductDropdown(false)
      }
      if (variantDropdownRef.current && !variantDropdownRef.current.contains(event.target)) {
        setShowVariantDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle serial number scan/enter
  const handleSerialKeyDown = (e) => {
    if (e.key === 'Enter' && itemForm.currentSerial.trim()) {
      e.preventDefault()
      // Allow duplicates - no check
      setItemForm(prev => ({
        ...prev,
        serialNumbers: [...prev.serialNumbers, prev.currentSerial.trim()],
        currentSerial: ""
      }))
    }
  }

  const removeSerialNumber = (serial) => {
    setItemForm(prev => ({
      ...prev,
      serialNumbers: prev.serialNumbers.filter(s => s !== serial)
    }))
  }

  const handleAddItem = () => {
    if (!itemForm.product || !itemForm.purchasePrice) {
      toast({
        title: "Error",
        description: "Please fill in product and purchase price",
        variant: "destructive",
      })
      return
    }

    const selectedProduct = products.find(p => p.id.toString() === itemForm.product)
    
    // Check serial numbers if warranty item
    if (selectedProduct?.is_warranty_item && itemForm.serialNumbers.length === 0) {
      toast({
        title: "Error",
        description: "At least one serial number is required for warranty items",
        variant: "destructive",
      })
      return
    }

    // Check if at least one branch has quantity
    const hasQty = Object.values(itemForm.branchQty).some(qty => qty && parseInt(qty) > 0)
    if (!hasQty) {
      toast({
        title: "Error",
        description: "Please add quantity for at least one branch",
        variant: "destructive",
      })
      return
    }

    const itemData = {
      id: editingItemIndex !== null ? purchaseItems[editingItemIndex].id : Date.now(),
      productId: itemForm.product,
      productName: selectedProduct?.name,
      variantId: itemForm.variant && itemForm.variant !== "" ? itemForm.variant : null,
      variantName: itemForm.variant && itemForm.variant !== "" ? variants.find(v => v.id.toString() === itemForm.variant)?.name : null,
      serialNumbers: [...itemForm.serialNumbers],
      purchasePrice: itemForm.purchasePrice,
      sellingPrice: itemForm.sellingPrice || "",
      branchQty: { ...itemForm.branchQty }
    }

    if (editingItemIndex !== null) {
      // Update existing item
      setPurchaseItems(prev => {
        const updated = [...prev]
        updated[editingItemIndex] = itemData
        return updated
      })
      toast({
        title: "Success",
        description: "Item updated successfully",
      })
    } else {
      // Add new item
      setPurchaseItems(prev => [...prev, itemData])
      toast({
        title: "Success",
        description: "Item added to purchase",
      })
    }
    
    // Reset item form
    const branchQty = {}
    branches.forEach(branch => {
      branchQty[branch.id] = ""
    })
    setItemForm({
      product: "",
      variant: "",
      serialNumbers: [],
      currentSerial: "",
      purchasePrice: "",
      sellingPrice: "",
      branchQty
    })
    
    setEditingItemIndex(null)
    setShowItemModal(false)
  }

  const handleRemoveItem = (itemIdOrIndex) => {
    setPurchaseItems(prev => prev.filter((item, idx) => item.id !== itemIdOrIndex && idx !== itemIdOrIndex))
  }

  const handleOpenItemModal = () => {
    // Reset form when opening modal
    const branchQty = {}
    branches.forEach(branch => {
      branchQty[branch.id] = ""
    })
    setItemForm({
      product: "",
      variant: "",
      serialNumbers: [],
      currentSerial: "",
      purchasePrice: "",
      sellingPrice: "",
      branchQty
    })
    setProductSearch("")
    setVariantSearch("")
    setShowProductDropdown(false)
    setShowVariantDropdown(false)
    setEditingItemIndex(null) // Reset edit mode
    setShowItemModal(true)
    // Focus on serial input after modal opens
    setTimeout(() => {
      if (serialInputRef.current) {
        serialInputRef.current.focus()
      }
    }, 100)
  }

  const handleEditItem = (index) => {
    const item = purchaseItems[index]
    console.log('Editing item:', item)
    
    // Populate form with item data
    setItemForm({
      product: item.productId || item.product,
      variant: item.variantId || item.variant || "",
      serialNumbers: item.serialNumbers || [],
      currentSerial: "",
      purchasePrice: item.purchasePrice,
      sellingPrice: item.sellingPrice || "",
      branchQty: { ...item.branchQty }
    })
    
    // Set product search to show selected product
    const selectedProduct = products.find(p => p.id.toString() === (item.productId || item.product))
    if (selectedProduct) {
      setProductSearch(selectedProduct.name)
      // Load variants if product has variants
      if (selectedProduct.is_variants) {
        fetchVariants(selectedProduct.id)
      }
    }
    
    setEditingItemIndex(index)
    setShowItemModal(true)
  }

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files)
    addFiles(files)
    // Clear the input value so same files can be selected again
    if (event.target) {
      event.target.value = ""
    }
  }

  const addFiles = (files) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    const maxSize = 10 * 1024 * 1024 // 10MB
    const validFiles = []
    let errorCount = 0

    files.forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        errorCount++
        return
      }

      if (file.size > maxSize) {
        errorCount++
        return
      }

      // Check if file already exists
      const isDuplicate = uploadedFiles.some(existing => 
        existing.name === file.name && existing.size === file.size
      )

      if (!isDuplicate) {
        validFiles.push(file)
      }
    })

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles])
      toast({
        title: "Success",
        description: `${validFiles.length} file(s) uploaded successfully!`,
      })
    }

    if (errorCount > 0) {
      toast({
        title: "Warning",
        description: `${errorCount} file(s) were skipped (invalid type or size > 10MB)`,
        variant: "destructive",
      })
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragActive(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files && files.length > 0) {
      addFiles(files)
    }
  }

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeAllFiles = () => {
    setUploadedFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSave = async () => {
    if (!purchaseForm.vendor || purchaseForm.vendor === "no-vendors" || !purchaseForm.purchaseDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Vendor, Date)",
        variant: "destructive",
      })
      return
    }

    if (purchaseItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the purchase",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    setSaveSuccess(false)
    
    try {
      // Build items array with new format
      const items = purchaseItems.map(item => {
        // Handle both string and number formats
        const priceStr = typeof item.purchasePrice === 'string' ? item.purchasePrice : String(item.purchasePrice || 0)
        const purchasePrice = parseFloat(priceStr.replace(/,/g, '')) || 0
        
        // Build branches array from branchQty
        const branches = []
        Object.entries(item.branchQty).forEach(([branchId, qty]) => {
          if (qty && parseInt(qty) > 0) {
            branches.push({
              branch: parseInt(branchId),
              qty: parseInt(qty)
            })
          }
        })
        
        const itemData = {
          product: parseInt(item.productId),
          variant: item.variantId && item.variantId !== "" ? parseInt(item.variantId) : null,
          purchase_price: purchasePrice.toFixed(2),
          branches: branches
        }
        
        // Add item ID if in edit mode
        if (isEditMode && item.id) {
          itemData.id = item.id
        }
        
        // Add serial_numbers if warranty item and has serials
        if (item.serialNumbers && item.serialNumbers.length > 0) {
          itemData.serial_numbers = item.serialNumbers
        }
        
        return itemData
      })

      console.log(`${isEditMode ? 'Updating' : 'Creating'} purchase data:`, {
        vendor: purchaseForm.vendor,
        bill_no: purchaseForm.billNo,
        purchase_date: purchaseForm.purchaseDate,
        notes: purchaseForm.notes,
        items: items,
        receipts_count: uploadedFiles.length
      })

      const token = localStorage.getItem("access_token")
      const formData = new FormData()
      
      // Add required fields
      formData.append('vendor', purchaseForm.vendor)
      formData.append('purchase_date', purchaseForm.purchaseDate)
      formData.append('items', JSON.stringify(items))
      
      // Add optional fields
      if (purchaseForm.billNo) {
        formData.append('bill_no', purchaseForm.billNo)
      }
      if (purchaseForm.notes) {
        formData.append('notes', purchaseForm.notes)
      }
      
      // Add receipt files if uploaded (only new files, not existing ones)
      const newFiles = uploadedFiles.filter(file => !file.isExisting)
      if (newFiles && newFiles.length > 0) {
        newFiles.forEach((file) => {
          formData.append('receipts', file)
        })
      }

      // Determine API endpoint and method based on mode
      const apiUrl = isEditMode 
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/vendor/purchase/${id}/update/`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/vendor/purchase/add/`
      
      const method = isEditMode ? "PUT" : "POST"

      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      })

      const responseData = await response.json()
      console.log('Purchase API response:', responseData)

      if (response.ok && responseData.success) {
        setSaveSuccess(true)
        
        // Store purchase response for barcode printing
        if (!isEditMode && responseData.items && responseData.items.length > 0) {
          setPurchaseResponse(responseData)
          setShowBarcodeDialog(true)
        }
        
        toast({
          title: "Success",
          description: responseData.message || `Purchase ${isEditMode ? 'updated' : 'added'} successfully!`,
        })
        
        setTimeout(() => {
          setSaveSuccess(false)
          if (isEditMode) {
            // Navigate back to purchase list after edit
            navigate('/admin/purchase')
          } else if (!showBarcodeDialog) {
            // Reset form for new purchase (only if barcode dialog not shown)
            setPurchaseForm({
              vendor: "",
              billNo: "",
              purchaseDate: new Date().toISOString().split('T')[0],
              notes: ""
            })
            setPurchaseItems([])
            setUploadedFiles([])
            if (fileInputRef.current) {
              fileInputRef.current.value = ""
            }
          }
        }, 2000)
        
      } else {
        console.error('Save error:', responseData)
        toast({
          title: "Error",
          description: responseData.message || responseData.error || `Failed to ${isEditMode ? 'update' : 'save'} purchase`,
          variant: "destructive",
        })
      }
      
    } catch (error) {
      console.error('Error saving purchase:', error)
      toast({
        title: "Error", 
        description: `Failed to ${isEditMode ? 'update' : 'save'} purchase. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Barcode printing function - same as BarcodePrinting component
  const printBarcodes = (item, quantity = 1) => {
    const { barcode, selling_price, product_name, variant } = item
    const qty = parseInt(quantity) || 1

    if (!barcode) {
      toast({
        title: "Error",
        description: "Invalid barcode",
        variant: "destructive",
      })
      return
    }

    console.log('Printing barcode:', barcode, 'Qty:', qty)

    // Generate all barcode images first
    const barcodeImages = []
    for (let i = 0; i < qty; i++) {
      const canvas = document.createElement('canvas')
      try {
        // Use CODE128 for better scanning compatibility
        JsBarcode(canvas, barcode, {
          format: "CODE128",
          width: 3,
          height: 80,
          displayValue: false,
          margin: 15,
          lineColor: "#000000",
          background: "#ffffff"
        })
        barcodeImages.push(canvas.toDataURL('image/png', 1.0))
      } catch (error) {
        console.error('Barcode generation error:', error)
        // Fallback: Try CODE39 if CODE128 fails
        try {
          JsBarcode(canvas, barcode, {
            format: "CODE39",
            width: 3,
            height: 80,
            displayValue: false,
            margin: 15,
            lineColor: "#000000",
            background: "#ffffff"
          })
          barcodeImages.push(canvas.toDataURL('image/png', 1.0))
        } catch (fallbackError) {
          console.error('Fallback barcode generation error:', fallbackError)
        }
      }
    }

    const logoPath = window.location.origin + '/barcode_logo.jpg'
    const displayName = variant ? variant.name : product_name

    // Create print content - no margins/padding, driver handles settings
    let printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Barcodes</title>
        <style>
          @page {
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .barcode-row {
            display: flex;
            page-break-after: always;
          }
          .barcode-row:last-child {
            page-break-after: avoid;
          }
          .barcode-label {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            text-align: center;
            margin-right: 2mm;
          }
          .barcode-label:last-child {
            margin-right: 0;
          }
          .logo {
            width: 22mm;
            height: 6mm;
            object-fit: contain;
          }
          .branch-name {
            font-size: 8pt;
            font-weight: bold;
            text-transform: uppercase;
            color: #000;
          }
          .barcode-img {
            width: 34mm;
            height: 14mm;
            object-fit: fill;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
            -ms-interpolation-mode: nearest-neighbor;
            margin: 0.5mm 1mm;
          }
          .barcode-number {
            font-size: 9pt;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            letter-spacing: 0.5px;
            color: #000;
          }
          .price {
            font-size: 14pt;
            font-weight: bold;
            color: #000;
          }
        </style>
      </head>
      <body>
    `

    // Generate barcodes in rows of 2 (for 2-ups paper)
    for (let i = 0; i < barcodeImages.length; i += 2) {
      printContent += '<div class="barcode-row">'
      
      // First label
      printContent += `
        <div class="barcode-label">
          <img class="logo" src="${logoPath}" alt="GoldFire" onerror="this.style.display='none'" />
          <div class="branch-name">GOLDFIRE</div>
          <img class="barcode-img" src="${barcodeImages[i]}" alt="barcode" />
          <div class="barcode-number">${barcode}</div>
          <div class="price">₹${Number(selling_price || 0).toLocaleString()}</div>
        </div>
      `
      
      // Second label (if exists)
      if (i + 1 < barcodeImages.length) {
        printContent += `
          <div class="barcode-label">
            <img class="logo" src="${logoPath}" alt="GoldFire" onerror="this.style.display='none'" />
            <div class="branch-name">GOLDFIRE</div>
            <img class="barcode-img" src="${barcodeImages[i + 1]}" alt="barcode" />
            <div class="barcode-number">${barcode}</div>
            <div class="price">₹${Number(selling_price || 0).toLocaleString()}</div>
          </div>
        `
      } else {
        // Empty placeholder for odd count
        printContent += '<div class="barcode-label"></div>'
      }
      
      printContent += '</div>'
    }

    printContent += `
      </body>
      </html>
    `

    // Safari-compatible print using iframe
    // Remove existing print frame if any
    const existingFrame = document.getElementById('barcode-print-frame')
    if (existingFrame) {
      existingFrame.remove()
    }

    // Create hidden iframe for printing
    const printFrame = document.createElement('iframe')
    printFrame.id = 'barcode-print-frame'
    printFrame.style.position = 'fixed'
    printFrame.style.top = '-10000px'
    printFrame.style.left = '-10000px'
    printFrame.style.width = '1px'
    printFrame.style.height = '1px'
    printFrame.style.border = 'none'
    document.body.appendChild(printFrame)

    // Write content to iframe
    const frameDoc = printFrame.contentDocument || printFrame.contentWindow.document
    frameDoc.open()
    frameDoc.write(printContent)
    frameDoc.close()

    // Wait for images to load then print (Safari needs more time)
    const images = frameDoc.getElementsByTagName('img')
    let loadedImages = 0
    const totalImages = images.length

    const triggerPrint = () => {
      setTimeout(() => {
        try {
          printFrame.contentWindow.focus()
          printFrame.contentWindow.print()
        } catch (e) {
          // Fallback for Safari - open in new window
          const printWindow = window.open('', '_blank')
          if (printWindow) {
            printWindow.document.write(printContent)
            printWindow.document.close()
            printWindow.focus()
            setTimeout(() => printWindow.print(), 500)
          }
        }
      }, 300)
    }

    if (totalImages === 0) {
      triggerPrint()
    } else {
      for (let img of images) {
        if (img.complete) {
          loadedImages++
          if (loadedImages === totalImages) triggerPrint()
        } else {
          img.onload = img.onerror = () => {
            loadedImages++
            if (loadedImages === totalImages) triggerPrint()
          }
        }
      }
      // Fallback timeout in case images don't trigger events
      setTimeout(triggerPrint, 1500)
    }
  }

  const formatCurrency = (value) => {
    if (!value) return ""
    const numericValue = value.replace(/[^\d.]/g, '')
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const handlePriceChange = (e) => {
    const formatted = formatCurrency(e.target.value)
    setItemForm(prev => ({ ...prev, purchasePrice: formatted }))
  }

  const calculateTotalAmount = () => {
    return purchaseItems.reduce((total, item) => {
      // Handle both string and number formats
      const priceStr = typeof item.purchasePrice === 'string' ? item.purchasePrice : String(item.purchasePrice || 0)
      const price = parseFloat(priceStr.replace(/,/g, '')) || 0
      const qty = Object.values(item.branchQty).reduce((sum, q) => sum + (parseInt(q) || 0), 0)
      return total + (price * qty)
    }, 0)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Building2 className="w-5 h-5" />
        <h1 className="text-2xl font-bold text-foreground">
          {isEditMode ? 'Edit Purchase' : 'Add Purchase'}
        </h1>
      </div>

      {/* Purchase Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Purchase Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor *</Label>
              <Select 
                value={purchaseForm.vendor} 
                onValueChange={(value) => setPurchaseForm(prev => ({ ...prev, vendor: value }))}
                disabled={isLoadingVendors}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingVendors ? "Loading vendors..." : "Select vendor"} />
                </SelectTrigger>
                <SelectContent>
                  {vendors.length > 0 ? (
                    vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id.toString()}>
                        {vendor.name}
                      </SelectItem>
                    ))
                  ) : !isLoadingVendors ? (
                    <SelectItem value="no-vendors" disabled>
                      No vendors found
                    </SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billNo">Bill No</Label>
              <Input
                id="billNo"
                type="text"
                placeholder="BILL-1023"
                value={purchaseForm.billNo}
                onChange={(e) => setPurchaseForm(prev => ({ ...prev, billNo: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="purchaseDate"
                  type="date"
                  value={purchaseForm.purchaseDate}
                  onChange={(e) => setPurchaseForm(prev => ({ ...prev, purchaseDate: e.target.value }))}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <textarea
              id="notes"
              placeholder="Additional notes about this purchase..."
              value={purchaseForm.notes}
              onChange={(e) => setPurchaseForm(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Purchase Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Purchase Items
          </CardTitle>
          <Button onClick={handleOpenItemModal} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          {purchaseItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No items added yet. Click "Add Item" to get started.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {purchaseItems.map((item, index) => (
                <div key={item.id || index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      {item.variantName && (
                        <p className="text-sm text-muted-foreground">Variant: {item.variantName}</p>
                      )}
                      {item.serialNumbers && item.serialNumbers.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          <span>Serials: </span>
                          <span className="text-foreground">{item.serialNumbers.join(', ')}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditItem(index)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id || index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Purchase Price: </span>
                      <span className="font-medium">₹{item.purchasePrice}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Selling Price: </span>
                      <span className="font-medium">₹{item.sellingPrice || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Branch-wise Quantities */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Branch-wise Stock:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      {branches.map(branch => {
                        const qty = item.branchQty[branch.id]
                        if (qty && parseInt(qty) > 0) {
                          return (
                            <div key={branch.id} className="bg-accent p-2 rounded flex items-center justify-between">
                              <span className="text-muted-foreground">{branch.name}</span>
                              <span className="font-medium">{qty} units</span>
                            </div>
                          )
                        }
                        return null
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total Amount */}
      {purchaseItems.length > 0 && (
        <Card className="bg-accent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Total Amount:</span>
              <span className="text-2xl font-bold flex items-center gap-1">
                <IndianRupee className="w-5 h-5" />
                {calculateTotalAmount().toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Receipts (Optional)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload multiple receipt files to attach with your purchase record
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Upload Invoice/Receipts (Optional)</Label>
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center space-y-4 transition-colors ${
                isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {uploadedFiles.length === 0 ? (
                <>
                  <div className="flex justify-center">
                    <div className="p-3 bg-accent rounded-full">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-foreground font-medium">
                      Drop files here or click to upload
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Multiple files supported - PDF, JPG, PNG (Max 10MB each)
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ""
                        fileInputRef.current.click()
                      }
                    }}
                    className="mx-auto"
                  >
                    Choose Files
                  </Button>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-accent rounded-lg">
                    <span className="text-sm font-medium">
                      {uploadedFiles.length} file(s) uploaded
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.value = ""
                            fileInputRef.current.click()
                          }
                        }}
                      >
                        Add More
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeAllFiles}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove All
                      </Button>
                    </div>
                  </div>
                  
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {uploadedFiles.map((file, idx) => {
                      // Check if it's an existing file (from API) or new file
                      const isPdf = file.isExisting 
                        ? (file.url && file.url.toLowerCase().includes('.pdf'))
                        : (file.type && file.type.includes('pdf'))
                      
                      return (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-background border rounded-lg">
                          {isPdf ? (
                            <FileText className="w-4 h-4 text-red-500" />
                          ) : (
                            <Image className="w-4 h-4 text-blue-500" />
                          )}
                          <span className="text-sm flex-1 truncate" title={file.name}>
                            {file.name}
                          </span>
                          {file.size && (
                            <span className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(1)}MB
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(idx)}
                            className="p-1 h-6 w-6 text-red-500 hover:text-red-700"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          * Required fields
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => {
            setPurchaseForm({
              vendor: "",
              billNo: "",
              purchaseDate: new Date().toISOString().split('T')[0],
              notes: ""
            })
            setPurchaseItems([])
            setUploadedFiles([])
            if (fileInputRef.current) {
              fileInputRef.current.value = ""
            }
          }}>
            Reset Form
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !purchaseForm.vendor || !purchaseForm.purchaseDate || purchaseItems.length === 0}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                {isEditMode ? 'Updating...' : 'Saving...'}
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                {isEditMode ? 'Updated!' : 'Saved!'}
              </>
            ) : (
              isEditMode ? 'Update Purchase' : 'Save Purchase'
            )}
          </Button>
        </div>
      </div>

      {/* Add Item Modal */}
      <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
        <DialogContent className="max-w-2xl overflow-visible">
          <DialogHeader>
            <DialogTitle>{editingItemIndex !== null ? 'Edit Purchase Item' : 'Add Purchase Item'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Product & Variant in one row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Custom Product Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="product">Product *</Label>
                <div className="relative" ref={productDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowProductDropdown(!showProductDropdown)}
                    onKeyDown={handleProductKeyDown}
                    disabled={isLoadingProducts}
                    className="w-full flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent disabled:opacity-50"
                  >
                    <span className={itemForm.product ? "" : "text-muted-foreground"}>
                      {itemForm.product 
                        ? products.find(p => p.id.toString() === itemForm.product)?.name 
                        : (isLoadingProducts ? "Loading..." : "Select product")}
                    </span>
                    <span className="text-muted-foreground">▼</span>
                  </button>
                  
                  {showProductDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-[300px] flex flex-col">
                      {/* Search Input - Fixed at top */}
                      <div className="p-2 border-b bg-background">
                        <Input
                          type="text"
                          placeholder="Search product..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          onKeyDown={handleProductKeyDown}
                          className="h-8"
                          autoFocus
                        />
                      </div>
                      
                      {/* Scrollable List */}
                      <div className="overflow-y-auto flex-1">
                        {filteredProducts.length > 0 ? (
                          filteredProducts.map((product, idx) => (
                            <div
                              key={product.id}
                              onClick={() => handleProductChange(product.id.toString())}
                              className={`px-3 py-2 cursor-pointer text-sm ${
                                itemForm.product === product.id.toString()
                                  ? 'bg-primary/20 text-primary font-medium'
                                  : idx === productFocusIndex
                                    ? 'bg-accent'
                                    : 'hover:bg-accent'
                              }`}
                            >
                              {product.name}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                            No products found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Variant Dropdown - Show only if product has variants */}
              {itemForm.product && products.find(p => p.id.toString() === itemForm.product)?.is_variants && (
                <div className="space-y-2">
                  <Label htmlFor="variant">Variant *</Label>
                  <div className="relative" ref={variantDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowVariantDropdown(!showVariantDropdown)}
                      onKeyDown={handleVariantKeyDown}
                      disabled={isLoadingVariants}
                      className="w-full flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent disabled:opacity-50"
                    >
                      <span className={itemForm.variant ? "" : "text-muted-foreground"}>
                        {itemForm.variant 
                          ? variants.find(v => v.id.toString() === itemForm.variant)?.name 
                          : (isLoadingVariants ? "Loading..." : "Select variant")}
                      </span>
                      <span className="text-muted-foreground">▼</span>
                    </button>
                    
                    {showVariantDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-[300px] flex flex-col">
                        {/* Search Input - Fixed at top */}
                        <div className="p-2 border-b bg-background">
                          <Input
                            type="text"
                            placeholder="Search variant..."
                            value={variantSearch}
                            onChange={(e) => setVariantSearch(e.target.value)}
                            onKeyDown={handleVariantKeyDown}
                            className="h-8"
                            autoFocus
                          />
                        </div>
                        
                        {/* Scrollable List */}
                        <div className="overflow-y-auto flex-1">
                          {filteredVariants.length > 0 ? (
                            filteredVariants.map((variant, idx) => (
                              <div
                                key={variant.id}
                                onClick={() => handleVariantChange(variant.id.toString())}
                                className={`px-3 py-2 cursor-pointer text-sm ${
                                  itemForm.variant === variant.id.toString()
                                    ? 'bg-primary/20 text-primary font-medium'
                                    : idx === variantFocusIndex
                                      ? 'bg-accent'
                                      : 'hover:bg-accent'
                                }`}
                              >
                                {variant.name}
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                              No variants found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Serial Numbers - Multiple inputs for warranty items */}
            {itemForm.product && products.find(p => p.id.toString() === itemForm.product)?.is_warranty_item && (
              <div className="space-y-2">
                <Label>Serial Numbers * (Scan & Press Enter)</Label>
                <Input
                  ref={serialInputRef}
                  type="text"
                  placeholder="Scan barcode or type serial number, press Enter to add"
                  value={itemForm.currentSerial}
                  onChange={(e) => setItemForm(prev => ({ ...prev, currentSerial: e.target.value }))}
                  onKeyDown={handleSerialKeyDown}
                  autoFocus
                  className="focus:ring-2 focus:ring-primary"
                />
                
                {/* Added serial numbers list */}
                {itemForm.serialNumbers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 p-2 bg-accent rounded-lg max-h-32 overflow-y-auto">
                    {itemForm.serialNumbers.map((serial, idx) => (
                      <div key={idx} className="flex items-center gap-1 bg-background px-2 py-1 rounded text-sm border">
                        <span>{serial}</span>
                        <button
                          type="button"
                          onClick={() => removeSerialNumber(serial)}
                          className="text-red-500 hover:text-red-700 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {itemForm.serialNumbers.length} serial number(s) added
                </p>
              </div>
            )}

            {/* Purchase Price */}
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price *</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="purchasePrice"
                  type="text"
                  placeholder="0.00"
                  value={itemForm.purchasePrice}
                  onChange={handlePriceChange}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Branch Quantities */}
            <div className="space-y-2">
              <Label>Branch Quantities *</Label>
              {branches.length === 0 ? (
                <p className="text-sm text-muted-foreground">No branches found</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {branches.map(branch => (
                    <div key={branch.id} className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{branch.name}</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Qty"
                        value={itemForm.branchQty[branch.id] || ""}
                        onChange={(e) => setItemForm(prev => ({
                          ...prev,
                          branchQty: { ...prev.branchQty, [branch.id]: e.target.value }
                        }))}
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem}>
              {editingItemIndex !== null ? 'Update Item' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barcode Printing Dialog */}
      <Dialog open={showBarcodeDialog} onOpenChange={setShowBarcodeDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5" />
              Print Barcodes
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Purchase created successfully! Would you like to print barcodes for the items?
            </p>
            
            {purchaseResponse && purchaseResponse.items && (
              <div className="space-y-3">
                {purchaseResponse.items.map((item, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">
                          {item.variant ? item.variant.name : item.product_name}
                        </h4>
                        <div className="text-sm text-muted-foreground mt-1">
                          <div>Barcode: <span className="font-mono">{item.barcode}</span></div>
                          <div>Price: ₹{Number(item.selling_price).toLocaleString()}</div>
                          <div>Quantity: {item.qty} units</div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Input
                          type="number"
                          min="1"
                          max={item.qty}
                          defaultValue="1"
                          placeholder="Qty"
                          className="w-20"
                          id={`qty-${index}`}
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            const qtyInput = document.getElementById(`qty-${index}`)
                            const qty = parseInt(qtyInput.value) || 1
                            printBarcodes(item, qty)
                            toast({
                              title: "Printing",
                              description: `Printing ${qty} barcode(s)...`,
                            })
                          }}
                        >
                          <Printer className="w-4 h-4 mr-1" />
                          Print
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowBarcodeDialog(false)
                // Reset form after closing dialog
                setPurchaseForm({
                  vendor: "",
                  billNo: "",
                  purchaseDate: new Date().toISOString().split('T')[0],
                  notes: ""
                })
                setPurchaseItems([])
                setUploadedFiles([])
                setPurchaseResponse(null)
                if (fileInputRef.current) {
                  fileInputRef.current.value = ""
                }
              }}
            >
              Skip & Continue
            </Button>
            <Button
              onClick={() => {
                // Print all barcodes
                if (purchaseResponse && purchaseResponse.items) {
                  purchaseResponse.items.forEach((item, index) => {
                    const qtyInput = document.getElementById(`qty-${index}`)
                    const qty = parseInt(qtyInput.value) || 1
                    setTimeout(() => printBarcodes(item, qty), index * 500)
                  })
                  toast({
                    title: "Printing All",
                    description: "Printing all barcodes...",
                  })
                }
              }}
            >
              <Printer className="w-4 h-4 mr-2" />
              Print All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}