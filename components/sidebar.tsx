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
  DollarSign,
  TrendingUp,
  Receipt,
  BookOpen,
  Database,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/auth-store"
import { cn } from "@/lib/utils"
import { UserRole } from "@/lib/master-data-types"

interface SidebarProps {
  currentScreen: string
  onNavigate: (screen: string) => void
}

export function Sidebar({ currentScreen, onNavigate }: SidebarProps) {
  const { logout } = useAuthStore()
  const user = useAuthStore((state) => state.getCurrentUser())

  // Icon map for dynamic rendering
  const iconMap: Record<string, any> = {
    BarChart3,
    DollarSign,
    TrendingUp,
    Receipt,
    FileText,
    CheckCircle,
    Inbox,
    BookOpen,
    Database,
  }

  // Get role-based menu items
  const getMenuItems = () => {
    const userRole = user?.role
    
    switch (userRole) {
      case UserRole.OPERATOR:
      case "operator":
        return [
          { id: "dashboard", label: "Dashboard", icon: "BarChart3" },
          { id: "budget-planning", label: "Budget Input", icon: "DollarSign" },
          { id: "spending-request", label: "SPK", icon: "Send" },
          { id: "actual-realization", label: "Actual Realization", icon: "Receipt" },
          { id: "budget-vs-actual", label: "Monitoring", icon: "BarChart3" },
        ]
      case UserRole.SUPERVISOR:
      case "supervisor":
        return [
          { id: "dashboard", label: "Dashboard", icon: "BarChart3" },
          { id: "approval-inbox", label: "Approval Queue", icon: "CheckCircle" },
          { id: "budget-vs-actual", label: "Monitoring", icon: "BarChart3" },
        ]
      case UserRole.ADMIN_BUDGET:
      case "admin_budget":
        return [
          { id: "dashboard", label: "Dashboard", icon: "BarChart3" },
          { id: "budget-planning", label: "Budget Management", icon: "DollarSign" },
          { id: "finance-approval", label: "Approvals", icon: "CheckCircle" },
          { id: "budget-vs-actual", label: "Monitoring", icon: "BarChart3" },
          { id: "transaction-ledger", label: "Transaction Ledger", icon: "BookOpen" },
          { id: "master-data", label: "Master Data", icon: "Database" },
        ]
      default:
        return [
          { id: "dashboard", label: "Dashboard", icon: "BarChart3" },
        ]
    }
  }

  const menuItems = getMenuItems()

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
            const Icon = iconMap[item.icon] || LayoutDashboard
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
