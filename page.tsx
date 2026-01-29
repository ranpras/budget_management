"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { useMasterDataStore } from "@/lib/master-data-store"
import { Login } from "@/components/screens/login"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Dashboard } from "@/components/screens/dashboard"
import { BudgetPlanning } from "@/components/screens/budget-planning"
import { BudgetRevision } from "@/components/screens/budget-revision"
import { SpendingRequest } from "@/components/screens/spending-request"
import { ActualRealization } from "@/components/screens/actual-realization"
import { BudgetVsActual } from "@/components/screens/budget-vs-actual"
import { FinanceApproval } from "@/components/screens/finance-approval"
import { TransactionLedger } from "@/components/screens/transaction-ledger"
import { MasterData } from "@/components/screens/master-data"
import { ApprovalInbox } from "@/components/screens/approval-inbox"
import { MySubmissions } from "@/components/screens/my-submissions"

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState("dashboard")
  const [mounted, setMounted] = useState(false)
  const { isAuthenticated, theme } = useAuthStore()
  const setCurrentUser = useMasterDataStore((state) => state.setCurrentUser)
  const currentUser = useAuthStore((state) => state.getCurrentUser())

  useEffect(() => {
    setMounted(true)
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

  if (!mounted) return null

  if (!isAuthenticated) {
    return (
      <div className={theme === "dark" ? "dark" : ""}>
        <Login onLoginSuccess={() => setCurrentScreen("dashboard")} />
      </div>
    )
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "dashboard":
        return <Dashboard />
      case "budget-planning":
        return <BudgetPlanning />
      case "budget-revision":
        return <BudgetRevision />
      case "spending-request":
        return <SpendingRequest />
      case "actual-realization":
        return <ActualRealization />
      case "budget-vs-actual":
        return <BudgetVsActual />
      case "finance-approval":
        return <FinanceApproval />
      case "approval-inbox":
        return <ApprovalInbox />
      case "my-submissions":
        return <MySubmissions />
      case "transaction-ledger":
        return <TransactionLedger />
      case "master-data":
        return <MasterData />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className={`flex h-screen flex-col ${theme === "dark" ? "dark" : ""}`}>
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentScreen={currentScreen} onNavigate={setCurrentScreen} />
        <main className="flex-1 overflow-auto bg-background">{renderScreen()}</main>
      </div>
    </div>
  )
}
