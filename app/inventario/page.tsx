"use client"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"
import { useInventory } from "@/hooks/use-inventory"
import {
  Home,
  AlertCircle,
  Clock,
  Bookmark,
  Edit,
  Trash2,
  X,
  FileDown,
  Snowflake,
  Bell,
  Smartphone,
  Laptop,
  Tablet,
} from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { useMediaQuery } from "@/hooks/use-media-query"

// Tipos de datos
interface Producto {
  id: string
  nombre: string
  descripcion?: string
  cantidad: number
  precio: number
  area: string
  categoria: string
  proveedor?: string
  fechaCaducidad?: string
  fechaRecepcion?: string
  stockMinimo: number
  stockMaximo?: number
  observaciones?: string
  guardado?: boolean
  clinicaId: string
  refrigeracion?: boolean
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
  esPrivado?: boolean
}

interface Usuario {
  id: string
  nombre: string
  rol: string
  clinicaId: string
}

interface SearchFilter {
  id: string
  name: string
  criteria: any
  isDefault?: boolean
}

// Función para formatear precio en CLP
const formatearPrecioCLP = (precio: number) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(precio)
}

// Función para calcular el precio total correctamente
const calcularPrecioTotal = (cantidad: number, precioUnitario: number) => {
  return cantidad * precioUnitario
}

// Áreas predefinidas
export const areas = [
  "Recepción",
  "Almacenamiento",
  "Esterilización",
  "Box 1",
  "Box 2",
  "Box 3",
  "Box 4",
  "Box 5",
  "Ortodoncia",
  "Endodoncia",
  "Periodoncia",
  "Cirugía Maxilofacial",
  "Odontopediatría",
  "Implantología",
  "Radiología",
]

// Categorías predefinidas
const categorias = ["Consumible", "Equipamiento", "Instrumental", "Limpieza", "Inmobiliario", "Medicamento", "Otros"]

