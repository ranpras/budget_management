"use client"

import { Suspense } from "react"
import AppContent from "@/components/app-content"

export default function Home() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <AppContent />
    </Suspense>
  )
}

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
