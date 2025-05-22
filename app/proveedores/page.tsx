"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Trash2, Edit, Star, StarHalf, Upload, FileText } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
}

export default function Proveedores() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [filtroTexto, setFiltroTexto] = useState("")
  const [filtroCalificacion, setFiltroCalificacion] = useState<string>("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [proveedorAEliminar, setProveedorAEliminar] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showDocumentForm, setShowDocumentForm] = useState(false)
  const [currentProveedorId, setCurrentProveedorId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Proveedor>>({
    id: "",
    nombre: "",
    contacto: "",
    telefono: "",
    email: "",
    direccion: "",
    condicionesPago: "",
    calificacion: 5,
    observaciones: "",
    documentos: [],
  })
  const [documentFormData, setDocumentFormData] = useState({
    nombre: "",
    tipo: "",
    fecha: new Date().toISOString().split("T")[0],
    url: "",
  })
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser")
    if (!currentUser) {
      router.push("/login")
      return
    }

    const userData = JSON.parse(currentUser)
    // Verificar si el usuario es admin
    setIsAdmin(userData.username === "admin")

    setIsLoggedIn(true)
    cargarProveedores()
  }, [router])

  const cargarProveedores = () => {
    const storedProveedores = JSON.parse(localStorage.getItem("proveedores") || "[]")
    setProveedores(storedProveedores)
  }

  const guardarProveedores = (nuevosProveedores: Proveedor[]) => {
    localStorage.setItem("proveedores", JSON.stringify(nuevosProveedores))
    setProveedores(nuevosProveedores)

    // Registrar la acción en el log
    registrarAccion("Actualización de proveedores")
  }

  const registrarAccion = (accion: string) => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
    const logs = JSON.parse(localStorage.getItem("systemLogs") || "[]")

    logs.push({
      fecha: new Date().toISOString(),
      usuario: currentUser.username || "Desconocido",
      accion: accion,
    })

    localStorage.setItem("systemLogs", JSON.stringify(logs))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData({ ...formData, [id]: value })
  }

  const handleDocumentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setDocumentFormData({ ...documentFormData, [id]: value })
  }

  const handleCalificacionChange = (value: string) => {
    setFormData({ ...formData, calificacion: Number.parseInt(value) })
  }

  const resetForm = () => {
    setFormData({
      id: "",
      nombre: "",
      contacto: "",
      telefono: "",
      email: "",
      direccion: "",
      condicionesPago: "",
      calificacion: 5,
      observaciones: "",
      documentos: [],
    })
    setIsEditing(false)
    setError("")
  }

  const resetDocumentForm = () => {
    setDocumentFormData({
      nombre: "",
      tipo: "",
      fecha: new Date().toISOString().split("T")[0],
      url: "",
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.nombre || !formData.contacto || !formData.telefono) {
      setError("Los campos Nombre, Contacto y Teléfono son obligatorios")
      return
    }

    const nuevoProveedor: Proveedor = {
      id: isEditing ? formData.id! : Date.now().toString(),
      nombre: formData.nombre!,
      contacto: formData.contacto!,
      telefono: formData.telefono!,
      email: formData.email || "",
      direccion: formData.direccion || "",
      condicionesPago: formData.condicionesPago || "",
      calificacion: formData.calificacion || 5,
      observaciones: formData.observaciones || "",
      documentos: formData.documentos || [],
    }

    let nuevosProveedores: Proveedor[]

    if (isEditing) {
      nuevosProveedores = proveedores.map((item) => (item.id === nuevoProveedor.id ? nuevoProveedor : item))
    } else {
      nuevosProveedores = [...proveedores, nuevoProveedor]
    }

    guardarProveedores(nuevosProveedores)
    setShowForm(false)
    resetForm()
  }

  const handleDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!documentFormData.nombre || !documentFormData.tipo) {
      setError("El nombre y tipo de documento son obligatorios")
      return
    }

    const proveedor = proveedores.find((p) => p.id === currentProveedorId)
    if (!proveedor) return

    const nuevoDocumento = {
      nombre: documentFormData.nombre,
      tipo: documentFormData.tipo,
      fecha: documentFormData.fecha,
      url: documentFormData.url || "#",
    }

    const documentosActualizados = [...proveedor.documentos, nuevoDocumento]
    const proveedorActualizado = { ...proveedor, documentos: documentosActualizados }

    const nuevosProveedores = proveedores.map((p) => (p.id === currentProveedorId ? proveedorActualizado : p))

    guardarProveedores(nuevosProveedores)
    setShowDocumentForm(false)
    resetDocumentForm()
  }

  const handleEdit = (proveedor: Proveedor) => {
    setFormData(proveedor)
    setIsEditing(true)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (!isAdmin) {
      setError("Solo el administrador puede eliminar proveedores")
      return
    }

    setProveedorAEliminar(id)
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (proveedorAEliminar) {
      const nuevosProveedores = proveedores.filter((item) => item.id !== proveedorAEliminar)
      guardarProveedores(nuevosProveedores)
      setShowDeleteDialog(false)
      setProveedorAEliminar(null)

      registrarAccion("Eliminación de proveedor")
    }
  }

  const filtrarProveedores = () => {
    return proveedores.filter((item) => {
      const matchTexto =
        item.nombre.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        item.contacto.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        item.email.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        item.direccion.toLowerCase().includes(filtroTexto.toLowerCase())

      const matchCalificacion = !filtroCalificacion || item.calificacion === Number.parseInt(filtroCalificacion)

      return matchTexto && matchCalificacion
    })
  }

  const renderCalificacion = (calificacion: number) => {
    const estrellas = []
    for (let i = 1; i <= 5; i++) {
      if (i <= calificacion) {
        estrellas.push(<Star key={i} className="h-4 w-4 fill-dental-yellow text-dental-yellow inline" />)
      } else if (i - 0.5 <= calificacion) {
        estrellas.push(<StarHalf key={i} className="h-4 w-4 fill-dental-yellow text-dental-yellow inline" />)
      } else {
        estrellas.push(<Star key={i} className="h-4 w-4 text-gray-300 inline" />)
      }
    }
    return <div>{estrellas}</div>
  }

  return (
    <div className="container mx-auto p-4">
      {isLoggedIn ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Gestión de Proveedores</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/")}>
                Volver al Inicio
              </Button>
              <Button
                onClick={() => {
                  resetForm()
                  setShowForm(true)
                }}
              >
                Agregar Proveedor
              </Button>
            </div>
          </div>

          {error && (
            <Alert className="mb-4 bg-red-50 text-dental-red border-dental-red/20 dark:bg-red-950/30">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="filtroTexto">Buscar</Label>
                  <Input
                    id="filtroTexto"
                    placeholder="Buscar por nombre, contacto, email..."
                    value={filtroTexto}
                    onChange={(e) => setFiltroTexto(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="filtroCalificacion">Filtrar por Calificación</Label>
                  <Select value={filtroCalificacion} onValueChange={(value) => setFiltroCalificacion(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las calificaciones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="5">5 estrellas</SelectItem>
                      <SelectItem value="4">4 estrellas</SelectItem>
                      <SelectItem value="3">3 estrellas</SelectItem>
                      <SelectItem value="2">2 estrellas</SelectItem>
                      <SelectItem value="1">1 estrella</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {showForm && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <h2 className="text-xl font-semibold mb-4">
                  {isEditing ? "Editar Proveedor" : "Agregar Nuevo Proveedor"}
                </h2>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      placeholder="Nombre del proveedor"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contacto">Persona de Contacto *</Label>
                    <Input
                      id="contacto"
                      value={formData.contacto}
                      onChange={handleInputChange}
                      placeholder="Nombre del contacto"
                    />
                  </div>

                  <div>
                    <Label htmlFor="telefono">Teléfono *</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      placeholder="Teléfono de contacto"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Email de contacto"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="direccion">Dirección</Label>
                    <Input
                      id="direccion"
                      value={formData.direccion}
                      onChange={handleInputChange}
                      placeholder="Dirección del proveedor"
                    />
                  </div>

                  <div>
                    <Label htmlFor="condicionesPago">Condiciones de Pago</Label>
                    <Input
                      id="condicionesPago"
                      value={formData.condicionesPago}
                      onChange={handleInputChange}
                      placeholder="Ej: 30 días, contado, etc."
                    />
                  </div>

                  <div>
                    <Label htmlFor="calificacion">Calificación</Label>
                    <Select value={formData.calificacion?.toString()} onValueChange={handleCalificacionChange}>
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
                      value={formData.observaciones}
                      onChange={handleInputChange}
                      placeholder="Observaciones adicionales"
                      rows={3}
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-2 mt-4">
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
                    <Button type="submit">{isEditing ? "Actualizar Proveedor" : "Agregar Proveedor"}</Button>
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
                      <TableHead>Nombre</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Condiciones de Pago</TableHead>
                      <TableHead>Calificación</TableHead>
                      <TableHead>Documentos</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtrarProveedores().length > 0 ? (
                      filtrarProveedores().map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.nombre}</TableCell>
                          <TableCell>{item.contacto}</TableCell>
                          <TableCell>{item.telefono}</TableCell>
                          <TableCell>{item.email}</TableCell>
                          <TableCell>{item.condicionesPago}</TableCell>
                          <TableCell>{renderCalificacion(item.calificacion)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{item.documentos?.length || 0}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCurrentProveedorId(item.id)
                                  setShowDocumentForm(true)
                                }}
                              >
                                <Upload className="h-4 w-4 mr-1" />
                                Añadir
                              </Button>
                              {item.documentos?.length > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/proveedores/documentos/${item.id}`)}
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  Ver
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="icon" onClick={() => handleEdit(item)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDelete(item.id)}
                                disabled={!isAdmin}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          No hay proveedores registrados
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
              <p>¿Está seguro de que desea eliminar este proveedor?</p>
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
