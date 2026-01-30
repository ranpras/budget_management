"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { useMasterDataStore } from "@/lib/master-data-store"

// Lazy load components
import dynamic from "next/dynamic"

const Login = dynamic(() => import("@/components/screens/login").then(m => ({ default: m.Login })), {
  loading: () => <div className="flex h-screen items-center justify-center">Loading login...</div>
})

const Dashboard = dynamic(() => import("@/components/screens/dashboard").then(m => ({ default: m.Dashboard })), {
  loading: () => <div className="flex h-screen items-center justify-center">Loading dashboard...</div>
})

const Header = dynamic(() => import("@/components/header").then(m => ({ default: m.Header })), {
  loading: () => <div className="h-16 bg-gray-100">Loading header...</div>
})

const Sidebar = dynamic(() => import("@/components/sidebar").then(m => ({ default: m.Sidebar })), {
  loading: () => <div className="w-64 bg-gray-100">Loading sidebar...</div>
})

interface AppContentProps {}

export default function AppContent() {
  const [mounted, setMounted] = useState(false)
  const [currentScreen, setCurrentScreen] = useState("dashboard")

  const { isAuthenticated, theme } = useAuthStore()
  const setCurrentUser = useMasterDataStore((state) => state.setCurrentUser)
  const currentUser = useAuthStore((state) => state.getCurrentUser())

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [theme])

  useEffect(() => {
    if (currentUser && mounted) {
      setCurrentUser(currentUser)
    }
  }, [currentUser, setCurrentUser, mounted])

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900">Loading...</h2>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className={theme === "dark" ? "dark" : ""}>
        <Login onLoginSuccess={() => {}} />
      </div>
    )
  }

  return (
    <div className={`flex h-screen flex-col ${theme === "dark" ? "dark" : ""}`}>
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentScreen={currentScreen} onNavigate={setCurrentScreen} />
        <main className="flex-1 overflow-auto bg-background">
          {currentScreen === "dashboard" && <Dashboard />}
        </main>
      </div>
    </div>
  )
}
