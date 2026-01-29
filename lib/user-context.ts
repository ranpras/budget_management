import { useMasterDataStore } from "@/lib/master-data-store"
import { UserRole } from "@/lib/master-data-types"
import type { AppUser } from "@/lib/master-data-types"

// Helper functions for role-based logic
export function useCurrentUser(): AppUser | null {
  const { currentUser } = useMasterDataStore()
  return currentUser
}

export function useUserRole(): UserRole | null {
  const user = useCurrentUser()
  return user?.role || null
}

export function isOperator(user: AppUser | null): boolean {
  return user?.role === UserRole.OPERATOR || user?.role === "operator"
}

export function isApproval(user: AppUser | null): boolean {
  return user?.role === UserRole.SUPERVISOR || user?.role === "supervisor"
}

export function isFinance(user: AppUser | null): boolean {
  return user?.role === UserRole.ADMIN_BUDGET || user?.role === "admin_budget"
}

export function canAccessUnitData(user: AppUser | null, targetUnitId: string): boolean {
  if (!user) return false
  const role = user.role as string
  if (role === UserRole.ADMIN_BUDGET || role === "admin_budget") return true // Finance sees all
  if ((role === UserRole.OPERATOR || role === "operator" || role === UserRole.SUPERVISOR || role === "supervisor")) {
    return user.unitId === targetUnitId
  }
  return false
}

export function getVisibleMenu(role: UserRole | null) {
  if (!role) return []

  switch (role) {
    case UserRole.OPERATOR:
      return [
        { id: "dashboard", label: "Dashboard", icon: "BarChart3" },
        { id: "budget-planning", label: "Budget Planning", icon: "DollarSign" },
        { id: "budget-revision", label: "Budget Revision / Unbudget", icon: "TrendingUp" },
        { id: "spending-request", label: "Spending Request", icon: "Send" },
        { id: "actual-realization", label: "Actual Realization", icon: "Receipt" },
        { id: "my-submissions", label: "My Submissions", icon: "FileText" },
      ]
    case UserRole.APPROVAL:
      return [
        { id: "dashboard", label: "Dashboard (Unit)", icon: "BarChart3" },
        { id: "approval-inbox", label: "Approval Inbox", icon: "CheckCircle2" },
        { id: "budget-vs-actual", label: "Budget vs Actual", icon: "BarChart3" },
      ]
    case UserRole.FINANCE:
      return [
        { id: "dashboard", label: "Dashboard (Corporate)", icon: "BarChart3" },
        { id: "finance-approval", label: "Approval Inbox", icon: "CheckCircle2" },
        { id: "budget-vs-actual", label: "Budget vs Actual", icon: "BarChart3" },
        { id: "transaction-ledger", label: "Transaction Ledger", icon: "BookOpen" },
        { id: "master-data", label: "Master Data", icon: "Database" },
      ]
    default:
      return []
  }
}

export function useUserContext() {
  return {
    currentUser: useCurrentUser(),
    currentUserRole: useUserRole(),
  }
}
