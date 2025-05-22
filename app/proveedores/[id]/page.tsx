"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Star, StarHalf, FileText, ArrowLeft, Trash2, Edit, Phone, Mail, MapPin, Clock } from "lucide-react"
import Link from "next/link"

interface Proveedor {
  id: string
  nombre: string
  contacto: string
  telefono: string
  email: string
  direccion: string
  condicionesPago: string
  calificacion: number
  observaciones: string
  documentos: Array<{
    nombre: string
    tipo: string
    fecha: string
    url: string
  }>
  productos: Array<{
    id: string
    nombre: string
    precio: number
    ultimaCompra: string
  }>
}

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

export default function PerfilProveedor() {
  const router = useRouter()
  const params = useParams()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [proveedor, setProveedor] = useState<Proveedor | null>(null)
  const [inventario, setInventario] = useState<ProductoInventario[]>([])
  const [showDocumentForm, setShowDocumentForm] = useState(false)
  const [showProductForm, setShowProductForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [documentFormData, setDocumentFormData] = useState({
    nombre: "",
    tipo: "",
    fecha: new Date().toISOString().split("T")[0],
    url: "",
  })
  const [productFormData, setProductFormData] = useState({
    id: "",
    nombre: "",
    precio: 0,
  })
  const [editFormData, setEditFormData] = useState<Partial<Proveedor>>({})
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser")
    if (!currentUser) {
      router.push("/login")
      return
    }

    const userData = JSON.parse(currentUser)
    setIsAdmin(userData.username === "admin")
    setIsLoggedIn(true)
    cargarDatos()
  }, [router, params])

  const cargarDatos = () => {
    const proveedores = JSON.parse(localStorage.getItem("proveedores") || "[]")
    const proveedorEncontrado = proveedores.find((p: Proveedor) => p.id === params.id)

    if (proveedorEncontrado) {
      // Si el proveedor no tiene la propiedad productos, añadirla
      if (!proveedorEncontrado.productos) {
        proveedorEncontrado.productos = []
      }

      setProveedor(proveedorEncontrado)
      setEditFormData(proveedorEncontrado)
    } else {
      router.push("/proveedores")
    }

    // Cargar inventario para vincular productos
    const storedInventario = JSON.parse(localStorage.getItem("inventario") || "[]")
    setInventario(storedInventario)
  }

  const guardarProveedor = (proveedorActualizado: Proveedor) => {
    const proveedores = JSON.parse(localStorage.getItem("proveedores") || "[]")
    const index = proveedores.findIndex((p: Proveedor) => p.id === proveedorActualizado.id)

    if (index !== -1) {
      proveedores[index] = proveedorActualizado
      localStorage.setItem("proveedores", JSON.stringify(proveedores))
      setProveedor(proveedorActualizado)

      // Registrar la acción
      registrarAccion(`Actualización de proveedor: ${proveedorActualizado.nombre}`)

      setSuccess("Proveedor actualizado correctamente")
      setTimeout(() => setSuccess(""), 3000)
    }
  }

  const registrarAccion = (accion: string) => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
    const logs = JSON.parse(localStorage.getItem("systemLogs") || "[]")

    logs.push({
      fecha: new Date().toISOString(),
      usuario: currentUser.username || "Desconocido",
      accion: accion,
      detalles: `Proveedor: ${proveedor?.nombre}`,
    })

    localStorage.setItem("systemLogs", JSON.stringify(logs))
  }

  const handleDocumentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setDocumentFormData({ ...documentFormData, [id]: value })
  }

  const handleProductInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target

    if (id === "precio") {
      setProductFormData({ ...productFormData, [id]: Number(value) })
    } else {
      setProductFormData({ ...productFormData, [id]: value })
    }
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setEditFormData({ ...editFormData, [id]: value })
  }

  const handleCalificacionChange = (value: string) => {
    setEditFormData({ ...editFormData, calificacion: Number.parseInt(value) })
  }

  const resetDocumentForm = () => {
    setDocumentFormData({
      nombre: "",
      tipo: "",
      fecha: new Date().toISOString().split("T")[0],
      url: "",
    })
  }

  const resetProductForm = () => {
    setProductFormData({
      id: "",
      nombre: "",
      precio: 0,
    })
  }

  const handleDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!documentFormData.nombre || !documentFormData.tipo) {
      setError("El nombre y tipo de documento son obligatorios")
      return
    }

    if (!proveedor) return

    const nuevoDocumento = {
      nombre: documentFormData.nombre,
      tipo: documentFormData.tipo,
      fecha: documentFormData.fecha,
      url: documentFormData.url || "#",
    }

    const documentosActualizados = [...proveedor.documentos, nuevoDocumento]
    const proveedorActualizado = { ...proveedor, documentos: documentosActualizados }

    guardarProveedor(proveedorActualizado)
    setShowDocumentForm(false)
    resetDocumentForm()
  }

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!productFormData.id) {
      setError("Debe seleccionar un producto")
      return
    }

    if (!proveedor) return

    const productoSeleccionado = inventario.find((item) => item.id === productFormData.id)

    if (!productoSeleccionado) {
      setError("Producto no encontrado")
      return
    }

    // Verificar si el producto ya está vinculado
    const productoExistente = proveedor.productos.find((p) => p.id === productFormData.id)

    if (productoExistente) {
      setError("Este producto ya está vinculado a este proveedor")
      return
    }

    const nuevoProducto = {
      id: productFormData.id,
      nombre: productoSeleccionado.producto,
      precio: productFormData.precio || Number(productoSeleccionado.precio) || 0,
      ultimaCompra: new Date().toISOString().split("T")[0],
    }

    const productosActualizados = [...proveedor.productos, nuevoProducto]
    const proveedorActualizado = { ...proveedor, productos: productosActualizados }

    guardarProveedor(proveedorActualizado)
    setShowProductForm(false)
    resetProductForm()
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!editFormData.nombre || !editFormData.contacto || !editFormData.telefono) {
      setError("Los campos Nombre, Contacto y Teléfono son obligatorios")
      return
    }

    if (!proveedor) return

    const proveedorActualizado = {
      ...proveedor,
      nombre: editFormData.nombre!,
      contacto: editFormData.contacto!,
      telefono: editFormData.telefono!,
      email: editFormData.email || "",
      direccion: editFormData.direccion || "",
      condicionesPago: editFormData.condicionesPago || "",
      calificacion: editFormData.calificacion || 5,
      observaciones: editFormData.observaciones || "",
    }

    guardarProveedor(proveedorActualizado)
    setShowEditForm(false)
  }

  const eliminarProducto = (id: string) => {
    if (!proveedor) return

    const productosActualizados = proveedor.productos.filter((p) => p.id !== id)
    const proveedorActualizado = { ...proveedor, productos: productosActualizados }

    guardarProveedor(proveedorActualizado)
  }

  const eliminarDocumento = (index: number) => {
    if (!proveedor) return

    const documentosActualizados = [...proveedor.documentos]
    documentosActualizados.splice(index, 1)

    const proveedorActualizado = { ...proveedor, documentos: documentosActualizados }
    guardarProveedor(proveedorActualizado)
  }

  const renderCalificacion = (calificacion: number) => {
    const estrellas = []
    for (let i = 1; i <= 5; i++) {
      if (i <= calificacion) {
        estrellas.push(<Star key={i} className="h-5 w-5 fill-dental-yellow text-dental-yellow inline" />)
      } else if (i - 0.5 <= calificacion) {
        estrellas.push(<StarHalf key={i} className="h-5 w-5 fill-dental-yellow text-dental-yellow inline" />)
      } else {
        estrellas.push(<Star key={i} className="h-5 w-5 text-gray-300 inline" />)
      }
    }
    return <div>{estrellas}</div>
  }

  const getTipoIcono = (tipo: string) => {
    switch (tipo) {
      case "Factura":
        return "text-dental-blue"
      case "Certificado":
        return "text-dental-green"
      case "Manual":
        return "text-dental-purple"
      case "Garantía":
        return "text-dental-yellow"
      default:
        return "text-gray-500"
    }
  }

  if (!proveedor) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <p className="mb-4">Cargando información del proveedor...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      {isLoggedIn ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => router.push("/proveedores")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">Perfil de Proveedor</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/")}>
                Volver al Inicio
              </Button>
              {isAdmin && (
                <Button onClick={() => setShowEditForm(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Proveedor
                </Button>
              )}
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-2xl">{proveedor.nombre}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  {renderCalificacion(proveedor.calificacion)}
                  <span className="text-sm text-muted-foreground">({proveedor.calificacion}/5)</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Información de Contacto</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Contacto:</span>
                        <span>{proveedor.contacto}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{proveedor.telefono}</span>
                      </div>
                      {proveedor.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{proveedor.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Detalles Adicionales</h3>
                    <div className="space-y-2">
                      {proveedor.direccion && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                          <span>{proveedor.direccion}</span>
                        </div>
                      )}
                      {proveedor.condicionesPago && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Condiciones de pago: {proveedor.condicionesPago}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {proveedor.observaciones && (
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Observaciones</h3>
                    <p className="whitespace-pre-wrap">{proveedor.observaciones}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button className="w-full" onClick={() => setShowProductForm(true)}>
                    Vincular Producto
                  </Button>
                  <Button className="w-full" onClick={() => setShowDocumentForm(true)}>
                    Añadir Documento
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => router.push("/compras")}>
                    Registrar Compra
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="productos" className="mb-6">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="productos">Productos Vinculados</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
            </TabsList>

            <TabsContent value="productos">
              <Card>
                <CardHeader>
                  <CardTitle>Productos Vinculados</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Última Compra</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proveedor.productos && proveedor.productos.length > 0 ? (
                        proveedor.productos.map((producto) => (
                          <TableRow key={producto.id}>
                            <TableCell className="font-medium">{producto.nombre}</TableCell>
                            <TableCell>${producto.precio.toLocaleString()}</TableCell>
                            <TableCell>{producto.ultimaCompra}</TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" onClick={() => eliminarProducto(producto.id)}>
                                <Trash2 className="h-4 w-4 mr-1" />
                                Eliminar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            No hay productos vinculados a este proveedor
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documentos">
              <Card>
                <CardHeader>
                  <CardTitle>Documentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proveedor.documentos && proveedor.documentos.length > 0 ? (
                        proveedor.documentos.map((doc, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <FileText className={`h-4 w-4 ${getTipoIcono(doc.tipo)}`} />
                                {doc.nombre}
                              </div>
                            </TableCell>
                            <TableCell>{doc.tipo}</TableCell>
                            <TableCell>{doc.fecha}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild={doc.url !== "#"}
                                  disabled={doc.url === "#"}
                                >
                                  {doc.url !== "#" ? (
                                    <Link href={doc.url} target="_blank">
                                      Descargar
                                    </Link>
                                  ) : (
                                    <>Descargar</>
                                  )}
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => eliminarDocumento(index)}>
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Eliminar
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            No hay documentos adjuntos para este proveedor
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Formulario para añadir documento */}
          <Dialog open={showDocumentForm} onOpenChange={setShowDocumentForm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Añadir Documento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleDocumentSubmit}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nombre">Nombre del Documento *</Label>
                    <Input
                      id="nombre"
                      value={documentFormData.nombre}
                      onChange={handleDocumentInputChange}
                      placeholder="Ej: Factura, Certificado, etc."
                    />
                  </div>

                  <div>
                    <Label htmlFor="tipo">Tipo de Documento *</Label>
                    <Select
                      value={documentFormData.tipo}
                      onValueChange={(value) => setDocumentFormData({ ...documentFormData, tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Factura">Factura</SelectItem>
                        <SelectItem value="Certificado">Certificado</SelectItem>
                        <SelectItem value="Manual">Manual</SelectItem>
                        <SelectItem value="Garantía">Garantía</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="fecha">Fecha</Label>
                    <Input id="fecha" type="date" value={documentFormData.fecha} onChange={handleDocumentInputChange} />
                  </div>

                  <div>
                    <Label htmlFor="url">URL del documento (opcional)</Label>
                    <Input
                      id="url"
                      value={documentFormData.url}
                      onChange={handleDocumentInputChange}
                      placeholder="URL o ruta del documento"
                    />
                  </div>

                  <div className="pt-4 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowDocumentForm(false)
                        resetDocumentForm()
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">Guardar Documento</Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Formulario para vincular producto */}
          <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Vincular Producto</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleProductSubmit}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="producto">Producto *</Label>
                    <Select
                      value={productFormData.id}
                      onValueChange={(value) => setProductFormData({ ...productFormData, id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventario
                          .filter((item) => !proveedor.productos.some((p) => p.id === item.id))
                          .map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.producto} ({item.categoria})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="precio">Precio Unitario</Label>
                    <Input
                      id="precio"
                      type="number"
                      min="0"
                      step="0.01"
                      value={productFormData.precio}
                      onChange={handleProductInputChange}
                      placeholder="Precio unitario"
                    />
                  </div>

                  <div className="pt-4 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowProductForm(false)
                        resetProductForm()
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">Vincular Producto</Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Formulario para editar proveedor */}
          <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar Proveedor</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={editFormData.nombre}
                      onChange={handleEditInputChange}
                      placeholder="Nombre del proveedor"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contacto">Persona de Contacto *</Label>
                    <Input
                      id="contacto"
                      value={editFormData.contacto}
                      onChange={handleEditInputChange}
                      placeholder="Nombre del contacto"
                    />
                  </div>

                  <div>
                    <Label htmlFor="telefono">Teléfono *</Label>
                    <Input
                      id="telefono"
                      value={editFormData.telefono}
                      onChange={handleEditInputChange}
                      placeholder="Teléfono de contacto"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editFormData.email}
                      onChange={handleEditInputChange}
                      placeholder="Email de contacto"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="direccion">Dirección</Label>
                    <Input
                      id="direccion"
                      value={editFormData.direccion}
                      onChange={handleEditInputChange}
                      placeholder="Dirección del proveedor"
                    />
                  </div>

                  <div>
                    <Label htmlFor="condicionesPago">Condiciones de Pago</Label>
                    <Input
                      id="condicionesPago"
                      value={editFormData.condicionesPago}
                      onChange={handleEditInputChange}
                      placeholder="Ej: 30 días, contado, etc."
                    />
                  </div>

                  <div>
                    <Label htmlFor="calificacion">Calificación</Label>
                    <Select value={editFormData.calificacion?.toString()} onValueChange={handleCalificacionChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione calificación" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 estrellas - Excelente</SelectItem>
                        <SelectItem value="4">4 estrellas - Muy bueno</SelectItem>
                        <SelectItem value="3">3 estrellas - Bueno</SelectItem>
                        <SelectItem value="2">2 estrellas - Regular</SelectItem>
                        <SelectItem value="1">1 estrella - Malo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                      id="observaciones"
                      value={editFormData.observaciones}
                      onChange={handleEditInputChange}
                      placeholder="Observaciones adicionales"
                      rows={3}
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowEditForm(false)
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">Actualizar Proveedor</Button>
                  </div>
                </div>
              </form>
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