// Componente de fila de producto memoizado para mejorar rendimiento
const ProductoRow = ({
  producto,
  bajoStock,
  proximoAVencer,
  diasParaVencer,
  requiereRefrigeracion,
  toggleGuardarProducto,
  decrementarCantidad,
  incrementarCantidad,
  handleEditar,
  handleEliminar,
  isMobile,
}) => {
  // Versión móvil de la fila
  if (isMobile) {
    return (
      <Card
        className={cn(
          "mb-4",
          bajoStock
            ? "bg-red-50 dark:bg-red-950/20 border-red-200"
            : proximoAVencer
              ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200"
              : producto.guardado
                ? "bg-teal-50 dark:bg-teal-950/20 border-teal-200"
                : "",
        )}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{producto.nombre}</h3>
                {requiereRefrigeracion && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                    <Snowflake className="h-3 w-3 mr-1" />
                    Refrigerar
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {producto.area} - {producto.categoria}
              </p>
              {producto.observaciones && <p className="text-xs text-gray-500 mt-1">{producto.observaciones}</p>}
            </div>
            <div className="text-right">
              <p className="font-medium">{formatearPrecioCLP(producto.precio)}</p>
              <p className={cn("text-sm", bajoStock ? "text-red-600 dark:text-red-400 font-medium" : "")}>
                Stock: {producto.cantidad} / Min: {producto.stockMinimo}
              </p>
            </div>
          </div>

          <div className="mt-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => decrementarCantidad(producto.id)}
                disabled={producto.cantidad <= 0}
              >
                <span className="font-bold">-</span>
              </Button>
              <span className={bajoStock ? "text-red-600 dark:text-red-400 font-medium" : ""}>{producto.cantidad}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => incrementarCantidad(producto.id)}
                disabled={producto.stockMaximo && producto.cantidad >= producto.stockMaximo}
              >
                <span className="font-bold">+</span>
              </Button>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => toggleGuardarProducto(producto.id)}>
                {producto.guardado ? <X className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleEditar(producto)}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-500 hover:text-red-700"
                onClick={() => handleEliminar(producto)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {proximoAVencer && (
            <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">
              Vence en {diasParaVencer} días (
              {producto.fechaCaducidad ? new Date(producto.fechaCaducidad).toLocaleDateString() : "No especificada"})
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Versión de escritorio (tabla)
  return (
    <TableRow
      key={producto.id}
      className={
        bajoStock
          ? "bg-red-50 dark:bg-red-950/20"
          : proximoAVencer
            ? "bg-orange-50 dark:bg-orange-950/20"
            : producto.guardado
              ? "bg-teal-50 dark:bg-teal-950/20"
              : ""
      }
    >
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {producto.nombre}
          {requiereRefrigeracion && (
            <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
              <Snowflake className="h-3 w-3 mr-1" />
              Refrigerar
            </Badge>
          )}
        </div>
        {producto.observaciones && <div className="text-xs text-gray-500 mt-1 max-w-xs">{producto.observaciones}</div>}
      </TableCell>
      <TableCell>{producto.area}</TableCell>
      <TableCell>{producto.categoria}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() => decrementarCantidad(producto.id)}
            disabled={producto.cantidad <= 0}
          >
            <span className="font-bold">-</span>
          </Button>
          <span className={bajoStock ? "text-red-600 dark:text-red-400 font-medium" : ""}>{producto.cantidad}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() => incrementarCantidad(producto.id)}
            disabled={producto.stockMaximo && producto.cantidad >= producto.stockMaximo}
          >
            <span className="font-bold">+</span>
          </Button>
        </div>
      </TableCell>
      <TableCell>{producto.stockMinimo}</TableCell>
      <TableCell>{producto.stockMaximo || "No definido"}</TableCell>
      <TableCell className={proximoAVencer ? "text-orange-600 dark:text-orange-400 font-medium" : ""}>
        {producto.fechaCaducidad ? new Date(producto.fechaCaducidad).toLocaleDateString() : "No especificada"}
        {proximoAVencer && <span className="ml-2 text-xs">({diasParaVencer} días)</span>}
      </TableCell>
      <TableCell>
        {producto.fechaRecepcion ? new Date(producto.fechaRecepcion).toLocaleDateString() : "No especificada"}
      </TableCell>
      <TableCell>{producto.proveedor || "No especificado"}</TableCell>
      <TableCell>{formatearPrecioCLP(producto.precio)}</TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => toggleGuardarProducto(producto.id)}
            className="flex items-center gap-1"
          >
            {producto.guardado ? (
              <>
                <X className="h-3.5 w-3.5" />
                Quitar
              </>
            ) : (
              <>
                <Bookmark className="h-3.5 w-3.5" />
                Guardar
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1"
            onClick={() => handleEditar(producto)}
          >
            <Edit className="h-3.5 w-3.5" />
            Editar
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1 text-red-500 hover:text-red-700"
            onClick={() => handleEliminar(producto)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

// Utilidad para combinar clases condicionales
const cn = (...classes) => {
  return classes.filter(Boolean).join(" ")
}

export default function InventarioPage() {
  // Referencias para desplazamiento
  const topRef = useRef(null)
  const tablaRef = useRef(null)

  // Detección de dispositivo
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isTablet = useMediaQuery("(min-width: 769px) and (max-width: 1024px)")
  const isDesktop = useMediaQuery("(min-width: 1025px)")

  // Usuario actual (simulado)
  const usuarioActual: Usuario = {
    id: "user1",
    nombre: "Admin",
    rol: "administrador",
    clinicaId: "1",
  }

  // Usar React Query para gestionar el inventario
  const {
    productos,
    isLoading,
    addProducto,
    updateProducto,
    deleteProducto,
    updateBatch,
    isAddingProducto,
    isUpdatingProducto,
    isDeletingProducto,
  } = useInventory(usuarioActual.clinicaId)

  // Estados
  const [compras, setCompras] = useState<Compra[]>([])
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const [filtroArea, setFiltroArea] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState("")
  const [filtroStockMinimo, setFiltroStockMinimo] = useState(false)
  const [filtroProximoVencer, setFiltroProximoVencer] = useState(false)
  const [filtroGuardados, setFiltroGuardados] = useState(false)
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false)
  const [mostrarDialogoEditar, setMostrarDialogoEditar] = useState(false)
  const [mostrarDialogoEliminar, setMostrarDialogoEliminar] = useState(false)
  const [mostrarDialogoCompra, setMostrarDialogoCompra] = useState(false)
  const [mostrarBotonSubir, setMostrarBotonSubir] = useState(false)
  const [ultimaAccion, setUltimaAccion] = useState<{ tipo: string; producto: Producto | null }>({
    tipo: "",
    producto: null,
  })
  const [compraForm, setCompraForm] = useState({
    productoId: "",
    cantidad: 1,
    precioUnitario: 0,
    proveedor: "",
    area: "",
    fecha: new Date().toISOString().split("T")[0],
  })
  const [mostrarBusquedaAvanzada, setMostrarBusquedaAvanzada] = useState(false)
  const [mostrarExportacion, setMostrarExportacion] = useState(false)
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false)
  const [savedFilters, setSavedFilters] = useState<SearchFilter[]>([])
  const [notificaciones, setNotificaciones] = useState<any[]>([])
  const [tabActiva, setTabActiva] = useState("productos")

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const storedCompras = localStorage.getItem("compras")
        const storedFilters = localStorage.getItem("savedFilters")
        const storedNotificaciones = localStorage.getItem("notificaciones")

        if (storedCompras) {
          setCompras(JSON.parse(storedCompras))
        }

        if (storedFilters) {
          setSavedFilters(JSON.parse(storedFilters))
        }

        if (storedNotificaciones) {
          setNotificaciones(JSON.parse(storedNotificaciones))
        } else {
          // Crear algunas notificaciones de ejemplo
          const notificacionesEjemplo = [
            {
              id: "1",
              title: "Stock bajo de Guantes de látex",
              message: "El producto ha alcanzado su nivel mínimo de stock. Considere realizar un pedido pronto.",
              type: "warning",
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
              read: false,
            },
            {
              id: "2",
              title: "Productos próximos a vencer",
              message:
                "Hay 3 productos que vencerán en los próximos 30 días. Revise el inventario para tomar acciones.",
              type: "info",
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 día atrás
              read: true,
            },
            {
              id: "3",
              title: "Nueva actualización del sistema",
              message: "Se ha lanzado una nueva actualización del sistema con mejoras en la gestión de inventario.",
              type: "success",
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 días atrás
              read: true,
            },
          ]

          setNotificaciones(notificacionesEjemplo)
          localStorage.setItem("notificaciones", JSON.stringify(notificacionesEjemplo))
        }
      } catch (e) {
        console.error("Error al cargar datos del localStorage:", e)
      }
    }

    cargarDatos()

    // Configurar el detector de scroll
    const handleScroll = () => {
      setMostrarBotonSubir(window.scrollY > 300)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Guardar datos en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem("compras", JSON.stringify(compras))
  }, [compras])

  useEffect(() => {
    localStorage.setItem("savedFilters", JSON.stringify(savedFilters))
  }, [savedFilters])

  useEffect(() => {
    localStorage.setItem("notificaciones", JSON.stringify(notificaciones))
  }, [notificaciones])

  // Filtrado de productos optimizado con useMemo
  const productosFiltrados = useMemo(() => {
    return productos.filter((producto) => {
      // Solo mostrar productos de la clínica del usuario actual
      if (producto.clinicaId !== usuarioActual.clinicaId) {
        return false
      }

      const cumpleBusqueda =
        producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (producto.descripcion && producto.descripcion.toLowerCase().includes(busqueda.toLowerCase())) ||
        (producto.proveedor && producto.proveedor.toLowerCase().includes(busqueda.toLowerCase())) ||
        (producto.observaciones && producto.observaciones.toLowerCase().includes(busqueda.toLowerCase()))

      const cumpleArea = filtroArea ? producto.area === filtroArea : true
      const cumpleCategoria = filtroCategoria ? producto.categoria === filtroCategoria : true

      const cumpleStockMinimo = filtroStockMinimo ? producto.cantidad <= producto.stockMinimo : true

      const hoy = new Date()
      const fechaVencimiento = producto.fechaCaducidad ? new Date(producto.fechaCaducidad) : null
      const diasParaVencer = fechaVencimiento
        ? Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
        : 999
      const cumpleProximoVencer = filtroProximoVencer ? diasParaVencer <= 30 && diasParaVencer > 0 : true

      const cumpleGuardados = filtroGuardados ? producto.guardado : true

      return (
        cumpleBusqueda && cumpleArea && cumpleCategoria && cumpleStockMinimo && cumpleProximoVencer && cumpleGuardados
      )
    })
  }, [
    productos,
    busqueda,
    filtroArea,
    filtroCategoria,
    filtroStockMinimo,
    filtroProximoVencer,
    filtroGuardados,
    usuarioActual.clinicaId,
  ])

  // Contadores para alertas optimizados con useMemo
  const contadores = useMemo(() => {
    const stockMinimo = productos.filter(
      (p) => p.cantidad <= p.stockMinimo && p.clinicaId === usuarioActual.clinicaId,
    ).length

    const proximosVencer = productos.filter((p) => {
      if (p.clinicaId !== usuarioActual.clinicaId || !p.fechaCaducidad) return false
      const hoy = new Date()
      const fechaVencimiento = new Date(p.fechaCaducidad)
      const diasParaVencer = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
      return diasParaVencer <= 30 && diasParaVencer > 0
    }).length

    const guardados = productos.filter((p) => p.guardado && p.clinicaId === usuarioActual.clinicaId).length

    return { stockMinimo, proximosVencer, guardados }
  }, [productos, usuarioActual.clinicaId])

  // Función para manejar la adición de un nuevo producto
  const handleProductoAgregado = useCallback(
    (nuevoProducto) => {
      try {
        // Asegurarse de que el producto tenga todos los campos necesarios
        const productoCompleto = {
          ...nuevoProducto,
          id: nuevoProducto.id || `prod-${Date.now()}`,
          guardado: nuevoProducto.guardado || false,
          clinicaId: nuevoProducto.clinicaId || usuarioActual.clinicaId,
        }

        // Añadir el producto usando React Query
        addProducto(productoCompleto)

        // Registrar la acción para poder deshacerla
        setUltimaAccion({
          tipo: "agregar",
          producto: productoCompleto,
        })

        // Mostrar notificación de éxito
        toast({
          title: "Producto añadido",
          description: `${productoCompleto.nombre} ha sido añadido al inventario.`,
        })

        // Crear notificación en el centro de notificaciones
        const nuevaNotificacion = {
          id: Date.now().toString(),
          title: "Producto añadido",
          message: `Se ha añadido ${productoCompleto.nombre} al inventario.`,
          type: "success",
          timestamp: new Date(),
          read: false,
        }

        setNotificaciones([nuevaNotificacion, ...notificaciones])

        // Desplazarse a la tabla
        setTimeout(() => {
          if (tablaRef.current) {
            tablaRef.current.scrollIntoView({ behavior: "smooth" })
          }
        }, 500)
      } catch (error) {
        console.error("Error al añadir producto:", error)
        toast({
          title: "Error",
          description: "No se pudo añadir el producto. Inténtalo de nuevo.",
          variant: "destructive",
        })
      }
    },
    [usuarioActual.clinicaId, addProducto, notificaciones],
  )

  // Función para guardar/desguardar un producto
  const toggleGuardarProducto = useCallback(
    (id: string) => {
      const producto = productos.find((p) => p.id === id)
      if (!producto) return

      const productoActualizado = { ...producto, guardado: !producto.guardado }

      // Actualizar usando React Query
      updateProducto(productoActualizado)

      setUltimaAccion({
        tipo: "guardar",
        producto,
      })

      // Crear notificación
      if (productoActualizado.guardado) {
        const nuevaNotificacion = {
          id: Date.now().toString(),
          title: "Producto guardado",
          message: `${producto.nombre} ha sido marcado para seguimiento.`,
          type: "info",
          timestamp: new Date(),
          read: false,
        }

        setNotificaciones([nuevaNotificacion, ...notificaciones])
      }
    },
    [productos, updateProducto, notificaciones],
  )

  // Función para incrementar la cantidad de un producto
  const incrementarCantidad = useCallback(
    (id: string) => {
      const producto = productos.find((p) => p.id === id)
      if (!producto) return

      // Verificar si la cantidad ya alcanzó el stock máximo
      if (producto.stockMaximo && producto.cantidad >= producto.stockMaximo) {
        toast({
          title: "Stock máximo alcanzado",
          description: `No se puede incrementar más. El stock máximo es ${producto.stockMaximo}.`,
          variant: "destructive",
        })
        return
      }

      const productoActualizado = { ...producto, cantidad: producto.cantidad + 1 }

      // Actualizar usando React Query
      updateProducto(productoActualizado)

      setUltimaAccion({
        tipo: "incrementar",
        producto,
      })
    },
    [productos, updateProducto],
  )

  // Función para decrementar la cantidad de un producto
  const decrementarCantidad = useCallback(
    (id: string) => {
      const producto = productos.find((p) => p.id === id)
      if (!producto || producto.cantidad <= 0) return

      const productoActualizado = { ...producto, cantidad: producto.cantidad - 1 }

      // Actualizar usando React Query
      updateProducto(productoActualizado)

      setUltimaAccion({
        tipo: "decrementar",
        producto,
      })

      // Si llega a stock mínimo, crear notificación
      if (productoActualizado.cantidad <= productoActualizado.stockMinimo) {
        const nuevaNotificacion = {
          id: Date.now().toString(),
          title: "Stock bajo",
          message: `${producto.nombre} ha alcanzado su nivel mínimo de stock.`,
          type: "warning",
          timestamp: new Date(),
          read: false,
        }

        setNotificaciones([nuevaNotificacion, ...notificaciones])
      }
    },
    [productos, updateProducto, notificaciones],
  )

  // Función para actualizar un producto
  const actualizarProducto = useCallback(() => {
    if (!productoEditando) return

    // Actualizar usando React Query
    updateProducto(productoEditando)

    setMostrarDialogoEditar(false)
    setUltimaAccion({
      tipo: "editar",
      producto: productoSeleccionado,
    })

    toast({
      title: "Producto actualizado",
      description: `${productoEditando.nombre} ha sido actualizado correctamente.`,
    })
  }, [productoEditando, productoSeleccionado, updateProducto])

  // Función para eliminar un producto
  const eliminarProducto = useCallback(() => {
    if (!productoSeleccionado) return

    // Eliminar usando React Query
    deleteProducto(productoSeleccionado.id)

    setMostrarDialogoEliminar(false)
    setUltimaAccion({
      tipo: "eliminar",
      producto: productoSeleccionado,
    })

    toast({
      title: "Producto eliminado",
      description: `${productoSeleccionado.nombre} ha sido eliminado del inventario.`,
    })
  }, [productoSeleccionado, deleteProducto])

  // Función para filtrar datos según el usuario
  const filtrarDatosPorUsuario = (datos) => {
    if (usuarioActual.rol === "administrador") {
      return datos // El admin ve todo
    } else {
      return datos.filter((item) => item.usuario === usuarioActual.nombre || !item.esPrivado)
    }
  }

  // Función para registrar una nueva compra
  const registrarCompra = useCallback(() => {
    if (!compraForm.productoId || compraForm.cantidad <= 0 || !compraForm.area) {
      toast({
        title: "Error",
        description: "Debe seleccionar un producto, especificar una cantidad válida y un área",
        variant: "destructive",
      })
      return
    }

    const producto = productos.find((p) => p.id === compraForm.productoId)
    if (!producto) {
      toast({
        title: "Error",
        description: "Producto no encontrado",
        variant: "destructive",
      })
      return
    }

    // Verificar si se excede el stock máximo
    if (producto.stockMaximo && producto.cantidad + compraForm.cantidad > producto.stockMaximo) {
      toast({
        title: "Error",
        description: `No se puede superar el stock máximo (${producto.stockMaximo}) para ${producto.nombre}`,
        variant: "destructive",
      })
      return
    }

    const precioTotal = calcularPrecioTotal(compraForm.cantidad, compraForm.precioUnitario)

    const nuevaCompra: Compra = {
      id: Date.now().toString(),
      fecha: compraForm.fecha,
      producto: producto.nombre,
      productoId: producto.id,
      cantidad: compraForm.cantidad,
      precioUnitario: compraForm.precioUnitario,
      precioTotal: precioTotal,
      proveedor: compraForm.proveedor || producto.proveedor || "No especificado",
      area: compraForm.area,
      usuario: usuarioActual.nombre,
    }

    // Añadir propiedad para marcar datos privados del admin
    if (usuarioActual.rol === "administrador") {
      nuevaCompra.esPrivado = true
    }

    // Actualizar compras
    setCompras((prevCompras) => [...prevCompras, nuevaCompra])

    // Actualizar inventario usando React Query
    const productoActualizado = {
      ...producto,
      cantidad: producto.cantidad + compraForm.cantidad,
      proveedor: compraForm.proveedor || producto.proveedor,
    }

    updateProducto(productoActualizado)

    toast({
      title: "Compra registrada",
      description: `Se ha registrado la compra de ${compraForm.cantidad} unidades de ${producto.nombre}`,
    })

    // Crear notificación
    const nuevaNotificacion = {
      id: Date.now().toString(),
      title: "Compra registrada",
      message: `Se ha registrado la compra de ${compraForm.cantidad} unidades de ${producto.nombre}.`,
      type: "success",
      timestamp: new Date(),
      read: false,
    }

    setNotificaciones([nuevaNotificacion, ...notificaciones])

    // Resetear formulario
    setCompraForm({
      productoId: "",
      cantidad: 1,
      precioUnitario: 0,
      proveedor: "",
      area: "",
      fecha: new Date().toISOString().split("T")[0],
    })

    setMostrarDialogoCompra(false)
  }, [compraForm, productos, usuarioActual.nombre, updateProducto, notificaciones])

  // Función para deshacer la última acción
  const deshacerUltimaAccion = useCallback(() => {
    if (!ultimaAccion.tipo || !ultimaAccion.producto) return

    switch (ultimaAccion.tipo) {
      case "agregar":
        if (ultimaAccion.producto) {
          deleteProducto(ultimaAccion.producto.id)
        }
        break
      case "editar":
      case "guardar":
      case "incrementar":
      case "decrementar":
        if (ultimaAccion.producto) {
          updateProducto(ultimaAccion.producto)
        }
        break
      case "eliminar":
        if (ultimaAccion.producto) {
          addProducto(ultimaAccion.producto)
        }
        break
    }

    toast({
      title: "Acción deshecha",
      description: "La última acción ha sido deshecha correctamente.",
    })

    setUltimaAccion({ tipo: "", producto: null })
  }, [ultimaAccion, addProducto, updateProducto, deleteProducto])

  // Función para limpiar filtros
  const limpiarFiltros = useCallback(() => {
    setBusqueda("")
    setFiltroArea("")
    setFiltroCategoria("")
    setFiltroStockMinimo(false)
    setFiltroProximoVencer(false)
    setFiltroGuardados(false)
  }, [])

  // Función para exportar a PDF
  const exportarInventarioPDF = useCallback(() => {
    try {
      const doc = new jsPDF()

      // Título
      doc.setFontSize(18)
      doc.text("Inventario de Productos", 14, 22)

      // Fecha de generación
      doc.setFontSize(11)
      doc.text(`Generado: ${new Date().toLocaleDateString("es-ES")}`, 14, 30)

      // Filtros aplicados
      let filtrosTexto = "Filtros aplicados: "
      if (busqueda) filtrosTexto += `Búsqueda: ${busqueda}, `
      if (filtroArea) filtrosTexto += `Área: ${filtroArea}, `
      if (filtroCategoria) filtrosTexto += `Categoría: ${filtroCategoria}, `
      if (filtroStockMinimo) filtrosTexto += `Stock Mínimo, `
      if (filtroProximoVencer) filtrosTexto += `Próximos a vencer, `
      if (filtroGuardados) filtrosTexto += `Guardados, `

      if (filtrosTexto !== "Filtros aplicados: ") {
        doc.text(filtrosTexto.slice(0, -2), 14, 38)
      }

      // Resumen
      doc.text(`Total de productos: ${productosFiltrados.length}`, 14, 46)
      doc.text(`Productos en stock mínimo: ${contadores.stockMinimo}`, 14, 54)
      doc.text(`Productos próximos a vencer: ${contadores.proximosVencer}`, 14, 62)

      // Tabla
      const productosData = productosFiltrados.map((producto) => {
        const fechaVencimiento = producto.fechaCaducidad
          ? new Date(producto.fechaCaducidad).toLocaleDateString()
          : "No especificada"

        return [
          producto.nombre,
          producto.area,
          producto.categoria,
          producto.cantidad.toString(),
          producto.stockMinimo.toString(),
          producto.stockMaximo?.toString() || "No definido",
          fechaVencimiento,
          producto.proveedor || "No especificado",
          formatearPrecioCLP(producto.precio),
        ]
      })

      // Usar autoTable como una función directamente en el objeto doc
      autoTable(doc, {
        startY: 70,
        head: [
          ["Nombre", "Área", "Categoría", "Cantidad", "Stock Mín", "Stock Máx", "Caducidad", "Proveedor", "Precio"],
        ],
        body: productosData,
        theme: "striped",
        headStyles: {
          fillColor: [0, 150, 214], // Color dental-blue
          textColor: [255, 255, 255],
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        columnStyles: {
          0: { cellWidth: 30 }, // Nombre
          8: { cellWidth: 20 }, // Precio
        },
      })

      doc.save("inventario-productos.pdf")

      toast({
        title: "PDF generado",
        description: "El inventario ha sido exportado a PDF correctamente.",
      })
    } catch (error) {
      console.error("Error al generar PDF:", error)
      toast({
        title: "Error",
        description: "No se pudo generar el PDF. Inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }, [
    busqueda,
    contadores.proximosVencer,
    contadores.stockMinimo,
    filtroArea,
    filtroCategoria,
    filtroGuardados,
    filtroProximoVencer,
    filtroStockMinimo,
    productosFiltrados,
  ])

  // Función para volver arriba
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  // Función para manejar cambios en el formulario de compra
  const handleCompraChange = useCallback((e) => {
    const { name, value } = e.target
    setCompraForm((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleCompraSelectChange = useCallback(
    (name, value) => {
      setCompraForm((prev) => ({ ...prev, [name]: value }))

      // Si se selecciona un producto, actualizar el precio unitario
      if (name === "productoId") {
        const producto = productos.find((p) => p.id === value)
        if (producto) {
          setCompraForm((prev) => ({
            ...prev,
            precioUnitario: producto.precio,
            proveedor: producto.proveedor || "",
          }))
        }
      }
    },
    [productos],
  )

  // Handlers para editar y eliminar productos
  const handleEditar = useCallback((producto) => {
    setProductoSeleccionado(producto)
    setProductoEditando({ ...producto })
    setMostrarDialogoEditar(true)
  }, [])

  const handleEliminar = useCallback((producto) => {
    setProductoSeleccionado(producto)
    setMostrarDialogoEliminar(true)
  }, [])

  // Función para manejar la búsqueda avanzada
  const handleAdvancedSearch = useCallback(
    (criteria) => {
      // Implementar la lógica de búsqueda avanzada
      console.log("Criterios de búsqueda avanzada:", criteria)

      // Actualizar filtros básicos basados en los criterios avanzados
      setBusqueda(criteria.keyword || "")
      setFiltroArea(criteria.areas.length === 1 ? criteria.areas[0] : "")
      setFiltroCategoria(criteria.categories.length === 1 ? criteria.categories[0] : "")
      setFiltroStockMinimo(criteria.stockStatus.lowStock)
      setFiltroProximoVencer(criteria.stockStatus.nearExpiry)
      setFiltroGuardados(criteria.saved)

      // Cerrar el panel de búsqueda avanzada en móvil
      if (isMobile) {
        setMostrarBusquedaAvanzada(false)
      }
    },
    [isMobile],
  )

  // Función para guardar filtros de búsqueda
  const handleSaveFilter = useCallback((filter) => {
    // Si es un filtro predeterminado, desmarcar otros predeterminados
    if (filter.isDefault) {
      setSavedFilters((prev) => prev.map((f) => ({ ...f, isDefault: false })).concat([filter]))
    } else {
      setSavedFilters((prev) => [...prev, filter])
    }

    toast({
      title: "Filtro guardado",
      description: `El filtro "${filter.name}" ha sido guardado correctamente.`,
    })
  }, [])

  // Función para manejar cambios en la configuración de notificaciones
  const handleNotificationSettingsChange = useCallback((settings) => {
    console.log("Nueva configuración de notificaciones:", settings)

    // Aquí se implementaría la lógica para guardar la configuración
    localStorage.setItem("notificationSettings", JSON.stringify(settings))

    toast({
      title: "Configuración guardada",
      description: "La configuración de notificaciones ha sido actualizada.",
    })
  }, [])

  // Función para enviar una notificación de prueba
  const handleSendTestNotification = useCallback(() => {
    const testNotification = {
      id: Date.now().toString(),
      title: "Notificación de prueba",
      message: "Esta es una notificación de prueba para verificar la configuración.",
      type: "info",
      timestamp: new Date(),
      read: false,
    }

    setNotificaciones([testNotification, ...notificaciones])

    return true
  }, [notificaciones])

  // Obtener lista de proveedores únicos
  const proveedoresUnicos = useMemo(() => {
    const proveedores = new Set<string>()
    productos.forEach((producto) => {
      if (producto.proveedor) {
        proveedores.add(producto.proveedor)
      }
    })
    return Array.from(proveedores)
  }, [productos])

  // Preparar datos para exportación
  const datosExportacion = useMemo(() => {
    return productosFiltrados.map((producto) => ({
      ...producto,
      fechaCaducidad: producto.fechaCaducidad
        ? new Date(producto.fechaCaducidad).toLocaleDateString()
        : "No especificada",
      fechaRecepcion: producto.fechaRecepcion
        ? new Date(producto.fechaRecepcion).toLocaleDateString()
        : "No especificada",
      precio: formatearPrecioCLP(producto.precio),
    }))
  }, [productosFiltrados])

  // Columnas para exportación
  const columnasExportacion = [
    { key: "nombre", header: "Nombre" },
    { key: "area", header: "Área" },
    { key: "categoria", header: "Categoría" },
    { key: "cantidad", header: "Cantidad" },
    { key: "stockMinimo", header: "Stock Mínimo" },
    { key: "stockMaximo", header: "Stock Máximo" },
    { key: "fechaCaducidad", header: "Fecha Caducidad" },
    { key: "fechaRecepcion", header: "Fecha Recepción" },
    { key: "proveedor", header: "Proveedor" },
    { key: "precio", header: "Precio" },
  ]

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Cargando inventario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6" ref={topRef}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
          <p className="text-gray-500">Gestiona el inventario de productos de tu clínica dental</p>
        </div>
        <div className="flex gap-2">
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <Home className="h-4 w-4" />
              {isMobile ? "" : "Inicio"}
            </Button>
          </Link>

          {!isMobile && (
            <Button variant="outline" className="gap-2" onClick={exportarInventarioPDF}>
              <FileDown className="h-4 w-4" />
              Exportar a PDF
            </Button>
          )}

          <Button
            variant="outline"
            className="relative"
            onClick={() => setMostrarNotificaciones(!mostrarNotificaciones)}
          >
            <Bell className="h-4 w-4" />
            {notificaciones.filter((n) => !n.read).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                {notificaciones.filter((n) => !n.read).length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Indicador de dispositivo (solo para desarrollo) */}
      <div className="fixed bottom-2 left-2 z-50 bg-black/70 text-white px-2 py-1 rounded text-xs">
        {isMobile && <Smartphone className="h-3 w-3 inline mr-1" />}
        {isTablet && <Tablet className="h-3 w-3 inline mr-1" />}
        {isDesktop && <Laptop className="h-3 w-3 inline mr-1" />}
        {isMobile ? "Móvil" : isTablet ? "Tablet" : "Escritorio"}
      </div>

      <Tabs value={tabActiva} onValueChange={setTabActiva}>
        <TabsList>
          <TabsTrigger value="productos">Productos</TabsTrigger>
          <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          <TabsTrigger value="devoluciones">Devoluciones</TabsTrigger>
          <TabsTrigger value="cierre-diario">Cierre diario</TabsTrigger>
        </TabsList>

        <TabsContent value="productos" className="pt-4 space-y-6">
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <h3 className="text-lg font-medium">Stock Mínimo</h3>
                  <Badge variant="destructive" className="ml-auto bg-red-600">
                    {contadores.stockMinimo}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-2">Productos por debajo del stock mínimo recomendado</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <h3 className="text-lg font-medium">Próximos a vencer</h3>
                  <Badge className="ml-auto bg-orange-500">{contadores.proximosVencer}</Badge>
                </div>
                <p className="text-sm text-gray-500 mt-2">Productos que vencerán en los próximos 30 días</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-teal-600" />
                  <h3 className="text-lg font-medium">Guardados</h3>
                  <Badge variant="secondary" className="ml-auto bg-teal-100 text-teal-800">
                    {contadores.guardados}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-2">Productos marcados como guardados para seguimiento</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
