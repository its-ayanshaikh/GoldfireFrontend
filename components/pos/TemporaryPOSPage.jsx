"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Trash2, X, Scan, User, Phone, Loader2, ShoppingCart, Save, Calendar } from "lucide-react"
import { useToast } from "../../hooks/use-toast"

const TemporaryPOSPage = () => {
  const { toast } = useToast()
  
  // Customer Details
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  
  // Bill Date
  const [billDate, setBillDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  
  // Get max date (today)
  const getMaxDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }
  
  // Discount
  const [discountType, setDiscountType] = useState("percentage")
  const [discountValue, setDiscountValue] = useState(0)
  
  // Items
  const [items, setItems] = useState([])
  const [currentItem, setCurrentItem] = useState({
    product_name: "",
    price: "",
    qty: 1,
    is_warranty: false,
    hsn: {
      code: "",
      cgst: "",
      sgst: "",
      igst: 0
    },
    serial_numbers: []
  })
  
  const [serialInput, setSerialInput] = useState("")
  const serialInputRef = useRef(null)
  const [savingOrder, setSavingOrder] = useState(false)

  // Clean barcode function
  const cleanBarcode = (value) => {
    if (!value) return value
    return value
      .replace(/Enter/gi, '')
      .replace(/\r?\n/g, '')
      .replace(/\r/g, '')
      .replace(/\u000D/g, '')
      .replace(/\u000A/g, '')
      .replace(/\u0013/g, '')
      .replace(/\u0010/g, '')
      .trim()
  }

  // Barcode scanner for serial numbers
  useEffect(() => {
    let barcodeBuffer = ""
    let lastKeyTime = 0

    const handleKeyPress = (e) => {
      if (document.activeElement !== serialInputRef.current) return

      const currentTime = Date.now()
      const timeDiff = currentTime - lastKeyTime

      if (timeDiff < 50 && barcodeBuffer.length > 0) {
        barcodeBuffer += e.key
      } else {
        barcodeBuffer = e.key
      }

      lastKeyTime = currentTime

      if (e.key === 'Enter' && barcodeBuffer.length >= 8) {
        e.preventDefault()
        const cleanedBarcode = cleanBarcode(barcodeBuffer)
        if (cleanedBarcode) {
          addSerialNumber(cleanedBarcode)
        }
        barcodeBuffer = ""
      } else if (barcodeBuffer.length >= 13 && timeDiff < 50) {
        setTimeout(() => {
          if (barcodeBuffer.length >= 8) {
            const cleanedBarcode = cleanBarcode(barcodeBuffer)
            if (cleanedBarcode) {
              addSerialNumber(cleanedBarcode)
            }
            barcodeBuffer = ""
          }
        }, 100)
      }
    }

    document.addEventListener('keypress', handleKeyPress)
    return () => document.removeEventListener('keypress', handleKeyPress)
  }, [currentItem])

  const addSerialNumber = (serial) => {
    if (!serial.trim()) return
    
    // Check if warranty is enabled
    if (!currentItem.is_warranty) {
      toast({
        title: "Warranty Not Enabled",
        description: "Please enable warranty to add serial numbers",
        variant: "destructive",
      })
      return
    }
    
    // Check if already at max quantity
    if (currentItem.serial_numbers.length >= currentItem.qty) {
      toast({
        title: "Maximum Serials Reached",
        description: `Cannot add more than ${currentItem.qty} serial numbers`,
        variant: "destructive",
      })
      return
    }
    
    if (currentItem.serial_numbers.includes(serial.trim())) {
      toast({
        title: "Duplicate Serial",
        description: "This serial number is already added",
        variant: "destructive",
      })
      return
    }

    setCurrentItem(prev => ({
      ...prev,
      serial_numbers: [...prev.serial_numbers, serial.trim()]
    }))
    
    setSerialInput("")
    
    toast({
      title: "Serial Added",
      description: `Serial ${serial} added (${currentItem.serial_numbers.length + 1}/${currentItem.qty})`,
      className: "bg-green-50 border-green-200 text-green-800",
    })
  }

  const removeSerialNumber = (index) => {
    setCurrentItem(prev => ({
      ...prev,
      serial_numbers: prev.serial_numbers.filter((_, i) => i !== index)
    }))
  }

  const handleAddSerialManually = () => {
    if (serialInput.trim()) {
      addSerialNumber(serialInput.trim())
    }
  }

  const handleAddItem = () => {
    if (!currentItem.product_name.trim()) {
      toast({
        title: "Product Name Required",
        description: "Please enter product name",
        variant: "destructive",
      })
      return
    }

    if (!currentItem.price || parseFloat(currentItem.price) <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter valid price",
        variant: "destructive",
      })
      return
    }

    if (currentItem.qty <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Quantity must be at least 1",
        variant: "destructive",
      })
      return
    }

    if (currentItem.is_warranty) {
      if (!currentItem.hsn.code.trim()) {
        toast({
          title: "HSN Code Required",
          description: "Please enter HSN code for warranty item",
          variant: "destructive",
        })
        return
      }
      if (!currentItem.hsn.cgst || parseFloat(currentItem.hsn.cgst) < 0) {
        toast({
          title: "Invalid CGST",
          description: "Please enter valid CGST percentage",
          variant: "destructive",
        })
        return
      }
      if (!currentItem.hsn.sgst || parseFloat(currentItem.hsn.sgst) < 0) {
        toast({
          title: "Invalid SGST",
          description: "Please enter valid SGST percentage",
          variant: "destructive",
        })
        return
      }
      
      // Check serial numbers count matches quantity for warranty items
      if (currentItem.serial_numbers.length !== currentItem.qty) {
        toast({
          title: "Serial Number Count Mismatch",
          description: `Please add exactly ${currentItem.qty} serial number(s). Currently added: ${currentItem.serial_numbers.length}`,
          variant: "destructive",
        })
        return
      }
    }

    const newItem = {
      ...currentItem,
      price: parseFloat(currentItem.price),
      hsn: currentItem.is_warranty ? {
        code: currentItem.hsn.code,
        cgst: parseFloat(currentItem.hsn.cgst),
        sgst: parseFloat(currentItem.hsn.sgst),
        igst: 0
      } : undefined
    }

    setItems([...items, newItem])

    setCurrentItem({
      product_name: "",
      price: "",
      qty: 1,
      is_warranty: false,
      hsn: {
        code: "",
        cgst: "",
        sgst: "",
        igst: 0
      },
      serial_numbers: []
    })
    setSerialInput("")

    toast({
      title: "Item Added",
      description: `${newItem.product_name} added`,
      className: "bg-green-50 border-green-200 text-green-800",
    })
  }

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.qty), 0)
  }

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal()
    if (discountType === "percentage") {
      return (subtotal * discountValue) / 100
    }
    return discountValue
  }

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount()
  }

  const handleSaveOrder = async () => {
    if (!customerName.trim()) {
      toast({
        title: "Customer Name Required",
        description: "Please enter customer name",
        variant: "destructive",
      })
      return
    }

    if (!customerPhone.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter customer phone number",
        variant: "destructive",
      })
      return
    }

    if (items.length === 0) {
      toast({
        title: "No Items",
        description: "Please add at least one item",
        variant: "destructive",
      })
      return
    }

    const payload = {
      customer: {
        name: customerName.trim(),
        phone: customerPhone.trim()
      },
      bill_date: billDate,
      discount_type: discountType,
      discount_value: parseFloat(discountValue) || 0,
      items: items.map(item => {
        const itemData = {
          product_name: item.product_name,
          price: item.price,
          qty: item.qty,
          serial_numbers: item.serial_numbers
        }

        if (item.is_warranty && item.hsn) {
          itemData.hsn = {
            code: item.hsn.code,
            cgst: item.hsn.cgst,
            sgst: item.hsn.sgst,
            igst: item.hsn.igst || 0
          }
        } else {
          itemData.hsn_code = ""
          itemData.cgst = 0
          itemData.sgst = 0
          itemData.igst = 0
        }

        return itemData
      })
    }

    console.log("Temporary Order Payload:", JSON.stringify(payload, null, 2))

    setSavingOrder(true)

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pos/temporary-orders/create/`, {
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
        console.log("Temporary order created:", data)

        toast({
          title: "Order Saved Successfully",
          description: `Temporary order created for ${customerName}`,
          className: "bg-green-50 border-green-200 text-green-800",
        })

        setCustomerName("")
        setCustomerPhone("")
        setBillDate(() => {
          const today = new Date()
          return today.toISOString().split('T')[0]
        })
        setDiscountType("percentage")
        setDiscountValue(0)
        setItems([])
        setCurrentItem({
          product_name: "",
          price: "",
          qty: 1,
          is_warranty: false,
          hsn: {
            code: "",
            cgst: "",
            sgst: "",
            igst: 0
          },
          serial_numbers: []
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("Order creation failed:", errorData)

        toast({
          title: "Order Creation Failed",
          description: errorData.error || errorData.message || "Failed to create order",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating order:', error)
      toast({
        title: "Network Error",
        description: "Failed to save order. Please check your connection.",
        variant: "destructive",
      })
    } finally {
      setSavingOrder(false)
    }
  }

  return (
    <div className="h-full flex flex-col md:flex-row bg-gray-50">
      {/* LEFT SIDE - Product Entry Form */}
      <div className="w-full md:w-1/2 flex flex-col border-r border-gray-200 bg-white">
        {/* Customer Details Header */}
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="relative">
              <User className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Customer Name*"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full pl-8 pr-2 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-black transition-colors bg-white text-sm"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="tel"
                placeholder="Mobile Number*"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full pl-8 pr-2 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-black transition-colors bg-white text-sm"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                max={getMaxDate()}
                className="w-full pl-8 pr-2 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-black transition-colors bg-white text-sm"
              />
            </div>
          </div>
        </div>

        {/* Product Entry Form */}
        <div className="flex-1 overflow-y-auto p-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Product</h3>
          
          {/* Row 1: Product Name, Price, Qty, Warranty Toggle */}
          <div className="grid grid-cols-12 gap-2 mb-2">
            <input
              type="text"
              value={currentItem.product_name}
              onChange={(e) => setCurrentItem({...currentItem, product_name: e.target.value})}
              placeholder="Product Name*"
              className="col-span-5 px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-black"
            />
            <input
              type="number"
              value={currentItem.price}
              onChange={(e) => setCurrentItem({...currentItem, price: e.target.value})}
              placeholder="Price*"
              min="0"
              step="0.01"
              className="col-span-3 px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-black"
            />
            <input
              type="number"
              value={currentItem.qty}
              onChange={(e) => setCurrentItem({...currentItem, qty: parseInt(e.target.value) || 1})}
              placeholder="Qty"
              min="1"
              className="col-span-2 px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-black"
            />
            <label className="col-span-2 flex items-center justify-center border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={currentItem.is_warranty}
                onChange={(e) => setCurrentItem({...currentItem, is_warranty: e.target.checked})}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-1 text-xs text-gray-700">Warranty</span>
            </label>
          </div>

          {/* Row 2: HSN & GST (shown when warranty is enabled) */}
          {currentItem.is_warranty && (
            <div className="grid grid-cols-12 gap-2 mb-2 p-2 bg-blue-50 rounded border border-blue-200">
              <input
                type="text"
                value={currentItem.hsn.code}
                onChange={(e) => setCurrentItem({
                  ...currentItem,
                  hsn: {...currentItem.hsn, code: e.target.value}
                })}
                placeholder="HSN Code*"
                className="col-span-6 px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              />
              <input
                type="number"
                value={currentItem.hsn.cgst}
                onChange={(e) => setCurrentItem({
                  ...currentItem,
                  hsn: {...currentItem.hsn, cgst: e.target.value}
                })}
                placeholder="CGST %*"
                min="0"
                max="100"
                step="0.01"
                className="col-span-3 px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              />
              <input
                type="number"
                value={currentItem.hsn.sgst}
                onChange={(e) => setCurrentItem({
                  ...currentItem,
                  hsn: {...currentItem.hsn, sgst: e.target.value}
                })}
                placeholder="SGST %*"
                min="0"
                max="100"
                step="0.01"
                className="col-span-3 px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Row 3: Serial Numbers (only for warranty items) */}
          {currentItem.is_warranty && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-700">
                  Serial Numbers* ({currentItem.serial_numbers.length}/{currentItem.qty})
                </label>
                {currentItem.serial_numbers.length < currentItem.qty && (
                  <span className="text-xs text-orange-600">
                    Add {currentItem.qty - currentItem.serial_numbers.length} more
                  </span>
                )}
                {currentItem.serial_numbers.length === currentItem.qty && (
                  <span className="text-xs text-green-600">✓ Complete</span>
                )}
              </div>
              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <Scan className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    ref={serialInputRef}
                    type="text"
                    value={serialInput}
                    onChange={(e) => setSerialInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddSerialManually()
                      }
                    }}
                    placeholder="Scan or type serial number"
                    disabled={currentItem.serial_numbers.length >= currentItem.qty}
                    className="w-full pl-8 pr-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-black disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <button
                  onClick={handleAddSerialManually}
                  disabled={currentItem.serial_numbers.length >= currentItem.qty}
                  className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              
              {currentItem.serial_numbers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {currentItem.serial_numbers.map((serial, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
                    >
                      <span>{serial}</span>
                      <button
                        onClick={() => removeSerialNumber(index)}
                        className="hover:text-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add Item Button */}
          <button
            onClick={handleAddItem}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add to Order
          </button>
        </div>

        {/* Discount Section - POS Style */}
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Discount:</span>
            <div className="flex items-center border border-gray-300 rounded overflow-hidden">
              <button
                onClick={() => setDiscountType("percentage")}
                className={`px-3 py-1 text-sm transition-colors ${
                  discountType === "percentage" ? "bg-black text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                %
              </button>
              <button
                onClick={() => setDiscountType("fixed")}
                className={`px-3 py-1 text-sm transition-colors ${
                  discountType === "fixed" ? "bg-black text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                ₹
              </button>
            </div>
            <input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
              placeholder="0"
              min="0"
              step="0.01"
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-black"
            />
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Order Preview & Summary */}
      <div className="w-full md:w-1/2 flex flex-col bg-gray-50">
        {/* Items Preview */}
        <div className="flex-1 overflow-y-auto p-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Items ({items.length})</h3>
          
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <ShoppingCart className="w-16 h-16 mb-2" />
              <p className="text-sm">No items added yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded p-3 hover:border-gray-300 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{item.product_name}</h4>
                      <div className="text-xs text-gray-600 mt-1">
                        <span>₹{item.price.toLocaleString()}</span>
                        <span className="mx-2">×</span>
                        <span>{item.qty}</span>
                        <span className="mx-2">=</span>
                        <span className="font-medium text-gray-900">₹{(item.price * item.qty).toLocaleString()}</span>
                      </div>
                      
                      {item.is_warranty && item.hsn && (
                        <div className="text-xs text-blue-600 mt-1">
                          HSN: {item.hsn.code} | CGST: {item.hsn.cgst}% | SGST: {item.hsn.sgst}%
                        </div>
                      )}
                      
                      {item.serial_numbers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.serial_numbers.map((serial, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                              {serial}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => removeItem(index)}
                      className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary & Save Button */}
        <div className="p-3 bg-white border-t border-gray-200">
          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-sm text-gray-700">
              <span>Subtotal:</span>
              <span className="font-medium">₹{calculateSubtotal().toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-700">
              <span>Discount ({discountType === "percentage" ? `${discountValue}%` : "Fixed"}):</span>
              <span className="font-medium text-red-600">- ₹{calculateDiscount().toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total:</span>
              <span>₹{calculateTotal().toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={handleSaveOrder}
            disabled={savingOrder || items.length === 0}
            className="w-full px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {savingOrder ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving Order...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Order
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TemporaryPOSPage
