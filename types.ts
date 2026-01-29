// Status Enums
export enum BudgetStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  APPROVED_UNIT = "approved_unit",
  APPROVED_FINANCE = "approved_finance",
  APPROVED_SUPERVISOR = "approved_supervisor", // Supervisor approved
  APPROVED_ADMIN = "approved_admin", // Admin approved (final)
  ACTIVE = "active",
  CLOSED = "closed",
  REJECTED = "rejected",
  REVISE_REQUESTED = "revise_requested", // Back to operator for revision
}

export enum RevisionStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  APPROVED_UNIT = "approved_unit",
  APPROVED_FINANCE = "approved_finance",
  REJECTED = "rejected",
}

export enum CommitmentStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  APPROVED_UNIT = "approved_unit",
  APPROVED_FINANCE = "approved_finance",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  REJECTED = "rejected",
}

export enum ActualStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  APPROVED_UNIT = "approved_unit",
  APPROVED_FINANCE = "approved_finance",
  POSTED = "posted",
  CANCELLED = "cancelled",
  REJECTED = "rejected",
}

export enum BudgetType {
  PROJECT = "project",
  ROUTINE = "routine",
}

// Core Domain Entities
export interface Budget {
  id: string
  fiscalYear: number
  unit: string
  unitId: string // Add unit ID for filtering
  rccId: string // Add RCC/Cost Center
  budgetType: BudgetType
  projectId?: string
  projectName?: string
  coa: string
  initialAmount: number
  status: BudgetStatus
  justification: string
  createdBy: string // Track who created
  createdAt: Date
  approvedUnitAt?: Date // Unit approval timestamp
  approvedUnitBy?: string // Unit approver ID
  approvedFinanceAt?: Date // Finance approval timestamp
  approvedFinanceBy?: string // Finance approver ID
  approvedSupervisorAt?: Date // Supervisor approval timestamp
  approvedSupervisorBy?: string // Supervisor approver ID
  approvedAdminAt?: Date // Admin approval timestamp
  approvedAdminBy?: string // Admin approver ID
  closedAt?: Date
  rejectionReason?: string // Track rejection reason
  rejectionType?: "supervisor" | "admin" // Who rejected
  rejectedBy?: string // Who rejected
  rejectedAt?: Date // Rejection timestamp
  revisionNotes?: string // Notes when requesting revision
  revisionRequestedBy?: string // Who requested revision
  revisionRequestedAt?: Date // Revision request timestamp
}

export interface BudgetRevision {
  id: string
  budgetId: string
  oldAmount: number
  newAmount: number
  difference: number
  reason: string
  status: RevisionStatus
  createdBy: string // Track creator
  createdAt: Date
  approvedUnitAt?: Date // Unit approval
  approvedUnitBy?: string
  approvedFinanceAt?: Date // Finance approval
  approvedFinanceBy?: string
  rejectionReason?: string // Track rejection reason
  rejectedBy?: string
}

export interface Commitment {
  id: string
  budgetId: string
  spkNumber: string
  fiscalYear: number
  unit: string
  unitId: string // Add unit ID
  rccId: string // Add RCC/Cost Center
  vendorName: string
  vendorContact: string
  description: string
  amount: number
  coa: string
  startDate: Date
  endDate: Date
  status: CommitmentStatus
  createdBy: string // Track creator
  createdAt: Date
  approvedUnitAt?: Date // Unit approval
  approvedUnitBy?: string
  approvedFinanceAt?: Date // Finance approval
  approvedFinanceBy?: string
  completedAt?: Date
  rejectionReason?: string // Track rejection reason
  rejectedBy?: string
}

export interface ActualPayment {
  id: string
  commitmentId?: string // Optional: for Routine budget without SPK
  budgetId: string
  invoiceNumber: string
  invoiceDate: Date
  vendorName: string
  amount: number
  paymentMethod: string
  description: string
  status: ActualStatus
  createdBy: string // Track creator
  createdAt: Date
  approvedUnitAt?: Date // Unit approval
  approvedUnitBy?: string
  approvedFinanceAt?: Date // Finance approval
  approvedFinanceBy?: string
  postedAt?: Date
  rejectionReason?: string // Track rejection reason
  rejectedBy?: string
}

// Calculated Views
export interface BudgetBalance {
  budgetId: string
  approvedBudget: number
  totalCommitted: number
  totalActual: number
  availableBudget: number
  remainingAfterSPK: number
}

export interface MonthlyActual {
  month: number
  year: number
  amount: number
  transactions: ActualPayment[]
}

export interface BudgetVsActualRow {
  budgetId: string
  projectName: string
  unit: string
  coa: string
  budgetType: BudgetType
  approvedBudget: number
  totalCommitted: number
  monthlyActuals: MonthlyActual[]
  totalActual: number
  balance: number
  utilizationPercent: number
}
