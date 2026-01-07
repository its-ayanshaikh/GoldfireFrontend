"use client"

import { useState, useEffect } from "react"
import { Search, X, ArrowLeft, Wallet, CreditCard, RefreshCw, CheckCircle, AlertCircle, Package, Truck, Calculator, Loader2, Percent, IndianRupee, Split } from "lucide-react"
import { useToast } from "../../hooks/use-toast"

const ReturnReplacePage = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchedBills, setSearchedBills] = useState([]) // Array of bills from search
  const [searchedBill, setSearchedBill] = useState(null) // Selected bill
  const [selectedItem, setSelectedItem] = useState(null)
  const [actionType, setActionType] = useState(null) // "return" or "replace"
  const [step, setStep] = useState("search") // "search", "selectBill", "selectItem", "action", "stockDecision"
  
  // Return states
  const [returnPaymentMethod, setReturnPaymentMethod] = useState(null) // "cash" or "online"
  
  // Replace states
  const [replaceType, setReplaceType] = useState(null) // "warranty" or "dissatisfaction"
  const [replacementProduct, setReplacementProduct] = useState(null)
  const [replacementQuantity, setReplacementQuantity] = useState(1)
  const [productSearchQuery, setProductSearchQuery] = useState("")
  const [productSearchResults, setProductSearchResults] = useState([])
  const [productSearchLoading, setProductSearchLoading] = useState(false)
  
  // Stock decision states
  const [showStockDecision, setShowStockDecision] = useState(false)
  const [stockDecision, setStockDecision] = useState(null) // "stock" or "vendor"
  const [processing, setProcessing] = useState(false)
  
  // Serial number for replacement
  const [newSerialNumber, setNewSerialNumber] = useState("")

  // Due payment states
  const [showDuePayment, setShowDuePayment] = useState(false)
  const [duePaymentBill, setDuePaymentBill] = useState(null)
  const [duePaymentMethod, setDuePaymentMethod] = useState(null) // "cash", "upi", "split"
  const [dueCashAmount, setDueCashAmount] = useState("")
  const [dueUpiAmount, setDueUpiAmount] = useState("")
  const [dueProcessing, setDueProcessing] = useState(false)

  // Replacement payment modal states
  const [showReplacementPayment, setShowReplacementPayment] = useState(false)
  const [replacementPaymentMethod, setReplacementPaymentMethod] = useState(null) // "cash", "upi", "split"
  const [replacementCashAmount, setReplacementCashAmount] = useState("")
  const [replacementUpiAmount, setReplacementUpiAmount] = useState("")
  const [replacementProcessing, setReplacementProcessing] = useState(false)

  // Discount states for replacement
  const [discountType, setDiscountType] = useState("percentage") // "percentage" or "fixed"
  const [discountValue, setDiscountValue] = useState(0)

  const { toast } = useToast()
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token')
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  // Open due payment modal
  const openDuePaymentModal = (bill) => {
    setDuePaymentBill(bill)
    setDuePaymentMethod(null)
    setDueCashAmount("")
    setDueUpiAmount("")
    setShowDuePayment(true)
  }

  // Process due payment
  const processDuePayment = async () => {
    if (!duePaymentMethod) {
      toast({
        title: "Select Payment Method",
        description: "Please select how to receive payment",
        variant: "destructive",
      })
      return
    }

    const billDueAmount = duePaymentBill?.finalAmount || 0
    let cashAmt = parseFloat(dueCashAmount) || 0
    let upiAmt = parseFloat(dueUpiAmount) || 0

    // Validate amounts based on payment method
    if (duePaymentMethod === "cash") {
      if (cashAmt <= 0 || cashAmt > billDueAmount) {
        toast({
          title: "Invalid Amount",
          description: `Cash amount must be between ₹1 and ₹${billDueAmount.toLocaleString()}`,
          variant: "destructive",
        })
        return
      }
      upiAmt = 0
    } else if (duePaymentMethod === "upi") {
      if (upiAmt <= 0 || upiAmt > billDueAmount) {
        toast({
          title: "Invalid Amount",
          description: `UPI amount must be between ₹1 and ₹${billDueAmount.toLocaleString()}`,
          variant: "destructive",
        })
        return
      }
      cashAmt = 0
    } else if (duePaymentMethod === "split") {
      const totalAmt = cashAmt + upiAmt
      if (totalAmt <= 0 || totalAmt > billDueAmount) {
        toast({
          title: "Invalid Amount",
          description: `Total amount must be between ₹1 and ₹${billDueAmount.toLocaleString()}`,
          variant: "destructive",
        })
        return
      }
      if (cashAmt < 0 || upiAmt < 0) {
        toast({
          title: "Invalid Amount",
          description: "Amounts cannot be negative",
          variant: "destructive",
        })
        return
      }
    }

    setDueProcessing(true)
    try {
      const payload = {
        bill_id: duePaymentBill.billId,
        payment_method: duePaymentMethod,
        cash_amount: cashAmt,
        upi_amount: upiAmt
      }

      console.log("Processing due payment:", payload)

      const response = await fetch(`${API_BASE}/api/pos/due/update/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Due payment response:", data)

        toast({
          title: "Payment Collected Successfully",
          description: `₹${(cashAmt + upiAmt).toLocaleString()} received for Bill #${duePaymentBill.id}`,
          className: "bg-green-50 border-green-200 text-green-800",
        })

        // Close modal and refresh
        setShowDuePayment(false)
        setDuePaymentBill(null)
        
        // Re-search to refresh data
        searchBill()
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || 'Failed to process payment')
      }
    } catch (error) {
      console.error('Error processing due payment:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      })
    } finally {
      setDueProcessing(false)
    }
  }

  // Search bill by bill number or customer phone
  const searchBill = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Enter Search Query",
        description: "Please enter bill number or customer mobile",
        variant: "destructive",
      })
      return
    }

    setSearchLoading(true)
    try {
      const url = `${API_BASE}/api/pos/bills/search/?q=${encodeURIComponent(searchQuery.trim())}`
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        const billsData = Array.isArray(data) ? data : (data.results?.bills || data.bills || [])
        
        if (billsData && billsData.length > 0) {
          // Transform all bills
          const transformedBills = billsData.map(bill => {
            // Check if bill has payments
            const hasPayments = bill.payments && bill.payments.length > 0
            
            return {
              id: bill.bill_number || `Bill-${bill.id}`,
              billId: bill.id,
              date: bill.date ? new Date(bill.date).toISOString().split('T')[0] : 'N/A',
              customerName: bill.customer?.name || 'Unknown Customer',
              customerMobile: bill.customer?.phone || 'N/A',
              customerDueBalance: parseFloat(bill.customer?.due_amount || 0),
              total: parseFloat(bill.final_amount || 0),
              paymentType: hasPayments ? bill.payments[0].payment_method : "pay_later",
              isPayLater: !hasPayments,
              items: (bill.items || []).map(item => ({
                id: item.id,
                product_id: item.product?.id,
                name: item.product?.name || 'Unknown Product',
                model: item.product?.model_name || '',
                quantity: item.qty || 0,
                price: parseFloat(item.price || 0),
                returned: item.returned_qty || 0,
                is_returned: item.is_returned || false,
                serial_number: item.serial_number || null,
                final_amount: parseFloat(item.final_amount || 0),
                salesperson: item.salesperson?.name || 'Unknown'
              })),
              payments: bill.payments || [],
              finalAmount: parseFloat(bill.final_amount || 0)
            }
          })
          
          setSearchedBills(transformedBills)
          
          // If only one bill, directly select it
          if (transformedBills.length === 1) {
            setSearchedBill(transformedBills[0])
            setStep("selectItem")
          } else {
            setStep("selectBill")
          }
        } else {
          toast({
            title: "Bill Not Found",
            description: "No bill found with this search query",
            variant: "destructive", 
          })
          setSearchedBill(null)
        }
      } else {
        toast({
          title: "Search Error",
          description: "Failed to search bills",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error searching bill:', error)
      toast({
        title: "Network Error",
        description: "Failed to connect to server",
        variant: "destructive",
      })
    } finally {
      setSearchLoading(false)
    }
  }

  // Search products for replacement
  const searchProducts = async (query) => {
    if (!query.trim()) {
      setProductSearchResults([])
      return
    }

    setProductSearchLoading(true)
    try {
      const url = `${API_BASE}/api/pos/search-products/?q=${encodeURIComponent(query.trim())}`
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.products) {
          setProductSearchResults(data.products)
        } else {
          setProductSearchResults([])
        }
      }
    } catch (error) {
      console.error('Error searching products:', error)
    } finally {
      setProductSearchLoading(false)
    }
  }

  // Debounced product search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (productSearchQuery.trim()) {
        searchProducts(productSearchQuery)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [productSearchQuery])

  const handleItemSelect = (item) => {
    if (item.quantity <= item.returned) {
      toast({
        title: "Item Not Available",
        description: "This item has already been returned",
        variant: "destructive",
      })
      return
    }
    setSelectedItem(item)
    setReplacementQuantity(1)
    setStep("action")
  }

  const handleActionSelect = (action) => {
    setActionType(action)
    if (action === "return") {
      setReturnPaymentMethod(null)
    } else {
      setReplaceType(null)
      setReplacementProduct(null)
    }
  }

  const calculatePriceDifference = () => {
    if (!selectedItem || !replacementProduct) return 0
    // Use final_amount which already has discounts applied
    // Calculate per-unit final price from final_amount
    const perUnitFinalPrice = selectedItem.final_amount && selectedItem.quantity > 0 
      ? selectedItem.final_amount / selectedItem.quantity 
      : selectedItem.price
    const originalPrice = perUnitFinalPrice * replacementQuantity
    const newPrice = parseFloat(replacementProduct.selling_price || replacementProduct.price || 0) * replacementQuantity
    return newPrice - originalPrice
  }

  // Helper to get per unit final price
  const getPerUnitFinalPrice = () => {
    if (!selectedItem) return 0
    return selectedItem.final_amount && selectedItem.quantity > 0 
      ? selectedItem.final_amount / selectedItem.quantity 
      : selectedItem.price
  }

  // Get new product total price (before discount)
  const getNewProductTotalPrice = () => {
    if (!replacementProduct) return 0
    return parseFloat(replacementProduct.selling_price || replacementProduct.price || 0) * replacementQuantity
  }

  // Calculate discount amount on new product price
  const calculateDiscountAmount = () => {
    if (discountValue <= 0 || !replacementProduct) return 0
    const newProductPrice = getNewProductTotalPrice()
    
    if (discountType === "percentage") {
      return (newProductPrice * discountValue) / 100
    }
    return Math.min(discountValue, newProductPrice) // Fixed discount can't exceed product price
  }

  // Get discounted new product price
  const getDiscountedNewProductPrice = () => {
    return getNewProductTotalPrice() - calculateDiscountAmount()
  }

  // Calculate final amount after discount (new product price - discount - original paid price)
  const calculateFinalPaymentAmount = () => {
    if (!replacementProduct) return 0
    const originalPaidPrice = getPerUnitFinalPrice() * replacementQuantity
    const discountedNewPrice = getDiscountedNewProductPrice()
    
    // Positive = customer pays, Negative = refund to customer
    return discountedNewPrice - originalPaidPrice
  }

  const handleReturnProcess = () => {
    // For Pay Later bills, no refund payment method needed
    if (!searchedBill?.isPayLater && !returnPaymentMethod) {
      toast({
        title: "Select Payment Method",
        description: "Please select how to process the refund",
        variant: "destructive",
      })
      return
    }
    // Show stock decision popup for returns
    setShowStockDecision(true)
  }

  const handleReplaceProcess = () => {
    if (replaceType === "warranty") {
      // Warranty replacement - need stock decision and optional serial number
      if (selectedItem.serial_number && !newSerialNumber) {
        toast({
          title: "Serial Number Required",
          description: "Please enter the new serial number",
          variant: "destructive",
        })
        return
      }
      // Show stock decision popup for warranty replacement too
      setShowStockDecision(true)
    } else if (replaceType === "dissatisfaction") {
      if (!replacementProduct) {
        toast({
          title: "Select Replacement Product",
          description: "Please select a product for replacement",
          variant: "destructive",
        })
        return
      }
      // Show stock decision popup for customer dissatisfaction
      setShowStockDecision(true)
    }
  }

  const processWarrantyReplacement = async () => {
    if (!stockDecision) {
      toast({
        title: "Select Stock Decision",
        description: "Please select where to send the returned item",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)
    try {
      // Build warranty replacement payload
      const itemPayload = {
        bill_item_id: selectedItem.id,
      }

      // Add serial numbers only if the item has serial number
      if (selectedItem.serial_number) {
        itemPayload.old_serial_number = selectedItem.serial_number
        itemPayload.new_serial_number = newSerialNumber
      }

      const payload = {
        bill_id: searchedBill.billId,
        replacement_type: "warranty",
        return_destination: stockDecision,
        items: [itemPayload]
      }

      console.log("Processing warranty replacement:", payload)

      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE}/api/pos/replace/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Warranty replacement API response:", data)

        let description = `Same product replacement for ${selectedItem.name}`
        if (selectedItem.serial_number) {
          description += `. S/N: ${selectedItem.serial_number} → ${newSerialNumber}`
        }
        description += `. Item sent to ${stockDecision === 'stock' ? 'Stock' : 'Vendor'}.`

        toast({
          title: "Warranty Replacement Processed",
          description: description,
          className: "bg-green-50 border-green-200 text-green-800",
        })

        setShowStockDecision(false)
        setStockDecision(null)
        resetToSearch()
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || 'Failed to process warranty replacement')
      }
    } catch (error) {
      console.error('Error processing warranty replacement:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to process warranty replacement",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const processWithStockDecision = async () => {
    if (!stockDecision) {
      toast({
        title: "Select Stock Decision",
        description: "Please select where to send the returned item",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)
    try {
      if (actionType === "return") {
        // Calculate refund amount
        const refundAmount = selectedItem.price * replacementQuantity

        // Build payload for return API
        const payload = {
          bill_id: searchedBill.billId,
          items: [
            {
              bill_item_id: selectedItem.id,
              qty: replacementQuantity
            }
          ],
          cash_amount: 0,
          upi_amount: 0,
          return_destination: stockDecision // "stock" or "vendor"
        }

        // Add refund_type and amounts only for non-pay-later bills
        if (!searchedBill?.isPayLater) {
          payload.refund_type = returnPaymentMethod === "cash" ? "cash" : "upi"
          
          if (returnPaymentMethod === "cash") {
            payload.cash_amount = refundAmount
          } else {
            payload.upi_amount = refundAmount
          }
        }

        console.log("Processing return with payload:", payload)

        // Call return API
        const token = localStorage.getItem('access_token')
        const response = await fetch(`${API_BASE}/api/pos/bill/return/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        })

        if (response.ok) {
          const data = await response.json()
          console.log("Return API response:", data)

          let description = ""
          if (searchedBill?.isPayLater) {
            description = `Return processed. No refund for Pay Later bill. Item sent to ${stockDecision === 'stock' ? 'Stock' : 'Vendor'}.`
          } else {
            description = `Refund of ₹${refundAmount.toLocaleString()} via ${returnPaymentMethod === 'cash' ? 'Cash' : 'UPI'}. Item sent to ${stockDecision === 'stock' ? 'Stock' : 'Vendor'}.`
          }

          toast({
            title: "Return Processed Successfully",
            description: description,
            className: "bg-green-50 border-green-200 text-green-800",
          })

          resetToSearch()
        } else {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || errorData.error || 'Failed to process return')
        }
      } else if (actionType === "replace" && replaceType === "warranty") {
        // For warranty replacement, call the API directly
        setProcessing(false)
        await processWarrantyReplacement()
        return
      } else if (actionType === "replace" && replaceType === "dissatisfaction") {
        // For dissatisfaction replacement, show payment modal
        setShowStockDecision(false)
        setShowReplacementPayment(true)
        setReplacementPaymentMethod(null)
        setReplacementCashAmount("")
        setReplacementUpiAmount("")
        return // Don't continue processing, wait for payment modal
      }
    } catch (error) {
      console.error('Error processing:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to process request",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
      if (actionType !== "replace") {
        setShowStockDecision(false)
        setStockDecision(null)
      }
    }
  }

  // Process replacement with payment
  const processReplacementWithPayment = async () => {
    const priceDiff = calculatePriceDifference()
    const finalAmount = calculateFinalPaymentAmount()
    
    // Validate payment method
    if (finalAmount > 0 && !replacementPaymentMethod) {
      toast({
        title: "Select Payment Method",
        description: "Please select how customer will pay",
        variant: "destructive",
      })
      return
    }
    
    if (finalAmount < 0 && !replacementPaymentMethod) {
      toast({
        title: "Select Refund Method",
        description: "Please select how to refund customer",
        variant: "destructive",
      })
      return
    }

    // Validate amounts for split payment
    if (replacementPaymentMethod === "split" && finalAmount > 0) {
      const cash = parseFloat(replacementCashAmount) || 0
      const upi = parseFloat(replacementUpiAmount) || 0
      if (cash + upi !== finalAmount) {
        toast({
          title: "Amount Mismatch",
          description: `Total must equal ₹${finalAmount.toLocaleString()}`,
          variant: "destructive",
        })
        return
      }
    }

    setReplacementProcessing(true)
    try {
      const discountAmt = calculateDiscountAmount()
      const newProductPrice = parseFloat(replacementProduct.selling_price || replacementProduct.price || 0) * replacementQuantity

      // Build item payload
      const itemPayload = {
        bill_item_id: selectedItem.id,
        new_product_id: replacementProduct.id || replacementProduct.product_id,
        price: newProductPrice,
      }

      // Add discount only if applied
      if (discountValue > 0) {
        itemPayload.discount_type = discountType
        itemPayload.discount_value = discountValue
      }

      // Build main payload
      const payload = {
        bill_id: searchedBill.billId,
        replacement_type: "dissatisfaction",
        return_destination: stockDecision,
        items: [itemPayload]
      }

      // Add payment or refund based on price difference
      if (finalAmount > 0) {
        // Customer pays - add payment object
        payload.payment = {
          payment_method: replacementPaymentMethod,
        }
        if (replacementPaymentMethod === "cash") {
          payload.payment.cash_amount = finalAmount
        } else if (replacementPaymentMethod === "upi") {
          payload.payment.upi_amount = finalAmount
        } else if (replacementPaymentMethod === "split") {
          payload.payment.cash_amount = parseFloat(replacementCashAmount) || 0
          payload.payment.upi_amount = parseFloat(replacementUpiAmount) || 0
        }
      } else if (finalAmount < 0) {
        // Refund to customer - add refund object
        const refundAmount = Math.abs(finalAmount)
        payload.refund = {
          refund_method: replacementPaymentMethod,
        }
        if (replacementPaymentMethod === "cash") {
          payload.refund.cash_amount = refundAmount
        } else if (replacementPaymentMethod === "upi") {
          payload.refund.upi_amount = refundAmount
        }
      }

      console.log("Processing dissatisfaction replacement with payment:", payload)

      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE}/api/pos/replace/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Dissatisfaction replacement API response:", data)

        let message = `Replacement processed for ${selectedItem.name}`
        if (finalAmount > 0) {
          message += `. Customer paid ₹${finalAmount.toLocaleString()}`
          if (discountAmt > 0) {
            message += ` (Discount: ₹${discountAmt.toLocaleString()})`
          }
        } else if (finalAmount < 0) {
          message += `. Refund ₹${Math.abs(finalAmount).toLocaleString()} to customer`
        }
        message += `. Item sent to ${stockDecision === 'stock' ? 'Stock' : 'Vendor'}.`

        toast({
          title: "Replacement Processed Successfully",
          description: message,
          className: "bg-green-50 border-green-200 text-green-800",
        })

        setShowReplacementPayment(false)
        setStockDecision(null)
        resetToSearch()
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || 'Failed to process replacement')
      }
    } catch (error) {
      console.error('Error processing replacement:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to process replacement",
        variant: "destructive",
      })
    } finally {
      setReplacementProcessing(false)
    }
  }

  const resetToSearch = () => {
    setSearchQuery("")
    setSearchedBills([])
    setSearchedBill(null)
    setSelectedItem(null)
    setActionType(null)
    setStep("search")
    setReturnPaymentMethod(null)
    setReplaceType(null)
    setReplacementProduct(null)
    setReplacementQuantity(1)
    setProductSearchQuery("")
    setProductSearchResults([])
    setShowStockDecision(false)
    setStockDecision(null)
    setNewSerialNumber("")
    // Reset payment and discount states
    setShowReplacementPayment(false)
    setReplacementPaymentMethod(null)
    setReplacementCashAmount("")
    setReplacementUpiAmount("")
    setDiscountType("percentage")
    setDiscountValue(0)
  }

  const goBack = () => {
    if (step === "action") {
      setSelectedItem(null)
      setActionType(null)
      setReturnPaymentMethod(null)
      setReplaceType(null)
      setReplacementProduct(null)
      setNewSerialNumber("")
      setStep("selectItem")
    } else if (step === "selectItem") {
      setSearchedBill(null)
      // Go back to bill selection if multiple bills, else to search
      if (searchedBills.length > 1) {
        setStep("selectBill")
      } else {
        setSearchedBills([])
        setStep("search")
      }
    } else if (step === "selectBill") {
      setSearchedBills([])
      setStep("search")
    }
  }

  const handleBillSelect = (bill) => {
    setSearchedBill(bill)
    setStep("selectItem")
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col p-3 md:p-4 overflow-hidden">
        {/* Header */}
        <div className="bg-white rounded-xl p-3 md:p-4 mb-3 border-2 border-gray-200">
          <div className="flex items-center gap-2">
            {step !== "search" && (
              <button
                onClick={goBack}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h3 className="font-bold text-lg text-black flex items-center gap-2">
                <RefreshCw size={18} />
                Return / Replace
              </h3>
              <p className="text-gray-600 text-xs mt-0.5">
                {step === "search" && "Search for a bill to process return or replacement"}
                {step === "selectBill" && `${searchedBills.length} bills found - Select a bill`}
                {step === "selectItem" && `Bill #${searchedBill?.id} - Select item`}
                {step === "action" && `${selectedItem?.name} - Choose action`}
              </p>
            </div>
          </div>
        </div>

        {/* Step 1: Search */}
        {step === "search" && (
          <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Enter bill number or customer mobile number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && searchBill()}
                  className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors bg-white text-sm"
                  autoFocus
                />
              </div>
              <button
                onClick={searchBill}
                disabled={searchLoading}
                className="bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 whitespace-nowrap text-sm"
              >
                {searchLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    Search Bill
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 1.5: Select Bill (when multiple bills found) */}
        {step === "selectBill" && searchedBills.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 flex-1 min-h-0">
            {/* Left Side - Customer Details (25%) */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-4 border-2 border-gray-200 sticky top-0">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-base">
                      {searchedBills[0]?.customerName?.charAt(0)?.toUpperCase() || 'C'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-black text-sm">{searchedBills[0]?.customerName}</h4>
                    <p className="text-xs text-gray-600">{searchedBills[0]?.customerMobile}</p>
                  </div>
                </div>
                
                <div className="space-y-2 border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-xs">Total Bills:</span>
                    <span className="font-semibold text-black text-sm">{searchedBills.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-xs">Total Amount:</span>
                    <span className="font-semibold text-black text-sm">
                      ₹{searchedBills.reduce((sum, bill) => sum + bill.finalAmount, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-xs">Due Balance:</span>
                    <span className="font-semibold text-red-600 text-sm">
                      ₹{(searchedBills[0]?.customerDueBalance || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-500 mb-1">Search Query</p>
                  <p className="text-xs font-medium text-black bg-gray-100 px-2 py-1.5 rounded-lg">{searchQuery}</p>
                </div>
              </div>
            </div>

            {/* Right Side - Bills List (75%) */}
            <div className="lg:col-span-3 flex flex-col min-h-0">
              <div className="bg-white rounded-xl border-2 border-gray-200 flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="p-3 bg-gray-50 border-b border-gray-200 shrink-0">
                  <h4 className="font-semibold text-black text-sm">Bills ({searchedBills.length})</h4>
                </div>
                <div className="divide-y divide-gray-100 flex-1 overflow-y-auto">
                  {searchedBills.map((bill, index) => (
                    <div
                      key={bill.billId || index}
                      className="p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        {/* Bill Info */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                          <div>
                            <p className="font-bold text-black text-sm">Bill #{bill.id}</p>
                            <p className="text-xs text-gray-600">{bill.date}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Items</p>
                            <p className="font-medium text-black text-sm">{bill.items.filter(item => item.quantity > item.returned && !item.is_returned).length} available</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Payment</p>
                            <p className={`font-medium capitalize text-sm ${bill.isPayLater ? 'text-orange-600' : 'text-black'}`}>
                              {bill.isPayLater ? 'Pay Later' : bill.paymentType}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Amount</p>
                            <p className="font-bold text-black text-base">₹{bill.finalAmount.toLocaleString()}</p>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 ml-3">
                          {/* Pay Due button for pay_later bills */}
                          {bill.isPayLater && (
                            <button
                              onClick={() => openDuePaymentModal(bill)}
                              className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-colors flex items-center gap-1.5 text-xs"
                            >
                              <CreditCard size={14} />
                              Pay Due
                            </button>
                          )}
                          <button
                            onClick={() => {
                              handleBillSelect(bill)
                              setActionType("return")
                            }}
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors flex items-center gap-1.5 text-xs"
                          >
                            <Wallet size={14} />
                            Return
                          </button>
                          <button
                            onClick={() => {
                              handleBillSelect(bill)
                              setActionType("replace")
                            }}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors flex items-center gap-1.5 text-xs"
                          >
                            <RefreshCw size={14} />
                            Replace
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Select Item from Bill */}
        {step === "selectItem" && searchedBill && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Bill Info - Left Side */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-4 border-2 border-gray-200 sticky top-0">
                <h4 className="font-bold text-base text-black mb-3">Bill #{searchedBill.id}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-xs">Date:</span>
                    <span className="font-medium text-black text-xs">{searchedBill.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-xs">Customer:</span>
                    <span className="font-medium text-black text-xs">{searchedBill.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-xs">Mobile:</span>
                    <span className="font-medium text-black text-xs">{searchedBill.customerMobile}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-xs">Payment:</span>
                    <span className="font-medium text-black text-xs capitalize">{searchedBill.paymentType}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-xs">Total Amount:</span>
                      <span className="font-bold text-lg text-black">₹{searchedBill.finalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items List - Right Side */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                <h4 className="font-semibold text-black text-sm mb-3">Select Item for Return/Replace</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {searchedBill.items.filter(item => item.quantity > item.returned).map((item, index) => (
                    <button
                      key={index}
                      onClick={() => !item.is_returned && handleItemSelect(item)}
                      disabled={item.is_returned}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        item.is_returned 
                          ? "bg-gray-100 border-gray-200 cursor-not-allowed opacity-60" 
                          : "bg-gray-50 hover:bg-gray-100 hover:border-gray-300 border-transparent"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className={`font-medium text-sm ${item.is_returned ? "text-gray-400" : "text-black"}`}>{item.name}</p>
                        <p className={`font-bold text-sm ${item.is_returned ? "text-gray-400" : "text-black"}`}>₹{item.price.toLocaleString()}</p>
                      </div>
                      {item.model && <p className="text-xs text-gray-600 mb-0.5">Model: {item.model}</p>}
                      {item.serial_number && <p className="text-xs text-purple-600 mb-1">S/N: {item.serial_number}</p>}
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-600">Qty: {item.quantity - item.returned} available</p>
                        {item.is_returned ? (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Returned</span>
                        ) : (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Select →</span>
                        )}
                      </div>
                      {/* Total Amount for this item */}
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                        <span className="text-xs text-gray-500">Total:</span>
                        <span className={`font-bold text-sm ${item.is_returned ? "text-gray-400" : "text-green-600"}`}>
                          ₹{(item.final_amount || (item.price * item.quantity)).toLocaleString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                {searchedBill.items.filter(item => item.quantity > item.returned && !item.is_returned).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No items available for return/replacement</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Choose Action (Return or Replace) */}
        {step === "action" && selectedItem && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1 min-h-0">
            {/* Selected Item Info - Left Side */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-4 border-2 border-gray-200 sticky top-0">
                <h4 className="font-semibold text-black text-sm mb-3">Selected Item</h4>
                <div className="space-y-2">
                  <div>
                    <p className="font-medium text-black text-sm">{selectedItem.name}</p>
                    {selectedItem.model && <p className="text-xs text-gray-600">Model: {selectedItem.model}</p>}
                    {selectedItem.serial_number && <p className="text-xs text-purple-600">S/N: {selectedItem.serial_number}</p>}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-xs">Unit Price:</span>
                    <span className="font-bold text-black text-sm">₹{selectedItem.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-xs">Available:</span>
                    <span className="font-medium text-black text-sm">{selectedItem.quantity - selectedItem.returned} units</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <p className="text-xs text-gray-500">Bill #{searchedBill?.id}</p>
                    <p className="text-xs text-gray-500">{searchedBill?.customerName} • {searchedBill?.customerMobile}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Area - Right Side */}
            <div className="lg:col-span-2 flex flex-col min-h-0">

            {/* Return Flow */}
            {actionType === "return" && (
              <div className="bg-white rounded-xl border-2 border-gray-200 flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
                  <h4 className="font-semibold text-black text-base">Process Return</h4>
                  <button
                    onClick={() => goBack()}
                    className="text-sm text-gray-600 hover:text-black px-3 py-1 rounded-lg hover:bg-gray-100"
                  >
                    ← Back
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left - Quantity & Amount */}
                    <div>
                      <label className="block text-xs font-medium text-black mb-2">Return Quantity</label>
                      <div className="flex items-center gap-2 mb-3">
                        <button
                          onClick={() => setReplacementQuantity(Math.max(1, replacementQuantity - 1))}
                          className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-base font-bold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={selectedItem.quantity - selectedItem.returned}
                          value={replacementQuantity}
                          onChange={(e) => setReplacementQuantity(Math.min(selectedItem.quantity - selectedItem.returned, Math.max(1, parseInt(e.target.value) || 1)))}
                          className="w-16 px-2 py-2 border-2 border-gray-200 rounded-lg text-center focus:outline-none focus:border-black text-base font-bold"
                        />
                        <button
                          onClick={() => setReplacementQuantity(Math.min(selectedItem.quantity - selectedItem.returned, replacementQuantity + 1))}
                          className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-base font-bold"
                        >
                          +
                        </button>
                        <span className="text-xs text-gray-500">of {selectedItem.quantity - selectedItem.returned}</span>
                      </div>

                      {/* Refund Amount */}
                      <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                        <p className="text-xs text-red-600 mb-0.5">Refund Amount</p>
                        <p className="font-bold text-xl text-red-700">₹{(selectedItem.price * replacementQuantity).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Right - Payment Method */}
                    <div>
                      <label className="block text-xs font-medium text-black mb-2">Payment Method</label>
                      
                      {/* Show message for Pay Later bills */}
                      {searchedBill?.isPayLater && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-2">
                          <p className="text-orange-700 text-xs font-medium">Pay Later Bill</p>
                          <p className="text-orange-600 text-xs mt-0.5">No refund applicable for unpaid bills</p>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <button
                          onClick={() => setReturnPaymentMethod("cash")}
                          disabled={searchedBill?.isPayLater}
                          className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                            searchedBill?.isPayLater
                              ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-50"
                              : returnPaymentMethod === "cash"
                                ? "border-green-500 bg-green-50"
                                : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${returnPaymentMethod === "cash" && !searchedBill?.isPayLater ? "bg-green-100" : "bg-gray-100"}`}>
                            <Wallet size={20} className={returnPaymentMethod === "cash" && !searchedBill?.isPayLater ? "text-green-600" : "text-gray-400"} />
                          </div>
                          <div className="text-left">
                            <p className={`font-medium text-sm ${searchedBill?.isPayLater ? "text-gray-400" : "text-black"}`}>Cash Refund</p>
                            <p className="text-xs text-gray-500">Return cash to customer</p>
                          </div>
                        </button>
                        <button
                          onClick={() => setReturnPaymentMethod("online")}
                          disabled={searchedBill?.isPayLater}
                          className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                            searchedBill?.isPayLater
                              ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-50"
                              : returnPaymentMethod === "online"
                                ? "border-green-500 bg-green-50"
                                : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${returnPaymentMethod === "online" && !searchedBill?.isPayLater ? "bg-green-100" : "bg-gray-100"}`}>
                            <CreditCard size={20} className={returnPaymentMethod === "online" && !searchedBill?.isPayLater ? "text-green-600" : "text-gray-400"} />
                          </div>
                          <div className="text-left">
                            <p className={`font-medium text-sm ${searchedBill?.isPayLater ? "text-gray-400" : "text-black"}`}>Online Transfer</p>
                            <p className="text-xs text-gray-500">UPI / Bank Transfer</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-100 shrink-0">
                  <button
                    onClick={handleReturnProcess}
                    disabled={!searchedBill?.isPayLater && !returnPaymentMethod}
                    className="w-full bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                  >
                    Process Return
                  </button>
                </div>
              </div>
            )}

            {/* Replace Flow */}
            {actionType === "replace" && (
              <div className="bg-white rounded-xl border-2 border-gray-200 flex flex-col flex-1 min-h-0 overflow-hidden">
                {!replaceType ? (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-black text-base">Select Replacement Type</h4>
                      <button
                        onClick={() => goBack()}
                        className="text-xs text-gray-600 hover:text-black px-2 py-1 rounded-lg hover:bg-gray-100"
                      >
                        ← Back
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => setReplaceType("warranty")}
                        className="p-4 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all flex flex-col items-center gap-3"
                      >
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle size={24} className="text-green-600" />
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-black text-base">Warranty Replacement</p>
                          <p className="text-xs text-gray-600">Same product, no charges</p>
                        </div>
                      </button>
                      <button
                        onClick={() => setReplaceType("dissatisfaction")}
                        className="p-4 rounded-xl border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all flex flex-col items-center gap-3"
                      >
                        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                          <AlertCircle size={24} className="text-orange-600" />
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-black text-base">Customer Dissatisfaction</p>
                          <p className="text-xs text-gray-600">Different product allowed</p>
                        </div>
                      </button>
                    </div>
                  </div>
                ) : replaceType === "warranty" ? (
                  <>
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle size={16} className="text-green-600" />
                        </div>
                        <h4 className="font-semibold text-black text-base">Warranty Replacement</h4>
                      </div>
                      <button
                        onClick={() => setReplaceType(null)}
                        className="text-xs text-gray-600 hover:text-black px-2 py-1 rounded-lg hover:bg-gray-100"
                      >
                        Change
                      </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4">
                    {/* Quantity Selection */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-black mb-2">Quantity</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setReplacementQuantity(Math.max(1, replacementQuantity - 1))}
                          className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-base font-bold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={selectedItem.quantity - selectedItem.returned}
                          value={replacementQuantity}
                          onChange={(e) => setReplacementQuantity(Math.min(selectedItem.quantity - selectedItem.returned, Math.max(1, parseInt(e.target.value) || 1)))}
                          className="w-16 px-2 py-2 border-2 border-gray-200 rounded-lg text-center focus:outline-none focus:border-black text-base font-bold"
                        />
                        <button
                          onClick={() => setReplacementQuantity(Math.min(selectedItem.quantity - selectedItem.returned, replacementQuantity + 1))}
                          className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-base font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* New Serial Number Input (only if original item has serial number) */}
                    {selectedItem.serial_number && (
                      <div className="mb-4">
                        <label className="block text-xs font-medium text-black mb-2">New Serial Number (Scan Barcode)</label>
                        <input
                          type="text"
                          value={newSerialNumber}
                          onChange={(e) => setNewSerialNumber(e.target.value)}
                          placeholder="Scan or enter new serial number..."
                          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                          autoComplete="off"
                        />
                        <p className="text-xs text-gray-500 mt-1">Old S/N: {selectedItem.serial_number}</p>
                      </div>
                    )}

                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="text-green-600" size={16} />
                        <span className="font-medium text-green-800 text-sm">Same Product Replacement</span>
                      </div>
                      <p className="text-xs text-green-700">
                        {replacementQuantity}x {selectedItem.name} will be replaced with the same product at no additional cost.
                      </p>
                    </div>
                    </div>

                    <div className="p-4 border-t border-gray-100 shrink-0">
                    <button
                      onClick={handleReplaceProcess}
                      disabled={processing || (selectedItem.serial_number && !newSerialNumber)}
                      className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2 text-sm"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={16} />
                          Process Warranty Replacement
                        </>
                      )}
                    </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <AlertCircle size={16} className="text-orange-600" />
                        </div>
                        <h4 className="font-semibold text-black text-base">Customer Dissatisfaction</h4>
                      </div>
                      <button
                        onClick={() => {
                          setReplaceType(null)
                          setReplacementProduct(null)
                          setProductSearchQuery("")
                        }}
                        className="text-xs text-gray-600 hover:text-black px-2 py-1 rounded-lg hover:bg-gray-100"
                      >
                        Change
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Left Side - Quantity & Search */}
                      <div>
                        {/* Quantity Selection */}
                        <div className="mb-4">
                          <label className="block text-xs font-medium text-black mb-2">Quantity</label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setReplacementQuantity(Math.max(1, replacementQuantity - 1))}
                              className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-base font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={selectedItem.quantity - selectedItem.returned}
                              value={replacementQuantity}
                              onChange={(e) => setReplacementQuantity(Math.min(selectedItem.quantity - selectedItem.returned, Math.max(1, parseInt(e.target.value) || 1)))}
                              className="w-16 px-2 py-2 border-2 border-gray-200 rounded-lg text-center focus:outline-none focus:border-black text-base font-bold"
                            />
                            <button
                              onClick={() => setReplacementQuantity(Math.min(selectedItem.quantity - selectedItem.returned, replacementQuantity + 1))}
                              className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-base font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Product Search */}
                        <div>
                          <label className="block text-xs font-medium text-black mb-2">Search Replacement Product</label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                              type="text"
                              placeholder="Search by product name, model or barcode..."
                              value={productSearchQuery}
                              onChange={(e) => setProductSearchQuery(e.target.value)}
                              className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors text-sm"
                            />
                          </div>
                        </div>

                        {/* Search Results */}
                        {productSearchQuery.trim() && (
                          <div className="mt-2 max-h-48 overflow-y-auto border-2 border-gray-200 rounded-lg">
                            {productSearchLoading ? (
                              <div className="text-center py-6">
                                <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
                              </div>
                            ) : productSearchResults.length > 0 ? (
                              <div className="divide-y">
                                {productSearchResults.map((product) => (
                                  <button
                                    key={product.id || product.product_id}
                                    onClick={() => {
                                      setReplacementProduct(product)
                                      setProductSearchQuery("")
                                    }}
                                    className="w-full p-3 hover:bg-gray-50 transition-all text-left"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-medium text-black text-sm">{product.name || product.product_name}</p>
                                        <p className="text-xs text-gray-600">
                                          {product.model_name || product.model} • Stock: {product.qty || 0}
                                        </p>
                                      </div>
                                      <p className="font-bold text-black text-sm">₹{parseFloat(product.selling_price || product.price || 0).toLocaleString()}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-6 text-gray-500 text-sm">
                                No products found
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right Side - Selected Product & Calculation */}
                      <div>
                        {/* Selected Replacement Product */}
                        {replacementProduct ? (
                          <>
                            <label className="block text-xs font-medium text-black mb-2">Selected Product</label>
                            <div className="p-3 rounded-lg border-2 border-orange-500 bg-orange-50 mb-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-black text-sm">{replacementProduct.name || replacementProduct.product_name}</p>
                                  <p className="text-xs text-gray-600">{replacementProduct.model_name || replacementProduct.model}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-lg text-black">₹{parseFloat(replacementProduct.selling_price || replacementProduct.price || 0).toLocaleString()}</p>
                                  <button
                                    onClick={() => setReplacementProduct(null)}
                                    className="text-red-600 text-xs hover:text-red-700 mt-0.5"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Price Calculation */}
                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                              <h5 className="font-semibold text-black text-sm mb-3 flex items-center gap-2">
                                <Calculator size={16} />
                                Price Calculation
                              </h5>
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-600">Paid Price ({replacementQuantity}x ₹{getPerUnitFinalPrice().toLocaleString()}):</span>
                                  <span className="text-black font-medium">₹{(getPerUnitFinalPrice() * replacementQuantity).toLocaleString()}</span>
                                </div>
                                {selectedItem.price !== getPerUnitFinalPrice() && (
                                  <div className="flex justify-between text-xs text-gray-400">
                                    <span>Original MRP: ₹{selectedItem.price.toLocaleString()}</span>
                                    <span className="text-green-600">Discount Applied</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-600">New Product ({replacementQuantity}x ₹{parseFloat(replacementProduct.selling_price || replacementProduct.price || 0).toLocaleString()}):</span>
                                  <span className="text-black font-medium">₹{getNewProductTotalPrice().toLocaleString()}</span>
                                </div>

                                {/* Discount Section - apply on new product price */}
                                <div className="border-t border-blue-200 pt-3 mt-2">
                                  <label className="block text-xs font-medium text-black mb-2">Apply Discount on New Product</label>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        setDiscountType("percentage")
                                        setDiscountValue(0)
                                      }}
                                      className={`p-2 rounded-lg transition-colors ${
                                        discountType === "percentage"
                                          ? "bg-black text-white"
                                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                      }`}
                                    >
                                      <Percent size={14} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setDiscountType("fixed")
                                        setDiscountValue(0)
                                      }}
                                      className={`p-2 rounded-lg transition-colors ${
                                        discountType === "fixed"
                                          ? "bg-black text-white"
                                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                      }`}
                                    >
                                      <IndianRupee size={14} />
                                    </button>
                                    <input
                                      type="number"
                                      min="0"
                                      max={discountType === "percentage" ? 100 : getNewProductTotalPrice()}
                                      value={discountValue || ""}
                                      onChange={(e) => {
                                        let val = parseFloat(e.target.value) || 0
                                        if (discountType === "percentage") {
                                          val = Math.min(100, Math.max(0, val))
                                        } else {
                                          val = Math.min(getNewProductTotalPrice(), Math.max(0, val))
                                        }
                                        setDiscountValue(val)
                                      }}
                                      placeholder="0"
                                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm bg-white"
                                    />
                                    {discountValue > 0 && (
                                      <button
                                        onClick={() => setDiscountValue(0)}
                                        className="p-2 text-red-600 hover:text-red-700"
                                      >
                                        <X size={14} />
                                      </button>
                                    )}
                                  </div>
                                  {discountValue > 0 && (
                                    <p className="text-xs text-green-600 mt-1">
                                      Discount on product: ₹{calculateDiscountAmount().toLocaleString()}
                                    </p>
                                  )}
                                </div>

                                {/* Discounted New Product Price */}
                                {discountValue > 0 && (
                                  <div className="flex justify-between text-xs bg-green-50 -mx-3 px-3 py-2 rounded">
                                    <span className="text-green-700 font-medium">New Product After Discount:</span>
                                    <span className="text-green-700 font-bold">₹{getDiscountedNewProductPrice().toLocaleString()}</span>
                                  </div>
                                )}

                                {/* Final Calculation */}
                                <div className={`border-t border-blue-200 pt-2 flex justify-between ${calculateFinalPaymentAmount() > 0 ? 'bg-orange-50' : calculateFinalPaymentAmount() < 0 ? 'bg-green-50' : ''} -mx-3 px-3 py-2 rounded-b-lg -mb-3`}>
                                  <span className="font-bold text-black text-sm">
                                    {calculateFinalPaymentAmount() > 0 ? "Customer Pays:" : calculateFinalPaymentAmount() < 0 ? "Refund to Customer:" : "No Difference:"}
                                  </span>
                                  <span className={`font-bold text-lg ${calculateFinalPaymentAmount() > 0 ? "text-orange-600" : calculateFinalPaymentAmount() < 0 ? "text-green-600" : "text-gray-600"}`}>
                                    ₹{Math.abs(calculateFinalPaymentAmount()).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6">
                            <div className="text-center text-gray-500">
                              <Search className="w-10 h-10 mx-auto mb-2 opacity-50" />
                              <p className="font-medium text-sm">Search and select a product</p>
                              <p className="text-xs">Use the search box to find replacement product</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    </div>

                    <div className="p-4 border-t border-gray-100 shrink-0">
                    <button
                      onClick={handleReplaceProcess}
                      disabled={!replacementProduct}
                      className="w-full bg-orange-600 text-white py-2.5 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                    >
                      <RefreshCw size={16} />
                      Process Replacement
                    </button>
                    </div>
                  </>
                )}
              </div>
            )}
            </div>
          </div>
        )}
      </div>

      {/* Stock Decision Popup */}
      {showStockDecision && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-black">Where to send the item?</h2>
                  <p className="text-xs text-gray-600 mt-0.5">Select destination for the returned product</p>
                </div>
                <button
                  onClick={() => {
                    setShowStockDecision(false)
                    setStockDecision(null)
                  }}
                  className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => setStockDecision("stock")}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                    stockDecision === "stock"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stockDecision === "stock" ? "bg-blue-100" : "bg-gray-100"}`}>
                    <Package size={24} className={stockDecision === "stock" ? "text-blue-600" : "text-gray-600"} />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-black text-sm">Return to Stock</p>
                    <p className="text-xs text-gray-600">Add back to inventory</p>
                  </div>
                </button>
                <button
                  onClick={() => setStockDecision("vendor")}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                    stockDecision === "vendor"
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stockDecision === "vendor" ? "bg-purple-100" : "bg-gray-100"}`}>
                    <Truck size={24} className={stockDecision === "vendor" ? "text-purple-600" : "text-gray-600"} />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-black text-sm">Return to Vendor</p>
                    <p className="text-xs text-gray-600">Send back to supplier</p>
                  </div>
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowStockDecision(false)
                    setStockDecision(null)
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={processWithStockDecision}
                  disabled={!stockDecision || processing}
                  className="flex-1 bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Confirm & Process"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Due Payment Modal */}
      {showDuePayment && duePaymentBill && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-green-50 p-4 border-b border-green-200 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-black">Collect Due Payment</h2>
                  <p className="text-xs text-gray-600 mt-0.5">Bill #{duePaymentBill.id} • {duePaymentBill.customerName}</p>
                </div>
                <button
                  onClick={() => {
                    setShowDuePayment(false)
                    setDuePaymentBill(null)
                  }}
                  className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Due Amount Display */}
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200 mb-4">
                <p className="text-xs text-orange-600 mb-0.5">Bill Due Amount</p>
                <p className="font-bold text-xl text-orange-700">₹{duePaymentBill.finalAmount.toLocaleString()}</p>
              </div>

              {/* Payment Method Selection */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-black mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setDuePaymentMethod("cash")
                      setDueCashAmount(duePaymentBill.finalAmount.toString())
                      setDueUpiAmount("")
                    }}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                      duePaymentMethod === "cash"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Wallet size={20} className={duePaymentMethod === "cash" ? "text-green-600" : "text-gray-600"} />
                    <span className={`font-medium text-xs ${duePaymentMethod === "cash" ? "text-green-700" : "text-gray-700"}`}>Cash</span>
                  </button>
                  <button
                    onClick={() => {
                      setDuePaymentMethod("upi")
                      setDueUpiAmount(duePaymentBill.finalAmount.toString())
                      setDueCashAmount("")
                    }}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                      duePaymentMethod === "upi"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <CreditCard size={20} className={duePaymentMethod === "upi" ? "text-green-600" : "text-gray-600"} />
                    <span className={`font-medium text-xs ${duePaymentMethod === "upi" ? "text-green-700" : "text-gray-700"}`}>UPI</span>
                  </button>
                  <button
                    onClick={() => {
                      setDuePaymentMethod("split")
                      setDueCashAmount("")
                      setDueUpiAmount("")
                    }}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                      duePaymentMethod === "split"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Calculator size={20} className={duePaymentMethod === "split" ? "text-green-600" : "text-gray-600"} />
                    <span className={`font-medium text-xs ${duePaymentMethod === "split" ? "text-green-700" : "text-gray-700"}`}>Split</span>
                  </button>
                </div>
              </div>

              {/* Amount Input Fields */}
              {duePaymentMethod && (
                <div className="space-y-3">
                  {/* Single field for Cash or UPI */}
                  {duePaymentMethod === "cash" && (
                    <div>
                      <label className="block text-xs font-medium text-black mb-1">Cash Amount</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₹</span>
                        <input
                          type="number"
                          value={dueCashAmount}
                          onChange={(e) => {
                            const val = e.target.value
                            if (val === "" || (parseFloat(val) >= 0 && parseFloat(val) <= duePaymentBill.finalAmount)) {
                              setDueCashAmount(val)
                            }
                          }}
                          placeholder="0"
                          max={duePaymentBill.finalAmount}
                          className="w-full pl-7 pr-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 font-medium"
                        />
                      </div>
                    </div>
                  )}
                  {duePaymentMethod === "upi" && (
                    <div>
                      <label className="block text-xs font-medium text-black mb-1">UPI Amount</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₹</span>
                        <input
                          type="number"
                          value={dueUpiAmount}
                          onChange={(e) => {
                            const val = e.target.value
                            if (val === "" || (parseFloat(val) >= 0 && parseFloat(val) <= duePaymentBill.finalAmount)) {
                              setDueUpiAmount(val)
                            }
                          }}
                          placeholder="0"
                          max={duePaymentBill.finalAmount}
                          className="w-full pl-7 pr-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 font-medium"
                        />
                      </div>
                    </div>
                  )}

                  {/* Split - Both fields in one row */}
                  {duePaymentMethod === "split" && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-black mb-1">Cash</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₹</span>
                            <input
                              type="number"
                              value={dueCashAmount}
                              onChange={(e) => {
                                const val = e.target.value
                                if (val === "" || parseFloat(val) >= 0) {
                                  setDueCashAmount(val)
                                }
                              }}
                              placeholder="0"
                              className="w-full pl-7 pr-2 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 font-medium"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-black mb-1">UPI</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₹</span>
                            <input
                              type="number"
                              value={dueUpiAmount}
                              onChange={(e) => {
                                const val = e.target.value
                                if (val === "" || parseFloat(val) >= 0) {
                                  setDueUpiAmount(val)
                                }
                              }}
                              placeholder="0"
                              className="w-full pl-7 pr-2 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 font-medium"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Total Display for Split */}
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">Total Paying:</span>
                          <span className={`font-bold ${
                            (parseFloat(dueCashAmount) || 0) + (parseFloat(dueUpiAmount) || 0) > duePaymentBill.finalAmount
                              ? "text-red-600"
                              : "text-green-600"
                          }`}>
                            ₹{((parseFloat(dueCashAmount) || 0) + (parseFloat(dueUpiAmount) || 0)).toLocaleString()}
                          </span>
                        </div>
                        {(parseFloat(dueCashAmount) || 0) + (parseFloat(dueUpiAmount) || 0) > duePaymentBill.finalAmount && (
                          <p className="text-red-500 text-xs mt-1">Cannot exceed due amount</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDuePayment(false)
                    setDuePaymentBill(null)
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={processDuePayment}
                  disabled={!duePaymentMethod || dueProcessing || 
                    (duePaymentMethod === "split" && (parseFloat(dueCashAmount) || 0) + (parseFloat(dueUpiAmount) || 0) > duePaymentBill.finalAmount)}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  {dueProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Collect Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Replacement Payment Modal */}
      {showReplacementPayment && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            <div className={`${calculateFinalPaymentAmount() > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} p-4 border-b shrink-0`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-black">
                    {calculateFinalPaymentAmount() > 0 ? 'Collect Payment' : 'Process Refund'}
                  </h2>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {selectedItem?.name} → {replacementProduct?.name || replacementProduct?.product_name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowReplacementPayment(false)
                    setStockDecision(null)
                  }}
                  className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Amount Summary */}
              <div className={`${calculateFinalPaymentAmount() > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} rounded-lg p-3 border mb-4`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-600">Customer Paid:</span>
                  <span className="font-medium text-sm">₹{(getPerUnitFinalPrice() * replacementQuantity).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-600">New Product Price:</span>
                  <span className="font-medium text-sm">₹{getNewProductTotalPrice().toLocaleString()}</span>
                </div>
                {discountValue > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-green-600">Discount on Product ({discountType === 'percentage' ? `${discountValue}%` : `₹${discountValue}`}):</span>
                    <span className="font-medium text-sm text-green-600">-₹{calculateDiscountAmount().toLocaleString()}</span>
                  </div>
                )}
                {discountValue > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-600">After Discount:</span>
                    <span className="font-medium text-sm">₹{getDiscountedNewProductPrice().toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between items-center">
                  <span className={`font-semibold ${calculateFinalPaymentAmount() > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    {calculateFinalPaymentAmount() > 0 ? 'Customer Pays:' : 'Refund Amount:'}
                  </span>
                  <span className={`font-bold text-xl ${calculateFinalPaymentAmount() > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    ₹{Math.abs(calculateFinalPaymentAmount()).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-black mb-2">
                  {calculateFinalPaymentAmount() > 0 ? 'Payment Method' : 'Refund Method'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setReplacementPaymentMethod("cash")
                      setReplacementCashAmount(Math.abs(calculateFinalPaymentAmount()).toString())
                      setReplacementUpiAmount("")
                    }}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                      replacementPaymentMethod === "cash"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Wallet size={18} className={replacementPaymentMethod === "cash" ? "text-green-600" : "text-gray-600"} />
                    <span className="text-xs font-medium">Cash</span>
                  </button>
                  <button
                    onClick={() => {
                      setReplacementPaymentMethod("upi")
                      setReplacementUpiAmount(Math.abs(calculateFinalPaymentAmount()).toString())
                      setReplacementCashAmount("")
                    }}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                      replacementPaymentMethod === "upi"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <CreditCard size={18} className={replacementPaymentMethod === "upi" ? "text-blue-600" : "text-gray-600"} />
                    <span className="text-xs font-medium">UPI</span>
                  </button>
                  {calculateFinalPaymentAmount() > 0 && (
                    <button
                      onClick={() => {
                        setReplacementPaymentMethod("split")
                        setReplacementCashAmount("")
                        setReplacementUpiAmount("")
                      }}
                      className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                        replacementPaymentMethod === "split"
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Split size={18} className={replacementPaymentMethod === "split" ? "text-purple-600" : "text-gray-600"} />
                      <span className="text-xs font-medium">Split</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Split Payment Amounts */}
              {replacementPaymentMethod === "split" && calculateFinalPaymentAmount() > 0 && (
                <>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-black mb-1">Cash Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={replacementCashAmount}
                        onChange={(e) => setReplacementCashAmount(e.target.value)}
                        placeholder="0"
                        className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 text-base"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-black mb-1">UPI Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={replacementUpiAmount}
                        onChange={(e) => setReplacementUpiAmount(e.target.value)}
                        placeholder="0"
                        className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-base"
                      />
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Entered:</span>
                      <span className={`font-bold ${
                        (parseFloat(replacementCashAmount) || 0) + (parseFloat(replacementUpiAmount) || 0) === calculateFinalPaymentAmount()
                          ? "text-green-600"
                          : "text-red-600"
                      }`}>
                        ₹{((parseFloat(replacementCashAmount) || 0) + (parseFloat(replacementUpiAmount) || 0)).toLocaleString()}
                      </span>
                    </div>
                    {(parseFloat(replacementCashAmount) || 0) + (parseFloat(replacementUpiAmount) || 0) !== calculateFinalPaymentAmount() && (
                      <p className="text-red-500 text-xs mt-1">
                        Must equal ₹{calculateFinalPaymentAmount().toLocaleString()}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Stock Decision Display */}
              <div className="mt-4 bg-gray-50 rounded-lg p-3 border">
                <div className="flex items-center gap-2">
                  {stockDecision === 'stock' ? (
                    <Package size={16} className="text-blue-600" />
                  ) : (
                    <Truck size={16} className="text-purple-600" />
                  )}
                  <span className="text-sm">
                    Item will be sent to: <strong>{stockDecision === 'stock' ? 'Stock' : 'Vendor'}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowReplacementPayment(false)
                    setStockDecision(null)
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={processReplacementWithPayment}
                  disabled={
                    !replacementPaymentMethod || 
                    replacementProcessing ||
                    (replacementPaymentMethod === "split" && 
                      (parseFloat(replacementCashAmount) || 0) + (parseFloat(replacementUpiAmount) || 0) !== calculateFinalPaymentAmount())
                  }
                  className={`flex-1 ${calculateFinalPaymentAmount() > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'} text-white py-3 rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm`}
                >
                  {replacementProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      {calculateFinalPaymentAmount() > 0 ? 'Collect & Process' : 'Refund & Process'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReturnReplacePage
