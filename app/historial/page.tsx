"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, User, FileDown, Filter } from "lucide-react"
import Link from "next/link"
import { jsPDF } from "jspdf"
import "jspdf-autotable"

interface LogEntry {
  fecha: string
  usuario: string
  accion: string
  detalles?: string
}

export default function Historial() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filtroUsuario, setFiltroUsuario] = useState<string>("")
  const [filtroAccion, setFiltroAccion] = useState<string>("")
  const [filtroFechaDesde, setFiltroFechaDesde] = useState<string>("")
  const [filtroFechaHasta, setFiltroFechaHasta] = useState<string>("")
  const [usuarios, setUsuarios] = useState<string[]>([])
  const [tiposAccion, setTiposAccion] = useState<string[]>([])

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser")
    if (!currentUser) {
      router.push("/login")
      return
    }

    const userData = JSON.parse(currentUser)
    setIsAdmin(userData.username === "admin")

    setIsLoggedIn(true)
    cargarLogs()
  }, [router])

  useEffect(() => {
    if (logs.length > 0) {
      // Extraer usuarios únicos
      const uniqueUsuarios = Array.from(new Set(logs.map((log) => log.usuario)))
      setUsuarios(uniqueUsuarios)

      // Extraer tipos de acción únicos
      const uniqueAcciones = Array.from(
        new Set(
          logs.map((log) => {
            const accionBase = log.accion.split(" ")[0]
            return accionBase
          }),
        ),
      )
      setTiposAccion(uniqueAcciones)
    }
  }, [logs])

  const cargarLogs = () => {
    const storedLogs = JSON.parse(localStorage.getItem("systemLogs") || "[]")

    // Generar algunos logs de ejemplo si no hay suficientes
    if (storedLogs.length < 5) {
      const ejemploLogs = generarLogsEjemplo()
      localStorage.setItem("systemLogs", JSON.stringify([...storedLogs, ...ejemploLogs]))
      setLogs([...storedLogs, ...ejemploLogs])
    } else {
      setLogs(storedLogs)
    }
  }

  const generarLogsEjemplo = (): LogEntry[] => {
    const usuarios = ["admin", "usuario1", "usuario2"]
    const acciones = [
      "Actualización de inventario",
      "Registro de compra",
      "Eliminación de producto",
      "Cambio de cantidad",
      "Actualización de proveedor",
    ]
    const areas = ["Box 1", "Box 2", "Box 3", "Almacenamiento", "Recepción"]

    const logs: LogEntry[] = []

    // Generar 20 logs de ejemplo
    for (let i = 0; i < 20; i++) {
      const fechaAleatoria = new Date()
      fechaAleatoria.setDate(fechaAleatoria.getDate() - Math.floor(Math.random() * 30))

      const usuario = usuarios[Math.floor(Math.random() * usuarios.length)]
      const accion = acciones[Math.floor(Math.random() * acciones.length)]
      const area = areas[Math.floor(Math.random() * areas.length)]

      logs.push({
        fecha: fechaAleatoria.toISOString(),
        usuario,
        accion,
        detalles: `Realizado en ${area}`,
      })
    }

    return logs
  }

  const filtrarLogs = () => {
    return logs
      .filter((log) => {
        const matchUsuario = !filtroUsuario || log.usuario === filtroUsuario

        const matchAccion = !filtroAccion || log.accion.toLowerCase().includes(filtroAccion.toLowerCase())

        let matchFechaDesde = true
        if (filtroFechaDesde) {
          const fechaLog = new Date(log.fecha)
          const fechaDesde = new Date(filtroFechaDesde)
          fechaDesde.setHours(0, 0, 0, 0)
          matchFechaDesde = fechaLog >= fechaDesde
        }

        let matchFechaHasta = true
        if (filtroFechaHasta) {
          const fechaLog = new Date(log.fecha)
          const fechaHasta = new Date(filtroFechaHasta)
          fechaHasta.setHours(23, 59, 59, 999)
          matchFechaHasta = fechaLog <= fechaHasta
        }

        return matchUsuario && matchAccion && matchFechaDesde && matchFechaHasta
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
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

  const exportarPDF = () => {
    const doc = new jsPDF()

    // Título
    doc.setFontSize(18)
    doc.text("Historial de Movimientos", 14, 22)

    // Fecha de generación
    doc.setFontSize(11)
    doc.text(`Generado: ${new Date().toLocaleDateString("es-ES")}`, 14, 30)

    // Filtros aplicados
    let filtrosTexto = "Filtros aplicados: "
    if (filtroUsuario) filtrosTexto += `Usuario: ${filtroUsuario}, `
    if (filtroAccion) filtrosTexto += `Acción: ${filtroAccion}, `
    if (filtroFechaDesde) filtrosTexto += `Desde: ${filtroFechaDesde}, `
    if (filtroFechaHasta) filtrosTexto += `Hasta: ${filtroFechaHasta}, `

    if (filtrosTexto !== "Filtros aplicados: ") {
      doc.text(filtrosTexto.slice(0, -2), 14, 38)
    }

    // Tabla
    const logsData = filtrarLogs().map((log) => [formatFecha(log.fecha), log.usuario, log.accion, log.detalles || ""])

    // @ts-ignore - jspdf-autotable types are not included
    doc.autoTable({
      startY: filtrosTexto !== "Filtros aplicados: " ? 45 : 38,
      head: [["Fecha", "Usuario", "Acción", "Detalles"]],
      body: logsData,
      theme: "striped",
      headStyles: {
        fillColor: [0, 150, 214], // Color dental-blue
        textColor: [255, 255, 255],
      },
      styles: {
        fontSize: 10,
      },
    })

    doc.save("historial-movimientos.pdf")
  }

  return (
    <div className="container mx-auto p-4">
      {isLoggedIn ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Historial de Movimientos</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/")}>
                Volver al Inicio
              </Button>
              <Button onClick={exportarPDF}>
                <FileDown className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="filtroUsuario">Usuario</Label>
                  <Select value={filtroUsuario} onValueChange={setFiltroUsuario}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los usuarios" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los usuarios</SelectItem>
                      {usuarios.map((usuario) => (
                        <SelectItem key={usuario} value={usuario}>
                          {usuario}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filtroAccion">Tipo de Acción</Label>
                  <Select value={filtroAccion} onValueChange={setFiltroAccion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las acciones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las acciones</SelectItem>
                      {tiposAccion.map((accion) => (
                        <SelectItem key={accion} value={accion}>
                          {accion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filtroFechaDesde">Desde</Label>
                  <Input
                    id="filtroFechaDesde"
                    type="date"
                    value={filtroFechaDesde}
                    onChange={(e) => setFiltroFechaDesde(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="filtroFechaHasta">Hasta</Label>
                  <Input
                    id="filtroFechaHasta"
                    type="date"
                    value={filtroFechaHasta}
                    onChange={(e) => setFiltroFechaHasta(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFiltroUsuario("")
                    setFiltroAccion("")
                    setFiltroFechaDesde("")
                    setFiltroFechaHasta("")
                  }}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Limpiar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registro de Actividades</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrarLogs().length > 0 ? (
                    filtrarLogs().map((log, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatFecha(log.fecha)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {log.usuario}
                          </div>
                        </TableCell>
                        <TableCell>{log.accion}</TableCell>
                        <TableCell>{log.detalles || "-"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        No hay registros que coincidan con los filtros
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
