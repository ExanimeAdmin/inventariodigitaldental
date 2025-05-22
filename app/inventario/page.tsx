"use client"

import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AddProductForm } from "@/components/add-product-form"
import {
  Home,
  Search,
  Filter,
  AlertCircle,
  Clock,
  Bookmark,
  Edit,
  Trash2,
  X,
  AlertTriangle,
  RefreshCcw,
  FileDown,
  ArrowUp,
  ShoppingCart,
  Snowflake,
} from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

// Añadir la función para verificar refrigeración en el componente de inventario
// Importar la función desde el componente add-product-form
import { requiereRefrigeracionProducto } from "@/components/add-product-form"

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
const ProductoRow = memo(
  ({
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
  }) => {
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
          {producto.observaciones && (
            <div className="text-xs text-gray-500 mt-1 max-w-xs">{producto.observaciones}</div>
          )}
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
  },
)

ProductoRow.displayName = "ProductoRow"

export default function InventarioPage() {
  // Referencias para desplazamiento
  const topRef = useRef(null)
  const tablaRef = useRef(null)

  // Usuario actual (simulado)
  const usuarioActual: Usuario = {
    id: "user1",
    nombre: "Admin",
    rol: "administrador",
    clinicaId: "1",
  }

  // Estados
  const [productos, setProductos] = useState<Producto[]>([])
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
  const [cargando, setCargando] = useState(true)

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true)
      try {
        const storedProductos = localStorage.getItem("inventario")
        const storedCompras = localStorage.getItem("compras")

        if (storedProductos) {
          setProductos(JSON.parse(storedProductos))
        }

        if (storedCompras) {
          setCompras(JSON.parse(storedCompras))
        }
      } catch (e) {
        console.error("Error al cargar datos del localStorage:", e)
      } finally {
        setCargando(false)
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
    if (!cargando) {
      localStorage.setItem("inventario", JSON.stringify(productos))
    }
  }, [productos, cargando])

  useEffect(() => {
    if (!cargando) {
      localStorage.setItem("compras", JSON.stringify(compras))
    }
  }, [compras, cargando])

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

        // Añadir el producto a la lista
        setProductos((prevProductos) => [...prevProductos, productoCompleto])

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
    [usuarioActual.clinicaId],
  )

  // Función para guardar/desguardar un producto
  const toggleGuardarProducto = useCallback(
    (id: string) => {
      const productoOriginal = productos.find((p) => p.id === id) || null

      setProductos((prevProductos) => prevProductos.map((p) => (p.id === id ? { ...p, guardado: !p.guardado } : p)))

      setUltimaAccion({
        tipo: "guardar",
        producto: productoOriginal,
      })
    },
    [productos],
  )

  // Función para incrementar la cantidad de un producto
  const incrementarCantidad = useCallback((id: string) => {
    setProductos((prevProductos) => {
      const producto = prevProductos.find((p) => p.id === id)
      if (!producto) return prevProductos

      // Verificar si la cantidad ya alcanzó el stock máximo
      if (producto.stockMaximo && producto.cantidad >= producto.stockMaximo) {
        toast({
          title: "Stock máximo alcanzado",
          description: `No se puede incrementar más. El stock máximo es ${producto.stockMaximo}.`,
          variant: "destructive",
        })
        return prevProductos
      }

      const productoOriginal = { ...producto }
      setUltimaAccion({
        tipo: "incrementar",
        producto: productoOriginal,
      })

      return prevProductos.map((p) => (p.id === id ? { ...p, cantidad: p.cantidad + 1 } : p))
    })
  }, [])

  // Función para decrementar la cantidad de un producto
  const decrementarCantidad = useCallback((id: string) => {
    setProductos((prevProductos) => {
      const producto = prevProductos.find((p) => p.id === id)
      if (!producto || producto.cantidad <= 0) return prevProductos

      const productoOriginal = { ...producto }
      setUltimaAccion({
        tipo: "decrementar",
        producto: productoOriginal,
      })

      return prevProductos.map((p) => (p.id === id ? { ...p, cantidad: p.cantidad - 1 } : p))
    })
  }, [])

  // Función para actualizar un producto
  const actualizarProducto = useCallback(() => {
    if (!productoEditando) return

    setProductos((prevProductos) => prevProductos.map((p) => (p.id === productoEditando.id ? productoEditando : p)))

    setMostrarDialogoEditar(false)
    setUltimaAccion({
      tipo: "editar",
      producto: productoSeleccionado,
    })

    toast({
      title: "Producto actualizado",
      description: `${productoEditando.nombre} ha sido actualizado correctamente.`,
    })
  }, [productoEditando, productoSeleccionado])

  // Función para eliminar un producto
  const eliminarProducto = useCallback(() => {
    if (!productoSeleccionado) return

    setProductos((prevProductos) => prevProductos.filter((p) => p.id !== productoSeleccionado.id))
    setMostrarDialogoEliminar(false)
    setUltimaAccion({
      tipo: "eliminar",
      producto: productoSeleccionado,
    })

    toast({
      title: "Producto eliminado",
      description: `${productoSeleccionado.nombre} ha sido eliminado del inventario.`,
    })
  }, [productoSeleccionado])

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

    // Actualizar inventario
    setProductos((prevProductos) =>
      prevProductos.map((p) => {
        if (p.id === compraForm.productoId) {
          return {
            ...p,
            cantidad: p.cantidad + compraForm.cantidad,
            proveedor: compraForm.proveedor || p.proveedor,
          }
        }
        return p
      }),
    )

    toast({
      title: "Compra registrada",
      description: `Se ha registrado la compra de ${compraForm.cantidad} unidades de ${producto.nombre}`,
    })

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
  }, [compraForm, productos, usuarioActual.nombre])

  // Función para deshacer la última acción
  const deshacerUltimaAccion = useCallback(() => {
    if (!ultimaAccion.tipo || !ultimaAccion.producto) return

    switch (ultimaAccion.tipo) {
      case "agregar":
        setProductos((prevProductos) => prevProductos.filter((p) => p.id !== ultimaAccion.producto?.id))
        break
      case "editar":
        if (ultimaAccion.producto) {
          setProductos((prevProductos) =>
            prevProductos.map((p) => (p.id === ultimaAccion.producto?.id ? ultimaAccion.producto : p)),
          )
        }
        break
      case "eliminar":
        if (ultimaAccion.producto) {
          setProductos((prevProductos) => [...prevProductos, ultimaAccion.producto])
        }
        break
      case "incrementar":
      case "decrementar":
        if (ultimaAccion.producto) {
          setProductos((prevProductos) =>
            prevProductos.map((p) =>
              p.id === ultimaAccion.producto?.id ? { ...p, cantidad: ultimaAccion.producto.cantidad } : p,
            ),
          )
        }
        break
      case "guardar":
        if (ultimaAccion.producto) {
          setProductos((prevProductos) =>
            prevProductos.map((p) =>
              p.id === ultimaAccion.producto?.id ? { ...p, guardado: ultimaAccion.producto.guardado } : p,
            ),
          )
        }
        break
    }

    toast({
      title: "Acción deshecha",
      description: "La última acción ha sido deshecha correctamente.",
    })

    setUltimaAccion({ tipo: "", producto: null })
  }, [ultimaAccion])

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

  if (cargando) {
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
              Volver al inicio
            </Button>
          </Link>
          <Button variant="outline" className="gap-2" onClick={exportarInventarioPDF}>
            <FileDown className="h-4 w-4" />
            Exportar a PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="productos">
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
              <AddProductForm clinicaId={usuarioActual.clinicaId} onProductAdded={handleProductoAgregado} />

              {/* Botón para registrar compra */}
              <Button className="gap-2" variant="outline" onClick={() => setMostrarDialogoCompra(true)}>
                <ShoppingCart className="h-4 w-4" />
                Registrar Compra
              </Button>

              {/* Botón para deshacer */}
              {ultimaAccion.tipo && (
                <Button variant="outline" className="flex items-center gap-2" onClick={deshacerUltimaAccion}>
                  <RefreshCcw className="h-4 w-4" />
                  Deshacer
                </Button>
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
                      <SelectContent className="max-h-60 overflow-y-auto">
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
                      <SelectContent className="max-h-60 overflow-y-auto">
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
                        {contadores.stockMinimo > 0 && (
                          <Badge variant="destructive" className="ml-1 bg-red-600">
                            {contadores.stockMinimo}
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
                        {contadores.proximosVencer > 0 && (
                          <Badge className="ml-1 bg-orange-500">{contadores.proximosVencer}</Badge>
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
                        {contadores.guardados > 0 && (
                          <Badge variant="secondary" className="ml-1 bg-teal-100 text-teal-800">
                            {contadores.guardados}
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
          {contadores.stockMinimo > 0 && !filtroStockMinimo && (
            <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/20 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                Hay {contadores.stockMinimo} productos por debajo del stock mínimo.{" "}
                <Button variant="link" className="p-0 h-auto text-red-600" onClick={() => setFiltroStockMinimo(true)}>
                  Ver productos
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {contadores.proximosVencer > 0 && !filtroProximoVencer && (
            <Alert className="bg-orange-50 dark:bg-orange-950/20 border-orange-200">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription>
                Hay {contadores.proximosVencer} productos próximos a vencer en los siguientes 30 días.{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-orange-600"
                  onClick={() => setFiltroProximoVencer(true)}
                >
                  Ver productos
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Tabla de productos */}
          <div className="rounded-md border overflow-auto max-h-[600px]" ref={tablaRef}>
            <Table>
              <TableHeader className="sticky top-0 bg-white dark:bg-gray-950 z-10">
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Stock Mínimo</TableHead>
                  <TableHead>Stock Máximo</TableHead>
                  <TableHead>Fecha Caducidad</TableHead>
                  <TableHead>Fecha Recepción</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-4">
                      No se encontraron productos con los filtros seleccionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  productosFiltrados.map((producto) => {
                    // Determinar si el producto está por debajo del stock mínimo
                    const bajoStock = producto.cantidad <= producto.stockMinimo

                    // Determinar si el producto está próximo a vencer
                    const hoy = new Date()
                    const fechaVencimiento = producto.fechaCaducidad ? new Date(producto.fechaCaducidad) : null
                    const diasParaVencer = fechaVencimiento
                      ? Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
                      : 999
                    const proximoAVencer = diasParaVencer <= 30 && diasParaVencer > 0

                    // Verificar si el producto requiere refrigeración
                    const requiereRefrigeracion =
                      producto.refrigeracion || requiereRefrigeracionProducto(producto.nombre)

                    return (
                      <ProductoRow
                        key={producto.id}
                        producto={producto}
                        bajoStock={bajoStock}
                        proximoAVencer={proximoAVencer}
                        diasParaVencer={diasParaVencer}
                        requiereRefrigeracion={requiereRefrigeracion}
                        toggleGuardarProducto={toggleGuardarProducto}
                        decrementarCantidad={decrementarCantidad}
                        incrementarCantidad={incrementarCantidad}
                        handleEditar={handleEditar}
                        handleEliminar={handleEliminar}
                      />
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Diálogo para editar producto */}
          <Dialog open={mostrarDialogoEditar} onOpenChange={setMostrarDialogoEditar}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar producto</DialogTitle>
              </DialogHeader>

              {productoEditando && (
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-nombre">Nombre</Label>
                    <Input
                      id="edit-nombre"
                      value={productoEditando.nombre}
                      onChange={(e) => setProductoEditando({ ...productoEditando, nombre: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-cantidad">Cantidad</Label>
                    <Input
                      id="edit-cantidad"
                      type="number"
                      value={productoEditando.cantidad}
                      onChange={(e) => setProductoEditando({ ...productoEditando, cantidad: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-area">Área</Label>
                    <Select
                      value={productoEditando.area}
                      onValueChange={(value) => setProductoEditando({ ...productoEditando, area: value })}
                    >
                      <SelectTrigger id="edit-area">
                        <SelectValue placeholder="Seleccionar área" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {areas.map((area) => (
                          <SelectItem key={area} value={area}>
                            {area}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-categoria">Categoría</Label>
                    <Select
                      value={productoEditando.categoria}
                      onValueChange={(value) => setProductoEditando({ ...productoEditando, categoria: value })}
                    >
                      <SelectTrigger id="edit-categoria">
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {categorias.map((categoria) => (
                          <SelectItem key={categoria} value={categoria}>
                            {categoria}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-stockMinimo">Stock Mínimo</Label>
                    <Input
                      id="edit-stockMinimo"
                      type="number"
                      value={productoEditando.stockMinimo}
                      onChange={(e) =>
                        setProductoEditando({ ...productoEditando, stockMinimo: Number(e.target.value) })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-precio">Precio</Label>
                    <Input
                      id="edit-precio"
                      type="number"
                      step="0.01"
                      value={productoEditando.precio}
                      onChange={(e) => setProductoEditando({ ...productoEditando, precio: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-proveedor">Proveedor</Label>
                    <Input
                      id="edit-proveedor"
                      value={productoEditando.proveedor || ""}
                      onChange={(e) => setProductoEditando({ ...productoEditando, proveedor: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-fechaCaducidad">Fecha de Caducidad</Label>
                    <Input
                      id="edit-fechaCaducidad"
                      type="date"
                      value={productoEditando.fechaCaducidad || ""}
                      onChange={(e) => setProductoEditando({ ...productoEditando, fechaCaducidad: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-fechaRecepcion">Fecha de Recepción</Label>
                    <Input
                      id="edit-fechaRecepcion"
                      type="date"
                      value={productoEditando.fechaRecepcion || ""}
                      onChange={(e) => setProductoEditando({ ...productoEditando, fechaRecepcion: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-stockMaximo">Stock Máximo</Label>
                    <Input
                      id="edit-stockMaximo"
                      type="number"
                      value={productoEditando.stockMaximo || ""}
                      onChange={(e) =>
                        setProductoEditando({ ...productoEditando, stockMaximo: Number(e.target.value) })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-refrigeracion">Refrigeración</Label>
                    <Select
                      value={productoEditando.refrigeracion ? "true" : "false"}
                      onValueChange={(value) =>
                        setProductoEditando({ ...productoEditando, refrigeracion: value === "true" })
                      }
                    >
                      <SelectTrigger id="edit-refrigeracion">
                        <SelectValue placeholder="¿Requiere refrigeración?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sí</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="edit-observaciones">Observaciones</Label>
                    <Textarea
                      id="edit-observaciones"
                      value={productoEditando.observaciones || ""}
                      onChange={(e) => setProductoEditando({ ...productoEditando, observaciones: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="edit-descripcion">Descripción</Label>
                    <Textarea
                      id="edit-descripcion"
                      value={productoEditando.descripcion || ""}
                      onChange={(e) => setProductoEditando({ ...productoEditando, descripcion: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setMostrarDialogoEditar(false)}>
                  Cancelar
                </Button>
                <Button onClick={actualizarProducto}>Guardar cambios</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Diálogo para confirmar eliminación */}
          <Dialog open={mostrarDialogoEliminar} onOpenChange={setMostrarDialogoEliminar}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Confirmar eliminación</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p>¿Estás seguro de que deseas eliminar el producto "{productoSeleccionado?.nombre}"?</p>
                <p className="text-sm text-gray-500 mt-2">Esta acción no se puede deshacer.</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setMostrarDialogoEliminar(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={eliminarProducto}>
                  Eliminar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Diálogo para registrar compra */}
          <Dialog open={mostrarDialogoCompra} onOpenChange={setMostrarDialogoCompra}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Nueva Compra</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="productoId">Producto *</Label>
                  <Select
                    value={compraForm.productoId}
                    onValueChange={(value) => handleCompraSelectChange("productoId", value)}
                  >
                    <SelectTrigger id="productoId">
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {productos.map((producto) => (
                        <SelectItem key={producto.id} value={producto.id}>
                          {producto.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cantidad">Cantidad *</Label>
                  <Input
                    id="cantidad"
                    name="cantidad"
                    type="number"
                    min="1"
                    value={compraForm.cantidad}
                    onChange={handleCompraChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precioUnitario">Precio Unitario *</Label>
                  <Input
                    id="precioUnitario"
                    name="precioUnitario"
                    type="number"
                    min="0"
                    step="1"
                    value={compraForm.precioUnitario}
                    onChange={handleCompraChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha de Compra</Label>
                  <Input id="fecha" name="fecha" type="date" value={compraForm.fecha} onChange={handleCompraChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proveedor">Proveedor</Label>
                  <Input
                    id="proveedor"
                    name="proveedor"
                    value={compraForm.proveedor}
                    onChange={handleCompraChange}
                    list="proveedores-list"
                  />
                  <datalist id="proveedores-list">
                    <option value="Dental Chile" />
                    <option value="Medical Supplies Inc." />
                    <option value="Pharma Plus" />
                    <option value="Dental Solutions" />
                    <option value="Ortho Specialists" />
                    <option value="Implant Tech" />
                    <option value="Dental Depot" />
                    <option value="Odonto Supply" />
                    <option value="Clínica Dental Proveedores" />
                    <option value="Dental Express" />
                  </datalist>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area">Área *</Label>
                  <Select value={compraForm.area} onValueChange={(value) => handleCompraSelectChange("area", value)}>
                    <SelectTrigger id="area">
                      <SelectValue placeholder="Seleccionar área" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {areas.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {compraForm.productoId && compraForm.cantidad > 0 && compraForm.precioUnitario > 0 && (
                  <div className="col-span-2 p-4 bg-gray-50 rounded-md">
                    <p className="font-medium">Resumen de compra:</p>
                    <p>Total: {formatearPrecioCLP(compraForm.cantidad * compraForm.precioUnitario)}</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setMostrarDialogoCompra(false)}>
                  Cancelar
                </Button>
                <Button onClick={registrarCompra}>Registrar Compra</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="pedidos" className="pt-4">
          <div className="border rounded-lg p-8 text-center text-gray-500">
            <h3 className="text-lg font-medium mb-2">Módulo de Pedidos</h3>
            <p>Esta funcionalidad estará disponible próximamente.</p>
            <Button className="mt-4" onClick={() => (window.location.href = "/inventario/pedidos")}>
              Ir a Pedidos
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="devoluciones" className="pt-4">
          <div className="border rounded-lg p-8 text-center text-gray-500">
            <h3 className="text-lg font-medium mb-2">Módulo de Devoluciones</h3>
            <p>Esta funcionalidad estará disponible próximamente.</p>
            <Button className="mt-4" onClick={() => (window.location.href = "/inventario/devoluciones")}>
              Ir a Devoluciones
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="cierre-diario" className="pt-4">
          <div className="border rounded-lg p-8 text-center text-gray-500">
            <h3 className="text-lg font-medium mb-2">Módulo de Cierre Diario</h3>
            <p>Esta funcionalidad estará disponible próximamente.</p>
            <Button className="mt-4" onClick={() => (window.location.href = "/inventario/cierre-diario")}>
              Ir a Cierre Diario
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Botón flotante para volver arriba */}
      {mostrarBotonSubir && (
        <Button className="fixed bottom-6 right-6 rounded-full w-12 h-12 shadow-lg" onClick={scrollToTop}>
          <ArrowUp className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
}
