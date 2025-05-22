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
import { ShoppingCart, Check, X, FileDown, Calendar, AlertTriangle } from "lucide-react"
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
  productos?: Array<{
    id: string
    nombre: string
    precio: number
    ultimaCompra: string
  }>
}

interface Pedido {
  id: string
  fecha: string
  fechaEntrega: string
  proveedor: string
  proveedorId: string
  productos: Array<{
    id: string
    nombre: string
    cantidad: number
    precio: number
    total: number
  }>
  total: number
  estado: "pendiente" | "enviado" | "recibido" | "cancelado"
  observaciones: string
  usuario: string
}

export default function PedidosDirectos() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentUser, setCurrentUser] = useState("")
  const [userArea, setUserArea] = useState("")
  const [inventario, setInventario] = useState<ProductoInventario[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [productosStockBajo, setProductosStockBajo] = useState<ProductoInventario[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [pedidoAConfirmar, setPedidoAConfirmar] = useState<string | null>(null)
  const [pedidoACancelar, setPedidoACancelar] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [filtroProveedor, setFiltroProveedor] = useState<string>("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formData, setFormData] = useState<{
    proveedorId: string
    fechaEntrega: string
    productos: Array<{
      id: string
      nombre: string
      cantidad: number
      precio: number
      total: number
    }>
    observaciones: string
  }>({
    proveedorId: "",
    fechaEntrega: "",
    productos: [],
    observaciones: "",
  })

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
    const storedPedidos = JSON.parse(localStorage.getItem("pedidos") || "[]")

    setInventario(storedInventario)
    setProveedores(storedProveedores)
    setPedidos(storedPedidos)

    // Identificar productos con stock bajo
    const productosConStockBajo = storedInventario.filter(
      (item: ProductoInventario) => item.cantidad <= item.stockMinimo,
    )
    setProductosStockBajo(productosConStockBajo)

    // Inicializar fecha de entrega a 3 días después
    const fechaEntrega = new Date()
    fechaEntrega.setDate(fechaEntrega.getDate() + 3)
    setFormData((prev) => ({
      ...prev,
      fechaEntrega: fechaEntrega.toISOString().split("T")[0],
    }))
  }

  const guardarPedidos = (nuevosPedidos: Pedido[]) => {
    localStorage.setItem("pedidos", JSON.stringify(nuevosPedidos))
    setPedidos(nuevosPedidos)

    // Registrar la acción
    registrarAccion("Actualización de pedidos")
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

    // Si se selecciona un proveedor, cargar sus productos disponibles
    if (proveedorId) {
      const proveedor = proveedores.find((p) => p.id === proveedorId)
      if (proveedor && proveedor.productos) {
        // Filtrar productos que están en stock bajo
        const productosDisponibles = proveedor.productos.filter((producto) =>
          productosStockBajo.some((p) => p.id === producto.id),
        )

        // Añadir automáticamente los productos en stock bajo
        const productosParaPedido = productosDisponibles.map((producto) => {
          const productoInventario = productosStockBajo.find((p) => p.id === producto.id)
          const cantidadNecesaria = productoInventario
            ? Math.max(productoInventario.stockMaximo - productoInventario.cantidad, 1)
            : 1

          return {
            id: producto.id,
            nombre: producto.nombre,
            cantidad: cantidadNecesaria,
            precio: producto.precio,
            total: cantidadNecesaria * producto.precio,
          }
        })

        setFormData((prev) => ({
          ...prev,
          productos: productosParaPedido,
        }))
      }
    }
  }

  const handleCantidadChange = (id: string, cantidad: number) => {
    const nuevosProductos = formData.productos.map((producto) => {
      if (producto.id === id) {
        return {
          ...producto,
          cantidad,
          total: cantidad * producto.precio,
        }
      }
      return producto
    })

    setFormData({
      ...formData,
      productos: nuevosProductos,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.proveedorId || formData.productos.length === 0 || !formData.fechaEntrega) {
      setError("Debe seleccionar un proveedor, productos y fecha de entrega")
      return
    }

    const proveedor = proveedores.find((p) => p.id === formData.proveedorId)
    if (!proveedor) {
      setError("Proveedor no encontrado")
      return
    }

    const total = formData.productos.reduce((sum, producto) => sum + producto.total, 0)

    const nuevoPedido: Pedido = {
      id: Date.now().toString(),
      fecha: new Date().toISOString().split("T")[0],
      fechaEntrega: formData.fechaEntrega,
      proveedor: proveedor.nombre,
      proveedorId: proveedor.id,
      productos: formData.productos,
      total,
      estado: "pendiente",
      observaciones: formData.observaciones || "",
      usuario: currentUser,
    }

    const nuevosPedidos = [...pedidos, nuevoPedido]
    guardarPedidos(nuevosPedidos)
    setShowForm(false)
    resetForm()
    setSuccess("Pedido registrado correctamente")
    setTimeout(() => setSuccess(""), 3000)

    // Registrar la acción específica
    registrarAccion("Nuevo pedido", `Proveedor: ${proveedor.nombre}, Total: $${total.toLocaleString()}`)
  }

  const resetForm = () => {
    setFormData({
      proveedorId: "",
      fechaEntrega: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      productos: [],
      observaciones: "",
    })
  }

  const confirmarRecepcion = () => {
    if (!pedidoAConfirmar) return

    const pedido = pedidos.find((p) => p.id === pedidoAConfirmar)
    if (!pedido) return

    // Actualizar el estado del pedido
    const nuevosPedidos = pedidos.map((p) => {
      if (p.id === pedidoAConfirmar) {
        return { ...p, estado: "recibido" }
      }
      return p
    })

    guardarPedidos(nuevosPedidos)

    // Actualizar el inventario
    const nuevoInventario = [...inventario]

    pedido.productos.forEach((producto) => {
      const index = nuevoInventario.findIndex((p) => p.id === producto.id)
      if (index !== -1) {
        nuevoInventario[index] = {
          ...nuevoInventario[index],
          cantidad: nuevoInventario[index].cantidad + producto.cantidad,
          entrega: new Date().toISOString().split("T")[0],
        }
      }
    })

    localStorage.setItem("inventario", JSON.stringify(nuevoInventario))
    setInventario(nuevoInventario)

    // Registrar la acción
    registrarAccion("Recepción de pedido", `Pedido: ${pedidoAConfirmar}, Proveedor: ${pedido.proveedor}`)

    setShowConfirmDialog(false)
    setPedidoAConfirmar(null)
    setSuccess("Pedido recibido correctamente")
    setTimeout(() => setSuccess(""), 3000)
  }

  const cancelarPedido = () => {
    if (!pedidoACancelar) return

    const nuevosPedidos = pedidos.map((p) => {
      if (p.id === pedidoACancelar) {
        return { ...p, estado: "cancelado" }
      }
      return p
    })

    guardarPedidos(nuevosPedidos)

    // Registrar la acción
    const pedido = pedidos.find((p) => p.id === pedidoACancelar)
    if (pedido) {
      registrarAccion("Cancelación de pedido", `Pedido: ${pedidoACancelar}, Proveedor: ${pedido.proveedor}`)
    }

    setShowCancelDialog(false)
    setPedidoACancelar(null)
    setSuccess("Pedido cancelado correctamente")
    setTimeout(() => setSuccess(""), 3000)
  }

  const filtrarPedidos = () => {
    return pedidos
      .filter((pedido) => {
        const matchEstado = filtroEstado === "todos" || pedido.estado === filtroEstado
        const matchProveedor = !filtroProveedor || pedido.proveedorId === filtroProveedor

        // Solo mostrar pedidos al admin o al usuario que los creó
        const matchUsuario = isAdmin || pedido.usuario === currentUser

        return matchEstado && matchProveedor && matchUsuario
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  }

  const exportarPDF = (pedido: Pedido) => {
    const doc = new jsPDF()

    // Título
    doc.setFontSize(18)
    doc.text(`Pedido #${pedido.id}`, 14, 22)

    // Información del pedido
    doc.setFontSize(12)
    doc.text(`Fecha: ${pedido.fecha}`, 14, 32)
    doc.text(`Proveedor: ${pedido.proveedor}`, 14, 40)
    doc.text(`Fecha de entrega: ${pedido.fechaEntrega}`, 14, 48)
    doc.text(`Estado: ${pedido.estado}`, 14, 56)

    // Tabla de productos
    const productosData = pedido.productos.map((producto) => [
      producto.nombre,
      producto.cantidad.toString(),
      `$${producto.precio.toLocaleString()}`,
      `$${producto.total.toLocaleString()}`,
    ])

    // @ts-ignore - jspdf-autotable types are not included
    doc.autoTable({
      startY: 65,
      head: [["Producto", "Cantidad", "Precio Unit.", "Total"]],
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

    // Total
    const finalY = (doc as any).lastAutoTable.finalY || 120
    doc.text(`Total: $${pedido.total.toLocaleString()}`, 14, finalY + 10)

    // Observaciones
    if (pedido.observaciones) {
      doc.text("Observaciones:", 14, finalY + 20)
      doc.text(pedido.observaciones, 14, finalY + 28)
    }

    doc.save(`pedido-${pedido.id}.pdf`)
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "enviado":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "recibido":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "cancelado":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
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
            <h1 className="text-2xl font-bold">Pedidos Directos a Proveedores</h1>
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
                <ShoppingCart className="h-4 w-4 mr-2" />
                Nuevo Pedido
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
                      <SelectItem value="enviado">Enviado</SelectItem>
                      <SelectItem value="recibido">Recibido</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
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
                <CardTitle>Nuevo Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div>
                      <Label htmlFor="fechaEntrega">Fecha de Entrega Esperada *</Label>
                      <Input
                        id="fechaEntrega"
                        type="date"
                        value={formData.fechaEntrega}
                        onChange={(e) => setFormData({ ...formData, fechaEntrega: e.target.value })}
                      />
                    </div>
                  </div>

                  {formData.proveedorId && (
                    <>
                      <div className="mt-4">
                        <h3 className="text-lg font-medium mb-2">Productos a Pedir</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Producto</TableHead>
                              <TableHead>Cantidad</TableHead>
                              <TableHead>Precio Unitario</TableHead>
                              <TableHead>Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {formData.productos.length > 0 ? (
                              formData.productos.map((producto) => (
                                <TableRow key={producto.id}>
                                  <TableCell>{producto.nombre}</TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={producto.cantidad}
                                      onChange={(e) =>
                                        handleCantidadChange(producto.id, Number.parseInt(e.target.value) || 1)
                                      }
                                      className="w-20"
                                    />
                                  </TableCell>
                                  <TableCell>${producto.precio.toLocaleString()}</TableCell>
                                  <TableCell>${producto.total.toLocaleString()}</TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-4">
                                  No hay productos seleccionados
                                </TableCell>
                              </TableRow>
                            )}
                            {formData.productos.length > 0 && (
                              <TableRow>
                                <TableCell colSpan={3} className="text-right font-bold">
                                  Total:
                                </TableCell>
                                <TableCell className="font-bold">
                                  ${formData.productos.reduce((sum, p) => sum + p.total, 0).toLocaleString()}
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
                          placeholder="Instrucciones especiales, detalles de entrega, etc."
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
                      Enviar Pedido
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Historial de Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              {filtrarPedidos().length > 0 ? (
                filtrarPedidos().map((pedido) => (
                  <Card key={pedido.id} className="mb-4 border-l-4 border-l-dental-blue">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-medium">Pedido #{pedido.id}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Fecha: {pedido.fecha}</span>
                          </div>
                          <p className="text-sm">Proveedor: {pedido.proveedor}</p>
                          <p className="text-sm">Entrega esperada: {pedido.fechaEntrega}</p>
                        </div>
                        <div className="mt-2 md:mt-0 flex flex-col items-end">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(pedido.estado)}`}
                          >
                            {pedido.estado === "pendiente" && "Pendiente"}
                            {pedido.estado === "enviado" && "Enviado"}
                            {pedido.estado === "recibido" && "Recibido"}
                            {pedido.estado === "cancelado" && "Cancelado"}
                          </span>
                          <p className="text-lg font-bold mt-2">Total: ${pedido.total.toLocaleString()}</p>
                        </div>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead>Precio Unitario</TableHead>
                            <TableHead>Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pedido.productos.map((producto) => (
                            <TableRow key={producto.id}>
                              <TableCell>{producto.nombre}</TableCell>
                              <TableCell>{producto.cantidad}</TableCell>
                              <TableCell>${producto.precio.toLocaleString()}</TableCell>
                              <TableCell>${producto.total.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {pedido.observaciones && (
                        <div className="mt-4">
                          <p className="text-sm font-medium">Observaciones:</p>
                          <p className="text-sm">{pedido.observaciones}</p>
                        </div>
                      )}

                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={() => exportarPDF(pedido)}>
                          <FileDown className="h-4 w-4 mr-1" />
                          Exportar PDF
                        </Button>

                        {pedido.estado === "pendiente" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-dental-green border-dental-green/20 hover:bg-dental-green/10"
                              onClick={() => {
                                setPedidoAConfirmar(pedido.id)
                                setShowConfirmDialog(true)
                              }}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Recibido
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-dental-red border-dental-red/20 hover:bg-dental-red/10"
                              onClick={() => {
                                setPedidoACancelar(pedido.id)
                                setShowCancelDialog(true)
                              }}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay pedidos registrados</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar Recepción</DialogTitle>
              </DialogHeader>
              <p>¿Confirma que ha recibido este pedido? Esta acción actualizará el inventario.</p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={confirmarRecepcion}>Confirmar Recepción</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancelar Pedido</DialogTitle>
              </DialogHeader>
              <p>¿Está seguro de que desea cancelar este pedido?</p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                  No Cancelar
                </Button>
                <Button variant="destructive" onClick={cancelarPedido}>
                  Sí, Cancelar Pedido
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
