"use client"

import type React from "react"

import { useState } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface LoginProps {
  onLoginSuccess: () => void
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const login = useAuthStore((state) => state.login)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Simulate API delay
    setTimeout(() => {
      const result = login(username, password)
      if (result.success) {
        onLoginSuccess()
      } else {
        setError(result.error || "Login failed")
      }
      setIsLoading(false)
    }, 500)
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center">
            <div className="rounded-lg bg-blue-600 p-3">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl">BudgetHub</CardTitle>
          <CardDescription>Budget Management System</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-6 space-y-3 rounded-lg bg-blue-50 p-4 dark:bg-gray-800">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Demo Credentials:</p>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <div>
                <p className="font-medium">Operator (Unit 1):</p>
                <p>operator1 / operator123</p>
              </div>
              <div>
                <p className="font-medium">Supervisor (Unit 1):</p>
                <p>supervisor1 / supervisor123</p>
              </div>
              <div>
                <p className="font-medium">Supervisor (Unit 2):</p>
                <p>supervisor2 / supervisor123</p>
              </div>
              <div>
                <p className="font-medium">Admin Budget (All Units):</p>
                <p>admin / admin123</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
