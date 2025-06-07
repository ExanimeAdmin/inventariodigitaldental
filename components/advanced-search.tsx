"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, Save, X, Filter, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface Product {
  id: string
  nombre: string
  descripcion?: string
  cantidad: number
  precio: number
  area: string
  categoria: string
  proveedor?: string
  fechaCaducidad?: string
  fechaRecepcion?: string
  stockMinimo: number
  stockMaximo?: number
  observaciones?: string
  guardado?: boolean
  clinicaId: string
  refrigeracion?: boolean
}

interface SearchFilter {
  id: string
  name: string
  criteria: SearchCriteria[]
}

interface SearchCriteria {
  field: string
  operator: string
  value: string
}

interface AdvancedSearchProps {
  products: Product[]
  onSearch: (results: Product[]) => void
  onReset: () => void
}

export function AdvancedSearch({ products, onSearch, onReset }: AdvancedSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [criteria, setCriteria] = useState<SearchCriteria[]>([{ field: "nombre", operator: "contiene", value: "" }])
  const [savedFilters, setSavedFilters] = useState<SearchFilter[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [filterName, setFilterName] = useState("")
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  // Load saved filters from localStorage
  useEffect(() => {
    const savedFiltersJson = localStorage.getItem("savedSearchFilters")
    if (savedFiltersJson) {
      setSavedFilters(JSON.parse(savedFiltersJson))
    }
  }, [])

  // Save filters to localStorage when they change
  useEffect(() => {
    localStorage.setItem("savedSearchFilters", JSON.stringify(savedFilters))
  }, [savedFilters])

  // Simple search
  const handleSimpleSearch = () => {
    if (!searchTerm.trim()) {
      onReset()
      return
    }

    const searchTermLower = searchTerm.toLowerCase()
    const results = products.filter(
      (product) =>
        product.nombre.toLowerCase().includes(searchTermLower) ||
        (product.descripcion && product.descripcion.toLowerCase().includes(searchTermLower)) ||
        product.categoria.toLowerCase().includes(searchTermLower) ||
        (product.proveedor && product.proveedor.toLowerCase().includes(searchTermLower)),
    )

    onSearch(results)
  }

  // Advanced search
  const handleAdvancedSearch = () => {
    if (criteria.length === 0) {
      onReset()
      return
    }

    let results = [...products]

    criteria.forEach((criterion) => {
      const { field, operator, value } = criterion

      if (!value.trim()) return

      results = results.filter((product) => {
        const productValue = String(product[field as keyof Product] || "").toLowerCase()
        const searchValue = value.toLowerCase()

        switch (operator) {
          case "contiene":
            return productValue.includes(searchValue)
          case "igual":
            return productValue === searchValue
          case "mayor":
            return Number.parseFloat(productValue) > Number.parseFloat(searchValue)
          case "menor":
            return Number.parseFloat(productValue) < Number.parseFloat(searchValue)
          case "empieza":
            return productValue.startsWith(searchValue)
          case "termina":
            return productValue.endsWith(searchValue)
          default:
            return true
        }
      })
    })

    onSearch(results)
    setShowAdvanced(false)
  }

  // Add new criteria
  const addCriteria = () => {
    setCriteria([...criteria, { field: "nombre", operator: "contiene", value: "" }])
  }

  // Remove criteria
  const removeCriteria = (index: number) => {
    const newCriteria = [...criteria]
    newCriteria.splice(index, 1)
    setCriteria(newCriteria)
  }

  // Update criteria
  const updateCriteria = (index: number, field: string, value: string) => {
    const newCriteria = [...criteria]
    newCriteria[index] = { ...newCriteria[index], [field]: value }
    setCriteria(newCriteria)
  }

  // Save current filter
  const saveFilter = () => {
    if (!filterName.trim() || criteria.length === 0) return

    const newFilter: SearchFilter = {
      id: `filter-${Date.now()}`,
      name: filterName,
      criteria: [...criteria],
    }

    setSavedFilters([...savedFilters, newFilter])
    setShowSaveDialog(false)
    setFilterName("")
  }

  // Load saved filter
  const loadFilter = (filterId: string) => {
    const filter = savedFilters.find((f) => f.id === filterId)
    if (filter) {
      setCriteria([...filter.criteria])
      setActiveFilter(filterId)
      setShowAdvanced(true)
    }
  }

  // Delete saved filter
  const deleteFilter = (filterId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newFilters = savedFilters.filter((f) => f.id !== filterId)
    setSavedFilters(newFilters)
    if (activeFilter === filterId) {
      setActiveFilter(null)
    }
  }

  // Reset search
  const handleReset = () => {
    setSearchTerm("")
    setCriteria([{ field: "nombre", operator: "contiene", value: "" }])
    setActiveFilter(null)
    onReset()
  }

  // Get field label
  const getFieldLabel = (field: string) => {
    const fieldMap: Record<string, string> = {
      nombre: "Nombre",
      descripcion: "Descripción",
      cantidad: "Cantidad",
      precio: "Precio",
      area: "Área",
      categoria: "Categoría",
      proveedor: "Proveedor",
      fechaCaducidad: "Fecha de caducidad",
      fechaRecepcion: "Fecha de recepción",
      stockMinimo: "Stock mínimo",
      refrigeracion: "Refrigeración",
    }
    return fieldMap[field] || field
  }

  // Get operator label
  const getOperatorLabel = (operator: string) => {
    const operatorMap: Record<string, string> = {
      contiene: "Contiene",
      igual: "Es igual a",
      mayor: "Es mayor que",
      menor: "Es menor que",
      empieza: "Empieza con",
      termina: "Termina con",
    }
    return operatorMap[operator] || operator
  }

  return (
    <div className="space-y-2">
      {/* Simple search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar productos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSimpleSearch()}
          />
        </div>
        <Button variant="outline" onClick={() => setShowAdvanced(true)}>
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
        <Button onClick={handleSimpleSearch}>Buscar</Button>
      </div>

      {/* Saved filters */}
      {savedFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {savedFilters.map((filter) => (
            <Badge
              key={filter.id}
              variant={activeFilter === filter.id ? "default" : "outline"}
              className="cursor-pointer flex items-center gap-1"
              onClick={() => loadFilter(filter.id)}
            >
              {activeFilter === filter.id && <Check className="h-3 w-3" />}
              {filter.name}
              <X className="h-3 w-3 ml-1 cursor-pointer" onClick={(e) => deleteFilter(filter.id, e)} />
            </Badge>
          ))}
        </div>
      )}

      {/* Advanced search dialog */}
      <Dialog open={showAdvanced} onOpenChange={setShowAdvanced}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Búsqueda avanzada</DialogTitle>
            <DialogDescription>Define criterios de búsqueda específicos para encontrar productos.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4 max-h-[400px] overflow-y-auto pr-2">
            {criteria.map((criterion, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-4">
                  <Label htmlFor={`field-${index}`} className="sr-only">
                    Campo
                  </Label>
                  <Select value={criterion.field} onValueChange={(value) => updateCriteria(index, "field", value)}>
                    <SelectTrigger id={`field-${index}`}>
                      <SelectValue placeholder="Seleccionar campo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nombre">Nombre</SelectItem>
                      <SelectItem value="descripcion">Descripción</SelectItem>
                      <SelectItem value="cantidad">Cantidad</SelectItem>
                      <SelectItem value="precio">Precio</SelectItem>
                      <SelectItem value="area">Área</SelectItem>
                      <SelectItem value="categoria">Categoría</SelectItem>
                      <SelectItem value="proveedor">Proveedor</SelectItem>
                      <SelectItem value="fechaCaducidad">Fecha de caducidad</SelectItem>
                      <SelectItem value="fechaRecepcion">Fecha de recepción</SelectItem>
                      <SelectItem value="stockMinimo">Stock mínimo</SelectItem>
                      <SelectItem value="refrigeracion">Refrigeración</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-3">
                  <Label htmlFor={`operator-${index}`} className="sr-only">
                    Operador
                  </Label>
                  <Select
                    value={criterion.operator}
                    onValueChange={(value) => updateCriteria(index, "operator", value)}
                  >
                    <SelectTrigger id={`operator-${index}`}>
                      <SelectValue placeholder="Operador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contiene">Contiene</SelectItem>
                      <SelectItem value="igual">Es igual a</SelectItem>
                      <SelectItem value="mayor">Es mayor que</SelectItem>
                      <SelectItem value="menor">Es menor que</SelectItem>
                      <SelectItem value="empieza">Empieza con</SelectItem>
                      <SelectItem value="termina">Termina con</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-4">
                  <Label htmlFor={`value-${index}`} className="sr-only">
                    Valor
                  </Label>
                  <Input
                    id={`value-${index}`}
                    value={criterion.value}
                    onChange={(e) => updateCriteria(index, "value", e.target.value)}
                    placeholder="Valor"
                  />
                </div>

                <div className="col-span-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCriteria(index)}
                    disabled={criteria.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button variant="outline" onClick={addCriteria} className="w-full">
              Añadir criterio
            </Button>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleReset} className="sm:mr-auto">
              Restablecer
            </Button>
            <Button variant="outline" onClick={() => setShowSaveDialog(true)}>
              <Save className="h-4 w-4 mr-2" />
              Guardar filtro
            </Button>
            <Button onClick={handleAdvancedSearch}>Aplicar filtros</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save filter dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Guardar filtro</DialogTitle>
            <DialogDescription>Guarda este filtro para usarlo más tarde.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label htmlFor="filter-name">Nombre del filtro</Label>
              <Input
                id="filter-name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Ej: Productos con stock bajo"
              />
            </div>

            <div className="space-y-2">
              <Label>Criterios</Label>
              <div className="text-sm space-y-1">
                {criteria.map((criterion, index) => (
                  <div key={index} className="text-muted-foreground">
                    {getFieldLabel(criterion.field)} {getOperatorLabel(criterion.operator)} "{criterion.value}"
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveFilter} disabled={!filterName.trim()}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
