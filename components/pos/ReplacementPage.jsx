"use client"

import { useState } from "react"
import { RefreshCw, Search, X, CheckCircle, AlertCircle, Calculator, Plus } from "lucide-react"
import { useToast } from "../../hooks/use-toast"

const ReplacementPage = () => {
  const [selectedBill, setSelectedBill] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showReplacementModal, setShowReplacementModal] = useState(false)
  const [replacementType, setReplacementType] = useState("dissatisfaction") // dissatisfaction or warranty
  const [selectedItem, setSelectedItem] = useState(null)
  const [replacementProduct, setReplacementProduct] = useState(null)
  const [replacementQuantity, setReplacementQuantity] = useState(1)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState("")
  const [productSearchQuery, setProductSearchQuery] = useState("")
  // Discount states for customer dissatisfaction
  const [discountType, setDiscountType] = useState("percentage") // percentage or fixed
  const [discountValue, setDiscountValue] = useState(0)
  const { toast } = useToast()

  // Mock bills data - same as BillsPage but only showing bills with returnable items
  const [bills] = useState([
    {
      id: "B001",
      date: "2024-01-15",
      salesperson: "John Doe",
      customerName: "Rahul Sharma",
      customerMobile: "9876543210",
      total: 159800,
      status: "normal",
      paymentType: "Cash",
      items: [
        {
          id: 1,
          name: "iPhone 14",
          model: "A2882",
          category: "Mobile",
          quantity: 2,
          price: 79900,
          rack: "A1",
          returned: 0,
          gst: 18,
        },
        {
          id: 2,
          name: "AirPods Pro",
          model: "A2084",
          category: "Accessories",
          quantity: 1,
          price: 24900,
          rack: "B2",
          returned: 0,
          gst: 18,
        },
      ],
    },
    {
      id: "B002",
      date: "2024-01-15",
      salesperson: "Jane Smith",
      customerName: "Priya Singh",
      customerMobile: "9123456789",
      total: 74999,
      status: "partial_return",
      paymentType: "UPI",
      items: [
        {
          id: 3,
          name: "Samsung Galaxy S23",
          model: "SM-S911B",
          category: "Mobile",
          quantity: 2,
          price: 74999,
          rack: "A2",
          returned: 1,
          gst: 18,
        },
      ],
    },
  ])

  // Mock available products for replacement
  const [availableProducts] = useState([
    {
      id: 101,
      name: "iPhone 15",
      model: "A3089",
      category: "Mobile",
      price: 89900,
      rack: "A1",
      stock: 5,
      barcode: "1234567890123",
    },
    {
      id: 102,
      name: "iPhone 14 Pro",
      model: "A2890",
      category: "Mobile",
      price: 99900,
      rack: "A2",
      stock: 3,
      barcode: "1234567890124",
    },
    {
      id: 103,
      name: "Samsung Galaxy S24",
      model: "SM-S921B",
      category: "Mobile",
      price: 79999,
      rack: "A3",
      stock: 4,
      barcode: "1234567890125",
    },
    {
      id: 104,
      name: "AirPods Pro 2",
      model: "A2698",
      category: "Accessories",
      price: 26900,
      rack: "B1",
      stock: 8,
      barcode: "1234567890126",
    },
    {
      id: 105,
      name: "Samsung Buds Pro",
      model: "SM-R190",
      category: "Accessories",
      price: 15999,
      rack: "B2",
      stock: 6,
      barcode: "1234567890127",
    },
    {
      id: 106,
      name: "iPhone 14",
      model: "A2882",
      category: "Mobile",
      price: 79900,
      rack: "A1",
      stock: 3,
      barcode: "1234567890128",
    },
    {
      id: 107,
      name: "AirPods Pro",
      model: "A2084",
      category: "Accessories",
      price: 24900,
      rack: "B2",
      stock: 5,
      barcode: "1234567890129",
    },
    {
      id: 108,
      name: "Samsung Galaxy S23",
      model: "SM-S911B",
      category: "Mobile",
      price: 74999,
      rack: "A2",
      stock: 4,
      barcode: "1234567890130",
    },
    {
      id: 109,
      name: "iPhone 15 Pro Max",
      model: "A3090",
      category: "Mobile",
      price: 119900,
      rack: "A4",
      stock: 2,
      barcode: "1234567890131",
    },
    {
      id: 110,
      name: "OnePlus 12",
      model: "CPH2573",
      category: "Mobile",
      price: 64999,
      rack: "A5",
      stock: 7,
      barcode: "1234567890132",
    },
  ])

  const filteredBills = bills.filter((bill) => {
    const hasReturnableItems = bill.items.some((item) => item.quantity > item.returned)
    const matchesSearch =
      !searchQuery ||
      bill.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.customerMobile.includes(searchQuery)

    return hasReturnableItems && matchesSearch
  })

  const initializeReplacement = (bill, item) => {
    setSelectedItem(item)
    setReplacementQuantity(1)
    setReplacementProduct(null)
    setDiscountType("percentage")
    setDiscountValue(0)
    setShowReplacementModal(true)
  }

  const calculatePriceDifference = () => {
    if (!selectedItem || !replacementProduct) return 0
    const originalPrice = selectedItem.price * replacementQuantity
    const newPrice = replacementProduct.price * replacementQuantity
    return newPrice - originalPrice
  }

  // Calculate discount amount
  const calculateDiscountAmount = () => {
    if (!selectedItem || !replacementProduct || discountValue <= 0) return 0
    const priceDifference = calculatePriceDifference()
    if (priceDifference <= 0) return 0 // No discount on refunds
    
    if (discountType === "percentage") {
      return (priceDifference * discountValue) / 100
    }
    return Math.min(discountValue, priceDifference) // Fixed discount can't exceed price difference
  }

  // Calculate final amount after discount
  const calculateFinalAmount = () => {
    const priceDifference = calculatePriceDifference()
    if (priceDifference <= 0) return priceDifference
    return priceDifference - calculateDiscountAmount()
  }

  const processReplacement = () => {
    if (!replacementProduct) {
      toast({
        title: "Select Replacement Product",
        description: "Please select a product for replacement",
        variant: "destructive",
      })
      return
    }

    const priceDifference = calculatePriceDifference()
    const isWarranty = replacementType === "warranty"

    if (
      isWarranty &&
      (replacementProduct.name !== selectedItem.name || replacementProduct.model !== selectedItem.model)
    ) {
      toast({
        title: "Warranty Replacement Error",
        description: "Warranty replacement must be with the same product model",
        variant: "destructive",
      })
      return
    }

    if (replacementProduct.stock < replacementQuantity) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${replacementProduct.stock} units available in stock`,
        variant: "destructive",
      })
      return
    }

    const replacementData = {
      billId: selectedBill.id,
      originalItem: selectedItem,
      replacementProduct,
      quantity: replacementQuantity,
      type: replacementType,
      priceDifference,
      customer: selectedBill.customerName,
      mobile: selectedBill.customerMobile,
    }

    console.log("Processing replacement:", replacementData)

    let message = `Replacement processed for ${selectedBill.customerName}`
    if (isWarranty) {
      message += " (Warranty Replacement)"
    } else if (priceDifference > 0) {
      const finalAmount = calculateFinalAmount()
      const discountAmt = calculateDiscountAmount()
      if (discountAmt > 0) {
        message += ` - Payment: ₹${finalAmount.toLocaleString()} (Discount: ₹${discountAmt.toLocaleString()})`
      } else {
        message += ` - Additional payment: ₹${priceDifference.toLocaleString()}`
      }
    } else if (priceDifference < 0) {
      message += ` - Refund amount: ₹${Math.abs(priceDifference).toLocaleString()}`
    } else {
      message += " - No price difference"
    }

    toast({
      title: "Replacement Successful",
      description: message,
      className: "bg-green-50 border-green-200 text-green-800",
    })

    setShowReplacementModal(false)
    setSelectedBill(null)
    setSelectedItem(null)
    setReplacementProduct(null)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "full_return":
        return "text-red-600 bg-red-50 border-red-200"
      case "partial_return":
        return "text-orange-600 bg-orange-50 border-orange-200"
      default:
        return "text-green-600 bg-green-50 border-green-200"
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "full_return":
        return "Full Return"
      case "partial_return":
        return "Partial Return"
      default:
        return "Normal"
    }
  }

  const handleBarcodeSubmit = () => {
    if (!barcodeInput.trim()) {
      toast({
        title: "Enter Barcode",
        description: "Please enter or scan a barcode",
        variant: "destructive",
      })
      return
    }

    const product = availableProducts.find((p) => p.barcode === barcodeInput.trim())
    if (product) {
      if (product.stock > 0) {
        setReplacementProduct(product)
        setShowBarcodeScanner(false)
        setBarcodeInput("")
        setProductSearchQuery("") // Clear search query
        toast({
          title: "Product Selected",
          description: `${product.name} selected for replacement`,
          className: "bg-green-50 border-green-200 text-green-800",
        })
      } else {
        toast({
          title: "Out of Stock",
          description: `${product.name} is currently out of stock`,
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "Product Not Found",
        description: "No product found with this barcode",
        variant: "destructive",
      })
    }
  }

  const getFilteredProducts = () => {
    let filtered = availableProducts.filter((product) =>
      replacementType === "warranty"
        ? product.name === selectedItem.name && product.model === selectedItem.model
        : product.stock > 0,
    )

    if (productSearchQuery.trim()) {
      const query = productSearchQuery.toLowerCase()
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.model.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.barcode.includes(query),
      )
    }

    return filtered
  }

  const handleReplacementTypeChange = (type) => {
    setReplacementType(type)
    setDiscountType("percentage")
    setDiscountValue(0)
    if (type === "warranty" && selectedItem) {
      const sameProduct = availableProducts.find(
        (product) => product.name === selectedItem.name && product.model === selectedItem.model,
      )
      if (sameProduct && sameProduct.stock > 0) {
        setReplacementProduct(sameProduct)
        console.log("[v0] Auto-selected warranty product:", sameProduct)
      } else {
        console.log("[v0] No matching product found for warranty replacement:", selectedItem)
        setReplacementProduct(null)
      }
    } else if (type === "dissatisfaction") {
      setReplacementProduct(null)
    }
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">
        <div className="bg-white rounded-2xl p-6 mb-6 border-2 border-gray-200">
          <h3 className="font-bold text-xl text-black mb-2 flex items-center gap-2">
            <RefreshCw size={20} />
            Product Replacement
          </h3>
          <p className="text-gray-600 mb-6">
            Handle product replacements for customer dissatisfaction or warranty claims
          </p>

          <div className="max-w-md">
            <label className="block text-sm font-medium text-black mb-2">Search Bills</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Bill ID, Customer, Mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors bg-white text-base"
              />
            </div>
          </div>
        </div>

        {/* Bills List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
          {filteredBills.map((bill) => (
            <div
              key={bill.id}
              onClick={() => setSelectedBill(bill)}
              className="bg-white border-2 border-gray-200 rounded-2xl p-6 cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all touch-manipulation"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-bold text-lg text-black">Bill #{bill.id}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(bill.status)}`}>
                  {getStatusText(bill.status)}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-black">Date:</span> {bill.date}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-black">Customer:</span> {bill.customerName}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-black">Mobile:</span> {bill.customerMobile}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-black">Items:</span>{" "}
                  {bill.items.filter((item) => item.quantity > item.returned).length} available
                </p>
              </div>

              <p className="font-bold text-xl text-black">₹{bill.total.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bill Detail Modal */}
      {selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-start justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-black">Select Item for Replacement</h2>
                <p className="text-gray-600 mt-1">
                  Bill #{selectedBill.id} - {selectedBill.customerName}
                </p>
              </div>
              <button
                onClick={() => setSelectedBill(null)}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors touch-manipulation"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain max-h-[calc(90vh-120px)]">
              <div className="p-6">
                <div className="space-y-3">
                  {selectedBill.items
                    .filter((item) => item.quantity > item.returned)
                    .map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-black">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            Model: {item.model} • Category: {item.category} • Rack: {item.rack}
                          </p>
                          <p className="text-sm text-gray-600">Available: {item.quantity - item.returned} units</p>
                        </div>
                        <div className="text-right mr-4">
                          <p className="font-bold text-black">₹{item.price.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">per unit</p>
                        </div>
                        <button
                          onClick={() => initializeReplacement(selectedBill, item)}
                          className="text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 touch-manipulation bg-chart-4"
                        >
                          <RefreshCw size={16} />
                          Replace
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Replacement Modal */}
      {showReplacementModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-black">Product Replacement</h2>
              <button
                onClick={() => setShowReplacementModal(false)}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors touch-manipulation"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain max-h-[calc(90vh-180px)]">
              <div className="p-6">
                {/* Original Item Info */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h3 className="font-semibold text-black mb-2">Original Item</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-black">{selectedItem.name}</p>
                      <p className="text-sm text-gray-600">Model: {selectedItem.model}</p>
                      <p className="text-sm text-gray-600">Category: {selectedItem.category}</p>
                    </div>
                    <div>
                      <p className="font-bold text-black">₹{selectedItem.price.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">
                        Available: {selectedItem.quantity - selectedItem.returned}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Replacement Type Selection */}
                <div className="mb-6">
                  <h3 className="font-semibold text-black mb-3">Replacement Type</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={() => handleReplacementTypeChange("dissatisfaction")}
                      className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        replacementType === "dissatisfaction"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      <AlertCircle size={20} />
                      <div className="text-left">
                        <p className="font-medium">Customer Dissatisfaction</p>
                        <p className="text-sm opacity-75">Can replace with different product</p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleReplacementTypeChange("warranty")}
                      className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        replacementType === "warranty"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      <CheckCircle size={20} />
                      <div className="text-left">
                        <p className="font-medium">Warranty Replacement</p>
                        <p className="text-sm opacity-75">Same product replacement</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Quantity Selection */}
                <div className="mb-6">
                  <h3 className="font-semibold text-black mb-3">Replacement Quantity</h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setReplacementQuantity(Math.max(1, replacementQuantity - 1))}
                      className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors touch-manipulation"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={selectedItem.quantity - selectedItem.returned}
                      value={replacementQuantity}
                      onChange={(e) =>
                        setReplacementQuantity(
                          Math.min(
                            selectedItem.quantity - selectedItem.returned,
                            Math.max(1, Number.parseInt(e.target.value) || 1),
                          ),
                        )
                      }
                      className="w-20 px-3 py-2 border-2 border-gray-200 rounded-lg text-center focus:outline-none focus:border-black text-base"
                    />
                    <button
                      onClick={() =>
                        setReplacementQuantity(
                          Math.min(selectedItem.quantity - selectedItem.returned, replacementQuantity + 1),
                        )
                      }
                      className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors touch-manipulation"
                    >
                      +
                    </button>
                    <span className="text-sm text-gray-600">Max: {selectedItem.quantity - selectedItem.returned}</span>
                  </div>
                </div>

                {replacementType === "dissatisfaction" && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-black">Search Replacement Product</h3>
                    </div>

                    <div className="mb-4">
                      <div className="relative">
                        <Search
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                        <input
                          type="text"
                          placeholder="Search by product name, model, category or scan barcode..."
                          value={productSearchQuery}
                          onChange={(e) => setProductSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors bg-white text-base"
                        />
                      </div>
                    </div>

                    {productSearchQuery.trim() && (
                      <div className="mb-4">
                        <h4 className="font-medium text-black mb-2">Search Results</h4>
                        <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                          {getFilteredProducts().length > 0 ? (
                            getFilteredProducts().map((product) => (
                              <button
                                key={product.id}
                                onClick={() => {
                                  setReplacementProduct(product)
                                  setProductSearchQuery("")
                                }}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${
                                  replacementProduct?.id === product.id
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium text-black">{product.name}</p>
                                    <p className="text-sm text-gray-600">
                                      Model: {product.model} • Category: {product.category}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Rack: {product.rack} • Stock: {product.stock}
                                    </p>
                                    <p className="text-xs text-gray-500">Barcode: {product.barcode}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-black">₹{product.price.toLocaleString()}</p>
                                    <p
                                      className={`text-sm font-medium ${
                                        product.price > selectedItem.price
                                          ? "text-red-600"
                                          : product.price < selectedItem.price
                                            ? "text-green-600"
                                            : "text-gray-600"
                                      }`}
                                    >
                                      {product.price > selectedItem.price ? "+" : ""}
                                      {product.price !== selectedItem.price
                                        ? `₹${Math.abs(product.price - selectedItem.price).toLocaleString()}`
                                        : "Same price"}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <p>No products found matching your search</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {replacementProduct && (
                      <div className="mb-4">
                        <h4 className="font-medium text-black mb-2">Selected Product</h4>
                        <div className="p-4 rounded-xl border-2 border-green-500 bg-green-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-black">{replacementProduct.name}</p>
                              <p className="text-sm text-gray-600">
                                Model: {replacementProduct.model} • Category: {replacementProduct.category}
                              </p>
                              <p className="text-sm text-gray-600">
                                Rack: {replacementProduct.rack} • Stock: {replacementProduct.stock}
                              </p>
                              <p className="text-xs text-gray-500">Barcode: {replacementProduct.barcode}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-black">₹{replacementProduct.price.toLocaleString()}</p>
                              <button
                                onClick={() => setReplacementProduct(null)}
                                className="text-red-600 text-sm hover:text-red-700 mt-1"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {replacementType === "warranty" && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-black mb-3">Same Product Replacement</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {getFilteredProducts().map((product) => (
                        <button
                          key={product.id}
                          onClick={() => setReplacementProduct(product)}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            replacementProduct?.id === product.id
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-black">{product.name}</p>
                              <p className="text-sm text-gray-600">
                                Model: {product.model} • Category: {product.category}
                              </p>
                              <p className="text-sm text-gray-600">
                                Rack: {product.rack} • Stock: {product.stock}
                              </p>
                              <p className="text-xs text-gray-500">Barcode: {product.barcode}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-black">₹{product.price.toLocaleString()}</p>
                              <p className="text-sm text-gray-600">Warranty Replacement</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Calculation */}
                {replacementProduct && replacementType === "dissatisfaction" && (
                  <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
                    <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                      <Calculator size={18} />
                      Price Calculation
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Original Amount ({replacementQuantity} × ₹{selectedItem.price.toLocaleString()}):
                        </span>
                        <span className="text-black font-medium">
                          ₹{(selectedItem.price * replacementQuantity).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          New Amount ({replacementQuantity} × ₹{replacementProduct.price.toLocaleString()}):
                        </span>
                        <span className="text-black font-medium">
                          ₹{(replacementProduct.price * replacementQuantity).toLocaleString()}
                        </span>
                      </div>
                      <div className="border-t border-blue-200 pt-2 flex justify-between font-semibold">
                        <span className="text-black">
                          {calculatePriceDifference() > 0
                            ? "Additional Payment:"
                            : calculatePriceDifference() < 0
                              ? "Refund Amount:"
                              : "No Difference:"}
                        </span>
                        <span
                          className={
                            calculatePriceDifference() > 0
                              ? "text-red-600"
                              : calculatePriceDifference() < 0
                                ? "text-green-600"
                                : "text-gray-600"
                          }
                        >
                          ₹{Math.abs(calculatePriceDifference()).toLocaleString()}
                        </span>
                      </div>

                      {/* Discount Section - only show when additional payment is required */}
                      {calculatePriceDifference() > 0 && (
                        <>
                          <div className="border-t border-blue-200 pt-3 mt-3">
                            <h4 className="font-medium text-black mb-2">Apply Discount</h4>
                            <div className="flex gap-2 mb-3">
                              <button
                                onClick={() => {
                                  setDiscountType("percentage")
                                  setDiscountValue(0)
                                }}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                  discountType === "percentage"
                                    ? "bg-blue-600 text-white"
                                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                % Percentage
                              </button>
                              <button
                                onClick={() => {
                                  setDiscountType("fixed")
                                  setDiscountValue(0)
                                }}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                  discountType === "fixed"
                                    ? "bg-blue-600 text-white"
                                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                ₹ Fixed
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                  {discountType === "percentage" ? "%" : "₹"}
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  max={discountType === "percentage" ? 100 : calculatePriceDifference()}
                                  value={discountValue || ""}
                                  onChange={(e) => {
                                    let val = parseFloat(e.target.value) || 0
                                    if (discountType === "percentage") {
                                      val = Math.min(100, Math.max(0, val))
                                    } else {
                                      val = Math.min(calculatePriceDifference(), Math.max(0, val))
                                    }
                                    setDiscountValue(val)
                                  }}
                                  placeholder={discountType === "percentage" ? "0" : "0"}
                                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-base bg-white"
                                />
                              </div>
                              {discountValue > 0 && (
                                <button
                                  onClick={() => setDiscountValue(0)}
                                  className="px-3 py-2 text-red-600 hover:text-red-700 text-sm font-medium"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                            {discountValue > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                Discount: ₹{calculateDiscountAmount().toLocaleString()}
                              </p>
                            )}
                          </div>

                          {/* Final Amount after Discount */}
                          {discountValue > 0 && (
                            <div className="border-t border-blue-200 pt-2 flex justify-between font-bold text-base">
                              <span className="text-black">Final Payment:</span>
                              <span className="text-green-600">
                                ₹{calculateFinalAmount().toLocaleString()}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t-2 border-gray-100 p-6">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReplacementModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  onClick={processReplacement}
                  disabled={
                    !replacementProduct || (replacementProduct && replacementProduct.stock < replacementQuantity)
                  }
                  className="flex-1 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation bg-foreground"
                >
                  <RefreshCw size={16} />
                  Process Replacement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBarcodeScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-70 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-black">Scan Product Barcode</h2>
              <button
                onClick={() => {
                  setShowBarcodeScanner(false)
                  setBarcodeInput("")
                }}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors touch-manipulation"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-black mb-2">Barcode</label>
                <input
                  type="text"
                  placeholder="Scan or enter barcode..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleBarcodeSubmit()}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors bg-white text-base"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">Use barcode scanner or manually enter the barcode number</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBarcodeScanner(false)
                    setBarcodeInput("")
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBarcodeSubmit}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 touch-manipulation"
                >
                  <Plus size={16} />
                  Select Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReplacementPage
