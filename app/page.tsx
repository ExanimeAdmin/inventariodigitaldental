"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser")
    if (currentUser) {
      const userData = JSON.parse(currentUser)
      setIsAdmin(userData.username === "admin")
      setIsLoggedIn(true)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    setIsLoggedIn(false)
    setIsAdmin(false)
  }

  return (
    <div className="container mx-auto p-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-dental-blue dark:text-dental-blue">
        Sistema de Gestión para Clínica Dental
      </h1>

      {isLoggedIn ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Bienvenido al Sistema {isAdmin && "(Administrador)"}</h2>
            <Button variant="destructive" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-dental-blue">
              <CardHeader className="bg-blue-50 dark:bg-blue-950/30">
                <CardTitle className="text-dental-blue">Inventario</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="mb-4">Gestiona los productos del inventario, agrega, edita y elimina productos.</p>
                <Button
                  className="w-full bg-dental-blue hover:bg-dental-blue/90"
                  onClick={() => router.push("/inventario")}
                >
                  Ir a Inventario
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-dental-green">
              <CardHeader className="bg-green-50 dark:bg-green-950/30">
                <CardTitle className="text-dental-green">Registro de Compras</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="mb-4">Registra las compras realizadas y visualiza informes de gastos.</p>
                <Button
                  className="w-full bg-dental-green hover:bg-dental-green/90"
                  onClick={() => router.push("/compras")}
                >
                  Ir a Compras
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-dental-purple">
              <CardHeader className="bg-purple-50 dark:bg-purple-950/30">
                <CardTitle className="text-dental-purple">Informes</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="mb-4">Visualiza informes detallados de productos y gastos.</p>
                <Button
                  className="w-full bg-dental-purple hover:bg-dental-purple/90"
                  onClick={() => router.push("/informes")}
                >
                  Ir a Informes
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-dental-yellow">
              <CardHeader className="bg-yellow-50 dark:bg-yellow-950/30">
                <CardTitle className="text-dental-yellow">Proveedores</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="mb-4">Gestiona los proveedores, contactos y documentos relacionados.</p>
                <Button
                  className="w-full bg-dental-yellow hover:bg-dental-yellow/90 text-black"
                  onClick={() => router.push("/proveedores")}
                >
                  Ir a Proveedores
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-dental-red">
              <CardHeader className="bg-red-50 dark:bg-red-950/30">
                <CardTitle className="text-dental-red">Sugerencias</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="mb-4">Envía y gestiona sugerencias sobre materiales y proveedores.</p>
                <Button
                  className="w-full bg-dental-red hover:bg-dental-red/90"
                  onClick={() => router.push("/sugerencias")}
                >
                  Ir a Sugerencias
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-dental-blue">
              <CardHeader className="bg-blue-50 dark:bg-blue-950/30">
                <CardTitle className="text-dental-blue">Historial</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="mb-4">Consulta el historial de movimientos y cambios en el sistema.</p>
                <Button
                  className="w-full bg-dental-blue hover:bg-dental-blue/90"
                  onClick={() => router.push("/historial")}
                >
                  Ir a Historial
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-dental-green">
              <CardHeader className="bg-green-50 dark:bg-green-950/30">
                <CardTitle className="text-dental-green">Consumo por Box</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="mb-4">Analiza el consumo de materiales por box o área de la clínica.</p>
                <Button
                  className="w-full bg-dental-green hover:bg-dental-green/90"
                  onClick={() => router.push("/consumo")}
                >
                  Ir a Consumo
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-dental-blue">
            <CardHeader className="bg-blue-50 dark:bg-blue-950/30">
              <CardTitle className="text-dental-blue">Iniciar Sesión</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="mb-4">Si ya tienes una cuenta, inicia sesión para acceder al sistema.</p>
              <Button className="w-full bg-dental-blue hover:bg-dental-blue/90" onClick={() => router.push("/login")}>
                Ir a Iniciar Sesión
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-dental-green">
            <CardHeader className="bg-green-50 dark:bg-green-950/30">
              <CardTitle className="text-dental-green">Registrarse</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="mb-4">Si eres nuevo, crea una cuenta para comenzar a utilizar el sistema.</p>
              <Button
                className="w-full bg-dental-green hover:bg-dental-green/90"
                onClick={() => router.push("/registro")}
              >
                Ir a Registrarse
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
