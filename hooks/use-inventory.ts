"use client"

import { useState, useEffect } from "react"
import type { Producto } from "@/types/producto"
import { useToast } from "@/hooks/use-toast"

export function useInventory() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [demoMode, setDemoMode] = useState(false)
  const { toast } = useToast()

  const fetchProductos = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/inventario")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al obtener productos")
      }

      const data = await response.json()

      // Verificar si estamos en modo demo
      if (data.demo_mode) {
        setDemoMode(true)
        toast({
          title: "Modo demostración",
          description: "Usando datos de ejemplo. La base de datos no está conectada.",
          variant: "warning",
        })
      }

      // Formatear fechas
      const productosFormateados = data.productos.map((producto: any) => ({
        ...producto,
        fecha_vencimiento: producto.fecha_vencimiento ? new Date(producto.fecha_vencimiento).toISOString() : null,
        created_at: producto.created_at ? new Date(producto.created_at).toISOString() : null,
        updated_at: producto.updated_at ? new Date(producto.updated_at).toISOString() : null,
      }))

      setProductos(productosFormateados)
    } catch (err) {
      console.error("Error fetching productos:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al cargar productos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addProducto = async (producto: Omit<Producto, "id" | "created_at" | "updated_at">) => {
    try {
      const response = await fetch("/api/inventario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(producto),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al crear producto")
      }

      const data = await response.json()

      // Si estamos en modo demo, no refrescamos la lista completa
      if (data.demo_mode) {
        setProductos([...productos, data.producto])
        toast({
          title: "Producto añadido (demo)",
          description: "El producto se ha añadido en modo demostración",
          variant: "default",
        })
        return data.producto
      }

      // Refrescar la lista de productos
      await fetchProductos()

      toast({
        title: "Producto añadido",
        description: "El producto se ha añadido correctamente",
        variant: "default",
      })

      return data.producto
    } catch (err) {
      console.error("Error adding producto:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al añadir producto",
        variant: "destructive",
      })
      throw err
    }
  }

  const updateProducto = async (id: number, producto: Partial<Producto>) => {
    try {
      const response = await fetch(`/api/inventario/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(producto),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al actualizar producto")
      }

      const data = await response.json()

      // Si estamos en modo demo, actualizamos localmente
      if (data.demo_mode) {
        setProductos(
          productos.map((p) => (p.id === id ? { ...p, ...producto, updated_at: new Date().toISOString() } : p)),
        )
        toast({
          title: "Producto actualizado (demo)",
          description: "El producto se ha actualizado en modo demostración",
          variant: "default",
        })
        return data.producto
      }

      // Refrescar la lista de productos
      await fetchProductos()

      toast({
        title: "Producto actualizado",
        description: "El producto se ha actualizado correctamente",
        variant: "default",
      })

      return data.producto
    } catch (err) {
      console.error(`Error updating producto ${id}:`, err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al actualizar producto",
        variant: "destructive",
      })
      throw err
    }
  }

  const deleteProducto = async (id: number) => {
    try {
      const response = await fetch(`/api/inventario/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al eliminar producto")
      }

      const data = await response.json()

      // Si estamos en modo demo, eliminamos localmente
      if (data.demo_mode) {
        setProductos(productos.filter((p) => p.id !== id))
        toast({
          title: "Producto eliminado (demo)",
          description: "El producto se ha eliminado en modo demostración",
          variant: "default",
        })
        return true
      }

      // Refrescar la lista de productos
      await fetchProductos()

      toast({
        title: "Producto eliminado",
        description: "El producto se ha eliminado correctamente",
        variant: "default",
      })

      return true
    } catch (err) {
      console.error(`Error deleting producto ${id}:`, err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al eliminar producto",
        variant: "destructive",
      })
      throw err
    }
  }

  useEffect(() => {
    fetchProductos()
  }, [])

  return {
    productos,
    loading,
    error,
    demoMode,
    fetchProductos,
    addProducto,
    updateProducto,
    deleteProducto,
  }
}
