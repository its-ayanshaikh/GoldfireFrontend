"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

const genders = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "unisex", label: "Unisex" },
]

export default function GenderSelection({
  productData,
  updateProductData,
  nextStep,
  prevStep,
  editMode
}) {
  const [searchTerm, setSearchTerm] = useState("")

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
        <p className="text-sm text-muted-foreground">Choose gender</p>
        <input
          type="search"
          className="w-full max-w-xs rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
          placeholder="Search gender..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {filteredGenders.map((g) => {
          const isActive = productData.selectedGender === g.id
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
              <CardHeader className="py-2 px-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  {g.label}
                  {isActive && <Badge variant="secondary">Selected</Badge>}
                </CardTitle>
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