"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Trash2, Calendar, FileDown, Filter } from "lucide-react"
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
  precio: string
  stockMinimo: number
  stockMaximo: number
  proveedor: string
}

interface Proveedor {
  id: string
  nombre: string
  productos?: Array<{
    id: string
    nombre: string
    precio: number
    ultimaCompra: string
  }>
}

interface Compra {
  id: string
  fecha: string
  producto: string
  productoId: string
  cantidad: number
  precioUnitario: number
  precioTotal: number
  proveedor: string
  area: string
  usuario: string
}

export default function Compras() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentUser, setCurrentUser] = useState("")
  const [userArea, setUserArea] = useState("")
  const [compras, setCompras] = useState<Compra[]>([])
  const [inventario, setInventario] = useState<ProductoInventario[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [filtroFecha, setFiltroFecha] = useState("")
  const [filtroProducto, setFiltroProducto] = useState("")
  const [filtroProveedor, setFiltroProveedor] = useState("")
  const [filtroArea, setFiltroArea] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [compraAEliminar, setCompraAEliminar] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<{
    productoId: string
    proveedorId: string
    cantidad: number
    precioUnitario: number
    fecha: string
    area: string
  }>({
    productoId: "",
    proveedorId: "",
    cantidad: 1,
    precioUnitario: 0,
    fecha: new Date().toISOString().split("T")[0],
    area: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [gastoTotal, setGastoTotal] = useState(0)
  const [gastoMes, setGastoMes] = useState(0)
  const [productosProveedor, setProductosProveedor] = useState<Array<{ id: string; nombre: string; precio: number }>>(
    [],
  )

  useEffect(() => {
    const currentUserJson = localStorage.getItem("currentUser")
    if (!currentUserJson) {
      router.push("/login")
      return
    }

    const userData = JSON.parse(currentUserJson)
    setCurrentUser(userData.username)
    setIsAdmin(userData.username === "admin")

    // Obtener el área asignada al usuario
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const user = users.find((u: any) => u.username === userData.username)
    if (user && user.area) {
      setUserArea(user.area)
      setFormData((prev) => ({ ...prev, area: user.area }))
    } else if (userData.username === "admin") {
      setUserArea("Todas")
    } else {
      setUserArea("Recepción") // Valor por defecto
      setFormData((prev) => ({ ...prev, area: "Recepción" }))
    }

    setIsLoggedIn(true)
    cargarDatos()
  }, [router])

  useEffect(() => {
    calcularGastos()
  }, [compras, filtroArea])

  const cargarDatos = () => {
    const storedCompras = JSON.parse(localStorage.getItem("compras") || "[]")
    const storedInventario = JSON.parse(localStorage.getItem("inventario") || "[]")
    const storedProveedores = JSON.parse(localStorage.getItem("proveedores") || "[]")

    setCompras(storedCompras)
    setInventario(storedInventario)
    setProveedores(storedProveedores)
  }

  const guardarCompras = (nuevasCompras: Compra[]) => {
    localStorage.setItem("compras", JSON.stringify(nuevasCompras))
    setCompras(nuevasCompras)

    // Registrar la acción
    registrarAccion("Actualización de compras")
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

  const calcularGastos = () => {
    // Filtrar compras por área si es necesario
    const comprasFiltradas = filtroArea
      ? compras.filter((compra) => compra.area === filtroArea)
      : userArea !== "Todas" && !isAdmin
        ? compras.filter((compra) => compra.area === userArea)
        : compras

    // Calcular gasto total
    const total = comprasFiltradas.reduce((sum, compra) => sum + compra.precioTotal, 0)
    setGastoTotal(total)

    // Calcular gasto del mes actual
    const hoy = new Date()
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)

    const gastoMesActual = comprasFiltradas.reduce((sum, compra) => {
      const fechaCompra = new Date(compra.fecha)
      if (fechaCompra >= primerDiaMes && fechaCompra <= ultimoDiaMes) {
        return sum + compra.precioTotal
      }
      return sum
    }, 0)

    setGastoMes(gastoMesActual)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData({ ...formData, [id]: value })
  }

  const handleSelectChange = (value: string, field: string) => {
    setFormData({ ...formData, [field]: value })

    // Si cambia el proveedor, actualizar los productos disponibles
    if (field === "proveedorId") {
      const proveedor = proveedores.find((p) => p.id === value)
      if (proveedor && proveedor.productos) {
        setProductosProveedor(proveedor.productos)
        setFormData((prev) => ({ ...prev, productoId: "", precioUnitario: 0 }))
      } else {
        setProductosProveedor([])
      }
    }

    // Si cambia el producto, actualizar el precio unitario
    if (field === "productoId") {
      if (formData.proveedorId && productosProveedor.length > 0) {
        // Si hay un proveedor seleccionado y tiene productos
        const producto = productosProveedor.find((p) => p.id === value)
        if (producto) {
          setFormData((prev) => ({ ...prev, precioUnitario: producto.precio }))
        }
      } else {
        // Si no hay proveedor seleccionado, usar el precio del inventario
        const producto = inventario.find((item) => item.id === value)
        if (producto) {
          setFormData((prev) => ({ ...prev, precioUnitario: Number.parseFloat(producto.precio) || 0 }))
        }
      }
    }
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const value = Number.parseFloat(e.target.value) || 0
    setFormData({ ...formData, [field]: value })
  }

  const resetForm = () => {
    setFormData({
      productoId: "",
      proveedorId: "",
      cantidad: 1,
      precioUnitario: 0,
      fecha: new Date().toISOString().split("T")[0],
      area: userArea !== "Todas" ? userArea : "",
    })
    setProductosProveedor([])
    setError("")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.productoId || formData.cantidad <= 0 || !formData.area) {
      setError("Debe seleccionar un producto, especificar una cantidad válida y un área")
      return
    }

    const producto = inventario.find((item) => item.id === formData.productoId)
    if (!producto) {
      setError("Producto no encontrado")
      return
    }

    // Verificar si se excede el stock máximo
    if (producto.stockMaximo && producto.cantidad + formData.cantidad > producto.stockMaximo) {
      setError(`No se puede superar el stock máximo (${producto.stockMaximo}) para ${producto.producto}`)
      return
    }

    const precioTotal = formData.cantidad * formData.precioUnitario

    // Obtener el nombre del proveedor
    let nombreProveedor = ""
    if (formData.proveedorId) {
      const proveedor = proveedores.find((p) => p.id === formData.proveedorId)
      if (proveedor) {
        nombreProveedor = proveedor.nombre
      }
    } else {
      nombreProveedor = producto.proveedor || "No especificado"
    }

    const nuevaCompra: Compra = {
      id: Date.now().toString(),
      fecha: formData.fecha,
      producto: producto.producto,
      productoId: producto.id,
      cantidad: formData.cantidad,
      precioUnitario: formData.precioUnitario,
      precioTotal: precioTotal,
      proveedor: nombreProveedor,
      area: formData.area,
      usuario: currentUser,
    }

    const nuevasCompras = [...compras, nuevaCompra]
    guardarCompras(nuevasCompras)

    // Actualizar el inventario (aumentar la cantidad)
    const nuevoInventario = inventario.map((item) => {
      if (item.id === formData.productoId) {
        return {
          ...item,
          cantidad: item.cantidad + formData.cantidad,
          proveedor: nombreProveedor || item.proveedor,
        }
      }
      return item
    })

    localStorage.setItem("inventario", JSON.stringify(nuevoInventario))
    setInventario(nuevoInventario)

    // Si hay un proveedor seleccionado, actualizar la fecha de última compra
    if (formData.proveedorId) {
      const nuevosProveedores = proveedores.map((p) => {
        if (p.id === formData.proveedorId) {
          const productosActualizados = p.productos ? [...p.productos] : []
          const productoIndex = productosActualizados.findIndex((prod) => prod.id === formData.productoId)

          if (productoIndex >= 0) {
            productosActualizados[productoIndex] = {
              ...productosActualizados[productoIndex],
              ultimaCompra: formData.fecha,
            }
          } else if (producto) {
            productosActualizados.push({
              id: producto.id,
              nombre: producto.producto,
              precio: formData.precioUnitario,
              ultimaCompra: formData.fecha,
            })
          }

          return {
            ...p,
            productos: productosActualizados,
          }
        }
        return p
      })

      localStorage.setItem("proveedores", JSON.stringify(nuevosProveedores))
      setProveedores(nuevosProveedores)
    }

    setShowForm(false)
    resetForm()
    setSuccess("Compra registrada correctamente")
    setTimeout(() => setSuccess(""), 3000)

    // Registrar la acción específica
    registrarAccion(
      "Registro de compra",
      `Producto: ${producto.producto}, Cantidad: ${formData.cantidad}, Área: ${formData.area}`,
    )
  }

  const handleDelete = (id: string) => {
    const compra = compras.find((c) => c.id === id)

    // Verificar permisos: solo admin o usuario del área puede eliminar
    if (!isAdmin && compra && compra.area !== userArea && userArea !== "Recepción") {
      setError("No tiene permisos para eliminar esta compra")
      return
    }

    setCompraAEliminar(id)
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (compraAEliminar) {
      const compraEliminada = compras.find((item) => item.id === compraAEliminar)
      const nuevasCompras = compras.filter((item) => item.id !== compraAEliminar)
      guardarCompras(nuevasCompras)

      // Si se encuentra la compra y el producto, actualizar el inventario
      if (compraEliminada) {
        const productoEnInventario = inventario.find((item) => item.id === compraEliminada.productoId)

        if (productoEnInventario) {
          const nuevoInventario = inventario.map((item) => {
            if (item.id === compraEliminada.productoId) {
              return {
                ...item,
                cantidad: Math.max(0, item.cantidad - compraEliminada.cantidad),
              }
            }
            return item
          })

          localStorage.setItem("inventario", JSON.stringify(nuevoInventario))
          setInventario(nuevoInventario)
        }

        // Registrar la acción
        registrarAccion(
          "Eliminación de compra",
          `Producto: ${compraEliminada.producto}, Cantidad: ${compraEliminada.cantidad}, Área: ${compraEliminada.area}`,
        )
      }

      setShowDeleteDialog(false)
      setCompraAEliminar(null)
      setSuccess("Compra eliminada correctamente")
      setTimeout(() => setSuccess(""), 3000)
    }
  }

  const filtrarCompras = () => {
    return compras
      .filter((item) => {
        // Filtros básicos
        const matchFecha = !filtroFecha || item.fecha === filtroFecha
        const matchProducto = !filtroProducto || item.producto.toLowerCase().includes(filtroProducto.toLowerCase())
        const matchProveedor = !filtroProveedor || item.proveedor.toLowerCase().includes(filtroProveedor.toLowerCase())

        // Filtro por área
        const matchArea = !filtroArea
          ? userArea === "Todas" || isAdmin
            ? true
            : item.area === userArea
          : item.area === filtroArea

        return matchFecha && matchProducto && matchProveedor && matchArea
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  }

  const exportarPDF = () => {
    const doc = new jsPDF()

    // Título
    doc.setFontSize(18)
    doc.text("Registro de Compras", 14, 22)

    // Fecha de generación
    doc.setFontSize(11)
    doc.text(`Generado: ${new Date().toLocaleDateString("es-ES")}`, 14, 30)

    // Filtros aplicados
    let filtrosTexto = "Filtros aplicados: "
    if (filtroFecha) filtrosTexto += `Fecha: ${filtroFecha}, `
    if (filtroProducto) filtrosTexto += `Producto: ${filtroProducto}, `
    if (filtroProveedor) filtrosTexto += `Proveedor: ${filtroProveedor}, `
    if (filtroArea) filtrosTexto += `Área: ${filtroArea}, `

    if (filtrosTexto !== "Filtros aplicados: ") {
      doc.text(filtrosTexto.slice(0, -2), 14, 38)
    }

    // Resumen financiero
    doc.text(`Gasto Total: $${gastoTotal.toLocaleString()}`, 14, 46)
    doc.text(`Gasto del Mes: $${gastoMes.toLocaleString()}`, 14, 54)

    // Tabla
    const comprasData = filtrarCompras().map((compra) => [
      compra.fecha,
      compra.producto,
      compra.cantidad.toString(),
      `$${compra.precioUnitario.toLocaleString()}`,
      `$${compra.precioTotal.toLocaleString()}`,
      compra.proveedor,
      compra.area,
    ])

    // @ts-ignore - jspdf-autotable types are not included
    doc.autoTable({
      startY: 62,
      head: [["Fecha", "Producto", "Cantidad", "Precio Unit.", "Total", "Proveedor", "Área"]],
      body: comprasData,
      theme: "striped",
      headStyles: {
        fillColor: [0, 150, 214], // Color dental-blue
        textColor: [255, 255, 255],
      },
      styles: {
        fontSize: 10,
      },
    })

    doc.save("registro-compras.pdf")
  }

  return (
    <div className="container mx-auto p-4">
      {isLoggedIn ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Registro de Compras {isAdmin && "(Admin)"}</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/")}>
                Volver al Inicio
              </Button>
              <Button onClick={exportarPDF}>
                <FileDown className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
              <Button
                className="bg-dental-blue hover:bg-dental-blue/90"
                onClick={() => {
                  resetForm()
                  setShowForm(true)
                }}
              >
                Registrar Nueva Compra
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="border-t-4 border-t-dental-blue">
              <CardHeader className="bg-blue-50 dark:bg-blue-950/30 pb-2">
                <CardTitle className="text-lg text-dental-blue">Gasto Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">${gastoTotal.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-dental-green">
              <CardHeader className="bg-green-50 dark:bg-green-950/30 pb-2">
                <CardTitle className="text-lg text-dental-green">Gasto del Mes Actual</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">${gastoMes.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="filtroProducto">Buscar por Producto</Label>
                  <Input
                    id="filtroProducto"
                    placeholder="Buscar por nombre de producto"
                    value={filtroProducto}
                    onChange={(e) => setFiltroProducto(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="filtroProveedor">Buscar por Proveedor</Label>
                  <Input
                    id="filtroProveedor"
                    placeholder="Buscar por nombre de proveedor"
                    value={filtroProveedor}
                    onChange={(e) => setFiltroProveedor(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="filtroFecha">Filtrar por Fecha</Label>
                  <Input
                    id="filtroFecha"
                    type="date"
                    value={filtroFecha}
                    onChange={(e) => setFiltroFecha(e.target.value)}
                  />
                </div>
                {(isAdmin || userArea === "Recepción" || userArea === "Todas") && (
                  <div>
                    <Label htmlFor="filtroArea">Filtrar por Área</Label>
                    <Select value={filtroArea} onValueChange={setFiltroArea}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las áreas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las áreas</SelectItem>
                        <SelectItem value="Box 1">Box 1</SelectItem>
                        <SelectItem value="Box 2">Box 2</SelectItem>
                        <SelectItem value="Box 3">Box 3</SelectItem>
                        <SelectItem value="Box 4">Box 4</SelectItem>
                        <SelectItem value="Box 5">Box 5</SelectItem>
                        <SelectItem value="Recepción">Recepción</SelectItem>
                        <SelectItem value="Almacenamiento">Almacenamiento</SelectItem>
                        <SelectItem value="Cirugía Maxilofacial">Cirugía Maxilofacial</SelectItem>
                        <SelectItem value="Implantología">Implantología</SelectItem>
                        <SelectItem value="Rehabilitación">Rehabilitación</SelectItem>
                        <SelectItem value="Endodoncia">Endodoncia</SelectItem>
                        <SelectItem value="Periodoncia">Periodoncia</SelectItem>
                        <SelectItem value="Ortodoncia">Ortodoncia</SelectItem>
                        <SelectItem value="Odontopediatría">Odontopediatría</SelectItem>
                        <SelectItem value="Radiología">Radiología</SelectItem>
                        <SelectItem value="Esterilización">Esterilización</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFiltroProducto("")
                    setFiltroProveedor("")
                    setFiltroFecha("")
                    setFiltroArea("")
                  }}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Limpiar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {showForm && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <h2 className="text-xl font-semibold mb-4">Registrar Nueva Compra</h2>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="proveedorId">Proveedor</Label>
                    <Select
                      value={formData.proveedorId}
                      onValueChange={(value) => handleSelectChange(value, "proveedorId")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un Proveedor (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin proveedor específico</SelectItem>
                        {proveedores.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="productoId">Producto *</Label>
                    <Select
                      value={formData.productoId}
                      onValueChange={(value) => handleSelectChange(value, "productoId")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un Producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.proveedorId && productosProveedor.length > 0
                          ? // Mostrar productos del proveedor seleccionado
                            productosProveedor.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.nombre} (${item.precio})
                              </SelectItem>
                            ))
                          : // Mostrar todos los productos del inventario
                            inventario.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.producto} ({item.categoria})
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="cantidad">Cantidad *</Label>
                    <Input
                      id="cantidad"
                      type="number"
                      min="1"
                      value={formData.cantidad}
                      onChange={(e) => handleNumberChange(e, "cantidad")}
                      placeholder="Cantidad"
                    />
                  </div>

                  <div>
                    <Label htmlFor="precioUnitario">Precio Unitario *</Label>
                    <Input
                      id="precioUnitario"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.precioUnitario}
                      onChange={(e) => handleNumberChange(e, "precioUnitario")}
                      placeholder="Precio unitario"
                    />
                  </div>

                  <div>
                    <Label htmlFor="fecha">Fecha de Compra</Label>
                    <Input id="fecha" type="date" value={formData.fecha} onChange={handleInputChange} />
                  </div>

                  <div>
                    <Label htmlFor="area">Área *</Label>
                    <Select
                      value={formData.area}
                      onValueChange={(value) => handleSelectChange(value, "area")}
                      disabled={!isAdmin && userArea !== "Recepción" && userArea !== "Todas"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un Área" />
                      </SelectTrigger>
                      <SelectContent>
                        {isAdmin || userArea === "Recepción" || userArea === "Todas" ? (
                          // Admin o recepción puede seleccionar cualquier área
                          <>
                            <SelectItem value="Box 1">Box 1</SelectItem>
                            <SelectItem value="Box 2">Box 2</SelectItem>
                            <SelectItem value="Box 3">Box 3</SelectItem>
                            <SelectItem value="Box 4">Box 4</SelectItem>
                            <SelectItem value="Box 5">Box 5</SelectItem>
                            <SelectItem value="Recepción">Recepción</SelectItem>
                            <SelectItem value="Almacenamiento">Almacenamiento</SelectItem>
                            <SelectItem value="Cirugía Maxilofacial">Cirugía Maxilofacial</SelectItem>
                            <SelectItem value="Implantología">Implantología</SelectItem>
                            <SelectItem value="Rehabilitación">Rehabilitación</SelectItem>
                            <SelectItem value="Endodoncia">Endodoncia</SelectItem>
                            <SelectItem value="Periodoncia">Periodoncia</SelectItem>
                            <SelectItem value="Ortodoncia">Ortodoncia</SelectItem>
                            <SelectItem value="Odontopediatría">Odontopediatría</SelectItem>
                            <SelectItem value="Radiología">Radiología</SelectItem>
                            <SelectItem value="Esterilización">Esterilización</SelectItem>
                          </>
                        ) : (
                          // Usuario normal solo puede seleccionar su área
                          <SelectItem value={userArea}>{userArea}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-2 mt-4">
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
                    <Button type="submit">Registrar Compra</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio Unitario</TableHead>
                      <TableHead>Precio Total</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Área</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtrarCompras().length > 0 ? (
                      filtrarCompras().map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {item.fecha}
                            </div>
                          </TableCell>
                          <TableCell>{item.producto}</TableCell>
                          <TableCell>{item.cantidad}</TableCell>
                          <TableCell>${item.precioUnitario.toLocaleString()}</TableCell>
                          <TableCell className="font-medium">${item.precioTotal.toLocaleString()}</TableCell>
                          <TableCell>{item.proveedor}</TableCell>
                          <TableCell>{item.area}</TableCell>
                          <TableCell>{item.usuario}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="icon" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-4">
                          No hay compras registradas
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar eliminación</DialogTitle>
              </DialogHeader>
              <p>¿Está seguro de que desea eliminar este registro de compra?</p>
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
