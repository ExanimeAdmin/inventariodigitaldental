"use client"

import { useState } from "react"
import { useInventory } from "@/hooks/use-inventory"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { NotificationCenter } from "@/components/notification-center"
import { DatabaseStatus } from "@/components/database-status"
import { Package, Search, AlertTriangle, Thermometer, RefreshCw } from "lucide-react"

// Export areas for deployment compatibility
export const areas = [
  "Consultorio 1",
  "Consultorio 2",
  "Consultorio 3",
  "Almacén Principal",
  "Farmacia",
  "Esterilización",
  "Recepción",
]

export default function InventarioPage() {
  const { productos, loading, error, demoMode, fetchProductos } = useInventory()
  const [searchTerm, setSearchTerm] = useState("")

  // Asegurarse de que productos es un array
  const productosSeguro = Array.isArray(productos) ? productos : []

  // Filtrar productos por término de búsqueda
  const filteredProductos = productosSeguro.filter(
    (producto) =>
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.codigo?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Contar productos por categoría
  const countByCategory = productosSeguro.reduce(
    (acc, producto) => {
      acc[producto.categoria] = (acc[producto.categoria] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Contar productos con stock bajo
  const stockBajoCount = productosSeguro.filter((producto) => producto.stock <= producto.stock_minimo).length

  // Contar productos por vencer (30 días)
  const porVencerCount = productosSeguro.filter((producto) => {
    if (!producto.fecha_vencimiento) return false
    const fechaVencimiento = new Date(producto.fecha_vencimiento)
    const hoy = new Date()
    const treintaDias = new Date()
    treintaDias.setDate(hoy.getDate() + 30)
    return fechaVencimiento <= treintaDias
  }).length

  // Contar productos que requieren refrigeración
  const refrigeracionCount = productosSeguro.filter((producto) => producto.requiere_refrigeracion).length

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
          <p className="text-muted-foreground">Gestión de productos y materiales de la clínica dental</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => fetchProductos()} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          {demoMode && (
            <Badge variant="outline" className="bg-yellow-100">
              Modo Demo
            </Badge>
          )}
        </div>
      </div>

      {/* Estado de la base de datos */}
      <DatabaseStatus />

      {/* Dashboard de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{productosSeguro.length}</div>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stockBajoCount}</div>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Por Vencer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{porVencerCount}</div>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Refrigeración</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{refrigeracionCount}</div>
              <Thermometer className="h-4 w-4 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Centro de notificaciones */}
      <NotificationCenter productos={productosSeguro} demoMode={demoMode} />

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar productos..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Listado de productos */}
      <Tabs defaultValue="todos">
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          {Object.keys(countByCategory).map((categoria) => (
            <TabsTrigger key={categoria} value={categoria}>
              {categoria} ({countByCategory[categoria]})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="todos" className="mt-4">
          <ProductTable productos={filteredProductos} loading={loading} />
        </TabsContent>

        {Object.keys(countByCategory).map((categoria) => (
          <TabsContent key={categoria} value={categoria} className="mt-4">
            <ProductTable productos={filteredProductos.filter((p) => p.categoria === categoria)} loading={loading} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function ProductTable({ productos, loading }: { productos: any[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
        ))}
      </div>
    )
  }

  if (productos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-md">
        <Package className="h-8 w-8 mb-2 text-muted-foreground" />
        <h3 className="text-lg font-medium">No hay productos</h3>
        <p className="text-sm text-muted-foreground">No se encontraron productos que coincidan con tu búsqueda.</p>
      </div>
    )
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="p-2 text-left font-medium">Nombre</th>
            <th className="p-2 text-left font-medium">Categoría</th>
            <th className="p-2 text-left font-medium">Stock</th>
            <th className="p-2 text-left font-medium">Precio</th>
            <th className="p-2 text-left font-medium">Ubicación</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((producto) => {
            // Determinar si el producto tiene stock bajo
            const stockBajo = producto.stock <= producto.stock_minimo

            // Determinar si el producto está por vencer
            let porVencer = false
            if (producto.fecha_vencimiento) {
              const fechaVencimiento = new Date(producto.fecha_vencimiento)
              const hoy = new Date()
              const treintaDias = new Date()
              treintaDias.setDate(hoy.getDate() + 30)
              porVencer = fechaVencimiento <= treintaDias
            }

            return (
              <tr key={producto.id} className="border-t hover:bg-muted/50">
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <span>{producto.nombre}</span>
                    {stockBajo && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                    {porVencer && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    {producto.requiere_refrigeracion && <Thermometer className="h-4 w-4 text-blue-500" />}
                  </div>
                </td>
                <td className="p-2">
                  <Badge variant="outline">{producto.categoria}</Badge>
                </td>
                <td className="p-2">
                  <span className={stockBajo ? "text-red-500 font-medium" : ""}>
                    {producto.stock} / {producto.stock_minimo}
                  </span>
                </td>
                <td className="p-2">
                  {new Intl.NumberFormat("es-CL", {
                    style: "currency",
                    currency: "CLP",
                  }).format(producto.precio)}
                </td>
                <td className="p-2">{producto.ubicacion}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
