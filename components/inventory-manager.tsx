"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Search, Plus, FileText, Clock, Bookmark, X, AlertTriangle, Filter } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Importar áreas estandarizadas
import { areas } from "../app/inventario/page"

// Tipos
interface Producto {
  id: string
  nombre: string
  area: string
  categoria: string
  cantidad: number
  stockMinimo: number
  fechaVencimiento: string
  proveedor: string
  precio: number
  ubicacion: string
  lote: string
  guardado: boolean
  clinicaId: string
}

interface Documento {
  id: string
  nombre: string
  fecha: string
  tipo: string
  productoId: string
}

interface Usuario {
  id: string
  nombre: string
  rol: string
  clinicaId: string
}

// Datos de ejemplo para el catálogo
const catalogoProductos = [
  {
    id: "cat1",
    nombre: "Guantes de látex",
    area: "General",
    categoria: "Protección",
    proveedor: "Medical Supplies Inc.",
    precio: 15.99,
  },
  {
    id: "cat2",
    nombre: "Anestesia local",
    area: "Cirugía",
    categoria: "Medicamentos",
    proveedor: "Pharma Plus",
    precio: 45.5,
  },
  {
    id: "cat3",
    nombre: "Resina compuesta",
    area: "Odontología",
    categoria: "Materiales",
    proveedor: "Dental Solutions",
    precio: 78.25,
  },
  {
    id: "cat4",
    nombre: "Mascarillas quirúrgicas",
    area: "General",
    categoria: "Protección",
    proveedor: "Medical Supplies Inc.",
    precio: 12.99,
  },
  {
    id: "cat5",
    nombre: "Agujas dentales",
    area: "Odontología",
    categoria: "Instrumental",
    proveedor: "Dental Solutions",
    precio: 22.75,
  },
  {
    id: "cat6",
    nombre: "Algodón",
    area: "General",
    categoria: "Consumibles",
    proveedor: "Medical Supplies Inc.",
    precio: 8.5,
  },
  {
    id: "cat7",
    nombre: "Gasas estériles",
    area: "Cirugía",
    categoria: "Consumibles",
    proveedor: "Medical Supplies Inc.",
    precio: 14.25,
  },
  {
    id: "cat8",
    nombre: "Brackets ortodónticos",
    area: "Ortodoncia",
    categoria: "Materiales",
    proveedor: "Ortho Specialists",
    precio: 120.0,
  },
  {
    id: "cat9",
    nombre: "Cemento dental",
    area: "Odontología",
    categoria: "Materiales",
    proveedor: "Dental Solutions",
    precio: 35.99,
  },
  {
    id: "cat10",
    nombre: "Implantes dentales",
    area: "Cirugía",
    categoria: "Implantes",
    proveedor: "Implant Tech",
    precio: 250.0,
  },
]

// Categorías predefinidas
const categorias = [
  "Protección",
  "Medicamentos",
  "Materiales",
  "Instrumental",
  "Consumibles",
  "Implantes",
  "Equipos",
  "Otros",
]

