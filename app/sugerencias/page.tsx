"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, MessageSquare, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

interface Sugerencia {
  id: string
  tipo: "material" | "proveedor" | "otro"
  titulo: string
  descripcion: string
  usuario: string
  fecha: string
  estado: "pendiente" | "aprobada" | "rechazada"
  comentarios: Array<{
    usuario: string
    texto: string
    fecha: string
  }>
}

export default function Sugerencias() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentUser, setCurrentUser] = useState("")
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([])
  const [filtroTipo, setFiltroTipo] = useState<string>("todos")
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [sugerenciaAEliminar, setSugerenciaAEliminar] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [currentSugerenciaId, setCurrentSugerenciaId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Sugerencia>>({
    tipo: "material",
    titulo: "",
    descripcion: "",
  })
  const [comentario, setComentario] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const userJson = localStorage.getItem("currentUser")
    if (!userJson) {
      router.push("/login")
      return
    }

    const userData = JSON.parse(userJson)
    setIsAdmin(userData.username === "admin")
    setCurrentUser(userData.username)
    setIsLoggedIn(true)
    cargarSugerencias()
  }, [router])

  const cargarSugerencias = () => {
    const storedSugerencias = JSON.parse(localStorage.getItem("sugerencias") || "[]")
    setSugerencias(storedSugerencias)
  }

  const guardarSugerencias = (nuevasSugerencias: Sugerencia[]) => {
    localStorage.setItem("sugerencias", JSON.stringify(nuevasSugerencias))
    setSugerencias(nuevasSugerencias)
    registrarAccion("Actualización de sugerencias")
  }

  const registrarAccion = (accion: string) => {
    const logs = JSON.parse(localStorage.getItem("systemLogs") || "[]")

    logs.push({
      fecha: new Date().toISOString(),
      usuario: currentUser || "Desconocido",
      accion: accion,
    })

    localStorage.setItem("systemLogs", JSON.stringify(logs))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData({ ...formData, [id]: value })
  }

  const handleSelectChange = (value: string, field: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const resetForm = () => {
    setFormData({
      tipo: "material",
      titulo: "",
      descripcion: "",
    })
    setError("")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.titulo || !formData.descripcion) {
      setError("El título y la descripción son obligatorios")
      return
    }

    const nuevaSugerencia: Sugerencia = {
      id: Date.now().toString(),
      tipo: formData.tipo as "material" | "proveedor" | "otro",
      titulo: formData.titulo!,
      descripcion: formData.descripcion!,
      usuario: currentUser,
      fecha: new Date().toISOString(),
      estado: "pendiente",
      comentarios: [],
    }

    const nuevasSugerencias = [...sugerencias, nuevaSugerencia]
    guardarSugerencias(nuevasSugerencias)
    setShowForm(false)
    resetForm()
    setSuccess("Sugerencia enviada correctamente")

    setTimeout(() => {
      setSuccess("")
    }, 3000)
  }

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!comentario.trim()) {
      setError("El comentario no puede estar vacío")
      return
    }

    const nuevoComentario = {
      usuario: currentUser,
      texto: comentario,
      fecha: new Date().toISOString(),
    }

    const nuevasSugerencias = sugerencias.map((sugerencia) => {
      if (sugerencia.id === currentSugerenciaId) {
        return {
          ...sugerencia,
          comentarios: [...sugerencia.comentarios, nuevoComentario],
        }
      }
      return sugerencia
    })

    guardarSugerencias(nuevasSugerencias)
    setShowCommentForm(false)
    setComentario("")
    setCurrentSugerenciaId(null)
  }

  const handleDelete = (id: string) => {
    setSugerenciaAEliminar(id)
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (sugerenciaAEliminar) {
      const nuevasSugerencias = sugerencias.filter((item) => item.id !== sugerenciaAEliminar)
      guardarSugerencias(nuevasSugerencias)
      setShowDeleteDialog(false)
      setSugerenciaAEliminar(null)
    }
  }

  const cambiarEstado = (id: string, estado: "aprobada" | "rechazada" | "pendiente") => {
    if (!isAdmin && estado !== "pendiente") {
      setError("Solo el administrador puede aprobar o rechazar sugerencias")
      return
    }

    const nuevasSugerencias = sugerencias.map((sugerencia) => {
      if (sugerencia.id === id) {
        return {
          ...sugerencia,
          estado,
        }
      }
      return sugerencia
    })

    guardarSugerencias(nuevasSugerencias)
    registrarAccion(`Cambio de estado de sugerencia a ${estado}`)
  }

  const filtrarSugerencias = () => {
    return sugerencias.filter((item) => {
      const matchTipo = filtroTipo === "todos" || item.tipo === filtroTipo
      const matchEstado = filtroEstado === "todos" || item.estado === filtroEstado
      return matchTipo && matchEstado
    })
  }

  const formatFecha = (fechaISO: string) => {
    const fecha = new Date(fechaISO)
    return fecha.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="container mx-auto p-4">
      {isLoggedIn ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Sugerencias del Personal</h1>
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
                Nueva Sugerencia
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
                  <Label htmlFor="filtroTipo">Filtrar por Tipo</Label>
                  <Select value={filtroTipo} onValueChange={(value) => setFiltroTipo(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los tipos</SelectItem>
                      <SelectItem value="material">Material</SelectItem>
                      <SelectItem value="proveedor">Proveedor</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filtroEstado">Filtrar por Estado</Label>
                  <Select value={filtroEstado} onValueChange={(value) => setFiltroEstado(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los estados</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="aprobada">Aprobada</SelectItem>
                      <SelectItem value="rechazada">Rechazada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {showForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Nueva Sugerencia</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="tipo">Tipo de Sugerencia</Label>
                    <Select value={formData.tipo} onValueChange={(value) => handleSelectChange(value, "tipo")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="material">Material</SelectItem>
                        <SelectItem value="proveedor">Proveedor</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="titulo">Título *</Label>
                    <Input
                      id="titulo"
                      value={formData.titulo}
                      onChange={handleInputChange}
                      placeholder="Título de la sugerencia"
                    />
                  </div>

                  <div>
                    <Label htmlFor="descripcion">Descripción *</Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={handleInputChange}
                      placeholder="Describa su sugerencia en detalle"
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
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
                    <Button type="submit">Enviar Sugerencia</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-6">
            {filtrarSugerencias().length > 0 ? (
              filtrarSugerencias().map((sugerencia) => (
                <Card
                  key={sugerencia.id}
                  className={`
                  ${sugerencia.estado === "aprobada" ? "border-l-4 border-l-dental-green" : ""}
                  ${sugerencia.estado === "rechazada" ? "border-l-4 border-l-dental-red" : ""}
                  ${sugerencia.estado === "pendiente" ? "border-l-4 border-l-dental-yellow" : ""}
                `}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{sugerencia.titulo}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {sugerencia.tipo === "material" && "Material"}
                          {sugerencia.tipo === "proveedor" && "Proveedor"}
                          {sugerencia.tipo === "otro" && "Otro"}
                          {" • "}
                          {sugerencia.usuario}
                          {" • "}
                          {formatFecha(sugerencia.fecha)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            sugerencia.estado === "pendiente"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                              : sugerencia.estado === "aprobada"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          }`}
                        >
                          {sugerencia.estado === "pendiente" && "Pendiente"}
                          {sugerencia.estado === "aprobada" && "Aprobada"}
                          {sugerencia.estado === "rechazada" && "Rechazada"}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap mb-4">{sugerencia.descripcion}</p>

                    {sugerencia.comentarios.length > 0 && (
                      <div className="mt-4 border-t pt-4">
                        <h4 className="text-sm font-medium mb-2">Comentarios ({sugerencia.comentarios.length})</h4>
                        <div className="space-y-3">
                          {sugerencia.comentarios.map((comentario, index) => (
                            <div key={index} className="bg-muted/50 p-3 rounded-md">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-sm">{comentario.usuario}</span>
                                <span className="text-xs text-muted-foreground">{formatFecha(comentario.fecha)}</span>
                              </div>
                              <p className="text-sm">{comentario.texto}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 mt-4">
                      {isAdmin && sugerencia.estado === "pendiente" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-dental-green border-dental-green/20 hover:bg-dental-green/10"
                            onClick={() => cambiarEstado(sugerencia.id, "aprobada")}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprobar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-dental-red border-dental-red/20 hover:bg-dental-red/10"
                            onClick={() => cambiarEstado(sugerencia.id, "rechazada")}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentSugerenciaId(sugerencia.id)
                          setShowCommentForm(true)
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Comentar
                      </Button>
                      {(isAdmin || currentUser === sugerencia.usuario) && (
                        <Button variant="outline" size="sm" onClick={() => handleDelete(sugerencia.id)}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No hay sugerencias disponibles</p>
                </CardContent>
              </Card>
            )}
          </div>

          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar eliminación</DialogTitle>
              </DialogHeader>
              <p>¿Está seguro de que desea eliminar esta sugerencia?</p>
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

          <Dialog open={showCommentForm} onOpenChange={setShowCommentForm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Añadir Comentario</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCommentSubmit}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="comentario">Comentario</Label>
                    <Textarea
                      id="comentario"
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      placeholder="Escriba su comentario"
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCommentForm(false)
                        setComentario("")
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">Enviar Comentario</Button>
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
