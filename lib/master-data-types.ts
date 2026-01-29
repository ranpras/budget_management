// Master Data Type Definitions

export interface COA {
  id: string
  code: string
  name: string
  category: string
  active: boolean
  createdAt: Date
}

export interface UnitKerja {
  id: string
  code: string
  name: string
  description: string
  active: boolean
  createdAt: Date
}

export interface RCC {
  id: string
  code: string
  name: string
  unitId: string
  manager: string
  active: boolean
  createdAt: Date
}

export interface FiscalYear {
  id: string
  year: number
  name: string
  startDate: Date
  endDate: Date
  status: "planning" | "active" | "closed"
  createdAt: Date
}

export interface BudgetCategory {
  id: string
  code: string
  name: string
  description: string
  active: boolean
  createdAt: Date
}

// Master Data Role/Permission Types
export enum UserRole {
  OPERATOR = "operator", // Unit Kerja - Input transactions
  SUPERVISOR = "supervisor", // Unit Approval - Approve unit submissions
  ADMIN_BUDGET = "admin_budget", // Corporate Finance - Final approval & master data
}

export interface AppUser {
  id: string
  name: string
  email: string
  role: UserRole | "operator" | "supervisor" | "admin_budget"
  unitId?: string // For OPERATOR and SUPERVISOR roles
  active?: boolean
  createdAt?: Date
}

export interface Vendor {
  id: string
  code: string
  name: string
  contactPerson: string
  email: string
  phone: string
  address: string
  active: boolean
  createdAt: Date
}
