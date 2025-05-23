"use client"

import { useState } from "react"
import { Download, FileSpreadsheet, FileText, Calendar, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Product {
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

interface ExportDataProps {
  products: Product[]
}

interface ScheduledExport {
  id: string
  name: string
  format: string
  frequency: string
  lastRun?: string
  nextRun?: string
  fields: string[]
  filter?: string
}

export function ExportData({ products }: ExportDataProps) {
  const [open, setOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState("excel")
  const [selectedFields, setSelectedFields] = useState<string[]>(["nombre", "cantidad", "precio", "categoria", "area"])
  const [scheduledExports, setScheduledExports] = useState<ScheduledExport[]>([
    {
      id: "export-1",
      name: "Reporte mensual de inventario",
      format: "excel",
      frequency: "monthly",
      lastRun: "2023-04-01",
      nextRun: "2023-05-01",
      fields: ["nombre", "cantidad", "precio", "categoria", "area", "proveedor"],
    },
    {
      id: "export-2",
      name: "Productos próximos a vencer",
      format: "csv",
      frequency: "weekly",
      lastRun: "2023-04-20",
      nextRun: "2023-04-27",
      fields: ["nombre", "cantidad", "fechaCaducidad", "categoria", "area"],
      filter: "próximos a vencer",
    },
  ])
  const [newExportName, setNewExportName] = useState("")
  const [newExportFrequency, setNewExportFrequency] = useState("monthly")

  // Available fields for export
  const availableFields = [
    { id: "nombre", label: "Nombre" },
    { id: "descripcion", label: "Descripción" },
    { id: "cantidad", label: "Cantidad" },
    { id: "precio", label: "Precio" },
    { id: "area", label: "Área" },
    { id: "categoria", label: "Categoría" },
    { id: "proveedor", label: "Proveedor" },
    { id: "fechaCaducidad", label: "Fecha de caducidad" },
    { id: "fechaRecepcion", label: "Fecha de recepción" },
    { id: "stockMinimo", label: "Stock mínimo" },
    { id: "stockMaximo", label: "Stock máximo" },
    { id: "observaciones", label: "Observaciones" },
    { id: "refrigeracion", label: "Refrigeración" },
  ]

  // Toggle field selection
  const toggleField = (fieldId: string) => {
    if (selectedFields.includes(fieldId)) {
      setSelectedFields(selectedFields.filter((id) => id !== fieldId))
    } else {
      setSelectedFields([...selectedFields, fieldId])
    }
  }

  // Select all fields
  const selectAllFields = () => {
    setSelectedFields(availableFields.map((field) => field.id))
  }

  // Deselect all fields
  const deselectAllFields = () => {
    setSelectedFields([])
  }

  // Export data
  const exportData = () => {
    // Get selected products data with only the selected fields
    const data = products.map((product) => {
      const exportProduct: Record<string, any> = {}
      selectedFields.forEach((field) => {
        exportProduct[field] = product[field as keyof Product]
      })
      return exportProduct
    })

    // Convert data to the selected format
    if (exportFormat === "excel") {
      exportToExcel(data)
    } else if (exportFormat === "csv") {
      exportToCSV(data)
    }

    setOpen(false)
  }

  // Export to Excel
  const exportToExcel = (data: Record<string, any>[]) => {
    // In a real application, you would use a library like xlsx or exceljs
    // For this example, we'll create a CSV and change the extension
    const headers = selectedFields.map((field) => availableFields.find((f) => f.id === field)?.label || field)
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        selectedFields
          .map((field) => {
            const value = row[field]
            // Handle values that might contain commas
            if (typeof value === "string" && value.includes(",")) {
              return `"${value}"`
            }
            return value
          })
          .join(","),
      ),
    ].join("\n")

    // Create a blob and download
    const blob = new Blob([csvContent], { type: "application/vnd.ms-excel" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `inventario_${new Date().toISOString().split("T")[0]}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Export to CSV
  const exportToCSV = (data: Record<string, any>[]) => {
    const headers = selectedFields.map((field) => availableFields.find((f) => f.id === field)?.label || field)
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        selectedFields
          .map((field) => {
            const value = row[field]
            // Handle values that might contain commas
            if (typeof value === "string" && value.includes(",")) {
              return `"${value}"`
            }
            return value
          })
          .join(","),
      ),
    ].join("\n")

    // Create a blob and download
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `inventario_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Schedule a new export
  const scheduleExport = () => {
    if (!newExportName.trim() || selectedFields.length === 0) return

    const newExport: ScheduledExport = {
      id: `export-${Date.now()}`,
      name: newExportName,
      format: exportFormat,
      frequency: newExportFrequency,
      fields: [...selectedFields],
      nextRun: getNextRunDate(newExportFrequency),
    }

    setScheduledExports([...scheduledExports, newExport])
    setNewExportName("")
  }

  // Delete a scheduled export
  const deleteScheduledExport = (id: string) => {
    setScheduledExports(scheduledExports.filter((exp) => exp.id !== id))
  }

  // Get next run date based on frequency
  const getNextRunDate = (frequency: string): string => {
    const date = new Date()
    switch (frequency) {
      case "daily":
        date.setDate(date.getDate() + 1)
        break
      case "weekly":
        date.setDate(date.getDate() + 7)
        break
      case "monthly":
        date.setMonth(date.getMonth() + 1)
        break
      case "quarterly":
        date.setMonth(date.getMonth() + 3)
        break
    }
    return date.toISOString().split("T")[0]
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Download className="h-4 w-4 mr-2" />
        Exportar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Exportar datos</DialogTitle>
            <DialogDescription>
              Exporta los datos del inventario en diferentes formatos o programa exportaciones periódicas.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="export">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="export">Exportación única</TabsTrigger>
              <TabsTrigger value="schedule">Exportaciones programadas</TabsTrigger>
            </TabsList>

            <TabsContent value="export" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="export-format">Formato de exportación</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger id="export-format">
                    <SelectValue placeholder="Seleccionar formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">
                      <div className="flex items-center">
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel (.xlsx)
                      </div>
                    </SelectItem>
                    <SelectItem value="csv">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        CSV (.csv)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Campos a exportar</Label>
                  <div className="space-x-2">
                    <Button variant="link" size="sm" onClick={selectAllFields} className="h-auto p-0">
                      Seleccionar todos
                    </Button>
                    <Button variant="link" size="sm" onClick={deselectAllFields} className="h-auto p-0">
                      Deseleccionar todos
                    </Button>
                  </div>
                </div>

                <ScrollArea className="h-[200px] border rounded-md p-4">
                  <div className="space-y-2">
                    {availableFields.map((field) => (
                      <div key={field.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`field-${field.id}`}
                          checked={selectedFields.includes(field.id)}
                          onCheckedChange={() => toggleField(field.id)}
                        />
                        <Label htmlFor={`field-${field.id}`} className="cursor-pointer">
                          {field.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="export-name">Nombre de la exportación</Label>
                  <Input
                    id="export-name"
                    value={newExportName}
                    onChange={(e) => setNewExportName(e.target.value)}
                    placeholder="Ej: Reporte mensual de inventario"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="schedule-format">Formato</Label>
                    <Select value={exportFormat} onValueChange={setExportFormat}>
                      <SelectTrigger id="schedule-format">
                        <SelectValue placeholder="Seleccionar formato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                        <SelectItem value="csv">CSV (.csv)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schedule-frequency">Frecuencia</Label>
                    <Select value={newExportFrequency} onValueChange={setNewExportFrequency}>
                      <SelectTrigger id="schedule-frequency">
                        <SelectValue placeholder="Seleccionar frecuencia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diaria</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensual</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={scheduleExport}
                  disabled={!newExportName.trim() || selectedFields.length === 0}
                  className="w-full"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Programar exportación
                </Button>

                <div className="border rounded-md">
                  <div className="bg-muted px-4 py-2 rounded-t-md font-medium">Exportaciones programadas</div>
                  <ScrollArea className="h-[200px]">
                    {scheduledExports.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">No hay exportaciones programadas</div>
                    ) : (
                      <div className="divide-y">
                        {scheduledExports.map((exp) => (
                          <div key={exp.id} className="p-4 flex justify-between items-start">
                            <div>
                              <div className="font-medium">{exp.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {exp.format === "excel" ? "Excel" : "CSV"} •
                                {exp.frequency === "daily"
                                  ? " Diaria"
                                  : exp.frequency === "weekly"
                                    ? " Semanal"
                                    : exp.frequency === "monthly"
                                      ? " Mensual"
                                      : " Trimestral"}
                              </div>
                              {exp.nextRun && (
                                <div className="text-sm mt-1">
                                  Próxima ejecución: {new Date(exp.nextRun).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => deleteScheduledExport(exp.id)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={exportData} disabled={selectedFields.length === 0}>
              Exportar ahora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
