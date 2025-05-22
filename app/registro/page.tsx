"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

export default function Registro() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [area, setArea] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validar campos
    if (!username || !password || !confirmPassword || !area) {
      setError("Todos los campos son obligatorios")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    // Verificar si el usuario ya existe
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const userExists = users.some((user: { username: string }) => user.username === username)

    // Verificar si el usuario está intentando registrarse como admin
    if (username.toLowerCase() === "admin") {
      setError("Este nombre de usuario no está disponible")
      return
    }

    if (userExists) {
      setError("El nombre de usuario ya está en uso")
      return
    }

    // Guardar nuevo usuario
    const newUser = { username, password, area, role: "user" }
    users.push(newUser)
    localStorage.setItem("users", JSON.stringify(users))

    // Registrar la acción en el log
    const logs = JSON.parse(localStorage.getItem("systemLogs") || "[]")
    logs.push({
      fecha: new Date().toISOString(),
      usuario: "Sistema",
      accion: "Registro de usuario",
      detalles: `Nuevo usuario: ${username}, Área: ${area}`,
    })
    localStorage.setItem("systemLogs", JSON.stringify(logs))

    setSuccess(true)
    setTimeout(() => {
      router.push("/login")
    }, 2000)
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Card className="border-t-4 border-t-dental-green">
        <CardHeader className="bg-green-50 dark:bg-green-950/30">
          <CardTitle className="text-2xl text-center text-dental-green">Registro de Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <Alert className="mb-4 bg-green-50 text-dental-green border-dental-green/20 dark:bg-green-950/30">
              <AlertDescription>¡Registro exitoso! Redirigiendo al inicio de sesión...</AlertDescription>
            </Alert>
          ) : null}

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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme su contraseña"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Área de Trabajo</Label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione su área de trabajo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Box 1">Box 1</SelectItem>
                  <SelectItem value="Box 2">Box 2</SelectItem>
                  <SelectItem value="Box 3">Box 3</SelectItem>
                  <SelectItem value="Box 4">Box 4</SelectItem>
                  <SelectItem value="Box 5">Box 5</SelectItem>
                  <SelectItem value="Recepción">Recepción</SelectItem>
                  <SelectItem value="Almacenamiento">Almacenamiento</SelectItem>
                  <SelectItem value="Cirugía Maxilofacial">Cirugía Maxilofacial</SelectItem>
                  <SelectItem value="Implantología">Implantología</SelectItem>
                  <SelectItem value="Rehabilitación">Rehabilitación</SelectItem>
                  <SelectItem value="Endodoncia">Endodoncia</SelectItem>
                  <SelectItem value="Periodoncia">Periodoncia</SelectItem>
                  <SelectItem value="Ortodoncia">Ortodoncia</SelectItem>
                  <SelectItem value="Odontopediatría">Odontopediatría</SelectItem>
                  <SelectItem value="Radiología">Radiología</SelectItem>
                  <SelectItem value="Esterilización">Esterilización</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full bg-dental-green hover:bg-dental-green/90">
              Registrarse
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p>
              ¿Ya tienes una cuenta?{" "}
              <Link href="/login" className="text-dental-blue hover:underline">
                Iniciar Sesión
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
