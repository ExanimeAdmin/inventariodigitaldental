"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { FileDown, Calendar, AlertTriangle, RotateCcw } from "lucide-react"
import Link from "next/link"
import { jsPDF } from "jspdf"
import "jspdf-autotable"

interface ProductoInventario {
  id: string
  producto: string
  categoria: string
  area: string
  cantidad: number
  unidad: string
  stockMinimo: number
  stockMaximo: number
  entrega: string
  vencimiento: string
  proveedor: string
  precio: string
  observaciones: string
}

interface Proveedor {
  id: string
  nombre: string
  contacto: string
  telefono: string
  email: string
}

interface Devolucion {
  id: string
  fecha: string
  proveedor: string
  proveedorId: string
  productos: Array<{
    id: string
    nombre: string
    cantidad: number
    motivo: string
  }>
  estado: "pendiente" | "procesada" | "rechazada"
  observaciones: string
  usuario: string
}

export default function Devoluciones() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentUser, setCurrentUser] = useState("")
  const [userArea, setUserArea] = useState("")
  const [inventario, setInventario] = useState<ProductoInventario[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([])
  const [productosVencidos, setProductosVencidos] = useState<ProductoInventario[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [devolucionAEliminar, setDevolucionAEliminar] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [filtroProveedor, setFiltroProveedor] = useState<string>("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formData, setFormData] = useState<{
    proveedorId: string
    productos: Array<{
      id: string
      nombre: string
      cantidad: number
      motivo: string
    }>
    observaciones: string
  }>({
    proveedorId: "",
    productos: [],
    observaciones: "",
  })
  const [selectedProducto, setSelectedProducto] = useState<string>("")
  const [selectedCantidad, setSelectedCantidad] = useState<number>(1)
  const [selectedMotivo, setSelectedMotivo] = useState<string>("defectuoso")

  useEffect(() => {
    const currentUserJson = localStorage.getItem("currentUser")
    if (!currentUserJson) {
      router.push("/login")
      return
    }

    const userData = JSON.parse(currentUserJson)
    setCurrentUser(userData.username)
    setIsAdmin(userData.role === "admin")

    // Obtener el área asignada al usuario
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const user = users.find((u: any) => u.username === userData.username)
    if (user && user.area) {
      setUserArea(user.area)
    } else if (userData.role === "admin") {
      setUserArea("Todas")
    } else {
      setUserArea("Recepción")
    }

    setIsLoggedIn(true)
    cargarDatos()
  }, [router])

  const cargarDatos = () => {
    const storedInventario = JSON.parse(localStorage.getItem("inventario") || "[]")
    const storedProveedores = JSON.parse(localStorage.getItem("proveedores") || "[]")
    const storedDevoluciones = JSON.parse(localStorage.getItem("devoluciones") || "[]")

    setInventario(storedInventario)
    setProveedores(storedProveedores)
    setDevoluciones(storedDevoluciones)

    // Identificar productos vencidos o próximos a vencer
    const hoy = new Date()
    const productosConProblemas = storedInventario.filter((item: ProductoInventario) => {
      if (!item.vencimiento) return false
      const fechaVencimiento = new Date(item.vencimiento)
      return fechaVencimiento <= hoy
    })
    setProductosVencidos(productosConProblemas)
  }

  const guardarDevoluciones = (nuevasDevoluciones: Devolucion[]) => {
    localStorage.setItem("devoluciones", JSON.stringify(nuevasDevoluciones))
    setDevoluciones(nuevasDevoluciones)

    // Registrar la acción
    registrarAccion("Actualización de devoluciones")
  }

  const registrarAccion = (accion: string, detalles = "") => {
    const logs = JSON.parse(localStorage.getItem("systemLogs") || "[]")

    logs.push({
      fecha: new Date().toISOString(),
      usuario: currentUser,
      accion: accion,
      detalles: detalles || `Área: ${userArea}`,
    })

    localStorage.setItem("systemLogs", JSON.stringify(logs))
  }

  const handleProveedorChange = (proveedorId: string) => {
    setFormData({
      ...formData,
      proveedorId,
      productos: [],
    })

    // Filtrar productos por proveedor seleccionado
    setSelectedProducto("")
  }

  const handleAddProducto = () => {
    if (!selectedProducto || selectedCantidad <= 0 || !selectedMotivo) {
      setError("Debe seleccionar un producto, cantidad y motivo")
      return
    }

    const producto = inventario.find((p) => p.id === selectedProducto)
    if (!producto) {
      setError("Producto no encontrado")
      return
    }

    // Verificar si el producto ya está en la lista
    const productoExistente = formData.productos.find((p) => p.id === selectedProducto)
    if (productoExistente) {
      setError("Este producto ya está en la lista de devolución")
      return
    }

    // Verificar que la cantidad no exceda la disponible en inventario
    if (selectedCantidad > producto.cantidad) {
      setError(`No puede devolver más de ${producto.cantidad} unidades disponibles`)
      return
    }

    const nuevoProducto = {
      id: producto.id,
      nombre: producto.producto,
      cantidad: selectedCantidad,
      motivo: selectedMotivo,
    }

    setFormData({
      ...formData,
      productos: [...formData.productos, nuevoProducto],
    })

    // Limpiar selección
    setSelectedProducto("")
    setSelectedCantidad(1)
    setSelectedMotivo("defectuoso")
    setError("")
  }

  const handleRemoveProducto = (id: string) => {
    setFormData({
      ...formData,
      productos: formData.productos.filter((p) => p.id !== id),
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.proveedorId || formData.productos.length === 0) {
      setError("Debe seleccionar un proveedor y al menos un producto")
      return
    }

    const proveedor = proveedores.find((p) => p.id === formData.proveedorId)
    if (!proveedor) {
      setError("Proveedor no encontrado")
      return
    }

    const nuevaDevolucion: Devolucion = {
      id: Date.now().toString(),
      fecha: new Date().toISOString().split("T")[0],
      proveedor: proveedor.nombre,
      proveedorId: proveedor.id,
      productos: formData.productos,
      estado: "pendiente",
      observaciones: formData.observaciones || "",
      usuario: currentUser,
    }

    const nuevasDevoluciones = [...devoluciones, nuevaDevolucion]
    guardarDevoluciones(nuevasDevoluciones)

    // Actualizar el inventario (reducir la cantidad)
    const nuevoInventario = [...inventario]

    formData.productos.forEach((producto) => {
      const index = nuevoInventario.findIndex((p) => p.id === producto.id)
      if (index !== -1) {
        nuevoInventario[index] = {
          ...nuevoInventario[index],
          cantidad: Math.max(0, nuevoInventario[index].cantidad - producto.cantidad),
        }
      }
    })

    localStorage.setItem("inventario", JSON.stringify(nuevoInventario))
    setInventario(nuevoInventario)

    setShowForm(false)
    resetForm()
    setSuccess("Devolución registrada correctamente")
    setTimeout(() => setSuccess(""), 3000)

    // Registrar la acción específica
    registrarAccion("Nueva devolución", `Proveedor: ${proveedor.nombre}, Productos: ${formData.productos.length}`)
  }

  const resetForm = () => {
    setFormData({
      proveedorId: "",
      productos: [],
      observaciones: "",
    })
    setSelectedProducto("")
    setSelectedCantidad(1)
    setSelectedMotivo("defectuoso")
  }

  const handleDelete = (id: string) => {
    setDevolucionAEliminar(id)
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (!devolucionAEliminar) return

    const devolucion = devoluciones.find((d) => d.id === devolucionAEliminar)
    if (!devolucion) return

    // Solo permitir eliminar si está pendiente
    if (devolucion.estado !== "pendiente") {
      setError("Solo se pueden eliminar devoluciones pendientes")
      setShowDeleteDialog(false)
      return
    }

    const nuevasDevoluciones = devoluciones.filter((d) => d.id !== devolucionAEliminar)
    guardarDevoluciones(nuevasDevoluciones)

    // Restaurar el inventario
    const nuevoInventario = [...inventario]

    devolucion.productos.forEach((producto) => {
      const index = nuevoInventario.findIndex((p) => p.id === producto.id)
      if (index !== -1) {
        nuevoInventario[index] = {
          ...nuevoInventario[index],
          cantidad: nuevoInventario[index].cantidad + producto.cantidad,
        }
      }
    })

    localStorage.setItem("inventario", JSON.stringify(nuevoInventario))
    setInventario(nuevoInventario)

    // Registrar la acción
    registrarAccion(
      "Eliminación de devolución",
      `Devolución: ${devolucionAEliminar}, Proveedor: ${devolucion.proveedor}`,
    )

    setShowDeleteDialog(false)
    setDevolucionAEliminar(null)
    setSuccess("Devolución eliminada correctamente")
    setTimeout(() => setSuccess(""), 3000)
  }

  const cambiarEstado = (id: string, nuevoEstado: "procesada" | "rechazada") => {
    if (!isAdmin) {
      setError("Solo el administrador puede cambiar el estado de las devoluciones")
      return
    }

    const nuevasDevoluciones = devoluciones.map((d) => {
      if (d.id === id) {
        return { ...d, estado: nuevoEstado }
      }
      return d
    })

    guardarDevoluciones(nuevasDevoluciones)

    // Si es rechazada, devolver los productos al inventario
    if (nuevoEstado === "rechazada") {
      const devolucion = devoluciones.find((d) => d.id === id)
      if (devolucion) {
        const nuevoInventario = [...inventario]

        devolucion.productos.forEach((producto) => {
          const index = nuevoInventario.findIndex((p) => p.id === producto.id)
          if (index !== -1) {
            nuevoInventario[index] = {
              ...nuevoInventario[index],
              cantidad: nuevoInventario[index].cantidad + producto.cantidad,
            }
          }
        })

        localStorage.setItem("inventario", JSON.stringify(nuevoInventario))
        setInventario(nuevoInventario)
      }
    }

    // Registrar la acción
    registrarAccion(`Devolución marcada como ${nuevoEstado}`, `Devolución: ${id}`)

    setSuccess(`Devolución marcada como ${nuevoEstado}`)
    setTimeout(() => setSuccess(""), 3000)
  }

  const filtrarDevoluciones = () => {
    return devoluciones
      .filter((devolucion) => {
        const matchEstado = filtroEstado === "todos" || devolucion.estado === filtroEstado
        const matchProveedor = !filtroProveedor || devolucion.proveedorId === filtroProveedor

        // Solo mostrar devoluciones al admin o al usuario que las creó
        const matchUsuario = isAdmin || devolucion.usuario === currentUser

        return matchEstado && matchProveedor && matchUsuario
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  }

  const exportarPDF = (devolucion: Devolucion) => {
    const doc = new jsPDF()

    // Título
    doc.setFontSize(18)
    doc.text(`Devolución #${devolucion.id}`, 14, 22)

    // Información de la devolución
    doc.setFontSize(12)
    doc.text(`Fecha: ${devolucion.fecha}`, 14, 32)
    doc.text(`Proveedor: ${devolucion.proveedor}`, 14, 40)
    doc.text(`Estado: ${devolucion.estado}`, 14, 48)

    // Tabla de productos
    const productosData = devolucion.productos.map((producto) => [
      producto.nombre,
      producto.cantidad.toString(),
      producto.motivo,
    ])

    // @ts-ignore - jspdf-autotable types are not included
    doc.autoTable({
      startY: 56,
      head: [["Producto", "Cantidad", "Motivo"]],
      body: productosData,
      theme: "striped",
      headStyles: {
        fillColor: [0, 150, 214], // Color dental-blue
        textColor: [255, 255, 255],
      },
      styles: {
        fontSize: 10,
      },
    })

    // Observaciones
    const finalY = (doc as any).lastAutoTable.finalY || 100
    if (devolucion.observaciones) {
      doc.text("Observaciones:", 14, finalY + 10)
      doc.text(devolucion.observaciones, 14, finalY + 18)
    }

    doc.save(`devolucion-${devolucion.id}.pdf`)
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "procesada":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "rechazada":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
    }
  }

  const getMotivoLabel = (motivo: string) => {
    switch (motivo) {
      case "defectuoso":
        return "Producto defectuoso"
      case "vencido":
        return "Producto vencido"
      case "incompleto":
        return "Pedido incompleto"
      case "equivocado":
        return "Producto equivocado"
      default:
        return motivo
    }
  }

  // Verificar si el usuario tiene acceso a esta página
  if (isLoggedIn && !isAdmin && userArea !== "Recepción") {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-dental-red mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Acceso Restringido</h2>
            <p className="mb-4">No tiene permisos para acceder a esta página.</p>
            <Button asChild>
              <Link href="/">Volver al Inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      {isLoggedIn ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Registro de Devoluciones a Proveedores</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/inventario")}>
                Volver al Inventario
              </Button>
              <Button
                onClick={() => {
                  resetForm()
                  setShowForm(true)
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Nueva Devolución
              </Button>
            </div>
          </div>

          {error && (
            <Alert className="mb-4 bg-red-50 text-dental-red border-dental-red/20 dark:bg-red-950/30">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 text-dental-green border-dental-green/20 dark:bg-green-950/30">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="filtroEstado">Filtrar por Estado</Label>
                  <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los estados</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="procesada">Procesada</SelectItem>
                      <SelectItem value="rechazada">Rechazada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filtroProveedor">Filtrar por Proveedor</Label>
                  <Select value={filtroProveedor} onValueChange={setFiltroProveedor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los proveedores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los proveedores</SelectItem>
                      {proveedores.map((proveedor) => (
                        <SelectItem key={proveedor.id} value={proveedor.id}>
                          {proveedor.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {showForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Nueva Devolución</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="proveedor">Proveedor *</Label>
                    <Select value={formData.proveedorId} onValueChange={handleProveedorChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {proveedores.map((proveedor) => (
                          <SelectItem key={proveedor.id} value={proveedor.id}>
                            {proveedor.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.proveedorId && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                          <Label htmlFor="producto">Producto</Label>
                          <Select value={selectedProducto} onValueChange={setSelectedProducto}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un producto" />
                            </SelectTrigger>
                            <SelectContent>
                              {inventario
                                .filter(
                                  (p) =>
                                    p.proveedor ===
                                    proveedores.find((prov) => prov.id === formData.proveedorId)?.nombre,
                                )
                                .map((producto) => (
                                  <SelectItem key={producto.id} value={producto.id}>
                                    {producto.producto} ({producto.cantidad} disponibles)
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="cantidad">Cantidad</Label>
                          <Input
                            id="cantidad"
                            type="number"
                            min="1"
                            value={selectedCantidad}
                            onChange={(e) => setSelectedCantidad(Number.parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="motivo">Motivo</Label>
                          <Select value={selectedMotivo} onValueChange={setSelectedMotivo}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un motivo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="defectuoso">Producto defectuoso</SelectItem>
                              <SelectItem value="vencido">Producto vencido</SelectItem>
                              <SelectItem value="incompleto">Pedido incompleto</SelectItem>
                              <SelectItem value="equivocado">Producto equivocado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Button type="button" onClick={handleAddProducto}>
                            Agregar Producto
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h3 className="text-lg font-medium mb-2">Productos a Devolver</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Producto</TableHead>
                              <TableHead>Cantidad</TableHead>
                              <TableHead>Motivo</TableHead>
                              <TableHead>Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {formData.productos.length > 0 ? (
                              formData.productos.map((producto) => (
                                <TableRow key={producto.id}>
                                  <TableCell>{producto.nombre}</TableCell>
                                  <TableCell>{producto.cantidad}</TableCell>
                                  <TableCell>{getMotivoLabel(producto.motivo)}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRemoveProducto(producto.id)}
                                    >
                                      Eliminar
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-4">
                                  No hay productos seleccionados
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      <div>
                        <Label htmlFor="observaciones">Observaciones</Label>
                        <Textarea
                          id="observaciones"
                          value={formData.observaciones}
                          onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                          placeholder="Detalles adicionales sobre la devolución"
                          rows={3}
                        />
                      </div>
                    </>
                  )}

                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false)
                        resetForm()
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={!formData.proveedorId || formData.productos.length === 0}>
                      Registrar Devolución
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Historial de Devoluciones</CardTitle>
            </CardHeader>
            <CardContent>
              {filtrarDevoluciones().length > 0 ? (
                filtrarDevoluciones().map((devolucion) => (
                  <Card key={devolucion.id} className="mb-4 border-l-4 border-l-dental-red">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-medium">Devolución #{devolucion.id}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Fecha: {devolucion.fecha}</span>
                          </div>
                          <p className="text-sm">Proveedor: {devolucion.proveedor}</p>
                        </div>
                        <div className="mt-2 md:mt-0 flex flex-col items-end">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(devolucion.estado)}`}
                          >
                            {devolucion.estado === "pendiente" && "Pendiente"}
                            {devolucion.estado === "procesada" && "Procesada"}
                            {devolucion.estado === "rechazada" && "Rechazada"}
                          </span>
                        </div>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead>Motivo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {devolucion.productos.map((producto) => (
                            <TableRow key={producto.id}>
                              <TableCell>{producto.nombre}</TableCell>
                              <TableCell>{producto.cantidad}</TableCell>
                              <TableCell>{getMotivoLabel(producto.motivo)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {devolucion.observaciones && (
                        <div className="mt-4">
                          <p className="text-sm font-medium">Observaciones:</p>
                          <p className="text-sm">{devolucion.observaciones}</p>
                        </div>
                      )}

                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={() => exportarPDF(devolucion)}>
                          <FileDown className="h-4 w-4 mr-1" />
                          Exportar PDF
                        </Button>

                        {devolucion.estado === "pendiente" && (
                          <>
                            {isAdmin && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-dental-green border-dental-green/20 hover:bg-dental-green/10"
                                  onClick={() => cambiarEstado(devolucion.id, "procesada")}
                                >
                                  Marcar como Procesada
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-dental-red border-dental-red/20 hover:bg-dental-red/10"
                                  onClick={() => cambiarEstado(devolucion.id, "rechazada")}
                                >
                                  Rechazar
                                </Button>
                              </>
                            )}
                            {(isAdmin || devolucion.usuario === currentUser) && (
                              <Button variant="outline" size="sm" onClick={() => handleDelete(devolucion.id)}>
                                Eliminar
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay devoluciones registradas</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Eliminar Devolución</DialogTitle>
              </DialogHeader>
              <p>
                ¿Está seguro de que desea eliminar esta devolución? Esta acción restaurará los productos al inventario.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={confirmDelete}>
                  Eliminar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <div className="flex justify-center items-center h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <p className="mb-4">Debe iniciar sesión para acceder a esta página.</p>
              <Button asChild>
                <Link href="/login">Ir a Iniciar Sesión</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
