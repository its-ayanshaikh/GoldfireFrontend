"use client"

import { useState, useEffect } from "react"
import { RotateCcw, CheckCircle, X, Loader2, Search, Eye, Plus, Minus } from "lucide-react"
import { useToast } from "../../hooks/use-toast"
import { Button } from "../../components/ui/button"

const BillsPage = () => {
  const [selectedBill, setSelectedBill] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)

  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]) // Today's date
  const [filterPaymentType, setFilterPaymentType] = useState("")
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [returnItems, setReturnItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [bills, setBills] = useState([])
  const [showDayEnd, setShowDayEnd] = useState(false)
  const [closingBalance, setClosingBalance] = useState("")

  const [paymentTypes] = useState(["cash", "upi", "split"])
  const [apiLoading, setApiLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10
  const { toast } = useToast()

  // Base API URL from environment variable
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

  // Get authorization headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token')
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  // Round off function - 50 se niche to niche, 50 se upar to upar
  const roundOffAmount = (amount) => {
    const decimal = amount % 1
    const integerPart = Math.floor(amount)

    if (decimal < 0.5) {
      return integerPart // Round down
    } else {
      return integerPart + 1 // Round up
    }
  }

  // Search bills from API
  const searchBills = async (query) => {
    if (!query.trim()) {
      // If search is empty, fetch regular bills
      fetchBills(filterDate, 1)
      return
    }

    setSearchLoading(true)
    try {
      const url = `${API_BASE}/api/pos/bills/search/?q=${encodeURIComponent(query.trim())}`
      console.log('Searching bills with query:', query)

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Search API Response:', data)

        // Handle response structure - same as bills API
        const billsData = Array.isArray(data) ? data : (data.results?.bills || data.bills || [])

        if (billsData && billsData.length > 0) {
          // Transform API response to match component structure (same as fetchBills)
          const transformedBills = billsData.map((bill, index) => {
            try {
              return {
                id: bill.bill_number || `Bill-${bill.id}`,
                billId: bill.id,
                date: bill.date ? new Date(bill.date).toISOString().split('T')[0] : 'N/A',
                customerName: bill.customer?.name || 'Unknown Customer',
                customerMobile: bill.customer?.phone || 'N/A',
                total: parseFloat(bill.final_amount || 0),
                status: "normal", // Default status, can be updated based on returns
                paymentType: bill.payments?.[0]?.payment_method || "cash",
                branchName: bill.branch_name || 'Unknown Branch',
                items: (bill.items || []).map(item => {
                  console.log('Raw API item:', item)
                  console.log('item.product:', item.product)
                  console.log('item.product?.id:', item.product?.id)

                  const transformedItem = {
                    id: item.id,
                    product_id: item.product?.id, // Product ke andar ki ID
                    name: item.product?.name || 'Unknown Product',
                    model: item.product?.model_name || 'Unknown Product',
                    quantity: item.qty || 0,
                    price: parseFloat(item.price || 0),
                    rack: "N/A", // Not in API response
                    returned: 0, // Default, can be updated
                    gst: 18, // Default GST
                    salesperson: item.salesperson?.name || 'Unknown Salesperson',
                    discount_type: item.discount_type || 'percentage',
                    discount_value: parseFloat(item.discount_value || 0),
                    final_amount: parseFloat(item.final_amount || 0)
                  }

                  console.log('Transformed item:', transformedItem)
                  return transformedItem
                }),
                payments: bill.payments || [],
                totalAmount: parseFloat(bill.total_amount || 0),
                totalDiscount: parseFloat(bill.total_discount || 0),
                finalAmount: parseFloat(bill.final_amount || 0)
              }
            } catch (error) {
              console.error(`Error transforming search result at index ${index}:`, error, bill)
              return null
            }
          }).filter(Boolean) // Remove null entries

          setBills(transformedBills)
          setTotalPages(1) // Search results don't have pagination
          setCurrentPage(1)

          console.log('Search results count:', transformedBills.length)
        } else {
          // No search results found
          console.log('No bills found for search query:', query)
          setBills([])
          setTotalPages(1)
          setCurrentPage(1)
        }
      } else {
        console.error('Failed to search bills:', response.status)
        toast({
          title: "Search Error",
          description: "Failed to search bills",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error searching bills:', error)
      toast({
        title: "Search Error",
        description: "Failed to connect to server",
        variant: "destructive",
      })
    } finally {
      setSearchLoading(false)
    }
  }



  // Fetch bills from API
  const fetchBills = async (date = filterDate, page = 1) => {
    setApiLoading(true)
    try {
      // Add date, page, and page_size query parameters
      const url = `${API_BASE}/api/pos/bills/?date=${date}&page=${page}&page_size=${itemsPerPage}`
      console.log('Fetching bills for date:', date, 'page:', page)

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Bills API Response:', data)

        // Handle response structure - data is directly an array of bills
        const billsData = Array.isArray(data) ? data : (data.results?.bills || data.bills || [])
        const totalBills = Array.isArray(data) ? data.length : (data.total_bills || data.count || billsData.length)

        console.log('Raw API data:', data)
        console.log('Bills data found:', billsData?.length || 0, 'bills')
        console.log('Total bills:', totalBills)

        if (billsData && billsData.length > 0) {
          console.log('Sample bill data:', billsData[0]) // Debug first bill
          console.log('Pagination info:', { total_bills: totalBills, current_page: page })

          // Update pagination info from API response
          setTotalPages(Math.ceil(totalBills / itemsPerPage))

          // Transform API response to match component structure
          const transformedBills = billsData.map((bill, index) => {
            try {
              return {
                id: bill.bill_number || `Bill-${bill.id}`,
                billId: bill.id,
                date: bill.date ? new Date(bill.date).toISOString().split('T')[0] : 'N/A',
                customerName: bill.customer?.name || 'Unknown Customer',
                customerMobile: bill.customer?.phone || 'N/A',
                total: parseFloat(bill.final_amount || 0),
                status: "normal", // Default status, can be updated based on returns
                paymentType: bill.payments?.[0]?.payment_method || "cash",
                branchName: bill.branch_name || 'Unknown Branch',
                items: (bill.items || []).map(item => ({
                  id: item.id,
                  name: item.product?.name || 'Unknown Product',
                  model: item.product?.model_name || 'Unknown Product', // Using name as model since model not in response
                  quantity: item.qty || 0,
                  price: parseFloat(item.price || 0),
                  rack: "N/A", // Not in API response
                  returned: 0, // Default, can be updated
                  gst: 18, // Default GST
                  salesperson: item.salesperson?.name || 'Unknown Salesperson',
                  discount_type: item.discount_type || 'percentage',
                  discount_value: parseFloat(item.discount_value || 0),
                  final_amount: parseFloat(item.final_amount || 0)
                })),
                payments: bill.payments || [],
                totalAmount: parseFloat(bill.total_amount || 0),
                totalDiscount: parseFloat(bill.total_discount || 0),
                finalAmount: parseFloat(bill.final_amount || 0)
              }
            } catch (error) {
              console.error(`Error transforming bill at index ${index}:`, error, bill)
              return null
            }
          }).filter(Boolean) // Remove null entries

          setBills(transformedBills)

          console.log('Transformed bills count:', transformedBills.length)
          console.log('Setting bills state with:', transformedBills)
        } else if (billsData && billsData.length === 0) {
          // API call successful but no bills found
          console.log('No bills found for the selected date')
          setBills([])
          setTotalPages(1)
        } else {
          console.log('No valid bills data found in response')
          setBills([])
          setTotalPages(1)
        }
      } else {
        console.error('Failed to fetch bills:', response.status)
        toast({
          title: "Error",
          description: "Failed to fetch bills",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching bills:', error)
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      })
    } finally {
      setApiLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    if (filterDate) {
      console.log('Initial load - fetching bills')
      fetchBills(filterDate, 1)
    }
  }, []) // Only run on mount

  // Refetch bills when page changes (but not on date change)
  useEffect(() => {
    if (filterDate && currentPage > 1) { // Only if not first page
      fetchBills(filterDate, currentPage)
    }
  }, [currentPage])

  // Reset to first page and fetch when date changes
  useEffect(() => {
    if (filterDate) {
      setCurrentPage(1)
      fetchBills(filterDate, 1)
    }
  }, [filterDate])

  // Reset to first page when payment type filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filterPaymentType])

  // Clear search when date changes
  useEffect(() => {
    if (searchQuery) {
      setSearchQuery('')
    }
  }, [filterDate])

  // Client-side filtering (only for payment type now, search is handled by API)
  const filteredBills = bills.filter((bill) => {
    const matchesPaymentType = !filterPaymentType || bill.paymentType === filterPaymentType
    return matchesPaymentType
  })

  console.log('Bills state:', bills.length, 'bills')
  console.log('Filtered bills:', filteredBills.length, 'bills')
  console.log('Search query:', searchQuery)

  console.log('Filter payment type:', filterPaymentType)

  // For display purposes (API handles pagination)
  const totalFilteredBills = filteredBills.length
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

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

  const initializeReturn = (bill) => {
    console.log('Initialize return - bill items:', bill.items)
    const availableItems = bill.items.filter((item) => item.quantity > item.returned)
    console.log('Available items for return:', availableItems)
    const returnItemsWithQty = availableItems.map((item) => {
      console.log('Item being processed:', item)
      console.log('Item product_id:', item.product_id)
      return { ...item, returnQty: 0 }
    })
    console.log('Return items set:', returnItemsWithQty)
    setReturnItems(returnItemsWithQty)
    setShowReturnModal(true)
  }

  const updateReturnQuantity = (itemId, quantity) => {
    setReturnItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, returnQty: Math.min(Math.max(0, quantity), item.quantity - item.returned) }
          : item,
      ),
    )
  }

  const processReturn = async () => {
    const itemsToReturn = returnItems.filter((item) => item.returnQty > 0)
    if (itemsToReturn.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select items to return",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Prepare payload according to API requirements


      const payload = {
        bill_id: selectedBill.billId, // Using billId from the selected bill
        items: itemsToReturn.map(item => ({
          bill_item_id: item.id, // This is the item ID from bills API
          qty: item.returnQty
        }))
      }

      console.log('Return API Payload:', payload)

      const response = await fetch(`${API_BASE}/api/pos/bills/return/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Return API Response:', data)

        // Update local state to reflect the return
        setBills((prev) =>
          prev.map((bill) =>
            bill.id === selectedBill.id
              ? {
                ...bill,
                items: bill.items.map((item) => {
                  const returnItem = itemsToReturn.find((ri) => ri.id === item.id)
                  if (returnItem) {
                    return { ...item, returned: item.returned + returnItem.returnQty }
                  }
                  return item
                }),
                status: getNewBillStatus(bill, itemsToReturn),
              }
              : bill,
          ),
        )

        const totalReturnAmount = roundOffAmount(itemsToReturn.reduce((sum, item) => sum + item.final_amount * item.returnQty, 0))

        toast({
          title: "Return Processed Successfully",
          description: `₹${totalReturnAmount.toLocaleString()} returned successfully`,
          className: "bg-green-50 border-green-200 text-green-800",
        })

        setShowReturnModal(false)
        setSelectedBill(null)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Return API Error:', response.status, errorData)

        toast({
          title: "Return Failed",
          description: errorData.message || errorData.error || "Failed to process return",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error processing return:', error)
      toast({
        title: "Return Error",
        description: "Failed to connect to server",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getNewBillStatus = (bill, returnedItems) => {
    const updatedItems = bill.items.map((item) => {
      const returnItem = returnedItems.find((ri) => ri.id === item.id)
      return returnItem ? { ...item, returned: item.returned + returnItem.returnQty } : item
    })

    const allReturned = updatedItems.every((item) => item.returned === item.quantity)
    const someReturned = updatedItems.some((item) => item.returned > 0)

    if (allReturned) return "full_return"
    if (someReturned) return "partial_return"
    return "normal"
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Search size={20} className="text-gray-600" />
              <h3 className="font-semibold text-lg text-gray-900">Search & Filter Bills</h3>
            </div>
            <button
              onClick={() => setShowDayEnd(true)}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              Day End
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Bill ID, Customer, Mobile, or scan barcode..."
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value
                    setSearchQuery(value)

                    // Debounce search - wait 500ms after user stops typing
                    clearTimeout(window.searchTimeout)
                    window.searchTimeout = setTimeout(() => {
                      searchBills(value)
                    }, 500)
                  }}
                  onKeyDown={(e) => {
                    // Handle Enter key for immediate search
                    if (e.key === 'Enter') {
                      clearTimeout(window.searchTimeout)
                      searchBills(searchQuery)
                    }
                    // Handle Escape key to clear search
                    if (e.key === 'Escape') {
                      setSearchQuery('')
                      fetchBills(filterDate, 1)
                    }
                  }}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors bg-white text-sm"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
                {searchQuery && !searchLoading && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      fetchBills(filterDate, 1)
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>



            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors bg-white text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
              <select
                value={filterPaymentType}
                onChange={(e) => setFilterPaymentType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors bg-white text-sm"
              >
                <option value="">All Payment Types</option>
                {paymentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Bills Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {apiLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading bills...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Bill Number</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Customer</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Mobile</th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Payment</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Total</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{bill.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{bill.date}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{bill.customerName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{bill.customerMobile}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {bill.paymentType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-gray-900">₹{bill.total.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedBill(bill)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalFilteredBills === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No bills found</div>
              <div className="text-gray-400 text-sm mt-1">Try adjusting your search or filter criteria</div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg border border-gray-200 px-6 py-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages} ({totalPages * itemsPerPage} total bills)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${currentPage === pageNum
                          ? 'bg-black text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bill Detail Modal */}
      {selectedBill && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-900">Bill Details - #{selectedBill.id}</h2>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedBill.status)}`}
                >
                  {getStatusText(selectedBill.status)}
                </span>
              </div>
              <button
                onClick={() => setSelectedBill(null)}
                className="p-2 hover:bg-gray-200 rounded-md transition-colors"
                aria-label="Close modal"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain max-h-[calc(90vh-120px)]">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-black">Date:</span> {selectedBill.date}
                    </p>

                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-black">Total Amount:</span> ₹{selectedBill.totalAmount?.toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-black">Customer:</span> {selectedBill.customerName}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-black">Mobile:</span> {selectedBill.customerMobile}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-black">Payment:</span> <span className="capitalize">{selectedBill.paymentType}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-black">Discount:</span> ₹{selectedBill.totalDiscount?.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg text-gray-900">Items</h3>
                    {selectedBill.status !== "full_return" && (
                      <button
                        onClick={() => initializeReturn(selectedBill)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      >
                        <RotateCcw size={16} className="mr-2" />
                        Process Return
                      </button>
                    )}
                  </div>

                  <div className="overflow-hidden border border-gray-200 rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesperson</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Final Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedBill.items.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{item.salesperson}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <div className="text-sm text-gray-900">{item.quantity}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right">
                              <div className="text-sm text-gray-900">₹{item.price.toLocaleString()}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              {item.discount_value > 0 ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  {item.discount_value}{item.discount_type === 'percentage' ? '%' : '₹'}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right">
                              <div className="text-sm font-medium text-gray-900">₹{item.final_amount.toLocaleString()}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-6 bg-gray-50 -mx-6 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                    <span className="text-xl font-bold text-gray-900">₹{selectedBill.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-900">Process Return</h2>
              <button
                onClick={() => setShowReturnModal(false)}
                className="p-2 hover:bg-gray-200 rounded-md transition-colors"
                aria-label="Close modal"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain max-h-[calc(95vh-180px)]">
              <div className="p-6">
                <div className="overflow-x-auto overflow-y-auto max-h-96 border border-gray-200 rounded-lg">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Product</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Model</th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Available</th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Unit Price</th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Return Qty</th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[130px]">Return Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {returnItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.model}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {item.quantity - item.returned}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm text-gray-900">₹{item.final_amount.toLocaleString()}</div>
                            {item.discount_value > 0 && (
                              <div className="text-xs text-gray-500">
                                Original: ₹{item.price.toLocaleString()}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => updateReturnQuantity(item.id, item.returnQty - 1)}
                                disabled={item.returnQty <= 0}
                                className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Minus size={14} />
                              </button>
                              <input
                                type="number"
                                min="0"
                                max={item.quantity - item.returned}
                                value={item.returnQty}
                                onChange={(e) => updateReturnQuantity(item.id, Number.parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                              />
                              <button
                                onClick={() => updateReturnQuantity(item.id, item.returnQty + 1)}
                                disabled={item.returnQty >= (item.quantity - item.returned)}
                                className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-medium text-gray-900">
                              ₹{roundOffAmount(item.final_amount * item.returnQty).toLocaleString()}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 bg-gray-50 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-sm text-gray-600">Total Return Amount</span>
                  <div className="text-2xl font-bold text-gray-900">
                    ₹{roundOffAmount(returnItems.reduce((sum, item) => sum + item.final_amount * item.returnQty, 0)).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-600">Items to Return</span>
                  <div className="text-lg font-semibold text-gray-900">
                    {returnItems.reduce((sum, item) => sum + item.returnQty, 0)}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setShowReturnModal(false)}
                  disabled={loading}
                  className="px-8 py-3 border border-gray-300 text-gray-700 bg-white rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={processReturn}
                  disabled={loading || returnItems.reduce((sum, item) => sum + item.returnQty, 0) === 0}
                  className="flex0 px-8 py-3 border border-transparent text-white bg-red-600 rounded-md font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600 min-w-[180px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing Return...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Confirm Return
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Day End Modal */}
      {showDayEnd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
              <h2 className="text-2xl font-bold text-white">Day End Settlement</h2>
              <p className="text-red-100 text-xs mt-1">Complete your daily cash reconciliation</p>
            </div>

            {/* Content - Horizontal Layout */}
            <div className="p-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left Column - Summary Cards */}
                <div className="space-y-3">
                  {/* Opening Balance */}
                  <div className="bg-slate-50 rounded-lg p-4 border-2 border-slate-200 hover:border-slate-300 transition-all">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Opening Balance</p>
                    <p className="text-3xl font-bold text-slate-900">₹ 5,000</p>
                    <p className="text-xs text-slate-500 mt-2">Starting cash</p>
                  </div>

                  {/* Total Sales */}
                  <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200 hover:border-blue-300 transition-all">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Total Sales Today</p>
                    <p className="text-3xl font-bold text-blue-900">₹ 12,450</p>
                    <p className="text-xs text-blue-600 mt-2">Cash transactions</p>
                  </div>

                  {/* Expected Balance */}
                  <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200 hover:border-green-300 transition-all">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Expected Balance</p>
                    <p className="text-3xl font-bold text-green-900">₹ 17,450</p>
                    <p className="text-xs text-green-600 mt-2">Opening + Sales</p>
                  </div>
                </div>

                {/* Right Column - Input & Variance */}
                <div className="space-y-4 flex flex-col justify-between">
                  {/* Closing Balance Input */}
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Closing Balance <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 font-semibold">₹</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={closingBalance}
                        onChange={(e) => setClosingBalance(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg font-semibold bg-white transition-all"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Cash in register at end of day</p>
                  </div>

                  {/* Variance */}
                  {closingBalance ? (
                    <div className={`rounded-lg p-4 border transition-all ${Math.abs(parseFloat(closingBalance) - 17450.50) < 1
                      ? 'bg-green-50 border-green-200'
                      : 'bg-amber-50 border-amber-200'
                      }`}>
                      <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${Math.abs(parseFloat(closingBalance) - 17450.50) < 1
                        ? 'text-green-700'
                        : 'text-amber-700'
                        }`}>
                        Variance
                      </p>
                      <p className={`text-2xl font-bold mb-1 ${Math.abs(parseFloat(closingBalance) - 17450.50) < 1
                        ? 'text-green-900'
                        : 'text-amber-900'
                        }`}>
                        ₹ {(parseFloat(closingBalance) - 17450.50).toFixed(2)}
                      </p>
                      <p className={`text-xs font-medium flex items-center gap-1 ${Math.abs(parseFloat(closingBalance) - 17450.50) < 1
                        ? 'text-green-700'
                        : 'text-amber-700'
                        }`}>
                        {Math.abs(parseFloat(closingBalance) - 17450.50) < 1
                          ? '✓ Matches'
                          : '⚠ Variance'}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-3 border border-dashed border-gray-300 flex items-center justify-center min-h-20">
                      <p className="text-gray-500 text-xs font-medium text-center">Enter closing balance</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 mt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    setShowDayEnd(false)
                    setClosingBalance("")
                  }}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded text-slate-700 font-medium hover:bg-slate-50 transition-all text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    toast({
                      title: "Success",
                      description: "Day end settlement completed successfully",
                      className: "bg-green-50 border-green-200 text-green-800",
                    })
                    setShowDayEnd(false)
                    setClosingBalance("")
                  }}
                  disabled={!closingBalance}
                  className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-medium rounded transition-all text-xs"
                >
                  Complete Day End
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BillsPage
