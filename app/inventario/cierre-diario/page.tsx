"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { FileDown, AlertTriangle, CheckCircle2, ClipboardCheck } from "lucide-react"
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

interface CierreDiario {
  id: string
  fecha: string
  usuario: string
  area: string
  items: Array<{
    id: string
    descripcion: string
    completado: boolean
  }>
  observaciones: string
  completado: boolean
}

export default function CierreDiario() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentUser, setCurrentUser] = useState("")
  const [userArea, setUserArea] = useState("")
  const [inventario, setInventario] = useState<ProductoInventario[]>([])
  const [cierresDiarios, setCierresDiarios] = useState<CierreDiario[]>([])
  const [cierreActual, setCierreActual] = useState<CierreDiario | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [itemsChecklist, setItemsChecklist] = useState<
    Array<{
      id: string
      descripcion: string
      completado: boolean
    }>
  >([])
  const [observaciones, setObservaciones] = useState("")

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
    const storedCierresDiarios = JSON.parse(localStorage.getItem("cierresDiarios") || "[]")

    setInventario(storedInventario)
    setCierresDiarios(storedCierresDiarios)

    // Verificar si ya existe un cierre para hoy y el área del usuario
    const hoy = new Date().toISOString().split("T")[0]
    const cierreHoy = storedCierresDiarios.find(
      (cierre: CierreDiario) => cierre.fecha === hoy && cierre.area === userArea,
    )

    if (cierreHoy) {
      setCierreActual(cierreHoy)
      setItemsChecklist(cierreHoy.items)
      setObservaciones(cierreHoy.observaciones)
    } else {
      // Generar checklist automático
      generarChecklist()
    }
  }

  const generarChecklist = () => {
    const items = [
      {
        id: "stock",
        descripcion: "Stock de productos críticos verificado",
        completado: false,
      },
      {
        id: "vencidos",
        descripcion: "Productos vencidos retirados",
        completado: false,
      },
      {
        id: "limpieza",
        descripcion: "Área de almacenamiento limpia y ordenada",
        completado: false,
      },
      {
        id: "pedidos",
        descripcion: "Pedidos pendientes revisados",
        completado: false,
      },
      {
        id: "devoluciones",
        descripcion: "Devoluciones procesadas",
        completado: false,
      },
    ]

    // Añadir items específicos según el área
    if (
      userArea === "Box 1" ||
      userArea === "Box 2" ||
      userArea === "Box 3" ||
      userArea === "Box 4" ||
      userArea === "Box 5"
    ) {
      items.push({
        id: "equipos",
        descripcion: "Equipos apagados y desinfectados",
        completado: false,
      })
    }

    if (userArea === "Recepción") {
      items.push({
        id: "caja",
        descripcion: "Caja cerrada y cuadrada",
        completado: false,
      })
    }

    setItemsChecklist(items)
  }

  const guardarCierresDiarios = (nuevosCierres: CierreDiario[]) => {
    localStorage.setItem("cierresDiarios", JSON.stringify(nuevosCierres))
    setCierresDiarios(nuevosCierres)

    // Registrar la acción
    registrarAccion("Actualización de cierres diarios")
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

  const handleItemChange = (id: string, checked: boolean) => {
    const nuevosItems = itemsChecklist.map((item) => {
      if (item.id === id) {
        return { ...item, completado: checked }
      }
      return item
    })
    setItemsChecklist(nuevosItems)

    // Si hay un cierre actual, actualizarlo
    if (cierreActual) {
      const nuevoCierre = { ...cierreActual, items: nuevosItems }
      const nuevosCierres = cierresDiarios.map((cierre) => (cierre.id === cierreActual.id ? nuevoCierre : cierre))
      guardarCierresDiarios(nuevosCierres)
      setCierreActual(nuevoCierre)
    }
  }

  const handleSubmit = () => {
    // Verificar que todos los items estén completados
    const todosCompletados = itemsChecklist.every((item) => item.completado)

    if (!todosCompletados) {
      setShowConfirmDialog(true)
      return
    }

    finalizarCierre(true)
  }

  const finalizarCierre = (completado: boolean) => {
    const hoy = new Date().toISOString().split("T")[0]

    if (cierreActual) {
      // Actualizar cierre existente
      const nuevoCierre = {
        ...cierreActual,
        items: itemsChecklist,
        observaciones,
        completado,
      }

      const nuevosCierres = cierresDiarios.map((cierre) => (cierre.id === cierreActual.id ? nuevoCierre : cierre))

      guardarCierresDiarios(nuevosCierres)
      setCierreActual(nuevoCierre)
    } else {
      // Crear nuevo cierre
      const nuevoCierre: CierreDiario = {
        id: Date.now().toString(),
        fecha: hoy,
        usuario: currentUser,
        area: userArea,
        items: itemsChecklist,
        observaciones,
        completado,
      }

      const nuevosCierres = [...cierresDiarios, nuevoCierre]
      guardarCierresDiarios(nuevosCierres)
      setCierreActual(nuevoCierre)
    }

    setShowConfirmDialog(false)
    setSuccess(completado ? "Cierre diario completado correctamente" : "Cierre diario guardado parcialmente")
    setTimeout(() => setSuccess(""), 3000)

    // Registrar la acción
    registrarAccion(
      completado ? "Cierre diario completado" : "Cierre diario parcial",
      `Área: ${userArea}, Fecha: ${hoy}`,
    )
  }

  const exportarPDF = () => {
    if (!cierreActual) return

    const doc = new jsPDF()

    // Título
    doc.setFontSize(18)
    doc.text(`Checklist de Cierre Diario`, 14, 22)

    // Información del cierre
    doc.setFontSize(12)
    doc.text(`Fecha: ${cierreActual.fecha}`, 14, 32)
    doc.text(`Área: ${cierreActual.area}`, 14, 40)
    doc.text(`Usuario: ${cierreActual.usuario}`, 14, 48)
    doc.text(`Estado: ${cierreActual.completado ? "Completado" : "Parcial"}`, 14, 56)

    // Tabla de items
    const itemsData = cierreActual.items.map((item) => [item.descripcion, item.completado ? "✓" : "✗"])

    // @ts-ignore - jspdf-autotable types are not included
    doc.autoTable({
      startY: 65,
      head: [["Tarea", "Completado"]],
      body: itemsData,
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
    const finalY = (doc as any).lastAutoTable.finalY || 120
    if (cierreActual.observaciones) {
      doc.text("Observaciones:", 14, finalY + 10)
      doc.text(cierreActual.observaciones, 14, finalY + 18)
    }

    doc.save(`cierre-diario-${cierreActual.fecha}-${cierreActual.area}.pdf`)
  }

  // Verificar si el usuario tiene acceso a esta página
  if (isLoggedIn && !isAdmin && userArea === "Todas") {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-dental-red mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Acceso Restringido</h2>
            <p className="mb-4">Debe tener un área asignada para acceder a esta página.</p>
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
            <h1 className="text-2xl font-bold">Checklist de Cierre Diario</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/inventario")}>
                Volver al Inventario
              </Button>
              {cierreActual && (
                <Button variant="outline" onClick={exportarPDF}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar PDF
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

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Checklist para {userArea} - {new Date().toLocaleDateString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {itemsChecklist.map((item) => (
                  <div key={item.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={item.id}
                      checked={item.completado}
                      onCheckedChange={(checked) => handleItemChange(item.id, checked === true)}
                      disabled={cierreActual?.completado}
                    />
                    <label
                      htmlFor={item.id}
                      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                        item.completado ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {item.descripcion}
                    </label>
                  </div>
                ))}

                <div className="pt-4">
                  <label htmlFor="observaciones" className="text-sm font-medium mb-2 block">
                    Observaciones
                  </label>
                  <textarea
                    id="observaciones"
                    className="w-full min-h-[100px] p-2 border rounded-md"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Anote cualquier observación o incidencia del día"
                    disabled={cierreActual?.completado}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  {!cierreActual?.completado && (
                    <Button onClick={handleSubmit}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Finalizar Cierre Diario
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Historial de Cierres Diarios</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Área</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Tareas Completadas</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cierresDiarios.length > 0 ? (
                      cierresDiarios
                        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                        .map((cierre) => (
                          <TableRow key={cierre.id}>
                            <TableCell>{cierre.fecha}</TableCell>
                            <TableCell>{cierre.area}</TableCell>
                            <TableCell>{cierre.usuario}</TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  cierre.completado
                                } ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                }`}
                              >
                                {cierre.completado ? "Completado" : "Incompleto"}
                              </span>
                            </TableCell>
                            <TableCell>
                              {cierre.items.filter((item) => item.completado).length} / {cierre.items.length}
                            </TableCell>
                            <TableCell>
                              <Button variant="outline" onClick={() => exportarPDF()}>
                                <FileDown className="h-4 w-4 mr-2" />
                                Exportar PDF
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          No hay cierres diarios registrados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>¿Estás seguro?</DialogTitle>
                <Alert className="mb-4 bg-yellow-50 text-yellow-800 border-yellow-800/20 dark:bg-yellow-950/30">
                  <AlertDescription>
                    No todos los items del checklist han sido completados. ¿Deseas guardar el cierre diario como
                    incompleto?
                  </AlertDescription>
                </Alert>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setShowConfirmDialog(false)}>
                  Cancelar
                </Button>
                <Button type="button" onClick={() => finalizarCierre(false)}>
                  Guardar como Incompleto
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <div>No has iniciado sesión.</div>
      )}
    </div>
  )
}
