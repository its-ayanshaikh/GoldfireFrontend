"use client"

import { X, Upload, Image } from "lucide-react"

export default function OverlayModal({ 
  open, 
  title, 
  value, 
  onChange, 
  onClose, 
  onSave, 
  placeholder = "Name", 
  isLoading = false, 
  isDeleteMode = false,
  imageFile = null,
  imagePreview = "",
  onImageChange = null,
  showImageUpload = false
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-card text-card-foreground shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <button
            className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted"
            aria-label="Close"
            onClick={onClose}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 py-4">
          {isDeleteMode ? (
            <p className="text-sm text-foreground leading-relaxed">{placeholder}</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">{placeholder}</label>
                <input
                  autoFocus
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !isLoading && !showImageUpload) {
                      onSave()
                    }
                  }}
                />
              </div>
              
              {showImageUpload && onImageChange && (
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Logo Image (Optional)</label>
                  <div className="flex items-center gap-3">
                    {(imagePreview || imageFile) && (
                      <div className="flex-shrink-0">
                        <img 
                          src={imageFile ? URL.createObjectURL(imageFile) : imagePreview} 
                          alt="Preview" 
                          className="w-12 h-12 object-cover rounded border border-border"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            onImageChange(file)
                          }
                        }}
                        className="hidden"
                        id="image-upload"
                        disabled={isLoading}
                      />
                      <label
                        htmlFor="image-upload"
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-md cursor-pointer hover:bg-muted disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4" />
                        {(imagePreview || imageFile) ? 'Change Image' : 'Upload Image'}
                      </label>
                    </div>
                  </div>
                  {(imagePreview || imageFile) && (
                    <button
                      type="button"
                      onClick={() => onImageChange(null)}
                      className="mt-2 text-xs text-red-600 hover:text-red-700"
                      disabled={isLoading}
                    >
                      Remove Image
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border">
          <button
            className="rounded-md px-4 py-2 text-sm bg-muted hover:bg-muted/80 disabled:opacity-50 text-foreground"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className={`rounded-md px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-2 ${
              isDeleteMode 
                ? "bg-red-600 text-white hover:bg-red-700" 
                : "bg-primary text-primary-foreground"
            }`}
            onClick={onSave}
            disabled={isLoading}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {isLoading ? "Processing..." : isDeleteMode ? "Delete" : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}