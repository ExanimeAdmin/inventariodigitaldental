"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

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

// Función para obtener productos del localStorage
const getProductos = async (): Promise<Producto[]> => {
  // Simulamos una pequeña latencia para demostrar el loading state
  await new Promise((resolve) => setTimeout(resolve, 500))

  const storedProductos = localStorage.getItem("inventario")
  if (storedProductos) {
    return JSON.parse(storedProductos)
  }
  return []
}

// Función para guardar productos en localStorage
const saveProductos = async (productos: Producto[]): Promise<Producto[]> => {
  // Simulamos una pequeña latencia para demostrar el loading state
  await new Promise((resolve) => setTimeout(resolve, 500))

  localStorage.setItem("inventario", JSON.stringify(productos))
  return productos
}

// Hook para gestionar el inventario con React Query
export function useInventory(clinicaId: string) {
  const queryClient = useQueryClient()

  // Query para obtener productos
  const {
    data: productos = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["inventario", clinicaId],
    queryFn: getProductos,
    select: (data) => data.filter((producto) => producto.clinicaId === clinicaId),
  })

  // Mutación para añadir un producto
  const addProductoMutation = useMutation({
    mutationFn: async (nuevoProducto: Omit<Producto, "id">) => {
      const allProductos = await getProductos()
      const productoCompleto = {
        ...nuevoProducto,
        id: `prod-${Date.now()}`,
        clinicaId,
      }
      const updatedProductos = [...allProductos, productoCompleto]
      return saveProductos(updatedProductos)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventario", clinicaId] })
    },
  })

  // Mutación para actualizar un producto
  const updateProductoMutation = useMutation({
    mutationFn: async (productoActualizado: Producto) => {
      const allProductos = await getProductos()
      const updatedProductos = allProductos.map((p) => (p.id === productoActualizado.id ? productoActualizado : p))
      return saveProductos(updatedProductos)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventario", clinicaId] })
    },
  })

  // Mutación para eliminar un producto
  const deleteProductoMutation = useMutation({
    mutationFn: async (id: string) => {
      const allProductos = await getProductos()
      const updatedProductos = allProductos.filter((p) => p.id !== id)
      return saveProductos(updatedProductos)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventario", clinicaId] })
    },
  })

  // Mutación para actualizar varios productos a la vez
  const updateBatchMutation = useMutation({
    mutationFn: async (updates: { id: string; changes: Partial<Producto> }[]) => {
      const allProductos = await getProductos()
      const updatedProductos = allProductos.map((producto) => {
        const update = updates.find((u) => u.id === producto.id)
        if (update) {
          return { ...producto, ...update.changes }
        }
        return producto
      })
      return saveProductos(updatedProductos)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventario", clinicaId] })
    },
  })

  // Función para obtener productos con stock bajo
  const getProductosBajoStock = () => {
    return productos.filter((p) => p.cantidad <= p.stockMinimo)
  }

  // Función para obtener productos próximos a vencer
  const getProductosProximosVencer = () => {
    const hoy = new Date()
    return productos.filter((p) => {
      if (!p.fechaCaducidad) return false
      const fechaVencimiento = new Date(p.fechaCaducidad)
      const diasParaVencer = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
      return diasParaVencer <= 30 && diasParaVencer > 0
    })
  }

  // Función para obtener productos guardados
  const getProductosGuardados = () => {
    return productos.filter((p) => p.guardado)
  }

  return {
    productos,
    isLoading,
    isError,
    error,
    refetch,
    addProducto: addProductoMutation.mutate,
    updateProducto: updateProductoMutation.mutate,
    deleteProducto: deleteProductoMutation.mutate,
    updateBatch: updateBatchMutation.mutate,
    getProductosBajoStock,
    getProductosProximosVencer,
    getProductosGuardados,
    isAddingProducto: addProductoMutation.isPending,
    isUpdatingProducto: updateProductoMutation.isPending,
    isDeletingProducto: deleteProductoMutation.isPending,
    isUpdatingBatch: updateBatchMutation.isPending,
  }
}
