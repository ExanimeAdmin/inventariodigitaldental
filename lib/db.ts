import { neon } from "@neondatabase/serverless"

// Modo de demostración para cuando no hay conexión a la base de datos
export const DEMO_MODE = !process.env.DATABASE_URL || process.env.FORCE_DEMO_MODE === "true"

// Función para crear la conexión a la base de datos
export function createDbConnection() {
  // Si estamos en modo demo, devolvemos una función mock
  if (DEMO_MODE) {
    console.warn("⚠️ MODO DEMOSTRACIÓN ACTIVADO: Usando datos de ejemplo en lugar de base de datos")
    return {
      mockDb: true,
      async query() {
        return { rows: [] }
      },
    }
  }

  // Verificar que la variable de entorno esté configurada
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL environment variable is not set. Please configure your Neon database connection string.",
    )
  }

  try {
    // Crear conexión con configuración optimizada para Neon
    const sql = neon(process.env.DATABASE_URL)
    return sql
  } catch (error) {
    console.error("Error creating database connection:", error)
    throw new Error(`Failed to create database connection: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Crear la conexión (o el mock en modo demo)
const sql = createDbConnection()

// Función para probar la conexión
export async function testConnection() {
  try {
    if (DEMO_MODE) {
      return {
        success: false,
        demoMode: true,
        message: "Modo demostración activado. Usando datos de ejemplo.",
      }
    }

    const result = await sql`SELECT 1 as test`
    return { success: true, message: "Conexión a la base de datos exitosa" }
  } catch (error) {
    console.error("Database connection test failed:", error)
    return {
      success: false,
      demoMode: false,
      message: error instanceof Error ? error.message : "Error desconocido en la base de datos",
    }
  }
}

export default sql
