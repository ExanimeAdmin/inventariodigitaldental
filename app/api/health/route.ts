import { NextResponse } from "next/server"
import { testConnection, DEMO_MODE } from "@/lib/db"

export async function GET() {
  try {
    const dbTest = await testConnection()

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: dbTest.success ? "connected" : "disconnected",
      demo_mode: DEMO_MODE,
      message: dbTest.message,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlFormat: process.env.DATABASE_URL
          ? process.env.DATABASE_URL.startsWith("postgresql://") || process.env.DATABASE_URL.startsWith("postgres://")
            ? "valid"
            : "invalid"
          : "missing",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        database: "error",
        demo_mode: DEMO_MODE,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