// Componente principal
export function InventoryManager({ usuarioClinicaId }: { usuarioClinicaId: string }) {
  // Usuario actual (simulado)
  const usuarioActual: Usuario = {
    id: "user1",
    nombre: "Admin",
    rol: "administrador",
    clinicaId: usuarioClinicaId,
  }

  // Estados
  const [productos, setProductos] = useState<Producto[]>([
    {
      id: "1",
      nombre: "Guantes de látex",
      area: "General",
      categoria: "Protección",
      cantidad: 5,
      stockMinimo: 10,
      fechaVencimiento: "2023-12-30",
      proveedor: "Medical Supplies Inc.",
      precio: 15.99,
      ubicacion: "Estante A",
      lote: "LOT-2023-001",
      guardado: false,
      clinicaId: "1",
    },
    {
      id: "2",
      nombre: "Anestesia local",
      area: "Cirugía",
      categoria: "Medicamentos",
      cantidad: 15,
      stockMinimo: 5,
      fechaVencimiento: "2023-06-15",
      proveedor: "Pharma Plus",
      precio: 45.5,
      ubicacion: "Refrigerador",
      lote: "LOT-2023-002",
      guardado: false,
      clinicaId: "1",
    },
    {
      id: "3",
      nombre: "Resina compuesta",
      area: "Odontología",
      categoria: "Materiales",
      cantidad: 8,
      stockMinimo: 3,
      fechaVencimiento: "2024-05-20",
      proveedor: "Dental Solutions",
      precio: 78.25,
      ubicacion: "Estante B",
      lote: "LOT-2023-003",
      guardado: true,
      clinicaId: "1",
    },
    {
      id: "4",
      nombre: "Brackets ortodónticos",
      area: "Ortodoncia",
      categoria: "Materiales",
      cantidad: 20,
      stockMinimo: 10,
      fechaVencimiento: "2024-08-15",
      proveedor: "Ortho Specialists",
      precio: 120.0,
      ubicacion: "Estante C",
      lote: "LOT-2023-004",
      guardado: false,
      clinicaId: "2",
    },
  ])

  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [nuevoProducto, setNuevoProducto] = useState<Partial<Producto>>({
    nombre: "",
    area: "",
    categoria: "",
    cantidad: 0,
    stockMinimo: 0,
    fechaVencimiento: "",
    proveedor: "",
    precio: 0,
    ubicacion: "",
    lote: "",
    guardado: false,
    clinicaId: usuarioClinicaId,
  })

  const [documentoNuevo, setDocumentoNuevo] = useState<Partial<Documento>>({
    nombre: "",
    fecha: "",
    tipo: "",
  })

  const [busqueda, setBusqueda] = useState("")
  const [filtroArea, setFiltroArea] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState("")
  const [filtroStockMinimo, setFiltroStockMinimo] = useState(false)
  const [filtroProximoVencer, setFiltroProximoVencer] = useState(false)
  const [filtroGuardados, setFiltroGuardados] = useState(false)
  const [mostrarDialogoAgregar, setMostrarDialogoAgregar] = useState(false)
  const [mostrarDialogoDocumentos, setMostrarDialogoDocumentos] = useState(false)
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const [resultadosBusqueda, setResultadosBusqueda] = useState<any[]>([])
  const [tabActiva, setTabActiva] = useState("manual")
  const [errores, setErrores] = useState<{ [key: string]: string }>({})
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false)

  // Funciones de permisos
  const tienePermisosEdicion = () => {
    return usuarioActual.rol === "administrador" || usuarioActual.rol === "inventario"
  }

  const esAdmin = () => {
    return usuarioActual.rol === "administrador"
  }

  // Función para buscar en el catálogo
  const buscarEnCatalogo = (termino: string) => {
    if (!termino.trim()) {
      setResultadosBusqueda([])
      return
    }

    const resultados = catalogoProductos.filter(
      (producto) =>
        producto.nombre.toLowerCase().includes(termino.toLowerCase()) ||
        producto.area.toLowerCase().includes(termino.toLowerCase()) ||
        producto.proveedor.toLowerCase().includes(termino.toLowerCase()),
    )

    setResultadosBusqueda(resultados)
  }

  // Actualización en tiempo real
  useEffect(() => {
    // Simulación de actualización en tiempo real
    const interval = setInterval(() => {
      // Aquí se conectaría con la base de datos para obtener actualizaciones
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Filtrado de productos
  const productosFiltrados = productos.filter((producto) => {
    // Solo mostrar productos de la clínica del usuario actual
    if (producto.clinicaId !== usuarioClinicaId) {
      return false
    }

    const cumpleBusqueda =
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.area.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.proveedor.toLowerCase().includes(busqueda.toLowerCase())

    const cumpleArea = filtroArea ? producto.area === filtroArea : true
    const cumpleCategoria = filtroCategoria ? producto.categoria === filtroCategoria : true

    const cumpleStockMinimo = filtroStockMinimo ? producto.cantidad <= producto.stockMinimo : true

    const hoy = new Date()
    const fechaVencimiento = new Date(producto.fechaVencimiento)
    const diasParaVencer = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    const cumpleProximoVencer = filtroProximoVencer ? diasParaVencer <= 30 && diasParaVencer > 0 : true

    const cumpleGuardados = filtroGuardados ? producto.guardado : true

    return (
      cumpleBusqueda && cumpleArea && cumpleCategoria && cumpleStockMinimo && cumpleProximoVencer && cumpleGuardados
    )
  })

  // Contadores para alertas
  const contadorStockMinimo = productos.filter(
    (p) => p.cantidad <= p.stockMinimo && p.clinicaId === usuarioClinicaId,
  ).length
  const contadorProximosVencer = productos.filter((p) => {
    if (p.clinicaId !== usuarioClinicaId) return false
    const hoy = new Date()
    const fechaVencimiento = new Date(p.fechaVencimiento)
    const diasParaVencer = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    return diasParaVencer <= 30 && diasParaVencer > 0
  }).length
  const contadorGuardados = productos.filter((p) => p.guardado && p.clinicaId === usuarioClinicaId).length

  // Obtener áreas y categorías únicas de los productos de la clínica actual
  const areasUnicas = [...new Set(productos.filter((p) => p.clinicaId === usuarioClinicaId).map((p) => p.area))]
  const categoriasUnicas = [
    ...new Set(productos.filter((p) => p.clinicaId === usuarioClinicaId).map((p) => p.categoria)),
  ]

  // Función para agregar un producto
  const agregarProducto = () => {
    // Validar campos obligatorios
    const nuevosErrores: { [key: string]: string } = {}

    if (!nuevoProducto.nombre || nuevoProducto.nombre.trim() === "") {
      nuevosErrores.nombre = "El nombre es obligatorio"
    }

    if (!nuevoProducto.area || nuevoProducto.area.trim() === "") {
      nuevosErrores.area = "El área es obligatoria"
    }

    if (!nuevoProducto.categoria || nuevoProducto.categoria.trim() === "") {
      nuevosErrores.categoria = "La categoría es obligatoria"
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      return
    }

    // Limpiar errores previos
    setErrores({})

    // Asignar valores por defecto a campos vacíos
    const productoCompleto: Producto = {
      id: Date.now().toString(),
      nombre: nuevoProducto.nombre || "",
      area: nuevoProducto.area || "",
      categoria: nuevoProducto.categoria || "",
      cantidad: nuevoProducto.cantidad || 0,
      stockMinimo: nuevoProducto.stockMinimo || 0,
      fechaVencimiento: nuevoProducto.fechaVencimiento || new Date().toISOString().split("T")[0],
      proveedor: nuevoProducto.proveedor || "No especificado",
      precio: nuevoProducto.precio || 0,
      ubicacion: nuevoProducto.ubicacion || "No especificada",
      lote: nuevoProducto.lote || "No especificado",
      guardado: false,
      clinicaId: usuarioClinicaId,
    }

    console.log("Producto a agregar:", productoCompleto) // Para depuración
    setProductos([...productos, productoCompleto])
    setNuevoProducto({
      nombre: "",
      area: "",
      categoria: "",
      cantidad: 0,
      stockMinimo: 0,
      fechaVencimiento: "",
      proveedor: "",
      precio: 0,
      ubicacion: "",
      lote: "",
      guardado: false,
      clinicaId: usuarioClinicaId,
    })
    setMostrarDialogoAgregar(false)
  }

  // Función para agregar un documento
  const agregarDocumento = () => {
    if (!productoSeleccionado) return

    const nuevoDocumento: Documento = {
      id: Date.now().toString(),
      nombre: documentoNuevo.nombre || "",
      fecha: documentoNuevo.fecha || new Date().toISOString().split("T")[0],
      tipo: documentoNuevo.tipo || "Otro",
      productoId: productoSeleccionado.id,
    }

    // Aquí se guardaría el documento en la base de datos
    console.log("Documento agregado:", nuevoDocumento)

    setDocumentoNuevo({
      nombre: "",
      fecha: "",
      tipo: "",
    })

    setMostrarDialogoDocumentos(false)
  }

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setBusqueda("")
    setFiltroArea("")
    setFiltroCategoria("")
    setFiltroStockMinimo(false)
    setFiltroProximoVencer(false)
    setFiltroGuardados(false)
  }

  // Función para seleccionar un producto del catálogo
  const seleccionarProductoCatalogo = (producto: any) => {
    setNuevoProducto({
      ...nuevoProducto,
      nombre: producto.nombre,
      area: producto.area,
      categoria: producto.categoria,
      proveedor: producto.proveedor,
      precio: producto.precio,
      clinicaId: usuarioClinicaId,
    })
    setResultadosBusqueda([])
    setTabActiva("manual")
  }

  // Función para guardar/desguardar un producto
  const toggleGuardarProducto = (id: string) => {
    setProductos(productos.map((p) => (p.id === id ? { ...p, guardado: !p.guardado } : p)))
  }

  // Función para pedir más de un producto
  const pedirMasProducto = (producto: Producto) => {
    // Aquí se implementaría la lógica para generar un pedido
    console.log("Generando pedido para:", producto.nombre)
    // Redirección a la página de pedidos o apertura de un diálogo
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <h3 className="text-lg font-medium">Stock Mínimo</h3>
              <Badge variant="destructive" className="ml-auto">
                {contadorStockMinimo}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-2">Productos por debajo del stock mínimo recomendado</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-medium">Próximos a vencer</h3>
              <Badge className="ml-auto bg-amber-500">{contadorProximosVencer}</Badge>
            </div>
            <p className="text-sm text-gray-500 mt-2">Productos que vencerán en los próximos 30 días</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-medium">Guardados</h3>
              <Badge variant="secondary" className="ml-auto">
                {contadorGuardados}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-2">Productos marcados para seguimiento especial</p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {(filtroArea || filtroCategoria || filtroStockMinimo || filtroProximoVencer || filtroGuardados) && (
              <Badge variant="secondary" className="ml-1">
                {[
                  filtroArea ? 1 : 0,
                  filtroCategoria ? 1 : 0,
                  filtroStockMinimo ? 1 : 0,
                  filtroProximoVencer ? 1 : 0,
                  filtroGuardados ? 1 : 0,
                ].reduce((a, b) => a + b, 0)}
              </Badge>
            )}
          </Button>

          {/* Botón para agregar producto */}
          {tienePermisosEdicion() && (
            <Dialog open={mostrarDialogoAgregar} onOpenChange={setMostrarDialogoAgregar}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Agregar Producto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Producto</DialogTitle>
                </DialogHeader>

                <Tabs value={tabActiva} onValueChange={setTabActiva}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="manual">Agregar manualmente</TabsTrigger>
                    <TabsTrigger value="catalogo">Buscar en catálogo</TabsTrigger>
                  </TabsList>

                  <TabsContent value="manual">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label htmlFor="nombre">Nombre *</Label>
                        <Input
                          id="nombre"
                          value={nuevoProducto.nombre || ""}
                          onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
                          className={errores.nombre ? "border-red-500" : ""}
                        />
                        {errores.nombre && <p className="text-red-500 text-sm mt-1">{errores.nombre}</p>}
                      </div>

                      <div>
                        <Label htmlFor="area">Área *</Label>
                        <Select
                          value={nuevoProducto.area}
                          onValueChange={(value) => setNuevoProducto({ ...nuevoProducto, area: value })}
                        >
                          <SelectTrigger id="area" className={errores.area ? "border-red-500" : ""}>
                            <SelectValue placeholder="Seleccionar área" />
                          </SelectTrigger>
                          <SelectContent>
                            {areas.map((area) => (
                              <SelectItem key={area} value={area}>
                                {area}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errores.area && <p className="text-red-500 text-sm mt-1">{errores.area}</p>}
                      </div>

                      <div>
                        <Label htmlFor="categoria">Categoría *</Label>
                        <Select
                          value={nuevoProducto.categoria}
                          onValueChange={(value) => setNuevoProducto({ ...nuevoProducto, categoria: value })}
                        >
                          <SelectTrigger id="categoria" className={errores.categoria ? "border-red-500" : ""}>
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {categorias.map((categoria) => (
                              <SelectItem key={categoria} value={categoria}>
                                {categoria}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errores.categoria && <p className="text-red-500 text-sm mt-1">{errores.categoria}</p>}
                      </div>

                      <div>
                        <Label htmlFor="cantidad">Cantidad</Label>
                        <Input
                          id="cantidad"
                          type="number"
                          value={nuevoProducto.cantidad || 0}
                          onChange={(e) =>
                            setNuevoProducto({ ...nuevoProducto, cantidad: Number.parseInt(e.target.value) })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="stockMinimo">Stock Mínimo</Label>
                        <Input
                          id="stockMinimo"
                          type="number"
                          value={nuevoProducto.stockMinimo || 0}
                          onChange={(e) =>
                            setNuevoProducto({ ...nuevoProducto, stockMinimo: Number.parseInt(e.target.value) })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="fechaVencimiento">Fecha de Vencimiento</Label>
                        <Input
                          id="fechaVencimiento"
                          type="date"
                          value={nuevoProducto.fechaVencimiento || ""}
                          onChange={(e) => setNuevoProducto({ ...nuevoProducto, fechaVencimiento: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="proveedor">Proveedor</Label>
                        <Input
                          id="proveedor"
                          value={nuevoProducto.proveedor || ""}
                          onChange={(e) => setNuevoProducto({ ...nuevoProducto, proveedor: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="precio">Precio</Label>
                        <Input
                          id="precio"
                          type="number"
                          step="0.01"
                          value={nuevoProducto.precio || 0}
                          onChange={(e) =>
                            setNuevoProducto({ ...nuevoProducto, precio: Number.parseFloat(e.target.value) })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="ubicacion">Ubicación</Label>
                        <Input
                          id="ubicacion"
                          value={nuevoProducto.ubicacion || ""}
                          onChange={(e) => setNuevoProducto({ ...nuevoProducto, ubicacion: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="lote">Lote</Label>
                        <Input
                          id="lote"
                          value={nuevoProducto.lote || ""}
                          onChange={(e) => setNuevoProducto({ ...nuevoProducto, lote: e.target.value })}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="catalogo">
                    <div className="mt-4">
                      <Label htmlFor="busquedaCatalogo">Buscar en catálogo</Label>
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="busquedaCatalogo"
                          placeholder="Buscar por nombre, área o proveedor..."
                          className="pl-8"
                          onChange={(e) => buscarEnCatalogo(e.target.value)}
                        />
                      </div>

                      {resultadosBusqueda.length > 0 && (
                        <div className="mt-4 border rounded-md">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Área</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead>Proveedor</TableHead>
                                <TableHead>Precio</TableHead>
                                <TableHead></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {resultadosBusqueda.map((producto) => (
                                <TableRow key={producto.id}>
                                  <TableCell>{producto.nombre}</TableCell>
                                  <TableCell>{producto.area}</TableCell>
                                  <TableCell>{producto.categoria}</TableCell>
                                  <TableCell>{producto.proveedor}</TableCell>
                                  <TableCell>${producto.precio.toFixed(2)}</TableCell>
                                  <TableCell>
                                    <Button size="sm" onClick={() => seleccionarProductoCatalogo(producto)}>
                                      Seleccionar
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {resultadosBusqueda.length === 0 && (
                        <p className="text-muted-foreground mt-2">
                          Ingrese un término de búsqueda para encontrar productos en el catálogo.
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setMostrarDialogoAgregar(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={agregarProducto}>Agregar Producto</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filtros avanzados */}
        {mostrarFiltrosAvanzados && (
          <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-900 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="filtroArea">Área</Label>
                <Select value={filtroArea} onValueChange={setFiltroArea}>
                  <SelectTrigger id="filtroArea">
                    <SelectValue placeholder="Todas las áreas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las áreas</SelectItem>
                    {areas.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="filtroCategoria">Categoría</Label>
                <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                  <SelectTrigger id="filtroCategoria">
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col space-y-2">
                <Label>Alertas</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={filtroStockMinimo ? "default" : "outline"}
                    onClick={() => setFiltroStockMinimo(!filtroStockMinimo)}
                    className="flex items-center gap-1"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Stock Mínimo
                    {contadorStockMinimo > 0 && (
                      <Badge variant="destructive" className="ml-1">
                        {contadorStockMinimo}
                      </Badge>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant={filtroProximoVencer ? "default" : "outline"}
                    onClick={() => setFiltroProximoVencer(!filtroProximoVencer)}
                    className="flex items-center gap-1"
                  >
                    <Clock className="h-4 w-4" />
                    Próximos a vencer
                    {contadorProximosVencer > 0 && (
                      <Badge className="ml-1 bg-amber-500">{contadorProximosVencer}</Badge>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant={filtroGuardados ? "default" : "outline"}
                    onClick={() => setFiltroGuardados(!filtroGuardados)}
                    className="flex items-center gap-1"
                  >
                    <Bookmark className="h-4 w-4" />
                    Guardados
                    {contadorGuardados > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {contadorGuardados}
                      </Badge>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" onClick={limpiarFiltros} className="flex items-center">
                <X className="h-4 w-4 mr-1" />
                Limpiar filtros
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Alertas */}
      {contadorStockMinimo > 0 && !filtroStockMinimo && (
        <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Hay {contadorStockMinimo} productos por debajo del stock mínimo.{" "}
            <Button variant="link" className="p-0 h-auto" onClick={() => setFiltroStockMinimo(true)}>
              Ver productos
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {contadorProximosVencer > 0 && !filtroProximoVencer && (
        <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            Hay {contadorProximosVencer} productos próximos a vencer en los siguientes 30 días.{" "}
            <Button variant="link" className="p-0 h-auto" onClick={() => setFiltroProximoVencer(true)}>
              Ver productos
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabla de productos */}
      <div className="rounded-md border overflow-auto max-h-[600px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Stock Mínimo</TableHead>
              <TableHead>Fecha Vencimiento</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No se encontraron productos con los filtros seleccionados.
                </TableCell>
              </TableRow>
            ) : (
              productosFiltrados.map((producto) => {
                // Determinar si el producto está por debajo del stock mínimo
                const bajoStock = producto.cantidad <= producto.stockMinimo

                // Determinar si el producto está próximo a vencer
                const hoy = new Date()
                const fechaVencimiento = new Date(producto.fechaVencimiento)
                const diasParaVencer = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
                const proximoAVencer = diasParaVencer <= 30 && diasParaVencer > 0

                return (
                  <TableRow
                    key={producto.id}
                    className={
                      bajoStock
                        ? "bg-red-50 dark:bg-red-950/20"
                        : proximoAVencer
                          ? "bg-amber-50 dark:bg-amber-950/20"
                          : producto.guardado
                            ? "bg-blue-50 dark:bg-blue-950/20"
                            : ""
                    }
                  >
                    <TableCell className="font-medium">{producto.nombre}</TableCell>
                    <TableCell>{producto.area}</TableCell>
                    <TableCell>{producto.categoria}</TableCell>
                    <TableCell className={bajoStock ? "text-red-600 dark:text-red-400 font-medium" : ""}>
                      {producto.cantidad}
                    </TableCell>
                    <TableCell>{producto.stockMinimo}</TableCell>
                    <TableCell className={proximoAVencer ? "text-amber-600 dark:text-amber-400 font-medium" : ""}>
                      {new Date(producto.fechaVencimiento).toLocaleDateString()}
                      {proximoAVencer && <span className="ml-2 text-xs">({diasParaVencer} días)</span>}
                    </TableCell>
                    <TableCell>{producto.proveedor}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => toggleGuardarProducto(producto.id)}>
                          {producto.guardado ? (
                            <>
                              <X className="h-3.5 w-3.5 mr-1" />
                              Quitar alerta
                            </>
                          ) : (
                            <>
                              <Bookmark className="h-3.5 w-3.5 mr-1" />
                              Guardar alerta
                            </>
                          )}
                        </Button>

                        {bajoStock && (
                          <Button size="sm" variant="destructive" onClick={() => pedirMasProducto(producto)}>
                            Pedir más
                          </Button>
                        )}

                        <Dialog
                          open={mostrarDialogoDocumentos && productoSeleccionado?.id === producto.id}
                          onOpenChange={(open) => {
                            if (open) {
                              setProductoSeleccionado(producto)
                            }
                            setMostrarDialogoDocumentos(open)
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Documentos de {producto.nombre}</DialogTitle>
                            </DialogHeader>

                            <div className="mt-4">
                              <h3 className="font-medium mb-2">Agregar nuevo documento</h3>
                              <div className="grid grid-cols-1 gap-4">
                                <div>
                                  <Label htmlFor="nombreDoc">Nombre del documento</Label>
                                  <Input
                                    id="nombreDoc"
                                    value={documentoNuevo.nombre || ""}
                                    onChange={(e) => setDocumentoNuevo({ ...documentoNuevo, nombre: e.target.value })}
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="fechaDoc">Fecha</Label>
                                  <Input
                                    id="fechaDoc"
                                    type="date"
                                    value={documentoNuevo.fecha || ""}
                                    onChange={(e) => setDocumentoNuevo({ ...documentoNuevo, fecha: e.target.value })}
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="tipoDoc">Tipo de documento</Label>
                                  <Select
                                    value={documentoNuevo.tipo}
                                    onValueChange={(value) => setDocumentoNuevo({ ...documentoNuevo, tipo: value })}
                                  >
                                    <SelectTrigger id="tipoDoc">
                                      <SelectValue placeholder="Seleccionar tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Factura">Factura</SelectItem>
                                      <SelectItem value="Certificado">Certificado</SelectItem>
                                      <SelectItem value="Manual">Manual</SelectItem>
                                      <SelectItem value="Otro">Otro</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" onClick={() => setMostrarDialogoDocumentos(false)}>
                                  Cancelar
                                </Button>
                                <Button onClick={agregarDocumento}>Agregar Documento</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
