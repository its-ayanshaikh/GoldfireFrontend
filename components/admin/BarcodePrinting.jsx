"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Printer, Package, Building2, Hash, Loader2 } from "lucide-react"
import { useToast } from "../../hooks/use-toast"
import JsBarcode from "jsbarcode"

const BarcodePrinting = () => {
    const { toast } = useToast()
    
    // State
    const [categories, setCategories] = useState([])
    const [products, setProducts] = useState([])
    const [purchaseHistory, setPurchaseHistory] = useState([]) // Purchase history for selected product
    
    const [selectedCategory, setSelectedCategory] = useState("")
    const [selectedProduct, setSelectedProduct] = useState("")
    const [selectedProductLabel, setSelectedProductLabel] = useState("")
    const [selectedPurchase, setSelectedPurchase] = useState("") // Selected purchase item
    const [selectedPurchaseLabel, setSelectedPurchaseLabel] = useState("")
    const [quantity, setQuantity] = useState(1)
    
    // Loading states
    const [categoriesLoading, setCategoriesLoading] = useState(true)
    const [productsLoading, setProductsLoading] = useState(false)
    const [productsLoadingMore, setProductsLoadingMore] = useState(false)
    const [purchaseLoading, setPurchaseLoading] = useState(false)
    const [purchaseLoadingMore, setPurchaseLoadingMore] = useState(false)
    const [printing, setPrinting] = useState(false)

    // Dropdown search state
    const [productSearch, setProductSearch] = useState("")
    const [purchaseSearch, setPurchaseSearch] = useState("")
    const [productSearchDebounced, setProductSearchDebounced] = useState("")
    const [purchaseSearchDebounced, setPurchaseSearchDebounced] = useState("")
    const [showProductDropdown, setShowProductDropdown] = useState(false)
    const [showPurchaseDropdown, setShowPurchaseDropdown] = useState(false)
    const [productFocusIndex, setProductFocusIndex] = useState(-1)
    const [purchaseFocusIndex, setPurchaseFocusIndex] = useState(-1)

    // Pagination state
    const [productsNext, setProductsNext] = useState(null)
    const [productsPage, setProductsPage] = useState(1)
    const [purchaseNext, setPurchaseNext] = useState(null)
    const [purchasePage, setPurchasePage] = useState(1)

    const productDropdownRef = useRef(null)
    const purchaseDropdownRef = useRef(null)
    const productListRef = useRef(null)
    const purchaseListRef = useRef(null)
    const productItemRefs = useRef([])
    const purchaseItemRefs = useRef([])
    const productSearchTimer = useRef(null)
    const purchaseSearchTimer = useRef(null)

    const normalizePaginated = (data) => {
        const nestedResults = data?.results?.results
        const nestedData = data?.results?.data
        const nestedItems = data?.results?.items
        const list = Array.isArray(nestedResults)
            ? nestedResults
            : Array.isArray(nestedData)
                ? nestedData
                : Array.isArray(nestedItems)
                    ? nestedItems
                    : Array.isArray(data?.results)
                        ? data.results
                        : Array.isArray(data?.data)
                            ? data.data
                            : Array.isArray(data)
                                ? data
                                : []

        return {
            items: list,
            next: data?.next ?? data?.results?.next ?? null,
            count: data?.count ?? data?.results?.count ?? list.length
        }
    }

    const mergeById = (prev, nextItems, idKey = "id") => {
        const map = new Map()
        prev.forEach((item) => map.set(String(item[idKey]), item))
        nextItems.forEach((item) => map.set(String(item[idKey]), item))
        return Array.from(map.values())
    }

    const getProductLabel = (product) => {
        if (!product) return ""
        const brand = product.brand ? `${product.brand} ` : ""
        return `${brand}${product.name || ""}`.trim()
    }

    const getPurchaseLabel = (purchase) => {
        if (!purchase) return ""
        const variantLabel = purchase.variant ? `${purchase.variant.name} - ` : ""
        return `${variantLabel}${purchase.vendor_name || ""} - ₹${Number(purchase.selling_price || 0).toLocaleString()}`
    }

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const token = localStorage.getItem('access_token')
                setCategoriesLoading(true)
                
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/product/categories/`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    credentials: 'omit',
                })

                if (response.ok) {
                    const data = await response.json()
                    setCategories(data.results || data)
                } else {
                    throw new Error('Failed to fetch categories')
                }
            } catch (error) {
                console.error('Error fetching categories:', error)
                toast({
                    title: "Error",
                    description: "Failed to load categories",
                    variant: "destructive",
                })
            } finally {
                setCategoriesLoading(false)
            }
        }

        fetchCategories()
    }, [])

    // Fetch products when category changes
    useEffect(() => {
        if (productSearchTimer.current) {
            clearTimeout(productSearchTimer.current)
        }
        productSearchTimer.current = setTimeout(() => {
            setProductSearchDebounced(productSearch)
        }, 300)

        return () => clearTimeout(productSearchTimer.current)
    }, [productSearch])

    useEffect(() => {
        if (purchaseSearchTimer.current) {
            clearTimeout(purchaseSearchTimer.current)
        }
        purchaseSearchTimer.current = setTimeout(() => {
            setPurchaseSearchDebounced(purchaseSearch)
        }, 300)

        return () => clearTimeout(purchaseSearchTimer.current)
    }, [purchaseSearch])

    useEffect(() => {
        if (!selectedCategory) {
            setProducts([])
            setSelectedProduct("")
            setSelectedProductLabel("")
            setPurchaseHistory([])
            setSelectedPurchase("")
            setSelectedPurchaseLabel("")
            setProductSearch("")
            setPurchaseSearch("")
            setProductsNext(null)
            setProductsPage(1)
            return
        }

        const fetchProducts = async (page = 1, replace = false) => {
            try {
                const token = localStorage.getItem('access_token')
                if (page === 1) {
                    setProductsLoading(true)
                } else {
                    setProductsLoadingMore(true)
                }
                if (page === 1) {
                    setSelectedProduct("")
                    setSelectedProductLabel("")
                    setPurchaseHistory([])
                    setSelectedPurchase("")
                    setSelectedPurchaseLabel("")
                }

                const params = new URLSearchParams()
                params.append("page", String(page))
                params.append("page_size", "20")
                if (productSearchDebounced.trim()) {
                    params.append("search", productSearchDebounced.trim())
                }

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/barcode/${selectedCategory}/products/?${params.toString()}`,
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
                    const { items, next } = normalizePaginated(data)
                    setProducts((prev) => replace ? items : mergeById(prev, items))
                    setProductsNext(next)
                    setProductsPage(page)
                } else {
                    throw new Error('Failed to fetch products')
                }
            } catch (error) {
                console.error('Error fetching products:', error)
                toast({
                    title: "Error",
                    description: "Failed to load products for this category",
                    variant: "destructive",
                })
            } finally {
                setProductsLoading(false)
                setProductsLoadingMore(false)
            }
        }

        fetchProducts(1, true)
    }, [selectedCategory, productSearchDebounced])

    // Fetch purchase history when product changes
    useEffect(() => {
        if (!selectedProduct) {
            setPurchaseHistory([])
            setSelectedPurchase("")
            setSelectedPurchaseLabel("")
            setPurchaseSearch("")
            setPurchaseNext(null)
            setPurchasePage(1)
            return
        }

        const fetchPurchaseHistory = async (page = 1, replace = false) => {
            try {
                const token = localStorage.getItem('access_token')
                if (page === 1) {
                    setPurchaseLoading(true)
                } else {
                    setPurchaseLoadingMore(true)
                }
                if (page === 1) {
                    setSelectedPurchase("")
                    setSelectedPurchaseLabel("")
                }

                const params = new URLSearchParams()
                params.append("page", String(page))
                params.append("page_size", "20")
                if (purchaseSearchDebounced.trim()) {
                    params.append("search", purchaseSearchDebounced.trim())
                }

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/barcode/${selectedProduct}/purchases/?${params.toString()}`,
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
                    console.log('Purchase history response:', data)
                    const { items, next } = normalizePaginated(data)
                    setPurchaseHistory((prev) => replace ? items : mergeById(prev, items, "purchase_item_id"))
                    setPurchaseNext(next)
                    setPurchasePage(page)
                } else {
                    throw new Error('Failed to fetch purchase history')
                }
            } catch (error) {
                console.error('Error fetching purchase history:', error)
                toast({
                    title: "Error",
                    description: "Failed to load purchase history",
                    variant: "destructive",
                })
            } finally {
                setPurchaseLoading(false)
                setPurchaseLoadingMore(false)
            }
        }

        fetchPurchaseHistory(1, true)
    }, [selectedProduct, purchaseSearchDebounced])

    useEffect(() => {
        if (!showProductDropdown) return
        if (productFocusIndex < 0) return
        const node = productItemRefs.current[productFocusIndex]
        if (node && node.scrollIntoView) {
            node.scrollIntoView({ block: "nearest" })
        }
    }, [productFocusIndex, showProductDropdown])

    useEffect(() => {
        if (!showPurchaseDropdown) return
        if (purchaseFocusIndex < 0) return
        const node = purchaseItemRefs.current[purchaseFocusIndex]
        if (node && node.scrollIntoView) {
            node.scrollIntoView({ block: "nearest" })
        }
    }, [purchaseFocusIndex, showPurchaseDropdown])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (productDropdownRef.current && !productDropdownRef.current.contains(event.target)) {
                setShowProductDropdown(false)
            }
            if (purchaseDropdownRef.current && !purchaseDropdownRef.current.contains(event.target)) {
                setShowPurchaseDropdown(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelectProduct = (product) => {
        setSelectedProduct(product.id.toString())
        setSelectedProductLabel(getProductLabel(product))
        setShowProductDropdown(false)
        setProductSearch("")
        setProductFocusIndex(-1)
    }

    const handleSelectPurchase = (purchase) => {
        setSelectedPurchase(purchase.purchase_item_id.toString())
        setSelectedPurchaseLabel(getPurchaseLabel(purchase))
        setShowPurchaseDropdown(false)
        setPurchaseSearch("")
        setPurchaseFocusIndex(-1)
    }

    const handleProductKeyDown = (event) => {
        if (!showProductDropdown) {
            if (event.key === 'Enter' || event.key === 'ArrowDown') {
                event.preventDefault()
                setShowProductDropdown(true)
                setProductFocusIndex(0)
            }
            return
        }

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault()
                setProductFocusIndex((prev) =>
                    prev < products.length - 1 ? prev + 1 : prev
                )
                break
            case 'ArrowUp':
                event.preventDefault()
                setProductFocusIndex((prev) =>
                    prev > 0 ? prev - 1 : 0
                )
                break
            case 'Enter':
                event.preventDefault()
                if (productFocusIndex >= 0 && products[productFocusIndex]) {
                    handleSelectProduct(products[productFocusIndex])
                }
                break
            case 'Escape':
                event.preventDefault()
                setShowProductDropdown(false)
                setProductFocusIndex(-1)
                break
        }
    }

    const handlePurchaseKeyDown = (event) => {
        if (!showPurchaseDropdown) {
            if (event.key === 'Enter' || event.key === 'ArrowDown') {
                event.preventDefault()
                setShowPurchaseDropdown(true)
                setPurchaseFocusIndex(0)
            }
            return
        }

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault()
                setPurchaseFocusIndex((prev) =>
                    prev < purchaseHistory.length - 1 ? prev + 1 : prev
                )
                break
            case 'ArrowUp':
                event.preventDefault()
                setPurchaseFocusIndex((prev) =>
                    prev > 0 ? prev - 1 : 0
                )
                break
            case 'Enter':
                event.preventDefault()
                if (purchaseFocusIndex >= 0 && purchaseHistory[purchaseFocusIndex]) {
                    handleSelectPurchase(purchaseHistory[purchaseFocusIndex])
                }
                break
            case 'Escape':
                event.preventDefault()
                setShowPurchaseDropdown(false)
                setPurchaseFocusIndex(-1)
                break
        }
    }

    const handleProductScroll = (event) => {
        const target = event.currentTarget
        if (!productsNext || productsLoadingMore) return
        if (target.scrollTop + target.clientHeight >= target.scrollHeight - 40) {
            const nextPage = productsPage + 1
            setProductsLoadingMore(true)
            const fetchNext = async () => {
                try {
                    const token = localStorage.getItem('access_token')
                    const params = new URLSearchParams()
                    params.append("page", String(nextPage))
                    params.append("page_size", "20")
                    if (productSearchDebounced.trim()) {
                        params.append("search", productSearchDebounced.trim())
                    }
                    const response = await fetch(
                        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/barcode/${selectedCategory}/products/?${params.toString()}`,
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
                        const { items, next } = normalizePaginated(data)
                        setProducts((prev) => mergeById(prev, items))
                        setProductsNext(next)
                        setProductsPage(nextPage)
                    }
                } catch (error) {
                    console.error('Error fetching more products:', error)
                } finally {
                    setProductsLoadingMore(false)
                }
            }
            fetchNext()
        }
    }

    const handlePurchaseScroll = (event) => {
        const target = event.currentTarget
        if (!purchaseNext || purchaseLoadingMore) return
        if (target.scrollTop + target.clientHeight >= target.scrollHeight - 40) {
            const nextPage = purchasePage + 1
            setPurchaseLoadingMore(true)
            const fetchNext = async () => {
                try {
                    const token = localStorage.getItem('access_token')
                    const params = new URLSearchParams()
                    params.append("page", String(nextPage))
                    params.append("page_size", "20")
                    if (purchaseSearchDebounced.trim()) {
                        params.append("search", purchaseSearchDebounced.trim())
                    }
                    const response = await fetch(
                        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/barcode/${selectedProduct}/purchases/?${params.toString()}`,
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
                        const { items, next } = normalizePaginated(data)
                        setPurchaseHistory((prev) => mergeById(prev, items, "purchase_item_id"))
                        setPurchaseNext(next)
                        setPurchasePage(nextPage)
                    }
                } catch (error) {
                    console.error('Error fetching more purchase items:', error)
                } finally {
                    setPurchaseLoadingMore(false)
                }
            }
            fetchNext()
        }
    }

    // Print barcodes function - optimized for 38mm x 38mm 2-ups thermal printer
    const printBarcodes = (barcodeData) => {
        const { barcode, selling_price, product_name, variant, variant_name } = barcodeData
        const qty = parseInt(quantity) || 1

        // Validate barcode
        if (!barcode) {
            toast({
                title: "Error",
                description: "Invalid barcode received from server",
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
                // Settings optimized for thermal printer + scanner
                JsBarcode(canvas, barcode, {
                    format: "CODE128",
                    width: 3,               // Wider bars = easier to scan
                    height: 80,             // Taller = better scan angle tolerance
                    displayValue: false,
                    margin: 15,             // Large quiet zone = CRITICAL for scanning
                    lineColor: "#000000",
                    background: "#ffffff"
                })
                // Use higher quality PNG export
                barcodeImages.push(canvas.toDataURL('image/png', 1.0))
            } catch (error) {
                console.error('Barcode generation error:', error)
                // Fallback: Try CODE39 if CODE128 fails (for special characters)
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

        const variantLabel = variant?.name || variant_name
        const displayName = variantLabel
            ? `${product_name || ""} - ${variantLabel}`.trim()
            : (product_name || "")

        // Get logo path
        const logoPath = window.location.origin + '/barcode_logo.jpg'

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
                    .item-name {
                        font-size: 8pt;
                        font-weight: bold;
                        text-transform: uppercase;
                        color: #000;
                        max-width: 36mm;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
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
                    <div class="item-name">${displayName}</div>
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
                        <div class="item-name">${displayName}</div>
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

    // Handle print button click
    const handlePrint = async () => {
        if (!selectedProduct || !selectedPurchase || !quantity) {
            toast({
                title: "Missing Fields",
                description: "Please select product, purchase item and enter quantity",
                variant: "destructive",
            })
            return
        }

        if (quantity < 1) {
            toast({
                title: "Invalid Quantity",
                description: "Quantity must be at least 1",
                variant: "destructive",
            })
            return
        }

        try {
            const token = localStorage.getItem('access_token')
            setPrinting(true)

            // Get selected purchase details
            const purchaseItem = purchaseHistory.find(p => p.purchase_item_id.toString() === selectedPurchase)
            
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/barcode/create/?product_id=${selectedProduct}&purchase_item_id=${selectedPurchase}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    credentials: 'omit',
                }
            )

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.message || 'Failed to generate barcode')
            }

            const responseData = await response.json()
            console.log('Barcode API response:', responseData)

            // Response format: { status: true, data: { barcode, product_name, selling_price, branch_name } }
            if (!responseData.status || !responseData.data) {
                throw new Error('Invalid response from server')
            }

            // Print the barcodes using data from response
            printBarcodes(responseData.data)

            toast({
                title: "Success",
                description: `Printing ${quantity} barcode(s)...`,
            })

        } catch (error) {
            console.error('Error generating barcode:', error)
            toast({
                title: "Error",
                description: error.message || "Failed to generate barcode",
                variant: "destructive",
            })
        } finally {
            setPrinting(false)
        }
    }

    // Reset form
    const handleReset = () => {
        setSelectedCategory("")
        setSelectedProduct("")
        setSelectedProductLabel("")
        setSelectedPurchase("")
        setSelectedPurchaseLabel("")
        setQuantity(1)
        setProducts([])
        setPurchaseHistory([])
        setProductSearch("")
        setPurchaseSearch("")
        setShowProductDropdown(false)
        setShowPurchaseDropdown(false)
    }

    return (
        <div className="p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Printer className="h-5 w-5" />
                        Barcode Printing
                    </CardTitle>
                    <CardDescription>
                        Generate and print barcodes for products (38mm x 38mm TVS Thermal Printer)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Category Selection */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Category
                        </Label>
                        <Select
                            value={selectedCategory}
                            onValueChange={setSelectedCategory}
                            disabled={categoriesLoading}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select Category"} />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id.toString()}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Product Selection */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Product
                        </Label>
                        <div className="relative" ref={productDropdownRef}>
                            <button
                                type="button"
                                onClick={() => setShowProductDropdown(!showProductDropdown)}
                                onKeyDown={handleProductKeyDown}
                                disabled={!selectedCategory || productsLoading}
                                className="w-full flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent disabled:opacity-50"
                            >
                                <span className={selectedProduct ? "" : "text-muted-foreground"}>
                                    {selectedProduct
                                        ? selectedProductLabel || getProductLabel(products.find((product) => product.id.toString() === selectedProduct))
                                        : (!selectedCategory
                                            ? "Select category first"
                                            : productsLoading
                                                ? "Loading products..."
                                                : products.length === 0
                                                    ? "No products in this category"
                                                    : "Select product")}
                                </span>
                                <span className="text-muted-foreground">▼</span>
                            </button>

                            {showProductDropdown && (
                                <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-[320px] flex flex-col">
                                    <div className="p-2 border-b bg-background">
                                        <Input
                                            type="text"
                                            placeholder="Search product..."
                                            value={productSearch}
                                            onChange={(event) => {
                                                const value = event.target.value
                                                setProductSearch(value)
                                                setProductFocusIndex(0)
                                            }}
                                            onKeyDown={handleProductKeyDown}
                                            className="h-8"
                                            autoFocus
                                        />
                                    </div>
                                    <div
                                        ref={productListRef}
                                        onScroll={handleProductScroll}
                                        className="overflow-y-auto flex-1"
                                    >
                                        {products.length > 0 ? (
                                            products.map((product, idx) => (
                                                <div
                                                    key={product.id}
                                                    ref={(node) => {
                                                        productItemRefs.current[idx] = node
                                                    }}
                                                    onClick={() => handleSelectProduct(product)}
                                                    className={`px-3 py-2 cursor-pointer text-sm ${
                                                        selectedProduct === product.id.toString()
                                                            ? 'bg-primary/20 text-primary font-medium'
                                                            : idx === productFocusIndex
                                                                ? 'bg-accent'
                                                                : 'hover:bg-accent'
                                                    }`}
                                                >
                                                    {getProductLabel(product)}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                                                {productsLoading ? "Loading products..." : "No products found"}
                                            </div>
                                        )}
                                        {productsLoadingMore && (
                                            <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                                                Loading more...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Purchase History Selection */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Purchase Item (Variant / Vendor / Price)
                        </Label>
                        <div className="relative" ref={purchaseDropdownRef}>
                            <button
                                type="button"
                                onClick={() => setShowPurchaseDropdown(!showPurchaseDropdown)}
                                onKeyDown={handlePurchaseKeyDown}
                                disabled={!selectedProduct || purchaseLoading}
                                className="w-full flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent disabled:opacity-50"
                            >
                                <span className={selectedPurchase ? "" : "text-muted-foreground"}>
                                    {selectedPurchase
                                        ? selectedPurchaseLabel || getPurchaseLabel(purchaseHistory.find((purchase) => purchase.purchase_item_id.toString() === selectedPurchase))
                                        : (!selectedProduct
                                            ? "Select product first"
                                            : purchaseLoading
                                                ? "Loading purchase history..."
                                                : purchaseHistory.length === 0
                                                    ? "No purchase history found"
                                                    : "Select purchase item")}
                                </span>
                                <span className="text-muted-foreground">▼</span>
                            </button>

                            {showPurchaseDropdown && (
                                <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-[320px] flex flex-col">
                                    <div className="p-2 border-b bg-background">
                                        <Input
                                            type="text"
                                            placeholder="Search purchase item..."
                                            value={purchaseSearch}
                                            onChange={(event) => {
                                                const value = event.target.value
                                                setPurchaseSearch(value)
                                                setPurchaseFocusIndex(0)
                                            }}
                                            onKeyDown={handlePurchaseKeyDown}
                                            className="h-8"
                                            autoFocus
                                        />
                                    </div>
                                    <div
                                        ref={purchaseListRef}
                                        onScroll={handlePurchaseScroll}
                                        className="overflow-y-auto flex-1"
                                    >
                                        {purchaseHistory.length > 0 ? (
                                            purchaseHistory.map((purchase, idx) => (
                                                <div
                                                    key={purchase.purchase_item_id}
                                                    ref={(node) => {
                                                        purchaseItemRefs.current[idx] = node
                                                    }}
                                                    onClick={() => handleSelectPurchase(purchase)}
                                                    className={`px-3 py-2 cursor-pointer text-sm ${
                                                        selectedPurchase === purchase.purchase_item_id.toString()
                                                            ? 'bg-primary/20 text-primary font-medium'
                                                            : idx === purchaseFocusIndex
                                                                ? 'bg-accent'
                                                                : 'hover:bg-accent'
                                                    }`}
                                                >
                                                    {getPurchaseLabel(purchase)}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                                                {purchaseLoading ? "Loading purchase history..." : "No purchase history found"}
                                            </div>
                                        )}
                                        {purchaseLoadingMore && (
                                            <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                                                Loading more...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        {purchaseHistory.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                                {purchaseHistory.length} purchase item(s) available
                            </p>
                        )}
                    </div>

                    {/* Quantity Input */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Hash className="h-4 w-4" />
                            Quantity
                        </Label>
                        <Input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                            placeholder="Enter quantity"
                            className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                            Number of barcode labels to print
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            onClick={handlePrint}
                            disabled={!selectedProduct || !selectedPurchase || !quantity || printing}
                            className="flex-1"
                        >
                            {printing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print Barcode
                                </>
                            )}
                        </Button>
                        <Button variant="outline" onClick={handleReset}>
                            Reset
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Print Settings Info</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="p-3 bg-muted/50 rounded-lg text-center">
                            <p className="text-muted-foreground">Label Size</p>
                            <p className="font-semibold">38mm x 38mm</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg text-center">
                            <p className="text-muted-foreground">Printer Type</p>
                            <p className="font-semibold">TVS Thermal</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg text-center">
                            <p className="text-muted-foreground">Barcode Format</p>
                            <p className="font-semibold">CODE128</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg text-center">
                            <p className="text-muted-foreground">Content</p>
                            <p className="font-semibold">Branch, Price, Code</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default BarcodePrinting
