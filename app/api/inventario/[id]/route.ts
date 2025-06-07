import { NextResponse } from "next/server"
import sql, { DEMO_MODE } from "@/lib/db"
import { demoProductos } from "@/lib/demo-data"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    // Si estamos en modo demo, devolvemos datos de ejemplo
    if (DEMO_MODE) {
      const producto = demoProductos.find((p) => p.id === id)
      if (!producto) {
        return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
      }
      return NextResponse.json({ producto, demo_mode: true })
    }

    // Consulta real a la base de datos
    const result = await sql`SELECT * FROM productos WHERE id = ${id}`

    if (result.length === 0) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ producto: result[0] })
  } catch (error) {
    console.error(`Error getting producto ${params.id}:`, error)
    return NextResponse.json(
      {
        error: "Error al obtener producto",
        message: error instanceof Error ? error.message : "Error desconocido",
        demo_mode: DEMO_MODE,
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const data = await request.json()

    // Si estamos en modo demo, simulamos una respuesta exitosa
    if (DEMO_MODE) {
      return NextResponse.json({
        producto: { ...data, id, updated_at: new Date().toISOString() },
        demo_mode: true,
      })
    }

    // Validación de datos
    if (!data.nombre || !data.categoria || data.precio === undefined || data.stock === undefined) {
      return NextResponse.json({ error: "Faltan campos requeridos: nombre, categoria, precio, stock" }, { status: 400 })
    }

    // Actualización en la base de datos
    const result = await sql`
      UPDATE productos SET
        nombre = ${data.nombre},
        descripcion = ${data.descripcion || ""},
        categoria = ${data.categoria},
        precio = ${data.precio},
        stock = ${data.stock},
        stock_minimo = ${data.stock_minimo || 10},
        ubicacion = ${data.ubicacion || "Almacén"},
        fecha_vencimiento = ${data.fecha_vencimiento || null},
        requiere_refrigeracion = ${data.requiere_refrigeracion || false},
        proveedor = ${data.proveedor || ""},
        codigo = ${data.codigo || ""},
        unidad_medida = ${data.unidad_medida || "Unidad"},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ producto: result[0] })
  } catch (error) {
    console.error(`Error updating producto ${params.id}:`, error)
    return NextResponse.json(
      {
        error: "Error al actualizar producto",
        message: error instanceof Error ? error.message : "Error desconocido",
        demo_mode: DEMO_MODE,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    // Si estamos en modo demo, simulamos una respuesta exitosa
    if (DEMO_MODE) {
      return NextResponse.json({ success: true, demo_mode: true })
    }

    // Eliminación en la base de datos
    const result = await sql`DELETE FROM productos WHERE id = ${id} RETURNING id`

    if (result.length === 0) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error(`Error deleting producto ${params.id}:`, error)
    return NextResponse.json(
      {
        error: "Error al eliminar producto",
        message: error instanceof Error ? error.message : "Error desconocido",
        demo_mode: DEMO_MODE,
      },
      { status: 500 },
    )
  }
}
