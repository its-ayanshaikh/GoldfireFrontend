"use client"

import { useState, useEffect } from "react"
import SearchBar from "./SearchBar"
import Cart from "./Cart"
import SalespersonSelect from "./SalespersonSelect"
import DiscountControl from "./DiscountControl"
import GSTToggle from "./GSTToggle"
import BillSummary from "./BillSummary"
import { ShoppingCart, User, Phone, CreditCard, Wallet, Split, Clock, X, Building2, AlertTriangle, Loader2 } from "lucide-react"
import { useToast } from "../../hooks/use-toast"

const POSPage = () => {
  const [currentBranch, setCurrentBranch] = useState(null)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferProduct, setTransferProduct] = useState(null)
  const [transferQuantity, setTransferQuantity] = useState(1)
  const [transferFromBranch, setTransferFromBranch] = useState("")

  // Mock branches data
  const branches = [
    { id: 1, name: "Main Store", address: "123 Main Street, Delhi" },
    { id: 2, name: "Mall Branch", address: "456 Mall Road, Mumbai" },
    { id: 3, name: "City Center", address: "789 City Center, Bangalore" },
    { id: 4, name: "Downtown", address: "321 Downtown, Chennai" },
  ]



  useEffect(() => {
    // Simulate fetching user's branch from login session
    // In real app, this would come from authentication context
    const userBranch = { id: 1, name: "Main Store", address: "123 Main Street, Delhi" }
    console.log('Setting current branch:', userBranch)
    setCurrentBranch(userBranch)
  }, [])

  // Clean barcode function - removes various "Enter" variations that barcode guns add
  const cleanBarcode = (value) => {
    if (!value) return value

    return value
      .replace(/Enter/gi, '')      // Remove "Enter" anywhere (global, case-insensitive)
      .replace(/\r?\n/g, '')       // Remove actual newline characters (global)
      .replace(/\r/g, '')          // Remove carriage return (global)
      .replace(/\u000D/g, '')      // Remove carriage return unicode (global)
      .replace(/\u000A/g, '')      // Remove line feed unicode (global)
      .replace(/\u0013/g, '')      // Remove device control 3
      .replace(/\u0010/g, '')      // Remove device control 0
      .trim()                      // Remove whitespace
  }

  // Global barcode scanner detection
  useEffect(() => {
    let barcodeBuffer = ""
    let lastKeyTime = 0

    const handleGlobalKeyPress = (e) => {
      const currentTime = Date.now()
      const timeDiff = currentTime - lastKeyTime

      // If time between keystrokes is very small (< 50ms), it's likely a barcode scanner
      if (timeDiff < 50 && barcodeBuffer.length > 0) {
        barcodeBuffer += e.key
      } else {
        barcodeBuffer = e.key
      }

      lastKeyTime = currentTime
      console.log('Barcode buffer:', barcodeBuffer, 'Key:', e.key, 'TimeDiff:', timeDiff)

      // Check if it's a complete barcode (Enter key or sufficient length)
      if (e.key === 'Enter' && barcodeBuffer.length >= 8) {
        // Clean the barcode before processing
        const cleanedBarcode = cleanBarcode(barcodeBuffer)
        console.log('Barcode detected via Enter:', { original: barcodeBuffer, cleaned: cleanedBarcode })
        handleBarcodeScanned(cleanedBarcode)
        barcodeBuffer = ""
      } else if (barcodeBuffer.length >= 13 && timeDiff < 50) {
        // Auto-detect complete barcode
        setTimeout(() => {
          if (barcodeBuffer.length >= 8) {
            // Clean the barcode before processing
            const cleanedBarcode = cleanBarcode(barcodeBuffer)
            console.log('Barcode detected via length:', { original: barcodeBuffer, cleaned: cleanedBarcode })
            handleBarcodeScanned(cleanedBarcode)
            barcodeBuffer = ""
          }
        }, 100)
      }
    }

    // Add global keypress listener
    document.addEventListener('keypress', handleGlobalKeyPress)

    return () => {
      document.removeEventListener('keypress', handleGlobalKeyPress)
    }
  }, [])

  // Handle barcode scanning using API
  const handleBarcodeScanned = async (barcode) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pos/search-products/?q=${encodeURIComponent(barcode)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Barcode scan API response:', data)

        if (data.success && data.products && Array.isArray(data.products) && data.products.length > 0) {
          const product = data.products.find(p => p.barcode === barcode)
          if (product) {
            // Ensure branch is loaded before adding to cart
            if (!currentBranch) {
              console.log('Branch not loaded in global scanner, setting default')
              const defaultBranch = { id: 1, name: "Main Store", address: "123 Main Street, Delhi" }
              setCurrentBranch(defaultBranch)
            }
            // Handle different response formats
            const transformedProduct = {
              id: product.id || product.product_id,
              name: product.name || product.product_name,
              price: parseFloat(product.selling_price) || 0,
              barcode: product.barcode,
              qty: product.qty || 0,
              gst: product.gst || product.hsn || { cgst: 9, sgst: 9, igst: 18 },
              isWarrantyItem: product.is_warranty_item || false,
              warrantyPeriod: product.warranty_period,
              hsnCode: product.hsn_code || product.hsn?.hsn_code,
              serialNumbers: product.serial_numbers || [],
              searchType: product.search_type || "regular",
              brand: product.brand || "",
              model: product.model || "",
              rack: product.rack || ""
            }

            // Validate required fields
            if (!transformedProduct.id || !transformedProduct.name || isNaN(transformedProduct.price)) {
              console.error('Invalid product data:', transformedProduct)
              toast({
                title: "Invalid Product Data",
                description: "Product information is incomplete",
                variant: "destructive",
              })
              return
            }

            console.log('Global barcode scanned - product found:', product)
            console.log('Global barcode scanned - transformed product:', transformedProduct)
            console.log('Product validation:', {
              hasId: !!transformedProduct.id,
              hasName: !!transformedProduct.name,
              hasPrice: !isNaN(transformedProduct.price),
              price: transformedProduct.price,
              name: transformedProduct.name,
              qty: transformedProduct.qty,
              currentBranch: currentBranch
            })
            console.log('Cart items before adding:', cartItems.length)

            addToCart(transformedProduct)

            // Check if product was actually added after a short delay
            setTimeout(() => {
              console.log('Cart items after adding:', cartItems.length)
            }, 100)
            toast({
              title: "Barcode Scanned",
              description: `${transformedProduct.name} added to cart`,
              className: "bg-green-50 border-green-200 text-green-800",
            })
            return
          }
        }
      }

      console.log('Barcode not found:', barcode)
      toast({
        title: "Product Not Found",
        description: `Barcode ${barcode} not found in inventory`,
        variant: "destructive",
      })
    } catch (error) {
      console.error('Error searching barcode:', error)
      toast({
        title: "Search Error",
        description: "Failed to search for product",
        variant: "destructive",
      })
    }
  }

  const [cartItems, setCartItems] = useState([])

  const [discount, setDiscount] = useState({ type: "%", value: 0 })
  const [gstEnabled, setGstEnabled] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [customerMobile, setCustomerMobile] = useState("")
  const [paymentType, setPaymentType] = useState("Cash")
  const [cashAmount, setCashAmount] = useState("")
  const [upiAmount, setUpiAmount] = useState("")
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [savingBill, setSavingBill] = useState(false)
  const [hoveredPayment, setHoveredPayment] = useState(null)
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  const [expenses, setExpenses] = useState([])
  const [expenseName, setExpenseName] = useState("")
  const [expenseAmount, setExpenseAmount] = useState("")
  const [expenseMethod, setExpenseMethod] = useState("Cash")

  const { toast } = useToast()



  const addToCart = (product) => {
    console.log('addToCart called with product:', product)
    console.log('currentBranch:', currentBranch)

    if (!currentBranch) {
      console.log('Branch not loaded, setting default branch and continuing')
      // Set default branch if not loaded yet
      const defaultBranch = { id: 1, name: "Main Store", address: "123 Main Street, Delhi" }
      setCurrentBranch(defaultBranch)
      // Continue with adding to cart instead of returning
    }

    // Since API already returns only available products for current branch,
    // we can directly use the qty from API response
    const availableStock = product.qty || 0
    console.log('Available stock:', availableStock)

    if (availableStock === 0) {
      console.log('No stock available, returning early')
      toast({
        title: "Product Not Available",
        description: "This product is out of stock in current branch",
        variant: "destructive",
      })
      return
    }

    // Products with serial numbers can be added to cart without serial initially
    // Serial number can be added later in the cart item itself

    // Check stock using current cart state (will be checked again in functional update)
    console.log('Checking stock for product:', product.id, 'Available:', availableStock)

    // Use functional state update to avoid stale closure issues
    setCartItems(prevCartItems => {
      console.log('Current cart items:', prevCartItems.length)

      // Find existing item in current cart state
      const existingItem = prevCartItems.find((item) => {
        if (product.serialNumber) {
          // If product has serial number, match both ID and serial number
          return item.id === product.id && item.serialNumber === product.serialNumber
        } else {
          // If no serial number, match ID and also no serial number
          return item.id === product.id && !item.serialNumber
        }
      })

      const currentQuantityInCart = existingItem ? existingItem.quantity : 0
      console.log('Current quantity in cart:', currentQuantityInCart, 'Available stock:', availableStock)

      // Check stock limit
      if (currentQuantityInCart >= availableStock) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${availableStock} units available`,
          variant: "destructive",
        })
        return prevCartItems // Return unchanged cart
      }

      if (existingItem) {
        console.log('Updating existing item in cart, current qty:', existingItem.quantity)
        return prevCartItems.map((item) => {
          if (product.serialNumber) {
            // Match by ID and serial number
            return (item.id === product.id && item.serialNumber === product.serialNumber)
              ? { ...item, quantity: item.quantity + 1 }
              : item
          } else {
            // Match by ID and no serial number
            return (item.id === product.id && !item.serialNumber)
              ? { ...item, quantity: item.quantity + 1 }
              : item
          }
        })
      } else {
        console.log('Adding new item to cart')
        const cartProduct = {
          ...product,
          quantity: 1,
          gst: product.gst || { cgst: 9, sgst: 9, igst: 18 },
          serialNumber: product.serialNumber || null,
          serialNumbers: product.serialNumber ? [product.serialNumber] : []
        }
        console.log('Cart product to add:', cartProduct)
        return [...prevCartItems, cartProduct]
      }
    })

    toast({
      title: "Product Added",
      description: `${product.name} added to cart`,
      className: "bg-green-50 border-green-200 text-green-800",
    })
  }



  const getBranchName = (branchId) => {
    const branch = branches.find((b) => b.id === Number.parseInt(branchId))
    return branch ? branch.name : ""
  }

  const handleTransferRequest = () => {
    if (!transferFromBranch || !transferQuantity) {
      toast({
        title: "Invalid Transfer Request",
        description: "Please select source branch and quantity",
        variant: "destructive",
      })
      return
    }

    const availableStock = 0 // Removed function call
    if (transferQuantity > availableStock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${availableStock} units available in ${getBranchName(transferFromBranch)}`,
        variant: "destructive",
      })
      return
    }

    // Simulate transfer request
    console.log("Transfer Request:", {
      product: transferProduct,
      fromBranch: transferFromBranch,
      toBranch: currentBranch.id,
      quantity: transferQuantity,
      requestedBy_id: null, // Removed selectedSalesperson reference
      timestamp: new Date().toISOString(),
    })

    toast({
      title: "Transfer Request Sent",
      description: `Requested ${transferQuantity} units of ${transferProduct.name}`,
      className: "bg-blue-50 border-blue-200 text-blue-800",
    })

    setShowTransferModal(false)
    setTransferProduct(null)
    setTransferQuantity(1)
    setTransferFromBranch("")
  }

  const updateQuantity = (targetItem, quantity) => {
    if (quantity <= 0) {
      setCartItems(cartItems.filter((item) =>
        !(item.id === targetItem.id && item.serialNumber === targetItem.serialNumber)
      ))
    } else {
      const availableStock = targetItem.qty || 0

      if (quantity > availableStock) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${availableStock} units available in ${currentBranch?.name}`,
          variant: "destructive",
        })
        return
      }
      setCartItems(cartItems.map((item) =>
        (item.id === targetItem.id && item.serialNumber === targetItem.serialNumber)
          ? { ...item, quantity }
          : item
      ))
    }
  }

  const removeItem = (targetItem) => {
    setCartItems(cartItems.filter((item) =>
      !(item.id === targetItem.id && item.serialNumber === targetItem.serialNumber)
    ))
  }

  const updateSerial = (targetItem, newSerials) => {
    setCartItems(cartItems.map((item) => {
      if (item.id === targetItem.id && item.serialNumber === targetItem.serialNumber) {
        return { ...item, serialNumbers: Array.isArray(newSerials) ? newSerials : [] }
      }
      return item
    }))

    if (Array.isArray(newSerials) && newSerials.length > 0) {
      toast({
        title: "Serial Numbers Updated",
        description: `${newSerials.length} serial number(s) added`,
        className: "bg-green-50 border-green-200 text-green-800",
      })
    }
  }

  const updateSalesperson = (targetItem, salespersonId) => {
    setCartItems(cartItems.map((item) => {
      if (item.id === targetItem.id && item.serialNumber === targetItem.serialNumber) {
        return { ...item, salespersonId: salespersonId || null }
      }
      return item
    }))
  }

  const handleClearCart = () => {
    if (cartItems.length > 0) {
      setShowClearConfirm(true)
    } else {
      clearCart()
    }
  }

  const clearCart = () => {
    setCartItems([])
    setDiscount({ type: "%", value: 0 })
    setCustomerName("")
    setCustomerMobile("")
    setPaymentType("Cash")
    setCashAmount("")
    setUpiAmount("")
    setShowClearConfirm(false)
  }



  const saveBill = () => {
    setSavingBill(true)

    // Check if all cart items have salesperson assigned
    const itemsWithoutSalesperson = cartItems.filter(item => !item.salespersonId)
    console.log("Cart items:", cartItems)
    console.log("Items without salesperson:", itemsWithoutSalesperson)

    if (itemsWithoutSalesperson.length > 0) {
      // Auto-assign current user as salesperson for items without salesperson
      const currentUserId = localStorage.getItem('user_id') || localStorage.getItem('employee_id') || 1
      console.log("Auto-assigning salesperson ID:", currentUserId)

      setCartItems(cartItems.map(item => ({
        ...item,
        salespersonId: item.salespersonId || currentUserId
      })))

      toast({
        title: "Salesperson Auto-Assigned",
        description: `Auto-assigned current user as salesperson for ${itemsWithoutSalesperson.length} items`,
        className: "bg-blue-50 border-blue-200 text-blue-800",
      })

      // Continue with bill creation after a short delay to allow state update
      setTimeout(() => {
        processPayment()
      }, 100)
      return
    }

    if (!customerName.trim()) {
      toast({
        title: "Customer Name Required",
        description: "Please enter customer name to save the bill",
        variant: "destructive",
      })
      setSavingBill(false)
      return
    }

    if (!customerMobile.trim()) {
      toast({
        title: "Mobile Number Required",
        description: "Please enter customer mobile number to save the bill",
        variant: "destructive",
      })
      setSavingBill(false)
      return
    }

    if (cartItems.length === 0) {
      toast({
        title: "No Items in Cart",
        description: "Please add items to the cart before saving",
        variant: "destructive",
      })
      return
    }

    // Process payment directly
    processPayment()
  }

  const processPayment = async () => {
    console.log("processPayment called - starting bill creation")
    const total = calculateTotal()

    if (paymentType === "Split") {
      const cash = Number.parseFloat(cashAmount) || 0
      const upi = Number.parseFloat(upiAmount) || 0

      if (Math.abs(cash + upi - total) > 0.01) {
        toast({
          title: "Payment Amount Mismatch",
          description: `Total payment (₹${(cash + upi).toLocaleString()}) must equal bill total (₹${total.toLocaleString()})`,
          variant: "destructive",
        })
        return
      }
    }

    // Calculate discount for each item based on the formula
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    let totalDiscountAmount = 0

    if (discount.type === "%") {
      totalDiscountAmount = (subtotal * discount.value) / 100
    } else {
      totalDiscountAmount = discount.value
    }

    // Prepare items with individual discount calculation
    console.log('Cart items before processing:', cartItems)
    const itemsWithDiscount = cartItems.map(item => {
      const itemTotal = item.price * item.quantity
      let itemDiscountAmount = 0

      if (totalDiscountAmount > 0) {
        if (discount.type === "%") {
          // For percentage discount, apply same percentage to each item
          itemDiscountAmount = discount.value // Send percentage value directly
        } else {
          // For fixed discount, distribute proportionally: (item MRP / Total MRP) * Total Discount
          itemDiscountAmount = (itemTotal / subtotal) * totalDiscountAmount
        }
      }

      const itemPayload = {
        product_id: item.id,
        qty: item.quantity,
        price: item.price,
        discount_type: discount.type === "%" ? "percentage" : "fixed",
        discount_value: itemDiscountAmount,
        salesperson_id: item.salespersonId
      }

      // Add serial numbers for warranty items
      if (item.isWarrantyItem && item.serialNumbers && item.serialNumbers.length > 0) {
        // For warranty items, send serial numbers as array
        itemPayload.serial_numbers = item.serialNumbers
        console.log(`Added serial numbers for warranty item ${item.name}:`, item.serialNumbers)
      }

      return itemPayload
    })

    // Prepare payment data
    let paymentData = {
      payment_method: paymentType.toLowerCase()
    }

    if (paymentType === "Split") {
      paymentData = {
        payment_method: "split",
        cash_amount: Number.parseFloat(cashAmount) || 0,
        upi_amount: Number.parseFloat(upiAmount) || 0
      }
    } else if (paymentType === "Cash") {
      paymentData = {
        payment_method: "cash",
        cash_amount: total
      }
    } else if (paymentType === "UPI") {
      paymentData = {
        payment_method: "upi",
        upi_amount: total
      }
    } else if (paymentType === "Pay Later") {
      paymentData = {
        payment_method: "pay_later"
      }
    }

    // Prepare API payload
    const payload = {
      customer: {
        name: customerName.trim(),
        phone: customerMobile.trim()
      },
      items: itemsWithDiscount,
      payment: paymentData,
      is_gst: gstEnabled
    }

    console.log("API Payload:", JSON.stringify(payload, null, 2))
    console.log("Making API call to:", `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pos/bills/create/`)

    try {
      const token = localStorage.getItem('access_token')
      console.log("Token exists:", !!token)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pos/bills/create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Bill created successfully:", data)

        toast({
          title: "Bill Saved Successfully",
          description: `Bill #${data.bill_number || 'N/A'} saved for ${customerName} - Payment: ${paymentType} - ₹${total.toLocaleString()}`,
          className: "bg-green-50 border-green-200 text-green-800",
        })

        clearCart()
        setPaymentType("Cash")
        setCashAmount("")
        setUpiAmount("")
        setSavingBill(false)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("Bill creation failed:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
          url: response.url
        })

        toast({
          title: "Bill Creation Failed",
          description: errorData.error || errorData.message || `Server error: ${response.status} ${response.statusText}`,
          variant: "destructive",
        })
        setSavingBill(false)
      }
    } catch (error) {
      console.error('Error creating bill:', error)
      toast({
        title: "Network Error",
        description: "Failed to save bill due to network error. Please check your connection and try again.",
        variant: "destructive",
      })
      setSavingBill(false)
    }
  }

  const calculateTotal = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    let discountAmount = 0

    if (discount.type === "%") {
      discountAmount = (subtotal * discount.value) / 100
    } else {
      discountAmount = discount.value
    }

    // Since prices are inclusive, no additional GST calculation needed
    return subtotal - discountAmount
  }

  const getPaymentIcon = (type) => {
    switch (type) {
      case "Cash":
        return <Wallet className="w-5 h-5" />
      case "UPI":
        return <CreditCard className="w-5 h-5" />
      case "Split":
        return <Split className="w-5 h-5" />
      case "Pay Later":
        return <Clock className="w-5 h-5" />
      default:
        return <Wallet className="w-5 h-5" />
    }
  }

  const addExpense = () => {
    if (!expenseName.trim()) {
      toast({
        title: "Error",
        description: "Please enter expense name",
        variant: "destructive",
      })
      return
    }

    if (!expenseAmount || parseFloat(expenseAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter valid amount",
        variant: "destructive",
      })
      return
    }

    const newExpense = {
      id: Date.now(),
      name: expenseName.trim(),
      amount: parseFloat(expenseAmount),
      method: expenseMethod,
      timestamp: new Date().toLocaleTimeString()
    }

    setExpenses([...expenses, newExpense])
    setExpenseName("")
    setExpenseAmount("")
    setExpenseMethod("Cash")

    toast({
      title: "Success",
      description: `Expense "${newExpense.name}" added for ₹${newExpense.amount}`,
      className: "bg-green-50 border-green-200 text-green-800",
    })
  }

  const removeExpense = (id) => {
    setExpenses(expenses.filter(exp => exp.id !== id))
  }

  const StockOverview = ({ product }) => {
    if (!product) return null

    return (
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="font-medium">{product.name}</div>
        <div className="text-sm text-gray-600">Barcode: {product.barcode}</div>
        <div className="text-sm text-gray-600">Price: ₹{product.price?.toLocaleString()}</div>
        <div className={`text-sm font-medium ${product.qty > 0 ? "text-green-600" : "text-red-600"}`}>
          Available Stock: {product.qty} units
        </div>
        {product.isWarrantyItem && (
          <div className="text-sm text-blue-600">
            Warranty: {product.warrantyPeriod || 'N/A'} months
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full bg-white text-gray-900 flex flex-col">
      {/* UPDATED: Icons-only payment + compact split - Oct 22 */}
      {/* Mobile Layout - Single Page Design */}
      <div className="md:hidden h-full flex flex-col overflow-hidden">
        {/* Compact Header */}
        <div className="p-2 bg-gray-50 border-b border-gray-200 flex-shrink-0">

          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <User className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Customer Name*"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full pl-8 pr-2 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-black transition-colors bg-white text-sm"
                required
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="tel"
                placeholder="Mobile Number*"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
                className="w-full pl-8 pr-2 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-black transition-colors bg-white text-sm"
                required
              />
            </div>
          </div>
        </div>

        {/* Search and Cart Items */}
        <div className="flex-1 overflow-y-auto bg-gray-50 min-h-0">
          <div className="p-2 bg-white border-b border-gray-200">
            <SearchBar onProductSelect={addToCart} selectedBranch={currentBranch?.id} withBarcodeScanner={true} />
          </div>
          <Cart items={cartItems} onUpdateQuantity={updateQuantity} onRemoveItem={removeItem} compact={true} gstEnabled={gstEnabled} onSerialUpdate={updateSerial} onSalespersonUpdate={updateSalesperson} />
        </div>

        {/* Payment Section */}
        <div className="p-3 bg-white border-t border-gray-200 flex-shrink-0">
          <div className="mb-3">
            <BillSummary items={cartItems} discount={discount} gstEnabled={gstEnabled} compact={true} />
          </div>

          {/* Payment Type Selection - Icons Only */}
          <div className="mb-2 relative">
            <div className="grid grid-cols-4 gap-1">
              {["Cash", "UPI", "Split", "Pay Later"].map((type) => (
                <div key={type} className="relative">
                  <button
                    onClick={() => setPaymentType(type)}
                    onMouseEnter={() => setHoveredPayment(type)}
                    onMouseLeave={() => setHoveredPayment(null)}
                    className={`w-full p-2 rounded-md border transition-all flex items-center justify-center ${paymentType === type
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                  >
                    {getPaymentIcon(type)}
                  </button>
                  {hoveredPayment === type && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10">
                      {type}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-800"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Split Payment Details - Inline */}
          {paymentType === "Split" && (
            <div className="mb-2">
              <div className="flex gap-1">
                <input
                  type="number"
                  placeholder="Cash"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:border-black"
                />
                <input
                  type="number"
                  placeholder="UPI"
                  value={upiAmount}
                  onChange={(e) => setUpiAmount(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:border-black"
                />
              </div>
            </div>
          )}

          {/* Discount and GST */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <DiscountControl discount={discount} onChange={setDiscount} compact={true} />
            </div>
            <div className="w-16">
              <GSTToggle enabled={gstEnabled} onChange={setGstEnabled} compact={true} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleClearCart}
              className="py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
              title="Clear all items from cart"
            >
              Clear
            </button>
            <button
              onClick={saveBill}
              disabled={cartItems.length === 0 || savingBill}
              className="py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              title="Save bill and process payment"
            >
              {savingBill ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Single Page Design */}
      <div className="hidden md:flex h-full overflow-hidden">
        {/* Left Side - Search, Cart and Summary */}
        <div className="flex-1 flex flex-col border-r border-gray-200">
          <div className="p-3 bg-white border-b border-gray-200">
            <SearchBar onProductSelect={addToCart} selectedBranch={currentBranch?.id} withBarcodeScanner={true} />
          </div>
          <div className="flex-1 overflow-y-auto">
            <Cart items={cartItems} onUpdateQuantity={updateQuantity} onRemoveItem={removeItem} gstEnabled={gstEnabled} onSerialUpdate={updateSerial} onSalespersonUpdate={updateSalesperson} />
          </div>
          <div className="border-t border-gray-200 bg-white">
            <BillSummary items={cartItems} discount={discount} gstEnabled={gstEnabled} />
          </div>
        </div>

        {/* Right Side - Customer Info & Controls */}
        <div className="w-96 flex flex-col p-4">




          {/* Customer Info */}
          <div className="mb-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Customer Name*"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors bg-white"
                  required
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="tel"
                  placeholder="Mobile Number*"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors bg-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Payment Section - Icons Only */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-2">Payment</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {["Cash", "UPI", "Split", "Pay Later"].map((type) => (
                <div key={type} className="relative">
                  <button
                    onClick={() => setPaymentType(type)}
                    onMouseEnter={() => setHoveredPayment(type)}
                    onMouseLeave={() => setHoveredPayment(null)}
                    className={`w-full p-3 rounded-lg border transition-all flex items-center justify-center ${paymentType === type
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                  >
                    {getPaymentIcon(type)}
                  </button>
                  {hoveredPayment === type && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded whitespace-nowrap z-10">
                      {type}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Split Payment Details - Very Compact */}
            {paymentType === "Split" && (
              <div className="mt-2">
                <div className="grid grid-cols-2 gap-1">
                  <input
                    type="number"
                    placeholder="Cash"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-black h-8"
                  />
                  <input
                    type="number"
                    placeholder="UPI"
                    value={upiAmount}
                    onChange={(e) => setUpiAmount(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-black h-8"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Discount and GST */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex gap-3">
              <div className="flex-1">
                <DiscountControl discount={discount} onChange={setDiscount} />
              </div>
              <div className="w-20">
                <GSTToggle enabled={gstEnabled} onChange={setGstEnabled} />
              </div>
            </div>
          </div>

          {/* Expenses Section */}
          {expenses.length > 0 && (
            <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h3 className="font-semibold text-orange-900 mb-2">Expenses ({expenses.length})</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {expenses.map(exp => (
                  <div key={exp.id} className="flex items-center justify-between text-sm bg-white p-2 rounded border border-orange-100">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{exp.name}</p>
                      <p className="text-xs text-gray-600">{exp.method} • {exp.timestamp}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-orange-700">₹{exp.amount}</span>
                      <button
                        onClick={() => removeExpense(exp.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              onClick={() => setShowExpenseDialog(true)}
              className="py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
              title="Add expense"
            >
              + Expense
            </button>
            <button
              onClick={handleClearCart}
              className="py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              title="Clear all items from cart"
            >
              Clear Bill
            </button>
          </div>

          <button
            onClick={saveBill}
            disabled={cartItems.length === 0 || savingBill}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            title="Save bill and process payment"
          >
            {savingBill ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Bill...
              </>
            ) : (
              "Save Bill"
            )}
          </button>
        </div>

      </div>

      {/* Transfer Request Modal (when product not available) */}
      {showTransferModal && transferProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-black flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                Product Not Available
              </h2>
              <button
                onClick={() => setShowTransferModal(false)}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-800">Product Not Available</span>
                </div>
                <p className="text-sm text-yellow-700">
                  {transferProduct.name} is not available in {currentBranch?.name}. You can request a transfer from
                  another branch or use the dedicated Stock Transfer page for better management.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-black mb-2">Product Details</h3>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{transferProduct.name}</p>
                  <p className="text-sm text-gray-600">Model: {transferProduct.model}</p>
                  <p className="text-sm text-gray-600">Price: ₹{transferProduct.price.toLocaleString()}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-black mb-2">Product Information</h3>
                <StockOverview product={transferProduct} />
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Transfer From Branch</label>
                  <select
                    value={transferFromBranch}
                    onChange={(e) => setTransferFromBranch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  >
                    <option value="">Select Source Branch</option>
                    {branches.filter(b => b.id !== currentBranch?.id).map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">Quantity to Transfer</label>
                  <input
                    type="number"
                    min="1"
                    max={100}
                    value={transferQuantity}
                    onChange={(e) => setTransferQuantity(Number.parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  />
                </div>

                <div className="text-sm text-gray-600">
                  <p>
                    <strong>From:</strong> {transferFromBranch ? branches.find(b => b.id == transferFromBranch)?.name : "Not selected"}
                  </p>
                  <p>
                    <strong>To:</strong> {currentBranch?.name}
                  </p>
                  <p>
                    <strong>Requested by:</strong> Current User
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransferRequest}
                  disabled={!transferFromBranch || !transferQuantity}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Request Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Clear Cart Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Clear Cart?</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to clear all items from the cart? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={clearCart}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Dialog */}
      {showExpenseDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Add Expense</h2>
              <button
                onClick={() => setShowExpenseDialog(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Expense Name</label>
                <input
                  type="text"
                  placeholder="e.g., Delivery, Packaging, etc."
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Payment Method</label>
                <select
                  value={expenseMethod}
                  onChange={(e) => setExpenseMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowExpenseDialog(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    addExpense()
                    setShowExpenseDialog(false)
                  }}
                  className="flex-1 bg-orange-600 text-white py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors"
                >
                  Add Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default POSPage
