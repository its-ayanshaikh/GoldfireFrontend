"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Separator } from "../ui/separator"
import { Upload, FileText, Image, Calendar, IndianRupee, Building2, X, Check } from "lucide-react"

import { useToast } from "../../hooks/use-toast"

export default function PurchaseAdd() {
  const { toast } = useToast()
  const [purchaseForm, setPurchaseForm] = useState({
    vendor: "",
    grandTotal: "",
    purchaseDate: "", // Will be set on client-side
    notes: ""
  })

  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  
  // Vendors state
  const [vendors, setVendors] = useState([])
  const [isLoadingVendors, setIsLoadingVendors] = useState(true)
  
  const fileInputRef = useRef(null)

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

  // Load vendors and set today's date on component mount
  useEffect(() => {
    fetchVendors()
    // Set today's date on client-side to avoid hydration mismatch
    setPurchaseForm(prev => ({
      ...prev,
      purchaseDate: new Date().toISOString().split('T')[0]
    }))
  }, [])

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
    if (!purchaseForm.vendor || purchaseForm.vendor === "no-vendors" || !purchaseForm.grandTotal || !purchaseForm.purchaseDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Vendor, Total, Date)",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    setSaveSuccess(false)
    
    try {
      const formData = new FormData()
      
      // Add required fields - mapping frontend to backend field names
      formData.append('vendor', purchaseForm.vendor) // vendor ID
      formData.append('total', purchaseForm.grandTotal.replace(/,/g, '')) // remove commas
      formData.append('purchase_date', purchaseForm.purchaseDate)
      
      // Add optional fields
      if (purchaseForm.notes) {
        formData.append('notes', purchaseForm.notes)
      }
      
      // Add receipt files if uploaded
      if (uploadedFiles && uploadedFiles.length > 0) {
        uploadedFiles.forEach((file, index) => {
          formData.append('receipt_files', file)
        })
      }

      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/vendor/purchase/add/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Purchase saved successfully:', data)
        
        setSaveSuccess(true)
        toast({
          title: "Success",
          description: "Purchase added successfully!",
        })
        
        setTimeout(() => {
          setSaveSuccess(false)
          // Reset form
          setPurchaseForm({
            vendor: "",
            grandTotal: "",
            purchaseDate: new Date().toISOString().split('T')[0],
            notes: ""
          })
          setUploadedFiles([])
          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }
        }, 2000)
        
      } else {
        const errorData = await response.json()
        console.error('Save error:', errorData)
        toast({
          title: "Error",
          description: errorData.error || "Failed to save purchase",
          variant: "destructive",
        })
      }
      
    } catch (error) {
      console.error('Error saving purchase:', error)
      toast({
        title: "Error", 
        description: "Failed to save purchase. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const formatCurrency = (value) => {
    if (!value) return ""
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d.]/g, '')
    // Format with commas
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const handleGrandTotalChange = (e) => {
    const formatted = formatCurrency(e.target.value)
    setPurchaseForm(prev => ({ ...prev, grandTotal: formatted }))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Building2 className="w-5 h-5" />
        <h1 className="text-2xl font-bold text-foreground">Add Purchase</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manual Entry Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Manual Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Label htmlFor="grandTotal">Grand Total *</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="grandTotal"
                  type="text"
                  placeholder="0.00"
                  value={purchaseForm.grandTotal}
                  onChange={handleGrandTotalChange}
                  className="pl-9"
                />
              </div>
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

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                placeholder="Additional notes about this purchase..."
                value={purchaseForm.notes}
                onChange={(e) => setPurchaseForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

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
                            // Clear the input value first, then trigger click
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
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-background border rounded-lg">
                          {file.type.includes('pdf') ? (
                            <FileText className="w-4 h-4 text-red-500" />
                          ) : (
                            <Image className="w-4 h-4 text-blue-500" />
                          )}
                          <span className="text-sm flex-1 truncate" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(1)}MB
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="p-1 h-6 w-6 text-red-500 hover:text-red-700"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Hidden file input - always present in DOM */}
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
      </div>

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
              grandTotal: "",
              purchaseDate: new Date().toISOString().split('T')[0],
              notes: ""
            })
            setUploadedFile(null)
            setExtractedData(null)
            if (fileInputRef.current) {
              fileInputRef.current.value = ""
            }
          }}>
            Reset Form
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !purchaseForm.vendor || !purchaseForm.grandTotal || !purchaseForm.purchaseDate}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              "Save Purchase"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}