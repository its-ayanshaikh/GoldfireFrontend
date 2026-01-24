"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { User, Users, Search } from "lucide-react"

const genders = [
  { id: "male", label: "Male", icon: User },
  { id: "female", label: "Female", icon: User },
  { id: "unisex", label: "Unisex", icon: Users },
]

export default function GenderSelection({
  productData,
  updateProductData,
  nextStep,
  categories
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const categoryName = productData.selectedCategory !== null ? categories[productData.selectedCategory] : null

  const handleGenderSelect = (genderId) => {
    updateProductData({ selectedGender: genderId })
    setTimeout(() => nextStep(), 300)
  }

  const filteredGenders = genders.filter((g) =>
    g.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Gender</h2>
          <p className="text-sm text-muted-foreground">
            Category: <span className="font-medium text-foreground">{categoryName}</span>
            {productData.selectedSubcategory && (
              <span> • Subcategory: <span className="font-medium text-foreground">{productData.selectedSubcategory}</span></span>
            )}
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search gender..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredGenders.map((g) => {
          const isActive = productData.selectedGender === g.id
          const IconComponent = g.icon
          return (
            <Card
              key={g.id}
              role="button"
              tabIndex={0}
              onClick={() => handleGenderSelect(g.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  handleGenderSelect(g.id)
                }
              }}
              className={`transition-shadow hover:shadow-sm cursor-pointer ${isActive ? "border-2 border-primary" : ""
                }`}
            >
              <CardHeader className="py-4 px-4">
                <div className="flex flex-col items-center text-center space-y-2">
                  <IconComponent className="h-8 w-8 text-primary" />
                  <CardTitle className="text-sm">
                    {g.label}
                  </CardTitle>
                  {isActive && <Badge variant="secondary">Selected</Badge>}
                </div>
              </CardHeader>
            </Card>
          )
        })}
      </div>

      <div className="text-center">
        <div className="text-xs text-muted-foreground">Click on a gender to continue</div>
      </div>
    </div>
  )
}
