// Mock data and utility functions for rack allocation system

export const initialRacks = [
  { id: 1, name: "A1", capacity: 50, occupied: 30, location: "Section A" },
  { id: 2, name: "A2", capacity: 50, occupied: 45, location: "Section A" },
  { id: 3, name: "B1", capacity: 40, occupied: 20, location: "Section B" },
  { id: 4, name: "B2", capacity: 40, occupied: 35, location: "Section B" },
  { id: 5, name: "C1", capacity: 60, occupied: 10, location: "Section C" },
  { id: 6, name: "C2", capacity: 60, occupied: 25, location: "Section C" },
]

export const initialStockItems = [
  { id: 1, name: "iPhone 15 Pro Cover", quantity: 25, rackId: 1, category: "Mobile Accessories" },
  { id: 2, name: "Samsung Galaxy Case", quantity: 15, rackId: 2, category: "Mobile Accessories" },
  { id: 3, name: "Wireless Charger", quantity: 30, rackId: 3, category: "Electronics" },
  { id: 4, name: "Phone Screen Protector", quantity: 50, rackId: null, category: "Mobile Accessories" },
  { id: 5, name: "Bluetooth Headphones", quantity: 20, rackId: 4, category: "Electronics" },
  { id: 6, name: "Power Bank", quantity: 18, rackId: null, category: "Electronics" },
  { id: 7, name: "USB Cable", quantity: 35, rackId: 5, category: "Electronics" },
  { id: 8, name: "iPad Case", quantity: 12, rackId: null, category: "Mobile Accessories" },
  { id: 9, name: "Laptop Stand", quantity: 8, rackId: 6, category: "Computer Accessories" },
  { id: 10, name: "Mouse Pad", quantity: 40, rackId: null, category: "Computer Accessories" },
]

// Utility functions
export const getRackById = (racks, rackId) => {
  return racks.find((rack) => rack.id === rackId)
}

export const calculateRackUtilization = (rack) => {
  return (rack.occupied / rack.capacity) * 100
}

export const isRackNearFull = (rack, threshold = 80) => {
  return calculateRackUtilization(rack) > threshold
}

export const getAvailableCapacity = (rack) => {
  return rack.capacity - rack.occupied
}

export const canFitInRack = (rack, quantity) => {
  return getAvailableCapacity(rack) >= quantity
}

export const getUnallocatedItems = (stockItems) => {
  return stockItems.filter((item) => item.rackId === null)
}

export const getItemsByRack = (stockItems, rackId) => {
  return stockItems.filter((item) => item.rackId === rackId)
}

export const getUniqueCategories = (stockItems) => {
  return [...new Set(stockItems.map((item) => item.category))]
}

export const filterStockItems = (stockItems, searchTerm, category) => {
  return stockItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = category === "all" || item.category === category
    return matchesSearch && matchesCategory
  })
}

// Rack name validation
export const isValidRackName = (name) => {
  // Validates rack names like A1, B2, C3, etc.
  const rackNamePattern = /^[A-Z]\d+$/
  return rackNamePattern.test(name)
}

export const generateNextRackName = (racks, section = "A") => {
  const sectionRacks = racks.filter((rack) => rack.name.startsWith(section))
  const numbers = sectionRacks.map((rack) => Number.parseInt(rack.name.substring(1)))
  const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1
  return `${section}${nextNumber}`
}
