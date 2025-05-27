"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import Link from "next/link"

interface ProductoUsado {
  id: string
  fecha: string
  producto: string
  cantidad: number
  precioUnitario: number
  precioTotal: number
  area: string
}

interface ConsumoArea {
  area: string
  cantidad: number
  valor: number
  productos: {
    [producto: string]: {
      cantidad: number
      valor: number
    }
  }
}

export default function ConsumoBox() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [productosUsados, setProductosUsados] = useState<ProductoUsado[]>([])
  const [consumoPorArea, setConsumoPorArea] = useState<ConsumoArea[]>([])
  const [areaSeleccionada, setAreaSeleccionada] = useState<string>("todas")
  const [periodoFiltro, setPeriodoFiltro] = useState<"dia" | "semana" | "mes" | "todo">("mes")
  const [datosGraficoBarras, setDatosGraficoBarras] = useState<any[]>([])
  const [datosGraficoPie, setDatosGraficoPie] = useState<any[]>([])

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#8dd1e1",
    "#a4de6c",
    "#d0ed57",
  ]

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser")
    if (!currentUser) {
      router.push("/login")
      return
    }
    setIsLoggedIn(true)
    cargarDatos()
  }, [router])

  useEffect(() => {
    if (productosUsados.length > 0) {
      calcularConsumoPorArea()
    }
  }, [productosUsados, periodoFiltro])

  useEffect(() => {
    prepararDatosGraficos()
  }, [consumoPorArea, areaSeleccionada])

  const cargarDatos = () => {
    let storedProductosUsados = JSON.parse(localStorage.getItem("productosUsados") || "[]")

    // Si no hay datos de productos usados, generar datos de ejemplo
    if (storedProductosUsados.length === 0) {
      storedProductosUsados = generarDatosEjemplo()
      localStorage.setItem("productosUsados", JSON.stringify(storedProductosUsados))
    }

    setProductosUsados(storedProductosUsados)
  }

  const generarDatosEjemplo = () => {
    const areas = ["Box 1", "Box 2", "Box 3", "Box 4", "Box 5", "Cirugía Maxilofacial", "Implantología", "Endodoncia"]
    const productos = [
      "Guantes de látex",
      "Mascarillas",
      "Algodón",
      "Anestesia",
      "Agujas",
      "Composite",
      "Resina",
      "Brackets",
      "Cemento dental",
      "Hilo retractor",
      "Gasas",
      "Jeringas",
      "Limas endodónticas",
    ]

    const ejemploProductosUsados: ProductoUsado[] = []

    // Generar 100 registros de ejemplo
    for (let i = 0; i < 100; i++) {
      const fechaAleatoria = new Date()
      fechaAleatoria.setDate(fechaAleatoria.getDate() - Math.floor(Math.random() * 30)) // Últimos 30 días

      const productoAleatorio = productos[Math.floor(Math.random() * productos.length)]
      const areaAleatoria = areas[Math.floor(Math.random() * areas.length)]
      const cantidadAleatoria = Math.floor(Math.random() * 5) + 1
      const precioUnitarioAleatorio = Math.floor(Math.random() * 50) + 10

      ejemploProductosUsados.push({
        id: `ejemplo-${i}`,
        fecha: fechaAleatoria.toISOString().split("T")[0],
        producto: productoAleatorio,
        cantidad: cantidadAleatoria,
        precioUnitario: precioUnitarioAleatorio,
        precioTotal: cantidadAleatoria * precioUnitarioAleatorio,
        area: areaAleatoria,
      })
    }

    return ejemploProductosUsados
  }

  const filtrarPorPeriodo = (datos: ProductoUsado[]) => {
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

  const calcularConsumoPorArea = () => {
    const productosFiltrados = filtrarPorPeriodo(productosUsados)
    const consumo: { [area: string]: ConsumoArea } = {}

    productosFiltrados.forEach((producto) => {
      if (!consumo[producto.area]) {
        consumo[producto.area] = {
          area: producto.area,
          cantidad: 0,
          valor: 0,
          productos: {},
        }
      }

      consumo[producto.area].cantidad += producto.cantidad
      consumo[producto.area].valor += producto.precioTotal

      if (!consumo[producto.area].productos[producto.producto]) {
        consumo[producto.area].productos[producto.producto] = {
          cantidad: 0,
          valor: 0,
        }
      }

      consumo[producto.area].productos[producto.producto].cantidad += producto.cantidad
      consumo[producto.area].productos[producto.producto].valor += producto.precioTotal
    })

    setConsumoPorArea(Object.values(consumo).sort((a, b) => b.valor - a.valor))
  }

  const prepararDatosGraficos = () => {
    // Datos para gráfico de barras (consumo por área)
    if (areaSeleccionada === "todas") {
      setDatosGraficoBarras(
        consumoPorArea.map((item) => ({
          name: item.area,
          cantidad: item.cantidad,
          valor: item.valor,
        })),
      )

      // Datos para gráfico circular (distribución por área)
      setDatosGraficoPie(
        consumoPorArea.map((item) => ({
          name: item.area,
          value: item.valor,
        })),
      )
    } else {
      // Si hay un área seleccionada, mostrar consumo por producto en esa área
      const areaData = consumoPorArea.find((item) => item.area === areaSeleccionada)

      if (areaData) {
        const productosDatos = Object.entries(areaData.productos)
          .map(([producto, datos]) => ({
            name: producto,
            cantidad: datos.cantidad,
            valor: datos.valor,
          }))
          .sort((a, b) => b.valor - a.valor)

        setDatosGraficoBarras(productosDatos)

        // Datos para gráfico circular (distribución por producto)
        setDatosGraficoPie(
          Object.entries(areaData.productos).map(([producto, datos]) => ({
            name: producto,
            value: datos.valor,
          })),
        )
      }
    }
  }

  const formatoMoneda = (valor: number) => {
    return `$${valor.toLocaleString()}`
  }

  return (
    <div className="container mx-auto p-4">
      {isLoggedIn ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Control de Consumo por Box/Área</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/")}>
                Volver al Inicio
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <Label>Período</Label>
                <Select
                  value={periodoFiltro}
                  onValueChange={(value: "dia" | "semana" | "mes" | "todo") => setPeriodoFiltro(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dia">Hoy</SelectItem>
                    <SelectItem value="semana">Última semana</SelectItem>
                    <SelectItem value="mes">Último mes</SelectItem>
                    <SelectItem value="todo">Todo el tiempo</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <Label>Área</Label>
                <Select value={areaSeleccionada} onValueChange={setAreaSeleccionada}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las áreas</SelectItem>
                    {consumoPorArea.map((item) => (
                      <SelectItem key={item.area} value={item.area}>
                        {item.area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {areaSeleccionada === "todas" ? "Consumo por Área" : `Consumo de Productos en ${areaSeleccionada}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datosGraficoBarras.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatoMoneda(Number(value))} />
                      <Bar dataKey="valor" fill="hsl(var(--dental-blue))" name="Valor" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {areaSeleccionada === "todas"
                    ? "Distribución de Consumo por Área"
                    : `Distribución de Productos en ${areaSeleccionada}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={datosGraficoPie.slice(0, 10)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={(entry) => entry.name}
                      >
                        {datosGraficoPie.slice(0, 10).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatoMoneda(Number(value))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {areaSeleccionada === "todas"
                  ? "Detalle de Consumo por Área"
                  : `Detalle de Consumo en ${areaSeleccionada}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{areaSeleccionada === "todas" ? "Área" : "Producto"}</TableHead>
                    <TableHead>Cantidad Total</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>% del Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {areaSeleccionada === "todas" ? (
                    consumoPorArea.length > 0 ? (
                      consumoPorArea.map((item) => {
                        const totalValor = consumoPorArea.reduce((sum, area) => sum + area.valor, 0)
                        const porcentaje = (item.valor / totalValor) * 100

                        return (
                          <TableRow key={item.area}>
                            <TableCell className="font-medium">{item.area}</TableCell>
                            <TableCell>{item.cantidad}</TableCell>
                            <TableCell>{formatoMoneda(item.valor)}</TableCell>
                            <TableCell>{porcentaje.toFixed(2)}%</TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          No hay datos de consumo disponibles
                        </TableCell>
                      </TableRow>
                    )
                  ) : (
                    (() => {
                      const areaData = consumoPorArea.find((item) => item.area === areaSeleccionada)

                      if (!areaData) {
                        return (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4">
                              No hay datos para esta área
                            </TableCell>
                          </TableRow>
                        )
                      }

                      const productos = Object.entries(areaData.productos)
                      const totalValor = productos.reduce((sum, [_, datos]) => sum + datos.valor, 0)

                      return productos.length > 0 ? (
                        productos
                          .sort(([_, a], [__, b]) => b.valor - a.valor)
                          .map(([producto, datos]) => {
                            const porcentaje = (datos.valor / totalValor) * 100

                            return (
                              <TableRow key={producto}>
                                <TableCell className="font-medium">{producto}</TableCell>
                                <TableCell>{datos.cantidad}</TableCell>
                                <TableCell>{formatoMoneda(datos.valor)}</TableCell>
                                <TableCell>{porcentaje.toFixed(2)}%</TableCell>
                              </TableRow>
                            )
                          })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            No hay productos registrados para esta área
                          </TableCell>
                        </TableRow>
                      )
                    })()
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

// Componente Label para mantener consistencia con el resto de la aplicación
function Label({ children, className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`text-sm font-medium leading-none mb-2 block ${className || ""}`} {...props}>
      {children}
    </label>
  )
}

// Componentes importados para mantener consistencia
function Table({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-auto">
      <table className="w-full caption-bottom text-sm" {...props}>
        {children}
      </table>
    </div>
  )
}

function TableHeader({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className="[&_tr]:border-b" {...props}>
      {children}
    </thead>
  )
}

function TableBody({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className="[&_tr:last-child]:border-0" {...props}>
      {children}
    </tbody>
  )
}

function TableRow({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted" {...props}>
      {children}
    </tr>
  )
}

function TableHead({ children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground" {...props}>
      {children}
    </th>
  )
}

function TableCell({ children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className="p-4 align-middle" {...props}>
      {children}
    </td>
  )
}
