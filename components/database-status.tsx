"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, RefreshCw, Info } from "lucide-react"

interface DatabaseStatus {
  status: string
  database: string
  message: string
  demo_mode: boolean
  environment: {
    nodeEnv: string
    hasDatabaseUrl: boolean
    databaseUrlFormat: string
  }
}

export function DatabaseStatus() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const checkStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/health")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error("Error checking database status:", error)
      setStatus({
        status: "error",
        database: "error",
        demo_mode: true,
        message: "No se pudo verificar el estado de la base de datos",
        environment: {
          nodeEnv: "unknown",
          hasDatabaseUrl: false,
          databaseUrlFormat: "unknown",
        },
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  if (loading) {
    return (
      <Alert>
        <RefreshCw className="h-4 w-4 animate-spin" />
        <AlertTitle>Verificando conexión...</AlertTitle>
        <AlertDescription>Comprobando el estado de la base de datos...</AlertDescription>
      </Alert>
    )
  }

  if (!status) return null

  const isConnected = status.database === "connected"
  const isDemoMode = status.demo_mode
  const hasValidConfig = status.environment.hasDatabaseUrl && status.environment.databaseUrlFormat === "valid"

  return (
    <div className="space-y-4">
      {isDemoMode ? (
        <Alert variant="warning">
          <Info className="h-4 w-4" />
          <AlertTitle>
            Modo Demostración
            <Badge variant="outline" className="ml-2 bg-yellow-100">
              Demo
            </Badge>
          </AlertTitle>
          <AlertDescription className="mt-2">
            <div className="space-y-2">
              <p>
                La aplicación está funcionando en <strong>modo demostración</strong> con datos de ejemplo.
              </p>
              <p className="text-sm">
                Para conectar con una base de datos real, configure la variable de entorno DATABASE_URL.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant={isConnected ? "default" : "destructive"}>
          {isConnected ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>
            Estado de la Base de Datos
            <Badge variant={isConnected ? "default" : "destructive"} className="ml-2">
              {isConnected ? "Conectada" : "Desconectada"}
            </Badge>
          </AlertTitle>
          <AlertDescription className="mt-2">
            <div className="space-y-2">
              <p>
                <strong>Mensaje:</strong> {status.message}
              </p>
              <p>
                <strong>Entorno:</strong> {status.environment.nodeEnv}
              </p>
              <p>
                <strong>DATABASE_URL:</strong> {status.environment.hasDatabaseUrl ? "Configurada" : "No configurada"}
              </p>
              <p>
                <strong>Formato URL:</strong> {status.environment.databaseUrlFormat}
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!hasValidConfig && !isDemoMode && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuración Requerida</AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              <p>Para conectar con Neon PostgreSQL, configure la variable de entorno:</p>
              <code className="block bg-muted p-2 rounded text-sm">
                DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
              </code>
              <p className="text-sm text-muted-foreground">
                Obtenga esta URL desde su dashboard de Neon en la sección "Connection Details"
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Button onClick={checkStatus} disabled={loading} variant="outline" size="sm">
        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
        Verificar Conexión
      </Button>
    </div>
  )
}
