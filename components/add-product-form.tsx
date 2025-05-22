"use client"

import { useState, useEffect, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { PlusCircle, AlertTriangle, Search, List, Edit, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Actualizar la lista de áreas predefinidas (sin Laboratorio)
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

// Actualizar las categorías según lo solicitado
const categorias = ["Consumible", "Equipamiento", "Instrumental", "Limpieza", "Inmobiliario", "Medicamento", "Otros"]

// Catálogo completo de productos odontológicos con terminología chilena
const catalogoOdontologicoInicial = [
  // Anestésicos
  {
    id: "prod-a1",
    nombre: "Anestesia local (Lidocaína 2%)",
    categoria: "Medicamento",
    precio: 45500,
    stockMinimo: 5,
    stockMaximo: 30,
    observaciones: "Mantener refrigerado",
    refrigeracion: true,
  },
  {
    id: "prod-a2",
    nombre: "Anestesia Mepivacaína 3%",
    categoria: "Medicamento",
    precio: 48000,
    stockMinimo: 5,
    stockMaximo: 30,
    observaciones: "Mantener refrigerado",
    refrigeracion: true,
  },
  {
    id: "prod-a3",
    nombre: "Anestesia Articaína 4% con epinefrina",
    categoria: "Medicamento",
    precio: 52000,
    stockMinimo: 5,
    stockMaximo: 30,
    observaciones: "Mantener refrigerado",
    refrigeracion: true,
  },
  {
    id: "prod-a4",
    nombre: "Agujas dentales 27G cortas",
    categoria: "Consumible",
    precio: 12000,
    stockMinimo: 5,
    stockMaximo: 25,
    observaciones: "Material punzocortante",
  },
  {
    id: "prod-a5",
    nombre: "Agujas dentales 30G extracortas",
    categoria: "Consumible",
    precio: 13500,
    stockMinimo: 5,
    stockMaximo: 25,
    observaciones: "Material punzocortante",
  },
  {
    id: "prod-a6",
    nombre: "Algodón en rollos",
    categoria: "Consumible",
    precio: 8500,
    stockMinimo: 8,
    stockMaximo: 40,
    observaciones: "",
  },
  {
    id: "prod-a7",
    nombre: "Alginato Jeltrate",
    categoria: "Consumible",
    precio: 22000,
    stockMinimo: 4,
    stockMaximo: 20,
    observaciones: "Mezclar según instrucciones del fabricante",
  },
  {
    id: "prod-a8",
    nombre: "Ácido grabador 37% (Gel Etch)",
    categoria: "Consumible",
    precio: 18500,
    stockMinimo: 3,
    stockMaximo: 15,
    observaciones: "Material corrosivo, manipular con cuidado",
  },
  {
    id: "prod-a9",
    nombre: "Adhesivo Single Bond",
    categoria: "Consumible",
    precio: 35000,
    stockMinimo: 3,
    stockMaximo: 15,
    observaciones: "Almacenar en lugar fresco y seco",
  },
  {
    id: "prod-a10",
    nombre: "Aspirador quirúrgico",
    categoria: "Equipamiento",
    precio: 450000,
    stockMinimo: 1,
    stockMaximo: 3,
    observaciones: "Requiere mantenimiento periódico",
  },

  // Productos con B
  {
    id: "prod-b1",
    nombre: "Bisturí desechable N°15",
    categoria: "Instrumental",
    precio: 15000,
    stockMinimo: 5,
    stockMaximo: 25,
    observaciones: "Material punzocortante",
  },
  {
    id: "prod-b2",
    nombre: "Brackets metálicos Morelli",
    categoria: "Consumible",
    precio: 85000,
    stockMinimo: 3,
    stockMaximo: 15,
    observaciones: "Para ortodoncia",
  },
  {
    id: "prod-b3",
    nombre: "Brackets cerámicos Clarity",
    categoria: "Consumible",
    precio: 120000,
    stockMinimo: 2,
    stockMaximo: 10,
    observaciones: "Para ortodoncia",
  },
  {
    id: "prod-b4",
    nombre: "Bandas ortodónticas preformadas",
    categoria: "Consumible",
    precio: 45000,
    stockMinimo: 3,
    stockMaximo: 15,
    observaciones: "Para ortodoncia",
  },
  {
    id: "prod-b5",
    nombre: "Botox (Toxina botulínica)",
    categoria: "Medicamento",
    precio: 350000,
    stockMinimo: 1,
    stockMaximo: 5,
    observaciones: "Mantener refrigerado",
    refrigeracion: true,
  },

  // Productos con C
  {
    id: "prod-c1",
    nombre: "Composite Z350 A1",
    categoria: "Consumible",
    precio: 75000,
    stockMinimo: 2,
    stockMaximo: 10,
    observaciones: "Material restaurador",
  },
  {
    id: "prod-c2",
    nombre: "Composite Z350 A2",
    categoria: "Consumible",
    precio: 75000,
    stockMinimo: 2,
    stockMaximo: 10,
    observaciones: "Material restaurador",
  },
  {
    id: "prod-c3",
    nombre: "Composite Z350 A3",
    categoria: "Consumible",
    precio: 75000,
    stockMinimo: 2,
    stockMaximo: 10,
    observaciones: "Material restaurador",
  },
  {
    id: "prod-c4",
    nombre: "Composite Z350 A3.5",
    categoria: "Consumible",
    precio: 75000,
    stockMinimo: 2,
    stockMaximo: 10,
    observaciones: "Material restaurador",
  },
  {
    id: "prod-c5",
    nombre: "Composite fluido Z350 A2",
    categoria: "Consumible",
    precio: 65000,
    stockMinimo: 2,
    stockMaximo: 10,
    observaciones: "Material restaurador. Mantener refrigerado",
    refrigeracion: true,
  },
  {
    id: "prod-c6",
    nombre: "Cubetas de impresión plásticas",
    categoria: "Consumible",
    precio: 9800,
    stockMinimo: 6,
    stockMaximo: 30,
    observaciones: "",
  },
  {
    id: "prod-c7",
    nombre: "Clorhexidina 0.12% (Perio-Aid)",
    categoria: "Medicamento",
    precio: 18000,
    stockMinimo: 3,
    stockMaximo: 15,
    observaciones: "Antiséptico bucal",
  },
  {
    id: "prod-c8",
    nombre: "Cemento de ionómero de vidrio (Vitremer)",
    categoria: "Consumible",
    precio: 65000,
    stockMinimo: 2,
    stockMaximo: 10,
    observaciones: "Seguir instrucciones de mezcla",
  },
  {
    id: "prod-c9",
    nombre: "Cemento de fosfato de zinc (Lee Smith)",
    categoria: "Consumible",
    precio: 45000,
    stockMinimo: 2,
    stockMaximo: 10,
    observaciones: "Seguir instrucciones de mezcla",
  },
  {
    id: "prod-c10",
    nombre: "Cera utility",
    categoria: "Consumible",
    precio: 12000,
    stockMinimo: 3,
    stockMaximo: 15,
    observaciones: "",
  },

  // Productos con D
  {
    id: "prod-d1",
    nombre: "Dique de goma",
    categoria: "Consumible",
    precio: 25000,
    stockMinimo: 3,
    stockMaximo: 15,
    observaciones: "Para aislamiento",
  },
  {
    id: "prod-d2",
    nombre: "Desinfectante Lysol",
    categoria: "Limpieza",
    precio: 15000,
    stockMinimo: 3,
    stockMaximo: 15,
    observaciones: "Para limpieza de equipos",
  },
  {
    id: "prod-d3",
    nombre: "Discos Soflex",
    categoria: "Consumible",
    precio: 28000,
    stockMinimo: 3,
    stockMaximo: 15,
    observaciones: "Para acabado de restauraciones",
  },

  // Productos con E
  {
    id: "prod-e1",
    nombre: "Espejo dental N°5",
    categoria: "Instrumental",
    precio: 18000,
    stockMinimo: 5,
    stockMaximo: 20,
    observaciones: "Esterilizar después de cada uso",
  },
  {
    id: "prod-e2",
    nombre: "Explorador dental",
    categoria: "Instrumental",
    precio: 15000,
    stockMinimo: 5,
    stockMaximo: 20,
    observaciones: "Esterilizar después de cada uso",
  },
  {
    id: "prod-e3",
    nombre: "Eyectores de saliva",
    categoria: "Consumible",
    precio: 7500,
    stockMinimo: 10,
    stockMaximo: 50,
    observaciones: "Desechable, un solo uso",
  },
  {
    id: "prod-e4",
    nombre: "Escobillas profilácticas",
    categoria: "Consumible",
    precio: 12000,
    stockMinimo: 5,
    stockMaximo: 25,
    observaciones: "Para limpieza dental",
  },
  {
    id: "prod-e5",
    nombre: "Espátula de cemento",
    categoria: "Instrumental",
    precio: 14000,
    stockMinimo: 3,
    stockMaximo: 15,
    observaciones: "Esterilizar después de cada uso",
  },

  // Productos con F
  {
    id: "prod-f1",
    nombre: "Fresas de diamante troncocónicas",
    categoria: "Instrumental",
    precio: 25000,
    stockMinimo: 4,
    stockMaximo: 20,
    observaciones: "Esterilizar después de cada uso",
  },
  {
    id: "prod-f2",
    nombre: "Fresas de carburo redondas",
    categoria: "Instrumental",
    precio: 28000,
    stockMinimo: 4,
    stockMaximo: 20,
    observaciones: "Esterilizar después de cada uso",
  },
  {
    id: "prod-f3",
    nombre: "Flúor en gel neutro",
    categoria: "Medicamento",
    precio: 18000,
    stockMinimo: 3,
    stockMaximo: 15,
    observaciones: "Para prevención de caries",
  },
  {
    id: "prod-f4",
    nombre: "Formocresol",
    categoria: "Medicamento",
    precio: 22000,
    stockMinimo: 2,
    stockMaximo: 10,
    observaciones: "Para tratamientos pulpares",
  },

  // Productos con G
  {
    id: "prod-g1",
    nombre: "Guantes de látex Maxter (caja)",
    categoria: "Consumible",
    precio: 15990,
    stockMinimo: 10,
    stockMaximo: 50,
    observaciones: "Usar con precaución en pacientes con alergia al látex",
  },
  {
    id: "prod-g2",
    nombre: "Guantes de nitrilo (caja)",
    categoria: "Consumible",
    precio: 18990,
    stockMinimo: 10,
    stockMaximo: 50,
    observaciones: "Alternativa para pacientes con alergia al látex",
  },
  {
    id: "prod-g3",
    nombre: "Gutapercha Maillefer",
    categoria: "Consumible",
    precio: 25000,
    stockMinimo: 3,
    stockMaximo: 15,
    observaciones: "Para obturación de conductos",
  },
  {
    id: "prod-g4",
    nombre: "Gasa estéril",
    categoria: "Consumible",
    precio: 8500,
    stockMinimo: 10,
    stockMaximo: 50,
    observaciones: "Para procedimientos quirúrgicos",
  },

  // Productos con H
  {
    id: "prod-h1",
    nombre: "Hilo dental Colgate",
    categoria: "Consumible",
    precio: 5000,
    stockMinimo: 10,
    stockMaximo: 50,
    observaciones: "",
  },
  {
    id: "prod-h2",
    nombre: "Hidróxido de calcio (Dycal)",
    categoria: "Medicamento",
    precio: 28000,
    stockMinimo: 3,
    stockMaximo: 15,
    observaciones: "Para recubrimiento pulpar",
  },
  {
    id: "prod-h3",
    nombre: "Hipoclorito de sodio 5%",
    categoria: "Medicamento",
    precio: 12000,
    stockMinimo: 3,
    stockMaximo: 15,
    observaciones: "Para irrigación de conductos",
  },

  // Productos con I
  {
    id: "prod-i1",
    nombre: "Implante dental Neodent",
    categoria: "Instrumental",
    precio: 250000,
    stockMinimo: 2,
    stockMaximo: 10,
    observaciones: "Para rehabilitación oral",
  },
  {
    id: "prod-i2",
    nombre: "Instrumental para implantes Neodent",
    categoria: "Instrumental",
    precio: 450000,
    stockMinimo: 1,
    stockMaximo: 5,
    observaciones: "Kit completo para colocación de implantes",
  },
  {
    id: "prod-i3",
    nombre: "Ionómero de vidrio Ketac Molar",
    categoria: "Consumible",
    precio: 65000,
    stockMinimo: 2,
    stockMaximo: 10,
    observaciones: "Seguir instrucciones de mezcla",
  },

  // Productos con J
  {
    id: "prod-j1",
    nombre: "Jeringa triple",
    categoria: "Equipamiento",
    precio: 180000,
    stockMinimo: 1,
    stockMaximo: 5,
    observaciones: "Para unidad dental",
  },
  {
    id: "prod-j2",
    nombre: "Jeringa carpule",
    categoria: "Instrumental",
    precio: 45000,
    stockMinimo: 3,
    stockMaximo: 15,
    observaciones: "Para administración de anestesia",
  },

  // Productos con K
  {
    id: "prod-k1",
    nombre: "Kit de fresas Gates Glidden",
    categoria: "Instrumental",
    precio: 120000,
    stockMinimo: 1,
    stockMaximo: 5,
    observaciones: "Para tratamiento de conductos",
  },
  {
    id: "prod-k2",
    nombre: "Kit de cirugía oral",
    categoria: "Instrumental",
    precio: 350000,
    stockMinimo: 1,
    stockMaximo: 3,
    observaciones: "Para procedimientos quirúrgicos",
  },

  // Productos con L
  {
    id: "prod-l1",
    nombre: "Limas K-File Maillefer",
    categoria: "Instrumental",
    precio: 35000,
    stockMinimo: 3,
    stockMaximo: 15,
    observaciones: "Para tratamiento de conductos",
  },
  {
    id: "prod-l2",
    nombre: "Lámpara de fotocurado LED",
    categoria: "Equipamiento",
    precio: 280000,
    stockMinimo: 1,
    stockMaximo: 3,
    observaciones: "Para polimerización de materiales",
  },
  {
    id: "prod-l3",
    nombre: "Lentes de protección",
    categoria: "Equipamiento",
    precio: 25000,
    stockMinimo: 3,
    stockMaximo: 15,
    observaciones: "Para protección del personal y pacientes",
  },

  // Productos con M
  {
    id: "prod-m1",
    nombre: "Mascarillas quirúrgicas (caja)",
    categoria: "Consumible",
    precio: 12000,
    stockMinimo: 10,
    stockMaximo: 50,
    observaciones: "Para protección del personal",
  },
  {
    id: "prod-m2",
    nombre: "Material de impresión silicona Elite HD",
    categoria: "Consumible",
    precio: 85000,
    stockMinimo: 2,
    stockMaximo: 10,
    observaciones: "Para toma de impresiones",
  },
  {
    id: "prod-m3",
    nombre: "Micromotor dental NSK",
    categoria: "Equipamiento",
    precio: 450000,
    stockMinimo: 1,
    stockMaximo: 3,
    observaciones: "Para unidad dental",
  },

  // Productos con N
  {
    id: "prod-n1",
    nombre: "Núcleos prefabricados de fibra",
    categoria: "Consumible",
    precio: 45000,
    stockMinimo: 3,
    stockMaximo: 15,
    observaciones: "Para reconstrucción dental",
  },
  {
    id: "prod-n2",
    nombre: "Negatoscopio LED",
    categoria: "Equipamiento",
    precio: 180000,
    stockMinimo: 1,
    stockMaximo: 3,
    observaciones: "Para visualización de radiografías",
  },

  // Productos con O
  {
    id: "prod-o1",
    nombre: "Obturador endodóntico",
    categoria: "Instrumental",
    precio: 35000,
    stockMinimo: 2,
    stockMaximo: 10,
    observaciones: "Para obturación de conductos",
  },
  {
    id: "prod-o2",
    nombre: "Óxido de zinc eugenol (IRM)",
    categoria: "Consumible",
    precio: 28000,
    stockMinimo: 2,
    stockMaximo: 10,
    observaciones: "Para cementación temporal",
  },

  // Productos con P
  {
    id: "prod-p1",
    nombre: "Pasta profiláctica Detartrine",
    categoria: "Consumible",
    precio: 19500,
    stockMinimo: 4,
    stockMaximo: 20,
    observaciones: "",
  },
  {
    id: "prod-p2",
    nombre: "Pieza de mano de alta velocidad Kavo",
    categoria: "Equipamiento",
    precio: 350000,
    stockMinimo: 1,
    stockMaximo: 5,
    observaciones: "Requiere mantenimiento periódico",
  },
  {
    id: "prod-p3",
    nombre: "Pinza algodonera",
    categoria: "Instrumental",
    precio: 15000,
    stockMinimo: 5,
    stockMaximo: 20,
    observaciones: "Esterilizar después de cada uso",
  },
  {
    id: "prod-p4",
    nombre: "Postes de fibra de vidrio Exacto",
    categoria: "Consumible",
    precio: 45000,
    stockMinimo: 3,
    stockMaximo: 15,
    observaciones: "Para reconstrucción dental",
  },

  // Productos con R
  {
    id: "prod-r1",
    nombre: "Radiografías dentales Kodak",
    categoria: "Consumible",
    precio: 35000,
    stockMinimo: 5,
    stockMaximo: 25,
    observaciones: "Almacenar en lugar oscuro",
  },
  {
    id: "prod-r2",
    nombre: "Resina compuesta Z350 A2",
    categoria: "Consumible",
    precio: 78250,
    stockMinimo: 3,
    stockMaximo: 20,
    observaciones: "Almacenar en lugar fresco y seco",
  },
  {
    id: "prod-r3",
    nombre: "Revelador de placa Plac-Control",
    categoria: "Consumible",
    precio: 15000,
    stockMinimo: 3,
    stockMaximo: 15,
    observaciones: "Para diagnóstico",
  },

  // Productos con S
  {
    id: "prod-s1",
    nombre: "Sellantes de fosas y fisuras Clinpro",
    categoria: "Consumible",
    precio: 42000,
    stockMinimo: 3,
    stockMaximo: 15,
    observaciones: "",
  },
  {
    id: "prod-s2",
    nombre: "Sonda periodontal Hu-Friedy",
    categoria: "Instrumental",
    precio: 25000,
    stockMinimo: 3,
    stockMaximo: 15,
    observaciones: "Para diagnóstico periodontal",
  },
  {
    id: "prod-s3",
    nombre: "Sutura Vicryl 3-0",
    categoria: "Consumible",
    precio: 35000,
    stockMinimo: 3,
    stockMaximo: 15,
    observaciones: "Para procedimientos quirúrgicos",
  },

  // Productos con T
  {
    id: "prod-t1",
    nombre: "Tiras de pulido metálicas",
    categoria: "Consumible",
    precio: 18000,
    stockMinimo: 3,
    stockMaximo: 15,
    observaciones: "Para acabado de restauraciones",
  },
  {
    id: "prod-t2",
    nombre: "Turbina dental NSK",
    categoria: "Equipamiento",
    precio: 320000,
    stockMinimo: 1,
    stockMaximo: 5,
    observaciones: "Requiere mantenimiento periódico",
  },

  // Productos con V
  {
    id: "prod-v1",
    nombre: "Vasos desechables",
    categoria: "Consumible",
    precio: 5000,
    stockMinimo: 10,
    stockMaximo: 50,
    observaciones: "Para enjuague bucal",
  },
  {
    id: "prod-v2",
    nombre: "Vibrador de yeso",
    categoria: "Equipamiento",
    precio: 180000,
    stockMinimo: 1,
    stockMaximo: 3,
    observaciones: "Para laboratorio dental",
  },

  // Productos con X
  {
    id: "prod-x1",
    nombre: "Xilol",
    categoria: "Consumible",
    precio: 25000,
    stockMinimo: 2,
    stockMaximo: 10,
    observaciones: "Solvente para materiales dentales",
  },

  // Productos con Y
  {
    id: "prod-y1",
    nombre: "Yeso dental tipo IV Velmix",
    categoria: "Consumible",
    precio: 35000,
    stockMinimo: 3,
    stockMaximo: 15,
    observaciones: "Para modelos de trabajo",
  },
  {
    id: "prod-y2",
    nombre: "Yeso piedra Ortodoncia",
    categoria: "Consumible",
    precio: 28000,
    stockMinimo: 3,
    stockMaximo: 15,
    observaciones: "Para modelos de estudio",
  },

  // Productos con Z
  {
    id: "prod-z1",
    nombre: "Zirconio para coronas",
    categoria: "Consumible",
    precio: 120000,
    stockMinimo: 2,
    stockMaximo: 10,
    observaciones: "Para prótesis fija",
  },
]

// Lista de términos que indican que un producto necesita refrigeración
const terminosRefrigeracion = [
  "anestesia",
  "lidocaína",
  "mepivacaína",
  "articaína",
  "prilocaína",
  "bupivacaína",
  "anestésico",
  "anestesico",
  "vacuna",
  "insulina",
  "epinefrina",
  "adrenalina",
  "botox",
  "toxina botulínica",
  "colágeno",
  "colageno",
  "ácido hialurónico",
  "acido hialuronico",
  "plasma",
  "sangre",
  "hemoderivado",
  "suero",
  "enzima",
  "proteína",
  "proteina",
  "hormona",
  "antibiótico líquido",
  "antibiotico liquido",
  "material de impresión hidrocoloide",
  "material de impresion hidrocoloide",
  "alginato",
  "silicona",
  "adhesivo dental",
  "composite fluido",
  "composite flow",
  "blanqueamiento",
  "peróxido",
  "peroxido",
  "gel",
]

// Función para verificar si un producto requiere refrigeración
export const requiereRefrigeracionProducto = (nombreProducto) => {
  const nombreLower = nombreProducto.toLowerCase()

  // Verificar si el producto está marcado explícitamente como refrigeración
  const productoEnCatalogo = catalogoOdontologico.find(
    (p) => p.nombre.toLowerCase() === nombreLower || p.nombre.toLowerCase().includes(nombreLower),
  )

  if (productoEnCatalogo && productoEnCatalogo.refrigeracion) {
    return true
  }

  // Verificar por términos clave
  return terminosRefrigeracion.some((termino) => nombreLower.includes(termino))
}

// Crear una copia del catálogo inicial para poder modificarlo
let catalogoOdontologico = [...catalogoOdontologicoInicial]

// Cargar el catálogo desde localStorage si existe
const cargarCatalogoDesdeLocalStorage = () => {
  try {
    const catalogoGuardado = localStorage.getItem("catalogoOdontologico")
    if (catalogoGuardado) {
      catalogoOdontologico = JSON.parse(catalogoGuardado)
    }
  } catch (error) {
    console.error("Error al cargar el catálogo desde localStorage:", error)
  }
}

// Guardar el catálogo en localStorage
const guardarCatalogoEnLocalStorage = () => {
  try {
    localStorage.setItem("catalogoOdontologico", JSON.stringify(catalogoOdontologico))
  } catch (error) {
    console.error("Error al guardar el catálogo en localStorage:", error)
  }
}

// Cargar el catálogo al inicio
cargarCatalogoDesdeLocalStorage()

// Función para formatear precio en CLP
const formatearPrecioCLP = (precio) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(precio)
}

// Componente de producto del catálogo memoizado para mejorar rendimiento
const ProductoCatalogo = memo(({ producto, onSelect, onEdit, onDelete }) => {
  return (
    <Card key={producto.id} className="cursor-pointer hover:bg-gray-50">
      <CardContent className="p-3">
        <div className="flex justify-between items-center">
          <div className="flex-1" onClick={() => onSelect(producto)}>
            <div className="font-medium">{producto.nombre}</div>
            <div className="text-sm text-gray-500">{producto.categoria}</div>
          </div>
          <div className="text-right mr-4" onClick={() => onSelect(producto)}>
            <div>{formatearPrecioCLP(producto.precio)}</div>
            {producto.refrigeracion && (
              <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                Refrigerar
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(producto)
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-500 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(producto)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

ProductoCatalogo.displayName = "ProductoCatalogo"

export function AddProductForm({ clinicaId, onProductAdded }) {
  const [open, setOpen] = useState(false)

  // Modificar el estado inicial para incluir precio total
  const [formData, setFormData] = useState({
    nombre: "",
    cantidad: 1,
    precio: 0,
    precioTotal: 0,
    area: "",
    categoria: "",
    proveedor: "",
    fechaCaducidad: "",
    fechaRecepcion: new Date().toISOString().split("T")[0],
    stockMinimo: 1,
    stockMaximo: 10,
    observaciones: "",
    clinicaId: clinicaId,
  })

  // Estados para la búsqueda y visualización
  const [busquedaProducto, setBusquedaProducto] = useState("")
  const [productosFiltrados, setProductosFiltrados] = useState([])
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const [requiereRefrigeracion, setRequiereRefrigeracion] = useState(false)
  const [vistaCatalogo, setVistaCatalogo] = useState("busqueda") // "busqueda" o "catalogo"
  const [letraSeleccionada, setLetraSeleccionada] = useState("")
  const [productosPorLetra, setProductosPorLetra] = useState([])

  // Estados para la edición del catálogo
  const [productoEditando, setProductoEditando] = useState(null)
  const [mostrarDialogoConfirmacion, setMostrarDialogoConfirmacion] = useState(false)
  const [accionPendiente, setAccionPendiente] = useState(null)

  // Calcular precio total cuando cambia la cantidad o el precio unitario
  useEffect(() => {
    const total = formData.cantidad * formData.precio
    setFormData((prev) => ({ ...prev, precioTotal: total }))
  }, [formData.cantidad, formData.precio])

  // Verificar si el producto requiere refrigeración
  useEffect(() => {
    if (!formData.nombre) {
      setRequiereRefrigeracion(false)
      return
    }

    const requiere = requiereRefrigeracionProducto(formData.nombre)
    setRequiereRefrigeracion(requiere)

    // Si requiere refrigeración y no hay observación sobre esto, añadirla
    if (requiere && !formData.observaciones.includes("Mantener refrigerado")) {
      const observacionActualizada = formData.observaciones
        ? `${formData.observaciones}. Mantener refrigerado.`
        : "Mantener refrigerado."

      setFormData((prev) => ({ ...prev, observaciones: observacionActualizada }))
    }
  }, [formData.nombre])

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleNumberChange = useCallback((e) => {
    const { name, value } = e.target
    const numValue = Number.parseFloat(value) || 0
    setFormData((prev) => ({ ...prev, [name]: numValue }))
  }, [])

  const handleSelectChange = useCallback((name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  // Función para buscar productos
  const buscarProductos = useCallback((texto) => {
    setBusquedaProducto(texto)

    if (!texto) {
      setProductosFiltrados([])
      setMostrarSugerencias(false)
      return
    }

    // Filtrar productos que coincidan con el texto de búsqueda
    const filtrados = catalogoOdontologico.filter((producto) =>
      producto.nombre.toLowerCase().includes(texto.toLowerCase()),
    )

    setProductosFiltrados(filtrados)
    setMostrarSugerencias(filtrados.length > 0)
  }, [])

  // Función para mostrar productos por letra
  const mostrarProductosPorLetra = useCallback((letra) => {
    setLetraSeleccionada(letra)

    const productosFiltrados = catalogoOdontologico.filter((producto) =>
      producto.nombre.toLowerCase().startsWith(letra.toLowerCase()),
    )

    setProductosPorLetra(productosFiltrados)
  }, [])

  // Función para seleccionar un producto del catálogo
  const seleccionarProducto = useCallback(
    (producto) => {
      setFormData({
        ...formData,
        nombre: producto.nombre,
        precio: producto.precio,
        precioTotal: producto.precio * formData.cantidad,
        categoria: producto.categoria,
        stockMinimo: producto.stockMinimo,
        stockMaximo: producto.stockMaximo,
        observaciones: producto.observaciones,
      })

      setBusquedaProducto(producto.nombre)
      setMostrarSugerencias(false)
      setVistaCatalogo("busqueda")
    },
    [formData],
  )

  // Función para editar un producto del catálogo
  const editarProductoCatalogo = useCallback((producto) => {
    setProductoEditando({ ...producto })
  }, [])

  // Función para guardar cambios en un producto del catálogo
  const guardarCambiosCatalogo = useCallback(() => {
    if (!productoEditando) return

    // Confirmar antes de guardar cambios
    setAccionPendiente({
      tipo: "editar",
      ejecutar: () => {
        // Actualizar el producto en el catálogo
        const nuevoCatalogo = catalogoOdontologico.map((p) => (p.id === productoEditando.id ? productoEditando : p))

        catalogoOdontologico = nuevoCatalogo
        guardarCatalogoEnLocalStorage()

        // Actualizar la lista filtrada si es necesario
        if (letraSeleccionada) {
          mostrarProductosPorLetra(letraSeleccionada)
        }

        setProductoEditando(null)

        toast({
          title: "Catálogo actualizado",
          description: `El producto "${productoEditando.nombre}" ha sido actualizado en el catálogo.`,
        })
      },
    })

    setMostrarDialogoConfirmacion(true)
  }, [productoEditando, letraSeleccionada, mostrarProductosPorLetra])

  // Función para eliminar un producto del catálogo
  const eliminarProductoCatalogo = useCallback(
    (producto) => {
      setProductoEditando(producto)

      // Confirmar antes de eliminar
      setAccionPendiente({
        tipo: "eliminar",
        ejecutar: () => {
          // Eliminar el producto del catálogo
          const nuevoCatalogo = catalogoOdontologico.filter((p) => p.id !== producto.id)

          catalogoOdontologico = nuevoCatalogo
          guardarCatalogoEnLocalStorage()

          // Actualizar la lista filtrada si es necesario
          if (letraSeleccionada) {
            mostrarProductosPorLetra(letraSeleccionada)
          }

          setProductoEditando(null)

          toast({
            title: "Producto eliminado",
            description: `El producto "${producto.nombre}" ha sido eliminado del catálogo.`,
          })
        },
      })

      setMostrarDialogoConfirmacion(true)
    },
    [letraSeleccionada, mostrarProductosPorLetra],
  )

  // Función para ejecutar la acción pendiente
  const ejecutarAccionPendiente = useCallback(() => {
    if (accionPendiente && typeof accionPendiente.ejecutar === "function") {
      accionPendiente.ejecutar()
    }

    setMostrarDialogoConfirmacion(false)
    setAccionPendiente(null)
  }, [accionPendiente])

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()

      // Validación básica
      if (!formData.nombre || !formData.area || !formData.categoria) {
        toast({
          title: "Error de validación",
          description: "Nombre, área y categoría son campos obligatorios",
          variant: "destructive",
        })
        return
      }

      // Validar que stock máximo sea mayor que stock mínimo
      if (formData.stockMaximo <= formData.stockMinimo) {
        toast({
          title: "Error de validación",
          description: "El stock máximo debe ser mayor que el stock mínimo",
          variant: "destructive",
        })
        return
      }

      // Crear un nuevo producto con un ID único
      const nuevoProducto = {
        id: `temp-${Date.now()}`,
        ...formData,
        guardado: false,
      }

      // Llamar a la función del componente padre
      onProductAdded(nuevoProducto)

      // Resetear el formulario
      setFormData({
        nombre: "",
        cantidad: 1,
        precio: 0,
        precioTotal: 0,
        area: "",
        categoria: "",
        proveedor: "",
        fechaCaducidad: "",
        fechaRecepcion: new Date().toISOString().split("T")[0],
        stockMinimo: 1,
        stockMaximo: 10,
        observaciones: "",
        clinicaId: clinicaId,
      })
      setBusquedaProducto("")
      setRequiereRefrigeracion(false)

      // Cerrar el diálogo
      setOpen(false)
    },
    [formData, clinicaId, onProductAdded],
  )

  // Generar alfabeto para navegación
  const alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" className="gap-2" onClick={() => setOpen(true)}>
          <PlusCircle className="h-4 w-4" />
          Añadir Producto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Añadir nuevo producto al inventario</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="busqueda" className="mt-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="busqueda" onClick={() => setVistaCatalogo("busqueda")}>
              <Search className="h-4 w-4 mr-2" />
              Búsqueda
            </TabsTrigger>
            <TabsTrigger value="catalogo" onClick={() => setVistaCatalogo("catalogo")}>
              <List className="h-4 w-4 mr-2" />
              Catálogo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="busqueda" className="space-y-4 pt-4">
            <div className="relative">
              <Label htmlFor="busquedaProducto">Buscar producto odontológico</Label>
              <Input
                id="busquedaProducto"
                value={busquedaProducto}
                onChange={(e) => buscarProductos(e.target.value)}
                placeholder="Escriba para buscar productos predefinidos..."
                className="mb-1"
              />

              {mostrarSugerencias && (
                <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {productosFiltrados.map((producto) => (
                    <div
                      key={producto.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => seleccionarProducto(producto)}
                    >
                      <div className="font-medium">{producto.nombre}</div>
                      <div className="text-sm text-gray-500">
                        {producto.categoria} - {formatearPrecioCLP(producto.precio)}
                      </div>
                      {producto.observaciones && (
                        <div className="text-xs text-gray-500 mt-1">{producto.observaciones}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-500">
                Busque un producto o explore el catálogo completo en la pestaña "Catálogo"
              </p>
            </div>
          </TabsContent>

          <TabsContent value="catalogo" className="space-y-4 pt-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {alfabeto.map((letra) => (
                <Button
                  key={letra}
                  variant={letraSeleccionada === letra ? "default" : "outline"}
                  size="sm"
                  onClick={() => mostrarProductosPorLetra(letra)}
                  className="w-8 h-8 p-0"
                >
                  {letra}
                </Button>
              ))}
            </div>

            {letraSeleccionada && (
              <div className="border rounded-md p-2 max-h-60 overflow-y-auto">
                <h3 className="font-medium mb-2">Productos con {letraSeleccionada}</h3>
                {productosPorLetra.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay productos que comiencen con esta letra</p>
                ) : (
                  <div className="space-y-2">
                    {productosPorLetra.map((producto) => (
                      <ProductoCatalogo
                        key={producto.id}
                        producto={producto}
                        onSelect={seleccionarProducto}
                        onEdit={editarProductoCatalogo}
                        onDelete={eliminarProductoCatalogo}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Formulario de edición de producto del catálogo */}
        {productoEditando && !mostrarDialogoConfirmacion && (
          <div className="mt-4 border rounded-md p-4 bg-gray-50">
            <h3 className="font-medium mb-2">Editar producto del catálogo</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nombre">Nombre</Label>
                <Input
                  id="edit-nombre"
                  value={productoEditando.nombre}
                  onChange={(e) => setProductoEditando({ ...productoEditando, nombre: e.target.value })}
                />
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
                <Label htmlFor="edit-precio">Precio</Label>
                <Input
                  id="edit-precio"
                  type="number"
                  value={productoEditando.precio}
                  onChange={(e) => setProductoEditando({ ...productoEditando, precio: Number(e.target.value) })}
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
              <div className="space-y-2">
                <Label htmlFor="edit-stockMinimo">Stock Mínimo</Label>
                <Input
                  id="edit-stockMinimo"
                  type="number"
                  value={productoEditando.stockMinimo}
                  onChange={(e) => setProductoEditando({ ...productoEditando, stockMinimo: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-stockMaximo">Stock Máximo</Label>
                <Input
                  id="edit-stockMaximo"
                  type="number"
                  value={productoEditando.stockMaximo}
                  onChange={(e) => setProductoEditando({ ...productoEditando, stockMaximo: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-observaciones">Observaciones</Label>
                <Textarea
                  id="edit-observaciones"
                  value={productoEditando.observaciones}
                  onChange={(e) => setProductoEditando({ ...productoEditando, observaciones: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setProductoEditando(null)}>
                  Cancelar
                </Button>
                <Button onClick={guardarCambiosCatalogo}>Guardar cambios</Button>
              </div>
            </div>
          </div>
        )}

        {/* Diálogo de confirmación */}
        <Dialog open={mostrarDialogoConfirmacion} onOpenChange={setMostrarDialogoConfirmacion}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirmar cambios en el catálogo</DialogTitle>
              <DialogDescription>
                {accionPendiente?.tipo === "editar"
                  ? "¿Estás seguro de que deseas modificar este producto en el catálogo? Esta acción afectará a todos los usuarios del sistema."
                  : "¿Estás seguro de que deseas eliminar este producto del catálogo? Esta acción no se puede deshacer y afectará a todos los usuarios del sistema."}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {productoEditando && (
                <div className="border rounded p-3 bg-gray-50">
                  <p className="font-medium">{productoEditando.nombre}</p>
                  <p className="text-sm text-gray-500">
                    {productoEditando.categoria} - {formatearPrecioCLP(productoEditando.precio)}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMostrarDialogoConfirmacion(false)}>
                Cancelar
              </Button>
              <Button
                variant={accionPendiente?.tipo === "eliminar" ? "destructive" : "default"}
                onClick={ejecutarAccionPendiente}
              >
                {accionPendiente?.tipo === "editar" ? "Confirmar cambios" : "Confirmar eliminación"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {requiereRefrigeracion && (
            <Alert className="bg-blue-50 border-blue-200 text-blue-800">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                Este producto requiere refrigeración. Se ha añadido automáticamente a las observaciones.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del producto *</Label>
              <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad *</Label>
              <Input
                id="cantidad"
                name="cantidad"
                type="number"
                min="0"
                value={formData.cantidad}
                onChange={handleNumberChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="precio">Precio unitario (CLP) *</Label>
              <Input
                id="precio"
                name="precio"
                type="number"
                min="0"
                step="1"
                value={formData.precio}
                onChange={handleNumberChange}
                required
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="precioTotal">Precio total</Label>
              <Input
                id="precioTotal"
                name="precioTotal"
                type="text"
                value={formatearPrecioCLP(formData.precioTotal)}
                readOnly
                className="bg-gray-50"
              />
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
                onChange={handleNumberChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockMaximo">Stock máximo *</Label>
              <Input
                id="stockMaximo"
                name="stockMaximo"
                type="number"
                min="0"
                value={formData.stockMaximo}
                onChange={handleNumberChange}
                required
              />
              <p className="text-xs text-gray-500">Debe ser mayor que el stock mínimo</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="area">Área *</Label>
              <Select
                name="area"
                value={formData.area}
                onValueChange={(value) => handleSelectChange("area", value)}
                required
              >
                <SelectTrigger>
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
              <Label htmlFor="categoria">Categoría *</Label>
              <Select
                name="categoria"
                value={formData.categoria}
                onValueChange={(value) => handleSelectChange("categoria", value)}
                required
              >
                <SelectTrigger>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="proveedor">Proveedor</Label>
            <Input
              id="proveedor"
              name="proveedor"
              value={formData.proveedor}
              onChange={handleChange}
              placeholder="Ingrese el nombre del proveedor"
            />
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
              placeholder="Añade cualquier observación relevante sobre el producto"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90"
              onClick={(e) => {
                e.preventDefault()
                handleSubmit(e)
              }}
            >
              Guardar producto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
