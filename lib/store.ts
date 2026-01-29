import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  type Budget,
  type BudgetRevision,
  type Commitment,
  type ActualPayment,
  BudgetStatus,
  RevisionStatus,
  CommitmentStatus,
  ActualStatus,
  type BudgetType,
  type BudgetBalance,
  type BudgetVsActualRow,
} from "./types"

interface BudgetStore {
  // Data
  budgets: Budget[]
  revisions: BudgetRevision[]
  commitments: Commitment[]
  actuals: ActualPayment[]

  // Budget Actions
  createBudget: (budget: Omit<Budget, "id" | "createdAt">) => void
  submitBudget: (budgetId: string) => void
  approveBudget: (budgetId: string) => void
  rejectBudget: (budgetId: string) => void
  closeBudgetYear: (fiscalYear: number) => void
  approveBudgetBySupervisor: (budgetId: string, approverId: string) => void
  approveBudgetByAdmin: (budgetId: string, approverId: string) => void
  rejectBudgetBySupervisor: (budgetId: string, approverId: string, reason: string) => void
  rejectBudgetByAdmin: (budgetId: string, approverId: string, reason: string) => void
  requestBudgetRevision: (budgetId: string, requestedBy: string, notes: string) => void

  // Revision Actions
  createRevision: (revision: Omit<BudgetRevision, "id" | "createdAt">) => void
  submitRevision: (revisionId: string) => void
  approveRevision: (revisionId: string) => void
  rejectRevision: (revisionId: string) => void
  approveUnitRevision: (revisionId: string, approverId: string) => void
  approveFinanceRevision: (revisionId: string, approverId: string) => void
  rejectUnitRevision: (revisionId: string, approverId: string, reason: string) => void
  rejectFinanceRevision: (revisionId: string, approverId: string, reason: string) => void

  // Commitment Actions
  createCommitment: (commitment: Omit<Commitment, "id" | "createdAt">) => void
  submitCommitment: (commitmentId: string) => void
  approveCommitment: (commitmentId: string) => void
  rejectCommitment: (commitmentId: string) => void
  completeCommitment: (commitmentId: string) => void
  cancelCommitment: (commitmentId: string) => void
  approveUnitCommitment: (commitmentId: string, approverId: string) => void
  approveFinanceCommitment: (commitmentId: string, approverId: string) => void
  rejectUnitCommitment: (commitmentId: string, approverId: string, reason: string) => void
  rejectFinanceCommitment: (commitmentId: string, approverId: string, reason: string) => void

  // Actual Payment Actions
  createActual: (actual: Omit<ActualPayment, "id" | "createdAt">) => void
  submitActual: (actualId: string) => void
  postActual: (actualId: string) => void
  cancelActual: (actualId: string) => void
  approveUnitActual: (actualId: string, approverId: string) => void
  approveFinanceActual: (actualId: string, approverId: string) => void
  rejectUnitActual: (actualId: string, approverId: string, reason: string) => void
  rejectFinanceActual: (actualId: string, approverId: string, reason: string) => void

