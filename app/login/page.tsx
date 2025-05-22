"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function Login() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    // Verificar si existe el usuario admin, si no, crearlo
    // Pero no mostrar ninguna información sobre esto en la interfaz
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const adminExists = users.some((user: { username: string }) => user.username === "admin")

    if (!adminExists) {
      users.push({
        username: "admin",
        password: "S217089336", // Contraseña especificada por el usuario
        role: "admin",
      })
      localStorage.setItem("users", JSON.stringify(users))
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validar campos
    if (!username || !password) {
      setError("Todos los campos son obligatorios")
      return
    }

    // Verificar credenciales
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const user = users.find(
      (user: { username: string; password: string }) => user.username === username && user.password === password,
    )

    if (!user) {
      setError("Nombre de usuario o contraseña incorrectos")
      return
    }

    // Guardar sesión
    localStorage.setItem(
      "currentUser",
      JSON.stringify({
        username: user.username,
        role: user.role || "user",
        area: user.area || "",
      }),
    )

    // Registrar inicio de sesión en el log
    const logs = JSON.parse(localStorage.getItem("systemLogs") || "[]")
    logs.push({
      fecha: new Date().toISOString(),
      usuario: username,
      accion: "Inicio de sesión",
      detalles: `Desde ${navigator.userAgent}`,
    })
    localStorage.setItem("systemLogs", JSON.stringify(logs))

    router.push("/")
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Card className="border-t-4 border-t-dental-blue">
        <CardHeader className="bg-blue-50 dark:bg-blue-950/30">
          <CardTitle className="text-2xl text-center text-dental-blue">Iniciar Sesión</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert className="mb-4 bg-red-50 text-dental-red border-dental-red/20 dark:bg-red-950/30">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de Usuario</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingrese su nombre de usuario"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese su contraseña"
              />
            </div>

            <Button type="submit" className="w-full bg-dental-blue hover:bg-dental-blue/90">
              Iniciar Sesión
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p>
              ¿No tienes una cuenta?{" "}
              <Link href="/registro" className="text-dental-blue hover:underline">
                Registrarse
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
