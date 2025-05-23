"use client"

import { useState, useEffect } from "react"
import { Bell, Settings, X, AlertCircle, Clock, Mail, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Product } from "./inventory-manager"

// Tipos
type NotificationType = "lowStock" | "expiration" | "system"
type NotificationChannel = "app" | "email" | "sms"

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  date: Date
  read: boolean
  productId?: string
}

interface NotificationPreferences {
  channels: {
    app: boolean
    email: boolean
    sms: boolean
  }
  thresholds: {
    lowStockPercentage: number
    expirationDays: number
  }
  types: {
    lowStock: boolean
    expiration: boolean
    system: boolean
  }
}

interface NotificationCenterProps {
  products: Product[]
}

export function NotificationCenter({ products }: NotificationCenterProps) {
  // Estado para las notificaciones
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    channels: {
      app: true,
      email: false,
      sms: false,
    },
    thresholds: {
      lowStockPercentage: 20,
      expirationDays: 30,
    },
    types: {
      lowStock: true,
      expiration: true,
      system: true,
    },
  })
  const [showSettings, setShowSettings] = useState(false)
  const [emailAddress, setEmailAddress] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // Generar notificaciones basadas en los productos
  useEffect(() => {
    const newNotifications: Notification[] = []

    // Notificaciones de stock bajo
    if (preferences.types.lowStock) {
      products.forEach((product) => {
        if (product.stock <= product.minStock) {
          newNotifications.push({
            id: `lowstock-${product.id}-${Date.now()}`,
            type: "lowStock",
            title: "Stock bajo",
            message: `El producto "${product.name}" está por debajo del stock mínimo (${product.stock}/${product.minStock}).`,
            date: new Date(),
            read: false,
            productId: product.id,
          })
        }
      })
    }

    // Notificaciones de productos próximos a vencer
    if (preferences.types.expiration) {
      products.forEach((product) => {
        if (product.expirationDate) {
          const expirationDate = new Date(product.expirationDate)
          const today = new Date()
          const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

          if (daysUntilExpiration <= preferences.thresholds.expirationDays && daysUntilExpiration > 0) {
            newNotifications.push({
              id: `expiration-${product.id}-${Date.now()}`,
              type: "expiration",
              title: "Producto próximo a vencer",
              message: `El producto "${product.name}" vencerá en ${daysUntilExpiration} días (${new Date(
                product.expirationDate,
              ).toLocaleDateString()}).`,
              date: new Date(),
              read: false,
              productId: product.id,
            })
          }
        }
      })
    }

    // Añadir notificaciones del sistema (simuladas)
    if (preferences.types.system && Math.random() > 0.7) {
      newNotifications.push({
        id: `system-${Date.now()}`,
        type: "system",
        title: "Actualización del sistema",
        message: "Se ha actualizado el sistema de inventario a la versión 2.0.",
        date: new Date(),
        read: false,
      })
    }

    // Actualizar el estado con las nuevas notificaciones
    if (newNotifications.length > 0) {
      setNotifications((prev) => {
        // Filtrar notificaciones duplicadas por ID
        const existingIds = new Set(prev.map((n) => n.id))
        const uniqueNewNotifications = newNotifications.filter((n) => !existingIds.has(n.id))
        return [...prev, ...uniqueNewNotifications]
      })
    }
  }, [products, preferences])

  // Cargar preferencias guardadas
  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem("notificationPreferences")
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences))
      }

      const savedEmail = localStorage.getItem("notificationEmail")
      if (savedEmail) {
        setEmailAddress(savedEmail)
      }

      const savedPhone = localStorage.getItem("notificationPhone")
      if (savedPhone) {
        setPhoneNumber(savedPhone)
      }
    } catch (error) {
      console.error("Error loading notification preferences:", error)
    }
  }, [])

  // Guardar preferencias
  const savePreferences = () => {
    try {
      localStorage.setItem("notificationPreferences", JSON.stringify(preferences))
      localStorage.setItem("notificationEmail", emailAddress)
      localStorage.setItem("notificationPhone", phoneNumber)
      setShowSettings(false)
    } catch (error) {
      console.error("Error saving notification preferences:", error)
    }
  }

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

  // Filtrar notificaciones según la pestaña activa
  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !notification.read
    return notification.type === activeTab
  })

  // Contar notificaciones no leídas
  const unreadCount = notifications.filter((notification) => !notification.read).length

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex justify-between items-center">
            <span>Notificaciones</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
                <Settings className="h-4 w-4" />
              </Button>
              {unreadCount > 0 && (
                <Button variant="ghost" size="icon" onClick={markAllAsRead}>
                  <Mail className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="lowStock">Stock</TabsTrigger>
              <TabsTrigger value="expiration">Vencimiento</TabsTrigger>
              <TabsTrigger value="unread">No leídas</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="max-h-[300px] overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="py-4 text-center text-sm text-gray-500">No hay notificaciones</div>
              ) : (
                filteredNotifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`flex flex-col items-start p-3 ${notification.read ? "opacity-70" : "font-medium"}`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="flex items-start gap-2">
                        {notification.type === "lowStock" && <AlertCircle className="h-4 w-4 text-red-500 mt-1" />}
                        {notification.type === "expiration" && <Clock className="h-4 w-4 text-amber-500 mt-1" />}
                        {notification.type === "system" && <MessageSquare className="h-4 w-4 text-blue-500 mt-1" />}
                        <div>
                          <div className="font-medium">{notification.title}</div>
                          <div className="text-sm text-gray-500">{notification.message}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {notification.date.toLocaleDateString()} {notification.date.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeNotification(notification.id)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead(notification.id)
                        }}
                      >
                        Marcar como leída
                      </Button>
                    )}
                  </DropdownMenuItem>
                ))
              )}
            </TabsContent>
          </Tabs>

          {filteredNotifications.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-center text-sm cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  clearAllNotifications()
                }}
              >
                Borrar todas las notificaciones
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Diálogo de configuración de notificaciones */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configuración de notificaciones</DialogTitle>
            <DialogDescription>Personaliza cómo y cuándo recibes notificaciones.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Canales de notificación</CardTitle>
                <CardDescription>Elige dónde quieres recibir las notificaciones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="app-notifications">Notificaciones en la aplicación</Label>
                  <Switch
                    id="app-notifications"
                    checked={preferences.channels.app}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        channels: { ...preferences.channels, app: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications">Notificaciones por email</Label>
                  <Switch
                    id="email-notifications"
                    checked={preferences.channels.email}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        channels: { ...preferences.channels, email: checked },
                      })
                    }
                  />
                </div>

                {preferences.channels.email && (
                  <div>
                    <Label htmlFor="email-address">Dirección de email</Label>
                    <Input
                      id="email-address"
                      type="email"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      placeholder="tu@email.com"
                      className="mt-1"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-notifications">Notificaciones por SMS</Label>
                  <Switch
                    id="sms-notifications"
                    checked={preferences.channels.sms}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        channels: { ...preferences.channels, sms: checked },
                      })
                    }
                  />
                </div>

                {preferences.channels.sms && (
                  <div>
                    <Label htmlFor="phone-number">Número de teléfono</Label>
                    <Input
                      id="phone-number"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+34 600 000 000"
                      className="mt-1"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tipos de notificaciones</CardTitle>
                <CardDescription>Selecciona qué tipos de notificaciones quieres recibir</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="low-stock">Stock bajo</Label>
                  <Switch
                    id="low-stock"
                    checked={preferences.types.lowStock}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        types: { ...preferences.types, lowStock: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="expiration">Productos próximos a vencer</Label>
                  <Switch
                    id="expiration"
                    checked={preferences.types.expiration}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        types: { ...preferences.types, expiration: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="system">Notificaciones del sistema</Label>
                  <Switch
                    id="system"
                    checked={preferences.types.system}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        types: { ...preferences.types, system: checked },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Umbrales de alerta</CardTitle>
                <CardDescription>Configura cuándo quieres recibir alertas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="expiration-days">Días antes del vencimiento</Label>
                  <Select
                    value={preferences.thresholds.expirationDays.toString()}
                    onValueChange={(value) =>
                      setPreferences({
                        ...preferences,
                        thresholds: { ...preferences.thresholds, expirationDays: Number.parseInt(value) },
                      })
                    }
                  >
                    <SelectTrigger id="expiration-days">
                      <SelectValue placeholder="Seleccionar días" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 días</SelectItem>
                      <SelectItem value="15">15 días</SelectItem>
                      <SelectItem value="30">30 días</SelectItem>
                      <SelectItem value="60">60 días</SelectItem>
                      <SelectItem value="90">90 días</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="low-stock-percentage">Porcentaje de stock bajo</Label>
                  <Select
                    value={preferences.thresholds.lowStockPercentage.toString()}
                    onValueChange={(value) =>
                      setPreferences({
                        ...preferences,
                        thresholds: { ...preferences.thresholds, lowStockPercentage: Number.parseInt(value) },
                      })
                    }
                  >
                    <SelectTrigger id="low-stock-percentage">
                      <SelectValue placeholder="Seleccionar porcentaje" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10%</SelectItem>
                      <SelectItem value="20">20%</SelectItem>
                      <SelectItem value="30">30%</SelectItem>
                      <SelectItem value="40">40%</SelectItem>
                      <SelectItem value="50">50%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancelar
            </Button>
            <Button onClick={savePreferences}>Guardar preferencias</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
