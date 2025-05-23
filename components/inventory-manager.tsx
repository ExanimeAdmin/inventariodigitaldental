"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddProductForm } from "./add-product-form"
import { Thermometer, Search, Plus, Edit, Trash2, RefreshCw } from "lucide-react"
import { AdvancedSearch } from "./advanced-search"
import { ExportData } from "./export-data"
import { NotificationCenter } from "./notification-center"
import { useInventory } from "@/hooks/use-inventory"

// Tipos
export type Product = {
  id: string
  name: string
  category: string
  stock: number
  minStock: number
  price: number
  expirationDate?: string
  refrigeration: boolean
  location: string
  provider: string
}

export type ProductFilter = {
  name?: string
  category?: string
  provider?: string
  location?: string
  refrigeration?: boolean
  lowStock?: boolean
  nearExpiration?: boolean
}

export type SavedFilter = {
  id: string
  name: string
  filter: ProductFilter
}

export function InventoryManager() {
  // Usar el hook personalizado para gestionar el inventario con React Query
  const { products, isLoading, error, addProduct, updateProduct, deleteProduct, refreshProducts } = useInventory()

  const [searchTerm, setSearchTerm] = useState("")
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [activeTab, setActiveTab] = useState("inventario")
  const [currentFilter, setCurrentFilter] = useState<ProductFilter>({})
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [isMobile, setIsMobile] = useState(false)

  // Detectar si es un dispositivo móvil
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  // Memoizar la lista filtrada de productos para mejorar el rendimiento
  const filteredProducts = useMemo(() => {
    if (!products) return []

    return products.filter((product) => {
      // Filtro básico por término de búsqueda
      const matchesSearch =
        searchTerm === "" ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.provider.toLowerCase().includes(searchTerm.toLowerCase())

      // Filtros avanzados
      const matchesName = !currentFilter.name || product.name.toLowerCase().includes(currentFilter.name.toLowerCase())

      const matchesCategory = !currentFilter.category || product.category === currentFilter.category

      const matchesProvider = !currentFilter.provider || product.provider === currentFilter.provider

      const matchesLocation = !currentFilter.location || product.location === currentFilter.location

      const matchesRefrigeration =
        currentFilter.refrigeration === undefined || product.refrigeration === currentFilter.refrigeration

      const matchesLowStock = !currentFilter.lowStock || product.stock <= product.minStock

      const matchesExpiration =
        !currentFilter.nearExpiration ||
        (product.expirationDate && new Date(product.expirationDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))

      return (
        matchesSearch &&
        matchesName &&
        matchesCategory &&
        matchesProvider &&
        matchesLocation &&
        matchesRefrigeration &&
        matchesLowStock &&
        matchesExpiration
      )
    })
  }, [products, searchTerm, currentFilter])

  // Función para guardar un filtro
  const saveFilter = useCallback(
    (name: string) => {
      const newFilter: SavedFilter = {
        id: Date.now().toString(),
        name,
        filter: { ...currentFilter },
      }

      setSavedFilters((prev) => [...prev, newFilter])

      // Guardar en localStorage
      try {
        const existingFilters = JSON.parse(localStorage.getItem("savedFilters") || "[]")
        localStorage.setItem("savedFilters", JSON.stringify([...existingFilters, newFilter]))
      } catch (error) {
        console.error("Error saving filter to localStorage:", error)
      }
    },
    [currentFilter],
  )

  // Cargar filtros guardados al iniciar
  useEffect(() => {
    try {
      const savedFiltersFromStorage = localStorage.getItem("savedFilters")
      if (savedFiltersFromStorage) {
        setSavedFilters(JSON.parse(savedFiltersFromStorage))
      }
    } catch (error) {
      console.error("Error loading saved filters:", error)
    }
  }, [])

  // Función para aplicar un filtro guardado
  const applyFilter = useCallback((filter: ProductFilter) => {
    setCurrentFilter(filter)
  }, [])

  // Función para eliminar un filtro guardado
  const deleteFilter = useCallback((id: string) => {
    setSavedFilters((prev) => prev.filter((filter) => filter.id !== id))

    // Actualizar localStorage
    try {
      const existingFilters = JSON.parse(localStorage.getItem("savedFilters") || "[]")
      localStorage.setItem("savedFilters", JSON.stringify(existingFilters.filter((f: SavedFilter) => f.id !== id)))
    } catch (error) {
      console.error("Error removing filter from localStorage:", error)
    }
  }, [])

  // Función para editar un producto
  const handleEdit = useCallback((product: Product) => {
    setEditingProduct(product)
  }, [])

  // Función para eliminar un producto
  const handleDelete = useCallback(
    (id: string) => {
      if (window.confirm("¿Estás seguro de que deseas eliminar este producto?")) {
        deleteProduct(id)
      }
    },
    [deleteProduct],
  )

  // Función para guardar cambios en un producto
  const handleSaveEdit = useCallback(
    (updatedProduct: Product) => {
      updateProduct(updatedProduct)
      setEditingProduct(null)
    },
    [updateProduct],
  )

  // Función para cancelar la edición
  const handleCancelEdit = useCallback(() => {
    setEditingProduct(null)
  }, [])

  // Renderizar mensaje de carga
  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Cargando inventario...</div>
  }

  // Renderizar mensaje de error
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <p className="text-red-500 mb-4">Error al cargar el inventario: {error.message}</p>
        <Button onClick={refreshProducts}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className={`container mx-auto p-4 ${isMobile ? "text-sm" : ""}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <TabsList className="mb-4 md:mb-0">
            <TabsTrigger value="inventario">Inventario</TabsTrigger>
            <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
            <TabsTrigger value="devoluciones">Devoluciones</TabsTrigger>
            <TabsTrigger value="cierre">Cierre diario</TabsTrigger>
          </TabsList>

          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <NotificationCenter products={products || []} />

            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <AdvancedSearch
              currentFilter={currentFilter}
              setCurrentFilter={setCurrentFilter}
              savedFilters={savedFilters}
              onSaveFilter={saveFilter}
              onApplyFilter={applyFilter}
              onDeleteFilter={deleteFilter}
            />

            <ExportData products={filteredProducts} />

            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Añadir nuevo producto</DialogTitle>
                  <DialogDescription>
                    Completa el formulario para añadir un nuevo producto al inventario.
                  </DialogDescription>
                </DialogHeader>
                <AddProductForm onSubmit={addProduct} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="inventario" className="space-y-4">
          <div className="rounded-md border overflow-auto max-h-[calc(100vh-250px)]">
            <Table>
              <TableCaption>Inventario actual de productos</TableCaption>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead>Fecha Exp.</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No se encontraron productos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {product.name}
                          {product.refrigeration && <Thermometer className="ml-2 h-4 w-4 text-blue-500" />}
                        </div>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={product.stock <= product.minStock ? "destructive" : "default"}>
                          {product.stock}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(product.price)}
                      </TableCell>
                      <TableCell>
                        {product.expirationDate ? (
                          <span
                            className={
                              new Date(product.expirationDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                                ? "text-red-500"
                                : ""
                            }
                          >
                            {new Date(product.expirationDate).toLocaleDateString()}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>{product.location}</TableCell>
                      <TableCell>{product.provider}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center space-x-2">
                          <Button variant="outline" size="icon" onClick={() => handleEdit(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleDelete(product.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="pedidos">
          <div className="rounded-md border p-4">
            <h2 className="text-xl font-bold mb-4">Gestión de Pedidos</h2>
            <p>Aquí puedes gestionar los pedidos a proveedores.</p>
            {/* Contenido de la pestaña de pedidos */}
          </div>
        </TabsContent>

        <TabsContent value="devoluciones">
          <div className="rounded-md border p-4">
            <h2 className="text-xl font-bold mb-4">Gestión de Devoluciones</h2>
            <p>Aquí puedes gestionar las devoluciones a proveedores.</p>
            {/* Contenido de la pestaña de devoluciones */}
          </div>
        </TabsContent>

        <TabsContent value="cierre">
          <div className="rounded-md border p-4">
            <h2 className="text-xl font-bold mb-4">Cierre Diario</h2>
            <p>Aquí puedes realizar el cierre diario del inventario.</p>
            {/* Contenido de la pestaña de cierre diario */}
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo para editar producto */}
      {editingProduct && (
        <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar producto</DialogTitle>
              <DialogDescription>Modifica los detalles del producto y guarda los cambios.</DialogDescription>
            </DialogHeader>
            <AddProductForm onSubmit={handleSaveEdit} initialData={editingProduct} onCancel={handleCancelEdit} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
