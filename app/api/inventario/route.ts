import { NextResponse } from "next/server"
import sql, { DEMO_MODE } from "@/lib/db"
import { demoProductos } from "@/lib/demo-data"

export async function GET() {
  try {
    // Si estamos en modo demo, devolvemos datos de ejemplo
    if (DEMO_MODE) {
      return NextResponse.json({ productos: demoProductos })
    }

    // Consulta real a la base de datos
    const result = await sql`SELECT * FROM productos ORDER BY nombre ASC`
    return NextResponse.json({ productos: result })
  } catch (error) {
    console.error("Error getting productos:", error)
    return NextResponse.json(
      {
        error: "Error al obtener productos",
        message: error instanceof Error ? error.message : "Error desconocido",
        demo_mode: DEMO_MODE,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    // Si estamos en modo demo, simulamos una respuesta exitosa
    if (DEMO_MODE) {
      const data = await request.json()
      const newProduct = {
        ...data,
        id: demoProductos.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      return NextResponse.json({ producto: newProduct, demo_mode: true }, { status: 201 })
    }

    const data = await request.json()

    // Validación de datos
    if (!data.nombre || !data.categoria || data.precio === undefined || data.stock === undefined) {
      return NextResponse.json({ error: "Faltan campos requeridos: nombre, categoria, precio, stock" }, { status: 400 })
    }

    // Inserción en la base de datos
    const result = await sql`
      INSERT INTO productos (
        nombre, descripcion, categoria, precio, stock, stock_minimo, 
        ubicacion, fecha_vencimiento, requiere_refrigeracion, proveedor, 
        codigo, unidad_medida
      ) VALUES (
        ${data.nombre}, ${data.descripcion || ""}, ${data.categoria}, 
        ${data.precio}, ${data.stock}, ${data.stock_minimo || 10}, 
        ${data.ubicacion || "Almacén"}, ${data.fecha_vencimiento || null}, 
        ${data.requiere_refrigeracion || false}, ${data.proveedor || ""}, 
        ${data.codigo || ""}, ${data.unidad_medida || "Unidad"}
      ) RETURNING *
    `

    return NextResponse.json({ producto: result[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating producto:", error)
    return NextResponse.json(
      {
        error: "Error al crear producto",
        message: error instanceof Error ? error.message : "Error desconocido",
        demo_mode: DEMO_MODE,
      },
      { status: 500 },
    )
  }
}
