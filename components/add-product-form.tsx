"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PlusCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { Producto } from "@/types/producto"

// Áreas predefinidas
const areas = [
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

interface AddProductFormProps {
  clinicaId: string
  onProductAdded: (producto: Omit<Producto, "id">) => Promise<void>
}

export function AddProductForm({ clinicaId, onProductAdded }: AddProductFormProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    cantidad: 0,
    precio: 0,
    area: "",
    categoria: "",
    proveedor: "",
    fechaCaducidad: "",
    fechaRecepcion: new Date().toISOString().split("T")[0],
    stockMinimo: 1,
    stockMaximo: 10,
    observaciones: "",
    guardado: false,
    refrigeracion: false,
    ubicacion: "",
    lote: "",
  })

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }))
  }, [])

  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const resetForm = useCallback(() => {
    setFormData({
      nombre: "",
      descripcion: "",
      cantidad: 0,
      precio: 0,
      area: "",
      categoria: "",
      proveedor: "",
      fechaCaducidad: "",
      fechaRecepcion: new Date().toISOString().split("T")[0],
      stockMinimo: 1,
      stockMaximo: 10,
      observaciones: "",
      guardado: false,
      refrigeracion: false,
      ubicacion: "",
      lote: "",
    })
  }, [])

  const validateForm = useCallback(() => {
    const errors: string[] = []

    if (!formData.nombre.trim()) {
      errors.push("El nombre es obligatorio")
    }

    if (!formData.area) {
      errors.push("El área es obligatoria")
    }

    if (!formData.categoria) {
      errors.push("La categoría es obligatoria")
    }

    if (formData.cantidad < 0) {
      errors.push("La cantidad no puede ser negativa")
    }

    if (formData.precio < 0) {
      errors.push("El precio no puede ser negativo")
    }

    if (formData.stockMinimo < 0) {
      errors.push("El stock mínimo no puede ser negativo")
    }

    if (formData.stockMaximo && formData.stockMaximo <= formData.stockMinimo) {
      errors.push("El stock máximo debe ser mayor que el stock mínimo")
    }

    return errors
  }, [formData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      toast({
        title: "Error de validación",
        description: validationErrors.join(", "),
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const producto: Omit<Producto, "id"> = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || undefined,
        cantidad: formData.cantidad,
        precio: formData.precio,
        area: formData.area,
        categoria: formData.categoria,
        proveedor: formData.proveedor.trim() || undefined,
        fechaCaducidad: formData.fechaCaducidad || undefined,
        fechaRecepcion: formData.fechaRecepcion || undefined,
        stockMinimo: formData.stockMinimo,
        stockMaximo: formData.stockMaximo || undefined,
        observaciones: formData.observaciones.trim() || undefined,
        guardado: formData.guardado,
        clinicaId: clinicaId,
        refrigeracion: formData.refrigeracion,
        ubicacion: formData.ubicacion.trim() || undefined,
        lote: formData.lote.trim() || undefined,
      }

      await onProductAdded(producto)

      toast({
        title: "Producto agregado",
        description: `${producto.nombre} ha sido agregado al inventario`,
      })

      resetForm()
      setOpen(false)
    } catch (error) {
      console.error("Error al agregar producto:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo agregar el producto. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Añadir Producto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Añadir nuevo producto al inventario</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del producto *</Label>
              <Input
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                placeholder="Ej: Guantes de látex"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad *</Label>
              <Input
                id="cantidad"
                name="cantidad"
                type="number"
                min="0"
                value={formData.cantidad}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={2}
              disabled={isSubmitting}
              placeholder="Descripción del producto..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="precio">Precio (CLP) *</Label>
              <Input
                id="precio"
                name="precio"
                type="number"
                min="0"
                step="1"
                value={formData.precio}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proveedor">Proveedor</Label>
              <Input
                id="proveedor"
                name="proveedor"
                value={formData.proveedor}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Nombre del proveedor"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="area">Área *</Label>
              <Select
                value={formData.area}
                onValueChange={(value) => handleSelectChange("area", value)}
                required
                disabled={isSubmitting}
              >
                <SelectTrigger>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría *</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => handleSelectChange("categoria", value)}
                required
                disabled={isSubmitting}
              >
                <SelectTrigger>
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
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stockMinimo">Stock mínimo *</Label>
              <Input
                id="stockMinimo"
                name="stockMinimo"
                type="number"
                min="0"
                value={formData.stockMinimo}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockMaximo">Stock máximo</Label>
              <Input
                id="stockMaximo"
                name="stockMaximo"
                type="number"
                min="0"
                value={formData.stockMaximo}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fechaRecepcion">Fecha de recepción</Label>
              <Input
                id="fechaRecepcion"
                name="fechaRecepcion"
                type="date"
                value={formData.fechaRecepcion}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaCaducidad">Fecha de caducidad</Label>
              <Input
                id="fechaCaducidad"
                name="fechaCaducidad"
                type="date"
                value={formData.fechaCaducidad}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ubicacion">Ubicación</Label>
              <Input
                id="ubicacion"
                name="ubicacion"
                value={formData.ubicacion}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Ej: Estante A, Nivel 2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lote">Lote</Label>
              <Input
                id="lote"
                name="lote"
                value={formData.lote}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Número de lote"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows={2}
              disabled={isSubmitting}
              placeholder="Observaciones adicionales..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar producto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