  // Calculations
  getBudgetBalance: (budgetId: string) => BudgetBalance
  getBudgetVsActualData: (fiscalYear: number, budgetType?: BudgetType) => BudgetVsActualRow[]
  getPendingApprovals: () => {
    budgets: Budget[]
    revisions: BudgetRevision[]
    commitments: Commitment[]
    actuals: ActualPayment[]
  }
  getPendingUnitApprovals: (unitId: string) => {
    budgets: Budget[]
    revisions: BudgetRevision[]
    commitments: Commitment[]
    actuals: ActualPayment[]
  }
  getPendingFinanceApprovals: () => {
    budgets: Budget[]
    revisions: BudgetRevision[]
    commitments: Commitment[]
    actuals: ActualPayment[]
  }
  getPendingSupervisorApprovals: (unitId: string) => {
    budgets: Budget[]
    revisions: BudgetRevision[]
    commitments: Commitment[]
    actuals: ActualPayment[]
  }
  getPendingAdminApprovals: () => {
    budgets: Budget[]
    revisions: BudgetRevision[]
    commitments: Commitment[]
    actuals: ActualPayment[]
  }
  getBudgetsByUnit: (unitId: string) => Budget[]
  getCommitmentsByUnit: (unitId: string) => Commitment[]
  getActualsByUnit: (unitId: string) => ActualPayment[]
  canCreateCommitment: (budgetId: string, amount: number) => { allowed: boolean; reason?: string }
  canPostActual: (commitmentId: string | undefined, amount: number) => { allowed: boolean; reason?: string }
  canSubmitBudget: (budgetId: string) => { allowed: boolean; reason?: string }
  canApproveBudget: (budgetId: string) => { allowed: boolean; reason?: string }
  canCreateRevision: (budgetId: string) => { allowed: boolean; reason?: string }
  canSubmitCommitment: (commitmentId: string) => { allowed: boolean; reason?: string }
}

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set, get) => ({
      budgets: [],
      revisions: [],
      commitments: [],
      actuals: [],

      // ===== BUDGET ACTIONS =====
      createBudget: (budget) =>
        set((state) => ({
          budgets: [...state.budgets, { ...budget, id: `BDG-${Date.now()}`, createdAt: new Date() }],
        })),

      submitBudget: (budgetId) =>
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.id === budgetId && b.status === BudgetStatus.DRAFT ? { ...b, status: BudgetStatus.SUBMITTED } : b,
          ),
        })),

      approveBudget: (budgetId) =>
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.id === budgetId && b.status === BudgetStatus.SUBMITTED
              ? { ...b, status: BudgetStatus.APPROVED_UNIT, approvedUnitAt: new Date() }
              : b,
          ),
        })),

      rejectBudget: (budgetId) =>
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.id === budgetId && b.status === BudgetStatus.SUBMITTED ? { ...b, status: BudgetStatus.REJECTED } : b,
          ),
        })),

      closeBudgetYear: (fiscalYear) =>
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.fiscalYear === fiscalYear && b.status === BudgetStatus.APPROVED
              ? { ...b, status: BudgetStatus.CLOSED, closedAt: new Date() }
              : b,
          ),
        })),

      approveBudgetBySupervisor: (budgetId, approverId) =>
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.id === budgetId && b.status === BudgetStatus.SUBMITTED
              ? {
                  ...b,
                  status: BudgetStatus.APPROVED_SUPERVISOR,
                  approvedSupervisorAt: new Date(),
                  approvedSupervisorBy: approverId,
                }
              : b,
          ),
        })),

      approveBudgetByAdmin: (budgetId, approverId) =>
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.id === budgetId && b.status === BudgetStatus.APPROVED_SUPERVISOR
              ? {
                  ...b,
                  status: BudgetStatus.ACTIVE,
                  approvedAdminAt: new Date(),
                  approvedAdminBy: approverId,
                }
              : b,
          ),
        })),

      rejectBudgetBySupervisor: (budgetId, approverId, reason) =>
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.id === budgetId && b.status === BudgetStatus.SUBMITTED
              ? {
                  ...b,
                  status: BudgetStatus.REJECTED,
                  rejectionReason: reason,
                  rejectionType: "supervisor",
                  rejectedBy: approverId,
                  rejectedAt: new Date(),
                }
              : b,
          ),
        })),

      rejectBudgetByAdmin: (budgetId, approverId, reason) =>
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.id === budgetId && b.status === BudgetStatus.APPROVED_SUPERVISOR
              ? {
                  ...b,
                  status: BudgetStatus.REJECTED,
                  rejectionReason: reason,
                  rejectionType: "admin",
                  rejectedBy: approverId,
                  rejectedAt: new Date(),
                }
              : b,
          ),
        })),

      requestBudgetRevision: (budgetId, requestedBy, notes) =>
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.id === budgetId && [BudgetStatus.SUBMITTED, BudgetStatus.APPROVED_SUPERVISOR].includes(b.status)
              ? {
                  ...b,
                  status: BudgetStatus.REVISE_REQUESTED,
                  revisionNotes: notes,
                  revisionRequestedBy: requestedBy,
                  revisionRequestedAt: new Date(),
                }
              : b,
          ),
        })),

      // ===== REVISION ACTIONS =====
      createRevision: (revision) =>
        set((state) => ({
          revisions: [...state.revisions, { ...revision, id: `REV-${Date.now()}`, createdAt: new Date() }],
        })),

      submitRevision: (revisionId) =>
        set((state) => ({
          revisions: state.revisions.map((r) =>
            r.id === revisionId && r.status === RevisionStatus.DRAFT ? { ...r, status: RevisionStatus.SUBMITTED } : r,
          ),
        })),

      approveRevision: (revisionId) =>
        set((state) => {
          const revision = state.revisions.find((r) => r.id === revisionId)
          if (!revision || revision.status !== RevisionStatus.SUBMITTED) return state

          // Update budget baseline
          const updatedBudgets = state.budgets.map((b) => (b.id === revision.budgetId ? b : b))

          return {
            revisions: state.revisions.map((r) =>
              r.id === revisionId ? { ...r, status: RevisionStatus.APPROVED_UNIT, approvedUnitAt: new Date() } : r,
            ),
            budgets: updatedBudgets,
          }
        }),

      rejectRevision: (revisionId) =>
        set((state) => ({
          revisions: state.revisions.map((r) =>
            r.id === revisionId && r.status === RevisionStatus.SUBMITTED
              ? { ...r, status: RevisionStatus.REJECTED }
              : r,
          ),
        })),

      approveUnitRevision: (revisionId, approverId) =>
        set((state) => ({
          revisions: state.revisions.map((r) =>
            r.id === revisionId && r.status === RevisionStatus.SUBMITTED
              ? { ...r, status: RevisionStatus.APPROVED_UNIT, approvedUnitAt: new Date(), approvedUnitBy: approverId }
              : r,
          ),
        })),

      approveFinanceRevision: (revisionId, approverId) =>
        set((state) => ({
          revisions: state.revisions.map((r) =>
            r.id === revisionId && r.status === RevisionStatus.APPROVED_UNIT
              ? {
                  ...r,
                  status: RevisionStatus.APPROVED_FINANCE,
                  approvedFinanceAt: new Date(),
                  approvedFinanceBy: approverId,
                }
              : r,
          ),
        })),

      rejectUnitRevision: (revisionId, approverId, reason) =>
        set((state) => ({
          revisions: state.revisions.map((r) =>
            r.id === revisionId && r.status === RevisionStatus.SUBMITTED
              ? { ...r, status: RevisionStatus.REJECTED, rejectedBy: approverId, rejectionReason: reason }
              : r,
          ),
        })),

      rejectFinanceRevision: (revisionId, approverId, reason) =>
        set((state) => ({
          revisions: state.revisions.map((r) =>
            r.id === revisionId && r.status === RevisionStatus.APPROVED_UNIT
              ? { ...r, status: RevisionStatus.REJECTED, rejectedBy: approverId, rejectionReason: reason }
              : r,
          ),
        })),

      // ===== COMMITMENT ACTIONS =====
      createCommitment: (commitment) =>
        set((state) => ({
          commitments: [...state.commitments, { ...commitment, id: `SPK-${Date.now()}`, createdAt: new Date() }],
        })),

      submitCommitment: (commitmentId) =>
        set((state) => ({
          commitments: state.commitments.map((c) =>
            c.id === commitmentId && c.status === CommitmentStatus.DRAFT
              ? { ...c, status: CommitmentStatus.SUBMITTED }
              : c,
          ),
        })),

      approveCommitment: (commitmentId) =>
        set((state) => ({
          commitments: state.commitments.map((c) =>
            c.id === commitmentId && c.status === CommitmentStatus.SUBMITTED
              ? { ...c, status: CommitmentStatus.APPROVED_UNIT, approvedUnitAt: new Date() }
              : c,
          ),
        })),

      rejectCommitment: (commitmentId) =>
        set((state) => ({
          commitments: state.commitments.map((c) =>
            c.id === commitmentId && c.status === CommitmentStatus.SUBMITTED
              ? { ...c, status: CommitmentStatus.REJECTED }
              : c,
          ),
        })),

      completeCommitment: (commitmentId) =>
        set((state) => ({
          commitments: state.commitments.map((c) =>
            c.id === commitmentId && c.status === CommitmentStatus.APPROVED_UNIT
              ? { ...c, status: CommitmentStatus.COMPLETED, completedAt: new Date() }
              : c,
          ),
        })),

      cancelCommitment: (commitmentId) =>
        set((state) => ({
          commitments: state.commitments.map((c) =>
            c.id === commitmentId && [CommitmentStatus.APPROVED_UNIT, CommitmentStatus.DRAFT].includes(c.status)
              ? { ...c, status: CommitmentStatus.CANCELLED }
              : c,
          ),
        })),

      approveUnitCommitment: (commitmentId, approverId) =>
        set((state) => ({
          commitments: state.commitments.map((c) =>
            c.id === commitmentId && c.status === CommitmentStatus.SUBMITTED
              ? { ...c, status: CommitmentStatus.APPROVED_UNIT, approvedUnitAt: new Date(), approvedUnitBy: approverId }
              : c,
          ),
        })),

      approveFinanceCommitment: (commitmentId, approverId) =>
        set((state) => ({
          commitments: state.commitments.map((c) =>
            c.id === commitmentId && c.status === CommitmentStatus.APPROVED_UNIT
              ? {
                  ...c,
                  status: CommitmentStatus.APPROVED_FINANCE,
                  approvedFinanceAt: new Date(),
                  approvedFinanceBy: approverId,
                }
              : c,
          ),
        })),

      rejectUnitCommitment: (commitmentId, approverId, reason) =>
        set((state) => ({
          commitments: state.commitments.map((c) =>
            c.id === commitmentId && c.status === CommitmentStatus.SUBMITTED
              ? { ...c, status: CommitmentStatus.REJECTED, rejectedBy: approverId, rejectionReason: reason }
              : c,
          ),
        })),

      rejectFinanceCommitment: (commitmentId, approverId, reason) =>
        set((state) => ({
          commitments: state.commitments.map((c) =>
            c.id === commitmentId && c.status === CommitmentStatus.APPROVED_UNIT
              ? { ...c, status: CommitmentStatus.REJECTED, rejectedBy: approverId, rejectionReason: reason }
              : c,
          ),
        })),

      // ===== ACTUAL PAYMENT ACTIONS =====
      createActual: (actual) =>
        set((state) => ({
          actuals: [...state.actuals, { ...actual, id: `ACT-${Date.now()}`, createdAt: new Date() }],
        })),

      submitActual: (actualId) =>
        set((state) => ({
          actuals: state.actuals.map((a) =>
            a.id === actualId && a.status === ActualStatus.DRAFT ? { ...a, status: ActualStatus.SUBMITTED } : a,
          ),
        })),

      postActual: (actualId) =>
        set((state) => ({
          actuals: state.actuals.map((a) =>
            a.id === actualId && a.status === ActualStatus.SUBMITTED
              ? { ...a, status: ActualStatus.POSTED, postedAt: new Date() }
              : a,
          ),
        })),

      cancelActual: (actualId) =>
        set((state) => ({
          actuals: state.actuals.map((a) =>
            a.id === actualId && [ActualStatus.DRAFT, ActualStatus.POSTED].includes(a.status)
              ? { ...a, status: ActualStatus.CANCELLED }
              : a,
          ),
        })),

      approveUnitActual: (actualId, approverId) =>
        set((state) => ({
          actuals: state.actuals.map((a) =>
            a.id === actualId && a.status === ActualStatus.SUBMITTED
              ? { ...a, status: ActualStatus.APPROVED_UNIT, approvedUnitAt: new Date(), approvedUnitBy: approverId }
              : a,
          ),
        })),

      approveFinanceActual: (actualId, approverId) =>
        set((state) => ({
          actuals: state.actuals.map((a) =>
            a.id === actualId && a.status === ActualStatus.APPROVED_UNIT
              ? {
                  ...a,
                  status: ActualStatus.POSTED,
                  approvedFinanceAt: new Date(),
                  approvedFinanceBy: approverId,
                  postedAt: new Date(),
                }
              : a,
          ),
        })),

      rejectUnitActual: (actualId, approverId, reason) =>
        set((state) => ({
          actuals: state.actuals.map((a) =>
            a.id === actualId && a.status === ActualStatus.SUBMITTED
              ? { ...a, status: ActualStatus.REJECTED, rejectedBy: approverId, rejectionReason: reason }
              : a,
          ),
        })),

      rejectFinanceActual: (actualId, approverId, reason) =>
        set((state) => ({
          actuals: state.actuals.map((a) =>
            a.id === actualId && a.status === ActualStatus.APPROVED_UNIT
              ? { ...a, status: ActualStatus.REJECTED, rejectedBy: approverId, rejectionReason: reason }
              : a,
          ),
        })),

      // ===== CALCULATIONS =====
      getBudgetBalance: (budgetId) => {
        const state = get()
        const budget = state.budgets.find((b) => b.id === budgetId)

        // Modified condition to include APPROVED_UNIT for budget balance calculation
        if (!budget || ![BudgetStatus.ACTIVE, BudgetStatus.APPROVED_UNIT].includes(budget.status)) {
          return {
            budgetId,
            approvedBudget: 0,
            totalCommitted: 0,
            totalActual: 0,
            availableBudget: 0,
            remainingAfterSPK: 0,
          }
        }

        // Calculate approved budget (including approved revisions)
        const approvedRevisions = state.revisions
          .filter((r) => r.budgetId === budgetId && r.status === RevisionStatus.APPROVED_FINANCE)
          .reduce((sum, r) => sum + r.difference, 0)
        const approvedBudget = budget.initialAmount + approvedRevisions

        // Calculate total committed (approved SPKs only)
        const totalCommitted = state.commitments
          .filter((c) => c.budgetId === budgetId && c.status === CommitmentStatus.APPROVED_FINANCE)
          .reduce((sum, c) => sum + c.amount, 0)

        // Calculate total actual (posted payments only)
        const totalActual = state.actuals
          .filter((a) => a.budgetId === budgetId && a.status === ActualStatus.POSTED)
          .reduce((sum, a) => sum + a.amount, 0)

        return {
          budgetId,
          approvedBudget,
          totalCommitted,
          totalActual,
          availableBudget: Math.max(0, approvedBudget - totalCommitted - totalActual),
          remainingAfterSPK: Math.max(0, approvedBudget - totalCommitted),
        }
      },

      getBudgetVsActualData: (fiscalYear, budgetType) => {
        const state = get()

        // Modified condition to include APPROVED_UNIT for budget vs actual data
        return state.budgets
          .filter(
            (b) =>
              b.fiscalYear === fiscalYear &&
              [BudgetStatus.ACTIVE, BudgetStatus.APPROVED_UNIT].includes(b.status) &&
              (!budgetType || b.budgetType === budgetType),
          )
          .map((budget) => {
            const balance = get().getBudgetBalance(budget.id)

            // Calculate monthly actuals
            const monthlyActuals = Array.from({ length: 12 }, (_, month) => {
              const transactions = state.actuals.filter((a) => {
                if (a.budgetId !== budget.id || a.status !== ActualStatus.POSTED) return false
                const date = new Date(a.postedAt || a.createdAt)
                return date.getMonth() === month && date.getFullYear() === fiscalYear
              })

              return {
                month: month + 1,
                year: fiscalYear,
                amount: transactions.reduce((sum, t) => sum + t.amount, 0),
                transactions,
              }
            })

            const totalActual = monthlyActuals.reduce((sum, m) => sum + m.amount, 0)

            return {
              budgetId: budget.id,
              projectName: budget.projectName || "Routine Operations",
              unit: budget.unit,
              coa: budget.coa,
              budgetType: budget.budgetType,
              approvedBudget: balance.approvedBudget,
              totalCommitted: balance.totalCommitted,
              monthlyActuals,
              totalActual,
              balance: balance.availableBudget,
              utilizationPercent: balance.approvedBudget > 0 ? (totalActual / balance.approvedBudget) * 100 : 0,
            }
          })
      },

      getPendingApprovals: () => {
        const state = get()
        return {
          budgets: state.budgets.filter((b) => b.status === BudgetStatus.SUBMITTED),
          revisions: state.revisions.filter((r) => r.status === RevisionStatus.SUBMITTED),
          commitments: state.commitments.filter((c) => c.status === CommitmentStatus.SUBMITTED),
          actuals: state.actuals.filter((a) => a.status === ActualStatus.SUBMITTED),
        }
      },

      getPendingUnitApprovals: (unitId) => {
        const state = get()
        return {
          budgets: state.budgets.filter((b) => b.unitId === unitId && b.status === BudgetStatus.SUBMITTED),
          revisions: state.revisions.filter((r) => {
            const budget = state.budgets.find((b) => b.id === r.budgetId)
            return budget?.unitId === unitId && r.status === RevisionStatus.SUBMITTED
          }),
          commitments: state.commitments.filter((c) => c.unitId === unitId && c.status === CommitmentStatus.SUBMITTED),
          actuals: state.actuals.filter((a) => {
            const budget = state.budgets.find((b) => b.id === a.budgetId)
            return budget?.unitId === unitId && a.status === ActualStatus.SUBMITTED
          }),
        }
      },

      getPendingFinanceApprovals: () => {
        const state = get()
        return {
          budgets: state.budgets.filter((b) => b.status === BudgetStatus.APPROVED_UNIT),
          revisions: state.revisions.filter((r) => r.status === RevisionStatus.APPROVED_UNIT),
          commitments: state.commitments.filter((c) => c.status === CommitmentStatus.APPROVED_UNIT),
          actuals: state.actuals.filter((a) => a.status === ActualStatus.APPROVED_UNIT),
        }
      },

      getPendingSupervisorApprovals: (unitId) => {
        const state = get()
        return {
          budgets: state.budgets.filter((b) => b.status === BudgetStatus.SUBMITTED && b.unitId === unitId),
          revisions: state.revisions.filter((r) => r.status === RevisionStatus.SUBMITTED),
          commitments: state.commitments.filter((c) => c.status === CommitmentStatus.SUBMITTED),
          actuals: state.actuals.filter((a) => a.status === ActualStatus.SUBMITTED),
        }
      },

      getPendingAdminApprovals: () => {
        const state = get()
        return {
          budgets: state.budgets.filter((b) => b.status === BudgetStatus.APPROVED_SUPERVISOR),
          revisions: state.revisions.filter((r) => r.status === RevisionStatus.APPROVED_UNIT),
          commitments: state.commitments.filter((c) => c.status === CommitmentStatus.APPROVED_UNIT),
          actuals: state.actuals.filter((a) => a.status === ActualStatus.APPROVED_UNIT),
        }
      },

      getBudgetsByUnit: (unitId) => {
        const state = get()
        return state.budgets.filter((b) => b.unitId === unitId)
      },

      getCommitmentsByUnit: (unitId) => {
        const state = get()
        return state.commitments.filter((c) => c.unitId === unitId)
      },

      getActualsByUnit: (unitId) => {
        const state = get()
        return state.actuals.filter((a) => {
          const budget = state.budgets.find((b) => b.id === a.budgetId)
          return budget?.unitId === unitId
        })
      },

      canCreateCommitment: (budgetId, amount) => {
        const state = get()
        const budget = state.budgets.find((b) => b.id === budgetId)

        // Modified condition to check if budget is ACTIVE
        if (!budget || budget.status !== BudgetStatus.ACTIVE) {
          return { allowed: false, reason: "Budget must be ACTIVE" }
        }

        const balance = get().getBudgetBalance(budgetId)
        if (amount > balance.availableBudget) {
          return {
            allowed: false,
            reason: `Amount exceeds available budget: Rp ${balance.availableBudget.toLocaleString()}`,
          }
        }

        return { allowed: true }
      },

      canPostActual: (commitmentId, amount) => {
        const state = get()

        if (!commitmentId) {
          // Routine budget without SPK - check budget directly
          return { allowed: true }
        }

        const commitment = state.commitments.find((c) => c.id === commitmentId)
        if (!commitment || commitment.status !== CommitmentStatus.APPROVED_FINANCE) {
          return { allowed: false, reason: "Commitment not found or not approved" }
        }

        const postedAgainstThisSPK = state.actuals
          .filter((a) => a.commitmentId === commitmentId && a.status === ActualStatus.POSTED)
          .reduce((sum, a) => sum + a.amount, 0)

        const remaining = commitment.amount - postedAgainstThisSPK
        if (amount > remaining) {
          return { allowed: false, reason: `Amount exceeds remaining commitment: Rp ${remaining.toLocaleString()}` }
        }

        return { allowed: true }
      },

      canSubmitBudget: (budgetId) => {
        const state = get()
        const budget = state.budgets.find((b) => b.id === budgetId)

        if (!budget) {
          return { allowed: false, reason: "Budget not found" }
        }

        if (budget.status !== BudgetStatus.DRAFT) {
          return { allowed: false, reason: "Budget must be in DRAFT status" }
        }

        // Added check for initialAmount
        if (!budget.initialAmount || budget.initialAmount <= 0) {
          return { allowed: false, reason: "Budget amount must be greater than 0" }
        }

        return { allowed: true }
      },

      canApproveBudget: (budgetId) => {
        const state = get()
        const budget = state.budgets.find((b) => b.id === budgetId)

        if (!budget) {
          return { allowed: false, reason: "Budget not found" }
        }

        if (budget.status !== BudgetStatus.SUBMITTED) {
          return { allowed: false, reason: "Budget must be SUBMITTED" }
        }

        return { allowed: true }
      },

      canCreateRevision: (budgetId) => {
        const state = get()
        const budget = state.budgets.find((b) => b.id === budgetId)

        // Modified condition to check if budget is ACTIVE
        if (!budget || budget.status !== BudgetStatus.ACTIVE) {
          return { allowed: false, reason: "Only ACTIVE budgets can be revised" }
        }

        return { allowed: true }
      },

      canSubmitCommitment: (commitmentId) => {
        const state = get()
        const commitment = state.commitments.find((c) => c.id === commitmentId)

        if (!commitment) {
          return { allowed: false, reason: "Commitment not found" }
        }

        if (commitment.status !== CommitmentStatus.DRAFT) {
          return { allowed: false, reason: "Commitment must be in DRAFT status" }
        }

        // Check budget exists and is approved
        const budget = state.budgets.find((b) => b.id === commitment.budgetId)
        if (!budget || budget.status !== BudgetStatus.APPROVED) {
          return { allowed: false, reason: "Cannot submit commitment against non-approved budget" }
        }

        // Check amount doesn't exceed available budget
        const balance = get().getBudgetBalance(commitment.budgetId)
        if (commitment.amount > balance.availableBudget) {
          return {
            allowed: false,
            reason: `Commitment amount (${commitment.amount}) exceeds available budget (${balance.availableBudget})`,
          }
        }

        return { allowed: true }
      },
    }),
    {
      name: "budget-storage",
    },
  ),
)
