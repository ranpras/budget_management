import type { AppUser } from "./master-data-types"
import { useBudgetStore } from "./store"

// Role-based permission checks
export function canCreateBudget(user: AppUser | null): boolean {
  return user?.role === "operator"
}

export function canSubmitBudget(user: AppUser | null): boolean {
  return user?.role === "operator"
}

export function canApproveBudget(user: AppUser | null): boolean {
  return user?.role === "supervisor" || user?.role === "admin_budget"
}

export function canApproveAsUnit(user: AppUser | null): boolean {
  return user?.role === "supervisor"
}

export function canApproveAsFinance(user: AppUser | null): boolean {
  return user?.role === "admin_budget"
}

export function canAccessMasterData(user: AppUser | null): boolean {
  return user?.role === "admin_budget"
}

export function canViewUnitData(user: AppUser | null, targetUnitId: string): boolean {
  if (!user) return false
  if (user.role === "admin_budget") return true
  if ((user.role === "operator" || user.role === "supervisor") && user.unitId === targetUnitId) return true
  return false
}

export function canViewAllData(user: AppUser | null): boolean {
  return user?.role === "admin_budget"
}

export function canViewCorporateDashboard(user: AppUser | null): boolean {
  return user?.role === "admin_budget"
}

export function canViewUnitDashboard(user: AppUser | null): boolean {
  return user?.role === "operator" || user?.role === "supervisor"
}

export function canCreateCommitment(user: AppUser | null, budgetUnitId: string): boolean {
  if (!user) return false
  if (user.role !== "operator") return false
  return user.unitId === budgetUnitId
}

export function canCreateActual(user: AppUser | null, commitmentUnitId: string): boolean {
  if (!user) return false
  if (user.role !== "operator") return false
  return user.unitId === commitmentUnitId
}

export function canEditSubmittedData(user: AppUser | null): boolean {
  return false // No one can edit submitted data
}

export function getApprovalQueueForUser(user: AppUser | null) {
  const store = useBudgetStore()

  if (!user) return { budgets: [], commitments: [], actuals: [], revisions: [] }

  if (user.role === "approval") {
    return store.getPendingUnitApprovals(user.unitId || "")
  }

  if (user.role === "finance") {
    return store.getPendingFinanceApprovals()
  }

  return { budgets: [], commitments: [], actuals: [], revisions: [] }
}

export function enforceUnitRestriction(
  user: AppUser | null,
  targetUnitId: string,
): {
  allowed: boolean
  reason?: string
} {
  if (!user) return { allowed: false, reason: "User not authenticated" }

  if (user.role === "admin_budget") {
    return { allowed: true }
  }

  if (user.role === "operator" || user.role === "supervisor") {
    if (user.unitId === targetUnitId) {
      return { allowed: true }
    }
    return { allowed: false, reason: `You can only access data for unit ${user.unitId}` }
  }

  return { allowed: false, reason: "Unauthorized role" }
}
