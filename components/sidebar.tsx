"use client"

import {
  LayoutDashboard,
  FileText,
  RefreshCw,
  Send,
  BarChart3,
  CheckCircle,
  Inbox,
  ClipboardList,
  Settings,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/auth-store"
import { cn } from "@/lib/utils"

interface SidebarProps {
  currentScreen: string
  onNavigate: (screen: string) => void
}

export function Sidebar({ currentScreen, onNavigate }: SidebarProps) {
  const { logout } = useAuthStore()
  const user = useAuthStore((state) => state.getCurrentUser())

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "budget-planning", label: "Budget Planning", icon: FileText },
    { id: "budget-revision", label: "Budget Revision", icon: RefreshCw },
    { id: "spending-request", label: "Spending Request", icon: Send },
    { id: "actual-realization", label: "Actual Realization", icon: BarChart3 },
    { id: "budget-vs-actual", label: "Budget vs Actual", icon: BarChart3 },
    { id: "finance-approval", label: "Finance Approval", icon: CheckCircle },
    { id: "approval-inbox", label: "Approval Inbox", icon: Inbox },
    { id: "my-submissions", label: "My Submissions", icon: ClipboardList },
    { id: "transaction-ledger", label: "Transaction Ledger", icon: FileText },
    { id: "master-data", label: "Master Data", icon: Settings },
  ]

  return (
    <aside className="w-64 border-r border-border bg-card">
      <div className="flex h-full flex-col overflow-y-auto">
        {/* User Info */}
        <div className="border-b border-border p-4">
          <p className="text-sm font-medium text-foreground">{user?.name || "User"}</p>
          <p className="text-xs text-muted-foreground">{user?.role || "Role"}</p>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-2 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentScreen === item.id

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="border-t border-border p-4">
          <Button
            onClick={logout}
            variant="outline"
            className="w-full justify-start"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  )
}
