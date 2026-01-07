"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Button } from "../../ui/button"
import { ChevronLeft, Plus, X, Check } from "lucide-react"
import { useToast } from "../../../hooks/use-toast"
import JsBarcode from "jsbarcode"

export default function ProductForm({
    productData,
    updateProductData,
    prevStep,
    categories,
    categoriesData,
    editMode,
    onClose,
    onSaved,
    resetForm
}) {
    const { toast } = useToast()
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)

    // API data states
    const [vendors, setVendors] = useState([])
    const [vendorsData, setVendorsData] = useState([])
    const [branches, setBranches] = useState([])
    const [branchesData, setBranchesData] = useState([])
    const [hsnCodes, setHsnCodes] = useState([])
    const [hsnData, setHsnData] = useState([])
    const [, setModels] = useState([])

    // Loading states
    const [vendorsLoading, setVendorsLoading] = useState(true)
    const [branchesLoading, setBranchesLoading] = useState(true)
    const [hsnLoading, setHsnLoading] = useState(true)

    // Serial number handling
    const [serialInput, setSerialInput] = useState("")
    const serialInputRef = useRef(null)
    const [barcodeBuffer, setBarcodeBuffer] = useState("")
    const [lastKeyTime, setLastKeyTime] = useState(0)

    // Model selection for Tuffun
    const [selectedModelToAdd, setSelectedModelToAdd] = useState("")
    const [modelSuggestionIndex, setModelSuggestionIndex] = useState(-1)

    const categoryName = productData.selectedCategory !== null ? categories[productData.selectedCategory] : null

    // Barcode printing function - SAME LAYOUT AS BarcodePrinting.jsx
    // Optimized for 38mm x 38mm 2-ups thermal printer
    const printBarcodes = (barcodeData) => {
        console.log('Printing scannable barcodes:', barcodeData)

        try {
            // Validate barcode data
            if (!barcodeData || !Array.isArray(barcodeData) || barcodeData.length === 0) {
                throw new Error('No barcode data provided')
            }

            // Generate barcode images first
            const barcodeImages = []
            let totalBarcodes = 0
            let failedBarcodes = 0

            barcodeData.forEach(item => {
                const { branch, qty, barcode, price } = item

                // Validate item data
                if (!barcode || !qty || qty <= 0) {
                    console.warn('Invalid barcode item:', item)
                    return
                }

                for (let i = 0; i < qty; i++) {
                    totalBarcodes++

                    try {
                        // Create canvas for barcode generation - SAME AS BarcodePrinting.jsx
                        const canvas = document.createElement('canvas')

                        // Generate scannable barcode using JsBarcode - SAME SETTINGS AS BarcodePrinting.jsx
                        JsBarcode(canvas, barcode, {
                            format: "CODE128",
                            width: 3,               // Wider bars = easier to scan
                            height: 80,             // Taller = better scan angle tolerance
                            displayValue: false,
                            margin: 15,             // Large quiet zone = CRITICAL for scanning
                            lineColor: "#000000",
                            background: "#ffffff"
                        })

                        barcodeImages.push({
                            dataUrl: canvas.toDataURL('image/png', 1.0),
                            barcode,
                            price: price || 0,
                            branch: branch || 'GOLDFIRE'
                        })

                    } catch (error) {
                        console.error('Error generating barcode for:', barcode, error)
                        // Fallback: Try CODE39 if CODE128 fails
                        try {
                            const canvas = document.createElement('canvas')
                            JsBarcode(canvas, barcode, {
                                format: "CODE39",
                                width: 3,
                                height: 80,
                                displayValue: false,
                                margin: 15,
                                lineColor: "#000000",
                                background: "#ffffff"
                            })
                            barcodeImages.push({
                                dataUrl: canvas.toDataURL('image/png', 1.0),
                                barcode,
                                price: price || 0,
                                branch: branch || 'GOLDFIRE'
                            })
                        } catch (fallbackError) {
                            console.error('Fallback barcode generation error:', fallbackError)
                            failedBarcodes++
                        }
                    }
                }
            })

            // Check if any barcodes were generated successfully
            if (barcodeImages.length === 0) {
                throw new Error('Failed to generate any barcodes')
            }

            // Show warning if some barcodes failed
            if (failedBarcodes > 0) {
                toast({
                    title: "Partial Barcode Generation",
                    description: `${failedBarcodes} out of ${totalBarcodes} barcodes failed to generate.`,
                    className: "bg-yellow-50 border-yellow-200 text-yellow-800",
                })
            }

            // Get logo path - SAME AS BarcodePrinting.jsx
            const logoPath = window.location.origin + '/barcode_logo.jpg'

            // Create print content - SAME LAYOUT AS BarcodePrinting.jsx
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

            // Generate barcodes in rows of 2 (for 2-ups paper) - SAME AS BarcodePrinting.jsx
            for (let i = 0; i < barcodeImages.length; i += 2) {
                printContent += '<div class="barcode-row">'

                // First label
                const barcode1 = barcodeImages[i]
                printContent += `
                    <div class="barcode-label">
                        <img class="logo" src="${logoPath}" alt="GoldFire" onerror="this.style.display='none'" />
                        <div class="branch-name">${barcode1.branch}</div>
                        <img class="barcode-img" src="${barcode1.dataUrl}" alt="barcode" />
                        <div class="barcode-number">${barcode1.barcode}</div>
                        <div class="price">₹${Number(barcode1.price || 0).toLocaleString()}</div>
                    </div>
                `

                // Second label (if exists)
                if (i + 1 < barcodeImages.length) {
                    const barcode2 = barcodeImages[i + 1]
                    printContent += `
                        <div class="barcode-label">
                            <img class="logo" src="${logoPath}" alt="GoldFire" onerror="this.style.display='none'" />
                            <div class="branch-name">${barcode2.branch}</div>
                            <img class="barcode-img" src="${barcode2.dataUrl}" alt="barcode" />
                            <div class="barcode-number">${barcode2.barcode}</div>
                            <div class="price">₹${Number(barcode2.price || 0).toLocaleString()}</div>
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

            // Safari-compatible print using iframe - SAME AS BarcodePrinting.jsx
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
            const totalImagesCount = images.length

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

            if (totalImagesCount === 0) {
                triggerPrint()
            } else {
                for (let img of images) {
                    if (img.complete) {
                        loadedImages++
                        if (loadedImages === totalImagesCount) triggerPrint()
                    } else {
                        img.onload = img.onerror = () => {
                            loadedImages++
                            if (loadedImages === totalImagesCount) triggerPrint()
                        }
                    }
                }
                // Fallback timeout in case images don't trigger events
                setTimeout(triggerPrint, 1500)
            }

            // Show success message
            toast({
                title: "Scannable Barcodes Ready",
                description: `${barcodeImages.length} scannable barcodes generated and ready to print!`,
                className: "bg-green-50 border-green-200 text-green-800",
            })

        } catch (error) {
            console.error('Barcode printing error:', error)
            toast({
                title: "Barcode Print Failed",
                description: error.message || "An error occurred while printing barcodes.",
                variant: "destructive",
            })
            throw error
        }
    }

    // Fetch vendors from API
    useEffect(() => {
        const fetchVendors = async () => {
            try {
                const token = localStorage.getItem('access_token')
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/vendor/`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    credentials: 'omit',
                })

                if (response.ok) {
                    const data = await response.json()
                    setVendorsData(data)
                    setVendors(data.map(vendor => vendor.name))
                }
            } catch (error) {
                console.error('Error fetching vendors:', error)
            } finally {
                setVendorsLoading(false)
            }
        }

        fetchVendors()
    }, [])

    // Fetch branches from API
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const token = localStorage.getItem('access_token')
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/branch/`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    credentials: 'omit',
                })

                if (response.ok) {
                    const data = await response.json()
                    setBranchesData(data)
                    setBranches(data.map(branch => branch.name))
                }
            } catch (error) {
                console.error('Error fetching branches:', error)
            } finally {
                setBranchesLoading(false)
            }
        }

        fetchBranches()
    }, [])

    // Fetch HSN codes from API
    useEffect(() => {
        const fetchHSNCodes = async () => {
            try {
                const token = localStorage.getItem('access_token')
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/hsn/list/`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    credentials: 'omit',
                })

                if (response.ok) {
                    const data = await response.json()
                    setHsnData(data)
                    setHsnCodes(data.map(hsn => hsn.code))

                    // Auto-select HSN for category
                    if (productData.selectedCategory !== null && categoriesData.length > 0) {
                        const categoryObj = categoriesData.find(cat => cat.name === categoryName)
                        if (categoryObj) {
                            const categoryHsn = data.find(hsn => hsn.category === categoryObj.id)
                            if (categoryHsn && !productData.productForm.hsn) {
                                updateProductData({
                                    productForm: { ...productData.productForm, hsn: categoryHsn.code }
                                })
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching HSN codes:', error)
            } finally {
                setHsnLoading(false)
            }
        }

        fetchHSNCodes()
    }, [productData.selectedCategory, categoriesData])

    // Fetch commission for category
    useEffect(() => {
        const fetchCommissionForCategory = async () => {
            try {
                if (productData.selectedCategory === null || categoriesData.length === 0) {
                    return
                }

                const categoryObj = categoriesData.find(cat => cat.name === categoryName)
                if (!categoryObj) {
                    return
                }

                const token = localStorage.getItem('access_token')
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/commission/${categoryObj.id}/`,
                    {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        credentials: 'omit',
                    }
                )

                if (response.ok) {
                    const data = await response.json()
                    if (data && data.commission_type && data.commission_value) {
                        // Prefill commission type and value
                        const commissionType = data.commission_type === "percentage" ? "percent" : "fixed"
                        updateProductData({
                            productForm: {
                                ...productData.productForm,
                                commissionType: commissionType,
                                commissionValue: data.commission_value.toString()
                            }
                        })
                    }
                }
            } catch (error) {
                console.error('Error fetching commission:', error)
            }
        }

        fetchCommissionForCategory()
    }, [productData.selectedCategory, categoriesData])

    // Fetch models for Tuffun category
    useEffect(() => {
        if (categoryName === "Tuffun" && productData.selectedBrand) {
            fetchModelsForBrand()
        }
    }, [categoryName, productData.selectedBrand])

    const fetchModelsForBrand = async () => {
        try {
            const token = localStorage.getItem('access_token')
            // This would need to be implemented based on your API structure
            // For now, using a placeholder
            setModels([])
        } catch (error) {
            console.error('Error fetching models:', error)
        }
    }

    const addSerialNumber = useCallback(() => {
        const trimmed = serialInput.trim()
        if (trimmed) {
            updateProductData({
                serialNumbers: [...productData.serialNumbers, trimmed]
            })
            setSerialInput("")
        }
    }, [serialInput, productData.serialNumbers, updateProductData])

    const removeSerialNumber = useCallback((index) => {
        updateProductData({
            serialNumbers: productData.serialNumbers.filter((_, i) => i !== index)
        })
    }, [productData.serialNumbers, updateProductData])

    const handleSerialKeyDown = useCallback((e) => {
        if (e.key === "Enter") {
            e.preventDefault()
            addSerialNumber()
        }
    }, [addSerialNumber])

    // Barcode scanner detection
    const handleSerialInput = useCallback((e) => {
        const currentTime = Date.now()
        const timeDiff = currentTime - lastKeyTime

        // If time between keystrokes is very small (< 50ms), it's likely a barcode scanner
        if (timeDiff < 50 && barcodeBuffer.length > 0) {
            setBarcodeBuffer(prev => prev + e.target.value.slice(-1))
        } else {
            setBarcodeBuffer(e.target.value.slice(-1))
        }

        setLastKeyTime(currentTime)
        setSerialInput(e.target.value)

        // Auto-add if it looks like a complete barcode scan (typically ends with Enter or has specific length)
        if (e.target.value.length >= 8 && timeDiff < 50) {
            setTimeout(() => {
                if (e.target.value.trim()) {
                    addSerialNumber()
                }
            }, 100)
        }
    }, [lastKeyTime, barcodeBuffer, addSerialNumber, productData.serialNumbers])

    const addModelToSelected = (model) => {
        if (!model) return
        if (productData.productForm.selectedModels.includes(model)) return
        updateProductData({
            productForm: {
                ...productData.productForm,
                selectedModels: [...productData.productForm.selectedModels, model]
            }
        })
        setSelectedModelToAdd("")
        setModelSuggestionIndex(-1)
    }

    const commissionPreview = useMemo(() => {
        const sellingPrice = Number.parseFloat(productData.productForm.sellingPrice) || 0
        const commissionValue = Number.parseFloat(productData.productForm.commissionValue) || 0

        if (sellingPrice === 0 || commissionValue === 0) return null

        if (productData.productForm.commissionType === "percent") {
            const amount = (sellingPrice * commissionValue) / 100
            return `₹${amount.toFixed(2)} (${commissionValue}%)`
        } else {
            const percent = (commissionValue / sellingPrice) * 100
            return `${percent.toFixed(2)}% (₹${commissionValue})`
        }
    }, [productData.productForm.sellingPrice, productData.productForm.commissionValue, productData.productForm.commissionType])

    const handleFinalSave = async () => {
        setIsSaving(true)
        setSaveSuccess(false)

        try {
            // Validation
            if (!productData.productForm.name.trim()) {
                throw new Error('Product name is required')
            }
            if (!productData.productForm.purchasePrice || parseFloat(productData.productForm.purchasePrice) <= 0) {
                throw new Error('Valid purchase price is required')
            }
            if (!productData.productForm.sellingPrice || parseFloat(productData.productForm.sellingPrice) <= 0) {
                throw new Error('Valid selling price is required')
            }
            if (productData.selectedCategory === null) {
                throw new Error('Category selection is required')
            }

            const token = localStorage.getItem('access_token')

            // Helper functions to get IDs
            const getCategoryId = () => {
                if (productData.selectedCategory === null) return null
                const categoryObj = categoriesData.find(cat => cat.name === categoryName)
                return categoryObj?.id || null
            }

            const getVendorId = () => {
                if (!productData.productForm.vendor) return null
                const vendorObj = vendorsData.find(vendor => vendor.name === productData.productForm.vendor)
                return vendorObj?.id || null
            }

            const getHsnId = () => {
                if (!productData.productForm.hsn || !hsnData || hsnData.length === 0) return null
                const hsnObj = hsnData.find(hsn => hsn.code === productData.productForm.hsn)
                return hsnObj?.id || null
            }

            // Build quantities array for branches
            const quantities = productData.productForm.selectedBranches.map(branchName => {
                const branchObj = branchesData.find(branch => branch.name === branchName)
                const qty = parseInt(productData.productForm.branchQuantities[branchName] || '0')
                return {
                    branch: branchObj?.id || null,
                    qty: qty
                }
            }).filter(q => q.branch !== null)

            // Helper functions to get all IDs
            const getSubcategoryId = () => {
                return productData.selectedSubcategoryId || null
            }

            const getBrandId = () => {
                return productData.selectedBrandId || null
            }

            const getSubBrandId = () => {
                return productData.selectedSubBrandId || null
            }

            const getModelId = () => {
                return productData.selectedModelId || null
            }

            const getTypeId = () => {
                return productData.selectedTypeId || productData.selectedGlassTypeId || null
            }

            // Build API payload with all required fields
            const apiPayload = {
                name: productData.productForm.name.trim(),
                category: getCategoryId(),
                subcategory: getSubcategoryId(),
                brand: getBrandId(),
                subbrand: getSubBrandId(),
                model: getModelId(),
                type: getTypeId(),
                vendor: getVendorId(),
                hsn: getHsnId(),
                purchase_price: parseFloat(productData.productForm.purchasePrice),
                selling_price: parseFloat(productData.productForm.sellingPrice),
                min_selling_price: parseFloat(productData.productForm.minSellingPrice) || parseFloat(productData.productForm.sellingPrice),
                min_qty_alert: parseInt(productData.productForm.minQtyAlert) || 5,
                commission_type: productData.productForm.commissionType === "percent" ? "percentage" : "fixed",
                commission_value: parseFloat(productData.productForm.commissionValue) || 0,
                status: "active",
                is_warranty_item: productData.hasWarranty || false,
                quantities: quantities
            }

            // Add warranty period if warranty is enabled
            if (productData.hasWarranty && productData.warrantyMonths) {
                apiPayload.warranty_period = productData.warrantyMonths.toString()
            }

            // Add serial numbers if warranty is enabled and serial numbers exist
            if (productData.hasWarranty && productData.serialNumbers && productData.serialNumbers.length > 0) {
                apiPayload.serial_numbers = productData.serialNumbers
            }

            console.log('Sending product data to API:', apiPayload)

            // Determine if this is an update or create operation
            const isUpdate = editMode && productData.productId
            const apiUrl = isUpdate 
                ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/update/${productData.productId}/`
                : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/create/`
            
            console.log(`${isUpdate ? 'Updating' : 'Creating'} product, API URL:`, apiUrl)

            // Call the API
            const response = await fetch(apiUrl, {
                method: isUpdate ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'omit',
                body: JSON.stringify(apiPayload)
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
            }

            const responseData = await response.json()
            console.log(`Product ${isUpdate ? 'updated' : 'created'} successfully:`, responseData)

            setSaveSuccess(true)

            toast({
                title: "Success",
                description: `Product "${productData.productForm.name}" ${isUpdate ? 'updated' : 'created'} successfully!`,
                variant: "default",
            })

            // Auto-print barcodes if available in response
            if (responseData.barcodes && Array.isArray(responseData.barcodes) && responseData.barcodes.length > 0) {
                console.log('Auto-printing barcodes:', responseData.barcodes)

                // Calculate total barcodes to print
                const totalBarcodes = responseData.barcodes.reduce((total, item) => {
                    return total + (parseInt(item.qty) || 0)
                }, 0)

                if (totalBarcodes > 0) {
                    setTimeout(() => {
                        try {
                            printBarcodes(responseData.barcodes)
                            toast({
                                title: "Barcodes Printing",
                                description: `Printing ${totalBarcodes} scannable barcodes for ${responseData.barcodes.length} branch(es)...`,
                                className: "bg-blue-50 border-blue-200 text-blue-800",
                            })
                        } catch (error) {
                            console.error('Barcode printing error:', error)
                            toast({
                                title: "Barcode Print Error",
                                description: `Failed to print barcodes: ${error.message || 'Unknown error'}`,
                                variant: "destructive",
                            })
                        }
                    }, 1500) // Small delay to let user see success message
                } else {
                    // Barcodes array exists but quantities are 0
                    setTimeout(() => {
                        toast({
                            title: "No Barcodes to Print",
                            description: `Product ${isUpdate ? 'updated' : 'created'} successfully but barcode quantities are zero.`,
                            className: "bg-yellow-50 border-yellow-200 text-yellow-800",
                        })
                    }, 1500)
                }
            } else {
                // No barcodes in response or invalid format
                setTimeout(() => {
                    toast({
                        title: "No Barcodes to Print",
                        description: `Product ${isUpdate ? 'updated' : 'created'} successfully but no barcodes were generated by the system.`,
                        className: "bg-yellow-50 border-yellow-200 text-yellow-800",
                    })
                }, 1500)
            }

            // Callback for parent
            if (typeof onSaved === "function") {
                const payload = {
                    category: categoryName,
                    subcategory: productData.selectedSubcategory,
                    gender: productData.selectedGender,
                    brand: productData.selectedBrand,
                    subBrand: productData.selectedSubBrand,
                    model: productData.selectedModel,
                    glassType: productData.selectedGlassType,
                    type: productData.selectedType,
                    form: { ...productData.productForm, serialNumbers: productData.serialNumbers, hasWarranty: productData.hasWarranty, warrantyMonths: productData.warrantyMonths },
                    apiResponse: responseData
                }
                onSaved(payload)
            }

            setTimeout(() => {
                setSaveSuccess(false)
                if (!editMode) {
                    resetForm()
                }
                if (typeof onClose === "function") onClose()
            }, 2000)

        } catch (error) {
            console.error('Error creating product:', error)
            setSaveSuccess(false)

            toast({
                title: "Error",
                description: `Failed to create product: ${error.message}`,
                variant: "destructive",
            })
        } finally {
            setIsSaving(false)
        }
    }

    const showModelsDropdown = categoryName === "Tuffun"
    const showCableType = (categoryName === "Earphone" || categoryName === "Headphone") && productData.selectedSubcategory === "Wired"
    const showChargerType = categoryName === "Charger"
    const showCapacity = categoryName === "Power Bank"

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-semibold text-foreground">Product Details</h3>
                <p className="text-sm text-muted-foreground">
                    Category: <span className="font-medium text-foreground">{categoryName}</span>
                    {productData.selectedSubcategory && (
                        <>
                            {" • "}
                            Subcategory: <span className="font-medium text-foreground">{productData.selectedSubcategory}</span>
                        </>
                    )}
                    {productData.selectedGender && (
                        <>
                            {" • "}
                            Gender: <span className="font-medium text-foreground capitalize">{productData.selectedGender}</span>
                        </>
                    )}
                    {productData.selectedBrand && (
                        <>
                            {" • "}
                            Brand: <span className="font-medium text-foreground">{productData.selectedBrand}</span>
                        </>
                    )}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm text-foreground">Product name</label>
                    <input
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                        value={productData.productForm.name}
                        onChange={(e) => updateProductData({
                            productForm: { ...productData.productForm, name: e.target.value }
                        })}
                        placeholder="Enter product name"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm text-foreground">HSN</label>
                    {hsnLoading ? (
                        <div className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                            Loading HSN codes...
                        </div>
                    ) : (
                        <select
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                            value={productData.productForm.hsn}
                            onChange={(e) => updateProductData({
                                productForm: { ...productData.productForm, hsn: e.target.value }
                            })}
                        >
                            <option value="">Select HSN</option>
                            {hsnData.map((hsn) => (
                                <option key={hsn.id} value={hsn.code}>
                                    {hsn.code} - {hsn.description || 'No description'}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm text-foreground">Vendor</label>
                    {vendorsLoading ? (
                        <div className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                            Loading vendors...
                        </div>
                    ) : (
                        <select
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                            value={productData.productForm.vendor}
                            onChange={(e) => updateProductData({
                                productForm: { ...productData.productForm, vendor: e.target.value }
                            })}
                        >
                            <option value="">Select vendor</option>
                            {vendorsData.map((vendor) => (
                                <option key={vendor.id} value={vendor.name}>
                                    {vendor.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {showModelsDropdown && (
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm text-foreground">Models</label>
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Type to search models..."
                                    value={selectedModelToAdd}
                                    onChange={(e) => setSelectedModelToAdd(e.target.value)}
                                />
                                <Button
                                    type="button"
                                    onClick={() => addModelToSelected(selectedModelToAdd)}
                                    disabled={!selectedModelToAdd}
                                >
                                    Add
                                </Button>
                            </div>

                            {productData.productForm.selectedModels.length > 0 && (
                                <div className="flex flex-wrap gap-2 rounded-md border border-border bg-muted/30 p-2">
                                    {productData.productForm.selectedModels.map((model, idx) => (
                                        <div
                                            key={idx}
                                            className="inline-flex items-center gap-1.5 rounded bg-background px-2.5 py-1.5 text-sm border border-border"
                                        >
                                            <span className="text-foreground">{model}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-4 w-4 hover:bg-destructive/10"
                                                onClick={() => {
                                                    updateProductData({
                                                        productForm: {
                                                            ...productData.productForm,
                                                            selectedModels: productData.productForm.selectedModels.filter((m) => m !== model)
                                                        }
                                                    })
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {showCableType && (
                    <div className="space-y-2">
                        <label className="text-sm text-foreground">Cable Type</label>
                        <select
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                            value={productData.productForm.cableType}
                            onChange={(e) => updateProductData({
                                productForm: { ...productData.productForm, cableType: e.target.value }
                            })}
                        >
                            <option value="">Select type</option>
                            <option value="TypeC">Type C</option>
                            <option value="Lightning">Lightning</option>
                        </select>
                    </div>
                )}

                {showChargerType && (
                    <div className="space-y-2">
                        <label className="text-sm text-foreground">Charger Type</label>
                        <select
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                            value={productData.productForm.chargerType}
                            onChange={(e) => updateProductData({
                                productForm: { ...productData.productForm, chargerType: e.target.value }
                            })}
                        >
                            <option value="">Select type</option>
                            <option value="TypeC">Type C</option>
                            <option value="Lightning">Lightning</option>
                        </select>
                    </div>
                )}

                {showCapacity && (
                    <div className="space-y-2">
                        <label className="text-sm text-foreground">Capacity</label>
                        <select
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                            value={productData.productForm.capacity}
                            onChange={(e) => updateProductData({
                                productForm: { ...productData.productForm, capacity: e.target.value }
                            })}
                        >
                            <option value="">Select capacity</option>
                            <option value="3000mAh">3000mAh</option>
                            <option value="5000mAh">5000mAh</option>
                            <option value="10000mAh">10000mAh</option>
                            <option value="20000mAh">20000mAh</option>
                        </select>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm text-foreground flex items-center gap-2">
                        <span>Warranty</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={productData.hasWarranty}
                                onChange={(e) => {
                                    updateProductData({
                                        hasWarranty: e.target.checked,
                                        warrantyMonths: e.target.checked ? productData.warrantyMonths : "",
                                        serialNumbers: e.target.checked ? productData.serialNumbers : []
                                    })
                                }}
                            />
                            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </label>
                    {productData.hasWarranty && (
                        <select
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                            value={productData.warrantyMonths}
                            onChange={(e) => updateProductData({ warrantyMonths: e.target.value })}
                        >
                            <option value="">Select warranty period</option>
                            <option value="3">3 Months</option>
                            <option value="6">6 Months</option>
                            <option value="9">9 Months</option>
                            <option value="12">12 Months</option>
                        </select>
                    )}
                </div>

                {productData.hasWarranty && (
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm text-foreground">Serial number</label>
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <input
                                    ref={serialInputRef}
                                    className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                                    value={serialInput}
                                    onChange={handleSerialInput}
                                    onKeyDown={handleSerialKeyDown}
                                    placeholder="Scan barcode or type serial number and press Enter"
                                    autoComplete="off"
                                />
                                <Button type="button" onClick={addSerialNumber} disabled={!serialInput.trim()}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            {productData.serialNumbers.length > 0 && (
                                <div className="flex flex-wrap gap-2 rounded-md border border-border bg-muted/30 p-2 max-h-40 overflow-y-auto">
                                    {productData.serialNumbers.map((serial, idx) => (
                                        <div
                                            key={idx}
                                            className="inline-flex items-center gap-1.5 rounded bg-background px-2.5 py-1.5 text-sm border border-border"
                                        >
                                            <span className="font-mono text-foreground">{serial}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-4 w-4 hover:bg-destructive/10"
                                                onClick={() => removeSerialNumber(idx)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm text-foreground">Purchase price</label>
                    <input
                        type="number"
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                        value={productData.productForm.purchasePrice}
                        onChange={(e) => updateProductData({
                            productForm: { ...productData.productForm, purchasePrice: e.target.value }
                        })}
                        placeholder="0"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm text-foreground">Selling price</label>
                    <input
                        type="number"
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                        value={productData.productForm.sellingPrice}
                        onChange={(e) => updateProductData({
                            productForm: { ...productData.productForm, sellingPrice: e.target.value }
                        })}
                        placeholder="0"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm text-foreground">Minimum selling price</label>
                    <input
                        type="number"
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                        value={productData.productForm.minSellingPrice}
                        onChange={(e) => updateProductData({
                            productForm: { ...productData.productForm, minSellingPrice: e.target.value }
                        })}
                        placeholder="0"
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm text-foreground">Branches</label>
                    {branchesLoading ? (
                        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                            Loading branches...
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {branches.map((b) => {
                                const checked = productData.productForm.selectedBranches.includes(b)
                                return (
                                    <label
                                        key={b}
                                        className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 accent-primary"
                                            checked={checked}
                                            onChange={(e) => {
                                                const isChecked = e.target.checked
                                                const nextSelected = isChecked
                                                    ? [...productData.productForm.selectedBranches, b]
                                                    : productData.productForm.selectedBranches.filter((x) => x !== b)
                                                const nextQty = { ...productData.productForm.branchQuantities }
                                                if (isChecked) {
                                                    if (nextQty[b] == null) nextQty[b] = "0"
                                                } else {
                                                    delete nextQty[b]
                                                }
                                                updateProductData({
                                                    productForm: {
                                                        ...productData.productForm,
                                                        selectedBranches: nextSelected,
                                                        branchQuantities: nextQty
                                                    }
                                                })
                                            }}
                                        />
                                        <span className="text-sm text-foreground">{b}</span>
                                    </label>
                                )
                            })}
                        </div>
                    )}
                </div>

                {productData.productForm.selectedBranches.length > 0 && (
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm text-foreground">Quantities per branch</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {productData.productForm.selectedBranches.map((b) => (
                                <div key={b} className="space-y-1">
                                    <div className="text-xs text-muted-foreground">{b}</div>
                                    <input
                                        type="number"
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                                        value={productData.productForm.branchQuantities[b] ?? "0"}
                                        onChange={(e) =>
                                            updateProductData({
                                                productForm: {
                                                    ...productData.productForm,
                                                    branchQuantities: { ...productData.productForm.branchQuantities, [b]: e.target.value }
                                                }
                                            })
                                        }
                                        placeholder="0"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm text-foreground">Minimum quantity alert</label>
                    <input
                        type="number"
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                        value={productData.productForm.minQtyAlert}
                        onChange={(e) => updateProductData({
                            productForm: { ...productData.productForm, minQtyAlert: e.target.value }
                        })}
                        placeholder="0"
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm text-foreground">Commission</label>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button
                            type="button"
                            variant={productData.productForm.commissionType === "fixed" ? "default" : "secondary"}
                            onClick={() => updateProductData({
                                productForm: { ...productData.productForm, commissionType: "fixed" }
                            })}
                        >
                            ₹
                        </Button>
                        <Button
                            type="button"
                            variant={productData.productForm.commissionType === "percent" ? "default" : "secondary"}
                            onClick={() => updateProductData({
                                productForm: { ...productData.productForm, commissionType: "percent" }
                            })}
                        >
                            %
                        </Button>
                        <input
                            type="number"
                            className="w-48 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                            value={productData.productForm.commissionValue}
                            onChange={(e) => updateProductData({
                                productForm: { ...productData.productForm, commissionValue: e.target.value }
                            })}
                            placeholder={productData.productForm.commissionType === "percent" ? "Percent" : "Amount"}
                        />
                        {commissionPreview && (
                            <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                                Preview: <span className="font-medium text-foreground">{commissionPreview}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">Review and save product</div>
                <div className="flex gap-2">
                    {!editMode && (
                        <Button variant="secondary" onClick={prevStep}>
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Back
                        </Button>
                    )}
                    <Button onClick={handleFinalSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save Product"}
                        {saveSuccess && <Check className="h-4 w-4 ml-1" />}
                    </Button>
                </div>
            </div>
        </div>
    )
}