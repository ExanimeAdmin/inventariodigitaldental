import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <title>Sistema de Gestión para Clínica Dental</title>
        <meta name="description" content="Sistema de gestión para clínica dental con inventario, compras e informes" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 dark:from-background dark:to-background">
            <div className="absolute top-4 right-4 z-50">
              <ThemeToggle />
            </div>
            <main>{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
