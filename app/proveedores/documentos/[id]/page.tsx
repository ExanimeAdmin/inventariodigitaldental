"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Download, ArrowLeft, Trash2 } from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface Documento {
  nombre: string
  tipo: string
  fecha: string
  url: string
}

interface Proveedor {
  id: string
  nombre: string
  documentos: Documento[]
}

export default function DocumentosProveedor() {
  const router = useRouter()
  const params = useParams()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [proveedor, setProveedor] = useState<Proveedor | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [documentoAEliminar, setDocumentoAEliminar] = useState<number | null>(null)

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser")
    if (!currentUser) {
      router.push("/login")
      return
    }

    const userData = JSON.parse(currentUser)
    setIsAdmin(userData.username === "admin")

    setIsLoggedIn(true)
    cargarProveedor()
  }, [router, params])

  const cargarProveedor = () => {
    const proveedores = JSON.parse(localStorage.getItem("proveedores") || "[]")
    const proveedorEncontrado = proveedores.find((p: Proveedor) => p.id === params.id)

    if (proveedorEncontrado) {
      setProveedor(proveedorEncontrado)
    } else {
      router.push("/proveedores")
    }
  }

  const handleDelete = (index: number) => {
    if (!isAdmin) {
      return
    }

    setDocumentoAEliminar(index)
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (documentoAEliminar === null || !proveedor) return

    const proveedores = JSON.parse(localStorage.getItem("proveedores") || "[]")
    const proveedorIndex = proveedores.findIndex((p: Proveedor) => p.id === proveedor.id)

    if (proveedorIndex !== -1) {
      const documentosActualizados = [...proveedor.documentos]
      documentosActualizados.splice(documentoAEliminar, 1)

      const proveedorActualizado = {
        ...proveedor,
        documentos: documentosActualizados,
      }

      proveedores[proveedorIndex] = proveedorActualizado
      localStorage.setItem("proveedores", JSON.stringify(proveedores))

      setProveedor(proveedorActualizado)
      setShowDeleteDialog(false)
      setDocumentoAEliminar(null)

      // Registrar la acción
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
      const logs = JSON.parse(localStorage.getItem("systemLogs") || "[]")

      logs.push({
        fecha: new Date().toISOString(),
        usuario: currentUser.username || "Desconocido",
        accion: `Eliminación de documento de proveedor ${proveedor.nombre}`,
      })

      localStorage.setItem("systemLogs", JSON.stringify(logs))
    }
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

  return (
    <div className="container mx-auto p-4">
      {isLoggedIn && proveedor ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => router.push("/proveedores")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">Documentos de {proveedor.nombre}</h1>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Documentos Adjuntos</CardTitle>
            </CardHeader>
            <CardContent>
              {proveedor.documentos && proveedor.documentos.length > 0 ? (
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
                    {proveedor.documentos.map((doc, index) => (
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
                            <Button variant="outline" size="sm" asChild={doc.url !== "#"} disabled={doc.url === "#"}>
                              {doc.url !== "#" ? (
                                <Link href={doc.url} target="_blank">
                                  <Download className="h-4 w-4 mr-1" />
                                  Descargar
                                </Link>
                              ) : (
                                <>
                                  <Download className="h-4 w-4 mr-1" />
                                  Descargar
                                </>
                              )}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(index)} disabled={!isAdmin}>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay documentos adjuntos para este proveedor</p>
                  <Button className="mt-4" onClick={() => router.push("/proveedores")}>
                    Volver a Proveedores
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar eliminación</DialogTitle>
              </DialogHeader>
              <p>¿Está seguro de que desea eliminar este documento?</p>
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
              <p className="mb-4">Cargando información...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
