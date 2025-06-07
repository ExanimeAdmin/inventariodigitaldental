"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, AlertCircle, AlertTriangle, Thermometer, Package } from "lucide-react"
import type { Producto } from "@/types/producto"

interface NotificationCenterProps {
  productos?: Producto[]
  demoMode?: boolean
}

interface Notification {
  id: string
  title: string
  message: string
  type: "error" | "warning" | "info"
  timestamp: Date
  read: boolean
}

export function NotificationCenter({ productos = [], demoMode = false }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Asegurarse de que productos es un array
  const productosArray = Array.isArray(productos) ? productos : []

  // Función segura para filtrar productos
  const safeFilter = (filterFn: (producto: Producto) => boolean) => {
    try {
      return productosArray.filter(filterFn)
    } catch (error) {
      console.error("Error al filtrar productos:", error)
      return []
    }
  }

  // Calcular días para vencer
  const calcularDiasParaVencer = (fechaCaducidad: string | null): number => {
    if (!fechaCaducidad) return 999
    const hoy = new Date()
    const fechaVencimiento = new Date(fechaCaducidad)
    return Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  }

  // Productos con stock bajo
  const stockBajo = safeFilter(
    (producto) =>
      typeof producto.stock === "number" &&
      typeof producto.stock_minimo === "number" &&
      producto.stock <= producto.stock_minimo,
  )

  // Productos vencidos o por vencer (en los próximos 30 días)
  const porVencer = safeFilter((producto) => {
    if (!producto.fecha_vencimiento) return false

    try {
      const fechaVencimiento = new Date(producto.fecha_vencimiento)
      const hoy = new Date()
      const treintaDias = new Date()
      treintaDias.setDate(hoy.getDate() + 30)

      return fechaVencimiento <= treintaDias
    } catch (error) {
      console.error("Error al procesar fecha de vencimiento:", error)
      return false
    }
  })

  // Productos que requieren refrigeración
  const refrigeracion = safeFilter((producto) => producto.requiere_refrigeracion === true)

  // Todos los productos con alguna alerta
  const todosConAlerta = [...new Set([...stockBajo, ...porVencer, ...refrigeracion])]

  useEffect(() => {
    const generatedNotifications: Notification[] = []

    // Productos con stock bajo
    if (stockBajo.length > 0) {
      generatedNotifications.push({
        id: "stock-bajo",
        title: "Stock bajo detectado",
        message: `${stockBajo.length} producto(s) tienen stock por debajo del mínimo recomendado`,
        type: "warning",
        timestamp: new Date(),
        read: false,
      })
    }

    // Productos próximos a vencer
    if (porVencer.length > 0) {
      generatedNotifications.push({
        id: "proximos-vencer",
        title: "Productos próximos a vencer",
        message: `${porVencer.length} producto(s) vencerán en los próximos 30 días`,
        type: "warning",
        timestamp: new Date(),
        read: false,
      })
    }

    // Productos vencidos
    const productosVencidos = productosArray.filter((p) => {
      if (!p || !p.fecha_vencimiento) return false
      const dias = calcularDiasParaVencer(p.fecha_vencimiento)
      return dias <= 0
    })

    if (productosVencidos.length > 0) {
      generatedNotifications.push({
        id: "vencidos",
        title: "Productos vencidos",
        message: `${productosVencidos.length} producto(s) han vencido y deben ser retirados`,
        type: "error",
        timestamp: new Date(),
        read: false,
      })
    }

    // Productos sin stock
    const productosSinStock = productosArray.filter((p) => {
      return p && typeof p.stock === "number" && p.stock === 0
    })

    if (productosSinStock.length > 0) {
      generatedNotifications.push({
        id: "sin-stock",
        title: "Productos sin stock",
        message: `${productosSinStock.length} producto(s) están agotados`,
        type: "error",
        timestamp: new Date(),
        read: false,
      })
    }

    setNotifications(generatedNotifications)
  }, [productos])

  // Marcar notificación como leída
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  // Eliminar notificación
  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  // Marcar todas como leídas
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  // Eliminar todas las notificaciones
  const clearAllNotifications = () => {
    setNotifications([])
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case "info":
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "error":
        return "border-red-200 bg-red-50"
      case "warning":
        return "border-orange-200 bg-orange-50"
      case "info":
        return "border-blue-200 bg-blue-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Centro de Notificaciones</span>
          {demoMode && (
            <Badge variant="outline" className="ml-2 bg-yellow-100">
              Demo
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Alertas y notificaciones del inventario</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              <span>Todas</span>
              <Badge variant="secondary" className="ml-1">
                {todosConAlerta.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              <span>Stock</span>
              <Badge variant="secondary" className="ml-1">
                {stockBajo.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="vencimiento" className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              <span>Vencimiento</span>
              <Badge variant="secondary" className="ml-1">
                {porVencer.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="refrigeracion" className="flex items-center gap-1">
              <Thermometer className="h-4 w-4" />
              <span>Refrigeración</span>
              <Badge variant="secondary" className="ml-1">
                {refrigeracion.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {todosConAlerta.length > 0 ? (
              <div className="space-y-2">
                {todosConAlerta.map((producto) => (
                  <NotificationItem key={producto.id} producto={producto} />
                ))}
              </div>
            ) : (
              <EmptyState message="No hay alertas activas" />
            )}
          </TabsContent>

          <TabsContent value="stock" className="mt-4">
            {stockBajo.length > 0 ? (
              <div className="space-y-2">
                {stockBajo.map((producto) => (
                  <NotificationItem
                    key={producto.id}
                    producto={producto}
                    message={`Stock bajo: ${producto.stock}/${producto.stock_minimo}`}
                    icon={<Package className="h-4 w-4 text-amber-500" />}
                  />
                ))}
              </div>
            ) : (
              <EmptyState message="No hay productos con stock bajo" />
            )}
          </TabsContent>

          <TabsContent value="vencimiento" className="mt-4">
            {porVencer.length > 0 ? (
              <div className="space-y-2">
                {porVencer.map((producto) => {
                  const fechaVencimiento = new Date(producto.fecha_vencimiento || "")
                  const hoy = new Date()
                  const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

                  let message = ""
                  let color = ""

                  if (diasRestantes < 0) {
                    message = `Vencido hace ${Math.abs(diasRestantes)} días`
                    color = "text-red-500"
                  } else if (diasRestantes === 0) {
                    message = "Vence hoy"
                    color = "text-red-500"
                  } else {
                    message = `Vence en ${diasRestantes} días`
                    color = diasRestantes <= 7 ? "text-amber-500" : "text-yellow-500"
                  }

                  return (
                    <NotificationItem
                      key={producto.id}
                      producto={producto}
                      message={message}
                      icon={<AlertTriangle className={`h-4 w-4 ${color}`} />}
                    />
                  )
                })}
              </div>
            ) : (
              <EmptyState message="No hay productos por vencer" />
            )}
          </TabsContent>

          <TabsContent value="refrigeracion" className="mt-4">
            {refrigeracion.length > 0 ? (
              <div className="space-y-2">
                {refrigeracion.map((producto) => (
                  <NotificationItem
                    key={producto.id}
                    producto={producto}
                    message="Requiere refrigeración"
                    icon={<Thermometer className="h-4 w-4 text-blue-500" />}
                  />
                ))}
              </div>
            ) : (
              <EmptyState message="No hay productos que requieran refrigeración" />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function NotificationItem({
  producto,
  message,
  icon,
}: {
  producto: Producto
  message?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
      <div className="flex items-center gap-2">
        {icon || <AlertCircle className="h-4 w-4 text-amber-500" />}
        <span className="font-medium">{producto.nombre}</span>
      </div>
      <div className="text-sm text-muted-foreground">
        {message || `Stock: ${producto.stock}/${producto.stock_minimo}`}
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
      <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
      <p>{message}</p>
    </div>
  )
}
