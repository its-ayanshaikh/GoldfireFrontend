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
    const [branches, setBranches] = useState([])
    
    const [selectedCategory, setSelectedCategory] = useState("")
    const [selectedProduct, setSelectedProduct] = useState("")
    const [selectedBranch, setSelectedBranch] = useState("")
    const [quantity, setQuantity] = useState(1)
    
    // Loading states
    const [categoriesLoading, setCategoriesLoading] = useState(true)
    const [productsLoading, setProductsLoading] = useState(false)
    const [branchesLoading, setBranchesLoading] = useState(true)
    const [printing, setPrinting] = useState(false)

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

    // Fetch branches on mount
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const token = localStorage.getItem('access_token')
                setBranchesLoading(true)
                
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
                    setBranches(data.results || data)
                } else {
                    throw new Error('Failed to fetch branches')
                }
            } catch (error) {
                console.error('Error fetching branches:', error)
                toast({
                    title: "Error",
                    description: "Failed to load branches",
                    variant: "destructive",
                })
            } finally {
                setBranchesLoading(false)
            }
        }

        fetchBranches()
    }, [])

    // Fetch products when category changes
    useEffect(() => {
        if (!selectedCategory) {
            setProducts([])
            setSelectedProduct("")
            return
        }

        const fetchProducts = async () => {
            try {
                const token = localStorage.getItem('access_token')
                setProductsLoading(true)
                setSelectedProduct("")
                
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/barcode/${selectedCategory}/products/`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    credentials: 'omit',
                })

                if (response.ok) {
                    const data = await response.json()
                    // Response format: { status: true, count: X, data: [...] }
                    setProducts(data.data || data.results || data)
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
            }
        }

        fetchProducts()
    }, [selectedCategory])

    // Print barcodes function - optimized for 38mm x 38mm 2-ups thermal printer
    const printBarcodes = (barcodeData) => {
        const { barcode, branch_name, selling_price, product_name } = barcodeData
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
                    <div class="branch-name">${branch_name || 'GOLDFIRE'}</div>
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
                        <div class="branch-name">${branch_name || 'GOLDFIRE'}</div>
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
        if (!selectedProduct || !selectedBranch || !quantity) {
            toast({
                title: "Missing Fields",
                description: "Please select product, branch and enter quantity",
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

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/barcode/create/?product_id=${selectedProduct}&branch_id=${selectedBranch}`,
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
        setSelectedBranch("")
        setQuantity(1)
        setProducts([])
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
                        <Select
                            value={selectedProduct}
                            onValueChange={setSelectedProduct}
                            disabled={!selectedCategory || productsLoading}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue 
                                    placeholder={
                                        !selectedCategory 
                                            ? "Select category first" 
                                            : productsLoading 
                                                ? "Loading products..." 
                                                : products.length === 0 
                                                    ? "No products in this category"
                                                    : "Select Product"
                                    } 
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map((product) => (
                                    <SelectItem key={product.id} value={product.id.toString()}>
                                        {product.name} - ₹{Number(product.selling_price || 0).toLocaleString()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Branch Selection */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Branch
                        </Label>
                        <Select
                            value={selectedBranch}
                            onValueChange={setSelectedBranch}
                            disabled={branchesLoading}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={branchesLoading ? "Loading branches..." : "Select Branch"} />
                            </SelectTrigger>
                            <SelectContent>
                                {branches.map((branch) => (
                                    <SelectItem key={branch.id} value={branch.id.toString()}>
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                            disabled={!selectedProduct || !selectedBranch || !quantity || printing}
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
