"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { AlertTriangle, TrendingUp, Package, Calendar, DollarSign, FileDown } from "lucide-react"
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
  entrega: string
  vencimiento: string
  proveedor: string
  precio: string
  observaciones: string
}

interface Compra {
  id: string
  fecha: string
  producto: string
  cantidad: number
  precioUnitario: number
  precioTotal: number
  area: string
  usuario: string
}

interface ProductoUsado {
  id: string
  fecha: string
  producto: string
  cantidad: number
  precioUnitario: number
  precioTotal: number
  area: string
}

export default function Informes() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userArea, setUserArea] = useState("")
  const [inventario, setInventario] = useState<ProductoInventario[]>([])
  const [compras, setCompras] = useState<Compra[]>([])
  const [productosUsados, setProductosUsados] = useState<ProductoUsado[]>([])
  const [periodoFiltro, setPeriodoFiltro] = useState<"dia" | "semana" | "mes" | "todo">("todo")
  const [areaFiltro, setAreaFiltro] = useState<string>("todas")
  const [gastoTotal, setGastoTotal] = useState(0)
  const [gastoProductosUsados, setGastoProductosUsados] = useState(0)
  const [gastoProductosVencidos, setGastoProductosVencidos] = useState(0)
  const [gastoProductosAgotados, setGastoProductosAgotados] = useState(0)
  const [productosVencidos, setProductosVencidos] = useState<ProductoInventario[]>([])
  const [productosAgotados, setProductosAgotados] = useState<ProductoInventario[]>([])
  const [productosBajoStock, setProductosBajoStock] = useState<ProductoInventario[]>([])
  const [productosMasUsados, setProductosMasUsados] = useState<{ producto: string; cantidad: number; area: string }[]>(
    [],
  )
  const [datosGrafico, setDatosGrafico] = useState<{ name: string; value: number }[]>([])
  const [gastoMes, setGastoMes] = useState(0)

  useEffect(() => {
    const currentUserJson = localStorage.getItem("currentUser")
    if (!currentUserJson) {
      router.push("/login")
      return
    }

    const userData = JSON.parse(currentUserJson)
    setIsAdmin(userData.username === "admin")

    // Obtener el área asignada al usuario
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const user = users.find((u: any) => u.username === userData.username)
    if (user && user.area) {
      setUserArea(user.area)
      setAreaFiltro(user.area)
    } else if (userData.username === "admin") {
      setUserArea("Todas")
    } else {
      setUserArea("Recepción")
      setAreaFiltro("Recepción")
    }

    setIsLoggedIn(true)
    cargarDatos()
  }, [router])

  useEffect(() => {
    if (inventario.length > 0 && productosUsados.length > 0 && compras.length > 0) {
      generarInformes()
      calcularGastos()
    }
  }, [inventario, productosUsados, compras, periodoFiltro, areaFiltro])

  const cargarDatos = () => {
    const storedInventario = JSON.parse(localStorage.getItem("inventario") || "[]")
    const storedCompras = JSON.parse(localStorage.getItem("compras") || "[]")
    const storedProductosUsados = JSON.parse(localStorage.getItem("productosUsados") || "[]")

    // Si no hay productos usados registrados, crear algunos de ejemplo
    if (storedProductosUsados.length === 0 && storedInventario.length > 0) {
      const ejemploProductosUsados = generarEjemploProductosUsados(storedInventario)
      localStorage.setItem("productosUsados", JSON.stringify(ejemploProductosUsados))
      setProductosUsados(ejemploProductosUsados)
    } else {
      setProductosUsados(storedProductosUsados)
    }

    setInventario(storedInventario)
    setCompras(storedCompras)
  }

  const generarEjemploProductosUsados = (inventario: ProductoInventario[]) => {
    const productosUsados: ProductoUsado[] = []
    const areas = ["Box 1", "Box 2", "Box 3", "Box 4", "Box 5", "Recepción", "Almacenamiento", "Cirugía Maxilofacial"]

    // Generar algunos ejemplos de productos usados en los últimos 30 días
    if (inventario.length > 0) {
      const hoy = new Date()

      for (let i = 0; i < 50; i++) {
        const randomProducto = inventario[Math.floor(Math.random() * inventario.length)]
        const randomDias = Math.floor(Math.random() * 30)
        const fecha = new Date()
        fecha.setDate(hoy.getDate() - randomDias)
        const randomArea = areas[Math.floor(Math.random() * areas.length)]

        productosUsados.push({
          id: Date.now() + i.toString(),
          fecha: fecha.toISOString().split("T")[0],
          producto: randomProducto.producto,
          cantidad: Math.floor(Math.random() * 5) + 1,
          precioUnitario: Number.parseFloat(randomProducto.precio) || 100,
          precioTotal: (Number.parseFloat(randomProducto.precio) || 100) * (Math.floor(Math.random() * 5) + 1),
          area: randomArea,
        })
      }
    }

    return productosUsados
  }

  const generarInformes = () => {
    // Filtrar por área si es necesario
    const inventarioFiltrado =
      areaFiltro !== "todas" ? inventario.filter((item) => item.area === areaFiltro) : inventario

    const productosUsadosFiltrados = filtrarPorPeriodo(
      areaFiltro !== "todas" ? productosUsados.filter((item) => item.area === areaFiltro) : productosUsados,
    )

    // Calcular gastos
    const gastoUsados = productosUsadosFiltrados.reduce((sum, item) => sum + item.precioTotal, 0)
    setGastoProductosUsados(gastoUsados)

    // Productos vencidos
    const hoy = new Date()
    const vencidos = inventarioFiltrado.filter((item) => {
      if (!item.vencimiento) return false
      const fechaVencimiento = new Date(item.vencimiento)
      return fechaVencimiento < hoy
    })
    setProductosVencidos(vencidos)

    // Calcular gasto en productos vencidos
    const gastoVencidos = vencidos.reduce((sum, item) => {
      return sum + (Number.parseFloat(item.precio) || 0) * item.cantidad
    }, 0)
    setGastoProductosVencidos(gastoVencidos)

    // Productos agotados
    const agotados = inventarioFiltrado.filter((item) => item.cantidad === 0)
    setProductosAgotados(agotados)

    // Calcular gasto en productos agotados
    const gastoAgotados = agotados.reduce((sum, item) => {
      return sum + (Number.parseFloat(item.precio) || 0)
    }, 0)
    setGastoProductosAgotados(gastoAgotados)

    // Productos con bajo stock
    const bajoStock = inventarioFiltrado.filter((item) => item.cantidad > 0 && item.cantidad <= item.stockMinimo)
    setProductosBajoStock(bajoStock)

    // Productos más usados
    const conteoProductos: Record<string, { cantidad: number; area: string }> = {}
    productosUsadosFiltrados.forEach((item) => {
      const key = item.producto
      if (conteoProductos[key]) {
        conteoProductos[key].cantidad += item.cantidad
      } else {
        conteoProductos[key] = {
          cantidad: item.cantidad,
          area: item.area,
        }
      }
    })

    const productosMasUsadosArray = Object.entries(conteoProductos)
      .map(([producto, datos]) => ({
        producto,
        cantidad: datos.cantidad,
        area: datos.area,
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10)

    setProductosMasUsados(productosMasUsadosArray)

    // Datos para el gráfico
    setDatosGrafico(
      productosMasUsadosArray.map((item) => ({
        name: item.producto,
        value: item.cantidad,
      })),
    )
  }

  const calcularGastos = () => {
    // Filtrar compras por área si es necesario
    const comprasFiltradas =
      areaFiltro !== "todas"
        ? compras.filter((compra) => compra.area === areaFiltro)
        : userArea !== "Todas" && !isAdmin
          ? compras.filter((compra) => compra.area === userArea)
          : compras

    // Calcular gasto total con precisión
    const total = comprasFiltradas.reduce((sum, compra) => {
      // Recalcular el precio total para asegurar precisión
      const precioTotalCalculado = compra.cantidad * compra.precioUnitario
      return sum + precioTotalCalculado
    }, 0)

    setGastoTotal(total)

    // Calcular gasto del mes actual con la misma precisión
    const hoy = new Date()
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)

    const gastoMesActual = comprasFiltradas.reduce((sum, compra) => {
      const fechaCompra = new Date(compra.fecha)
      if (fechaCompra >= primerDiaMes && fechaCompra <= ultimoDiaMes) {
        // Recalcular el precio total para asegurar precisión
        const precioTotalCalculado = compra.cantidad * compra.precioUnitario
        return sum + precioTotalCalculado
      }
      return sum
    }, 0)

    setGastoMes(gastoMesActual)
  }

  const filtrarPorPeriodo = (datos: any[]) => {
    const hoy = new Date()

    switch (periodoFiltro) {
      case "dia":
        return datos.filter((item) => {
          const fecha = new Date(item.fecha)
          return fecha.toDateString() === hoy.toDateString()
        })

      case "semana":
        const unaSemanaAtras = new Date()
        unaSemanaAtras.setDate(hoy.getDate() - 7)
        return datos.filter((item) => {
          const fecha = new Date(item.fecha)
          return fecha >= unaSemanaAtras && fecha <= hoy
        })

      case "mes":
        const unMesAtras = new Date()
        unMesAtras.setMonth(hoy.getMonth() - 1)
        return datos.filter((item) => {
          const fecha = new Date(item.fecha)
          return fecha >= unMesAtras && fecha <= hoy
        })

      default:
        return datos
    }
  }

  const exportarPDF = (tipo: string) => {
    const doc = new jsPDF()

    // Título
    doc.setFontSize(18)
    doc.text(`Informe de ${tipo}`, 14, 22)

    // Fecha de generación
    doc.setFontSize(11)
    doc.text(`Generado: ${new Date().toLocaleDateString("es-ES")}`, 14, 30)

    // Filtros aplicados
    let filtrosTexto = "Filtros aplicados: "
    filtrosTexto += `Período: ${periodoFiltro === "dia" ? "Hoy" : periodoFiltro === "semana" ? "Última semana" : periodoFiltro === "mes" ? "Último mes" : "Todo el tiempo"}, `
    filtrosTexto += `Área: ${areaFiltro === "todas" ? "Todas" : areaFiltro}`

    doc.text(filtrosTexto, 14, 38)

    // Resumen financiero
    doc.text(`Gasto Total: $${gastoTotal.toLocaleString()}`, 14, 46)

    // Tabla
    let tableData: any[] = []
    let tableHeaders: string[] = []

    switch (tipo) {
      case "Productos Usados":
        tableHeaders = ["Fecha", "Producto", "Cantidad", "Precio Unit.", "Total", "Área"]
        tableData = filtrarPorPeriodo(
          areaFiltro !== "todas" ? productosUsados.filter((item) => item.area === areaFiltro) : productosUsados,
        ).map((item) => [
          item.fecha,
          item.producto,
          item.cantidad.toString(),
          `$${item.precioUnitario.toLocaleString()}`,
          `$${item.precioTotal.toLocaleString()}`,
          item.area,
        ])
        break

      case "Productos Vencidos":
        tableHeaders = ["Producto", "Categoría", "Área", "Cantidad", "Vencimiento", "Precio", "Valor Total"]
        tableData = productosVencidos.map((item) => [
          item.producto,
          item.categoria,
          item.area,
          item.cantidad.toString(),
          item.vencimiento,
          `$${Number.parseFloat(item.precio).toLocaleString()}`,
          `$${(Number.parseFloat(item.precio) * item.cantidad).toLocaleString()}`,
        ])
        break

      case "Productos Agotados":
        tableHeaders = ["Producto", "Categoría", "Área", "Precio", "Proveedor"]
        tableData = productosAgotados.map((item) => [
          item.producto,
          item.categoria,
          item.area,
          `$${Number.parseFloat(item.precio).toLocaleString()}`,
          item.proveedor,
        ])
        break

      case "Productos Más Usados":
        tableHeaders = ["Producto", "Cantidad Usada", "Área"]
        tableData = productosMasUsados.map((item) => [item.producto, item.cantidad.toString(), item.area])
        break
    }

    // @ts-ignore - jspdf-autotable types are not included
    doc.autoTable({
      startY: 54,
      head: [tableHeaders],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [0, 150, 214], // Color dental-blue
        textColor: [255, 255, 255],
      },
      styles: {
        fontSize: 10,
      },
    })

    doc.save(`informe-${tipo.toLowerCase().replace(/\s+/g, "-")}.pdf`)
  }

  return (
    <div className="container mx-auto p-4">
      {isLoggedIn ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Informes de Productos {isAdmin && "(Admin)"}</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/")}>
                Volver al Inicio
              </Button>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Filtros</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Card className="p-4">
                <Label>Filtrar por Período</Label>
                <Select
                  value={periodoFiltro}
                  onValueChange={(value: "dia" | "semana" | "mes" | "todo") => setPeriodoFiltro(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dia">Hoy</SelectItem>
                    <SelectItem value="semana">Última semana</SelectItem>
                    <SelectItem value="mes">Último mes</SelectItem>
                    <SelectItem value="todo">Todo el tiempo</SelectItem>
                  </SelectContent>
                </Select>
              </Card>

              <Card className="p-4">
                <Label>Filtrar por Área</Label>
                <Select
                  value={areaFiltro}
                  onValueChange={setAreaFiltro}
                  disabled={!isAdmin && userArea !== "Recepción" && userArea !== "Todas"}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar área" />
                  </SelectTrigger>
                  <SelectContent>
                    {isAdmin || userArea === "Recepción" || userArea === "Todas" ? (
                      <>
                        <SelectItem value="todas">Todas las áreas</SelectItem>
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
                      <SelectItem value={userArea}>{userArea}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-t-4 border-t-dental-red">
                <CardHeader className="bg-red-50 dark:bg-red-950/30 pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-dental-red">
                    <DollarSign className="h-5 w-5 text-dental-red" />
                    Gasto Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">${gastoTotal.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-dental-blue">
                <CardHeader className="bg-blue-50 dark:bg-blue-950/30 pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-dental-blue">
                    <Package className="h-5 w-5 text-dental-blue" />
                    Productos Usados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">${gastoProductosUsados.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-dental-yellow">
                <CardHeader className="bg-yellow-50 dark:bg-yellow-950/30 pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-dental-yellow">
                    <AlertTriangle className="h-5 w-5 text-dental-yellow" />
                    Productos Vencidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">${gastoProductosVencidos.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Tabs defaultValue="usados" className="mb-6">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-4">
              <TabsTrigger value="usados">Productos Usados</TabsTrigger>
              <TabsTrigger value="vencidos">Productos Vencidos</TabsTrigger>
              <TabsTrigger value="agotados">Productos Agotados</TabsTrigger>
              <TabsTrigger value="masUsados">Productos Más Usados</TabsTrigger>
            </TabsList>

            <TabsContent value="usados">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Productos Usados</CardTitle>
                  <Button onClick={() => exportarPDF("Productos Usados")}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto max-h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Precio Unitario</TableHead>
                          <TableHead>Precio Total</TableHead>
                          <TableHead>Área</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtrarPorPeriodo(
                          areaFiltro !== "todas"
                            ? productosUsados.filter((item) => item.area === areaFiltro)
                            : productosUsados,
                        ).length > 0 ? (
                          filtrarPorPeriodo(
                            areaFiltro !== "todas"
                              ? productosUsados.filter((item) => item.area === areaFiltro)
                              : productosUsados,
                          ).map((item) => (
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
                              <TableCell>{item.area}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4">
                              No hay productos usados en este período
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vencidos">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Productos Vencidos</CardTitle>
                  <Button onClick={() => exportarPDF("Productos Vencidos")}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto max-h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Área</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Fecha Vencimiento</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Valor Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productosVencidos.length > 0 ? (
                          productosVencidos.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.producto}</TableCell>
                              <TableCell>{item.categoria}</TableCell>
                              <TableCell>{item.area}</TableCell>
                              <TableCell>{item.cantidad}</TableCell>
                              <TableCell className="text-red-600 font-medium">{item.vencimiento}</TableCell>
                              <TableCell>${Number.parseFloat(item.precio).toLocaleString()}</TableCell>
                              <TableCell className="font-medium">
                                ${(Number.parseFloat(item.precio) * item.cantidad).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4">
                              No hay productos vencidos
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agotados">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Productos Agotados</CardTitle>
                  <Button onClick={() => exportarPDF("Productos Agotados")}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto max-h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Área</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Proveedor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productosAgotados.length > 0 ? (
                          productosAgotados.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.producto}</TableCell>
                              <TableCell>{item.categoria}</TableCell>
                              <TableCell>{item.area}</TableCell>
                              <TableCell>${Number.parseFloat(item.precio).toLocaleString()}</TableCell>
                              <TableCell>{item.proveedor}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4">
                              No hay productos agotados
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="masUsados">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Productos Más Usados</CardTitle>
                  <Button onClick={() => exportarPDF("Productos Más Usados")}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="h-80 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={datosGrafico}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(var(--dental-purple))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="overflow-x-auto max-h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Cantidad Usada</TableHead>
                          <TableHead>Área</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productosMasUsados.length > 0 ? (
                          productosMasUsados.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.producto}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span>{item.cantidad}</span>
                                  {index === 0 && <TrendingUp className="h-4 w-4 text-green-600" />}
                                </div>
                              </TableCell>
                              <TableCell>{item.area}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-4">
                              No hay datos de productos usados
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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

function Label({ children, className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`text-sm font-medium leading-none mb-2 block ${className || ""}`} {...props}>
      {children}
    </label>
  )
}
