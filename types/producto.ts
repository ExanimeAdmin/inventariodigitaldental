export interface Producto {
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
  ubicacion?: string
  lote?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateProductoRequest {
  nombre: string
  descripcion?: string
  cantidad: number
  precio: number
  area: string
  categoria: string
  proveedor?: string
  fecha_caducidad?: string
  fecha_recepcion?: string
  stock_minimo: number
  stock_maximo?: number
  observaciones?: string
  guardado?: boolean
  clinica_id: string
  refrigeracion?: boolean
  ubicacion?: string
  lote?: string
}

export interface UpdateProductoRequest extends Partial<CreateProductoRequest> {}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface Usuario {
  id: string
  nombre: string
  rol: string
  clinicaId: string
}

export interface Notificacion {
  id: string
  title: string
  message: string
  type: "success" | "error" | "warning" | "info"
  timestamp: Date
  read: boolean
}
