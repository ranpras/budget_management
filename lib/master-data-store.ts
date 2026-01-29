import { create } from "zustand"
import type { COA, UnitKerja, RCC, FiscalYear, BudgetCategory, AppUser, Vendor } from "./master-data-types"
import { UserRole } from "./master-data-types"

interface MasterDataStore {
  // Master Data Collections
  coas: COA[]
  units: UnitKerja[]
  rccs: RCC[]
  fiscalYears: FiscalYear[]
  budgetCategories: BudgetCategory[]
  users: AppUser[]
  vendors: Vendor[] // New Vendor collection

  // Current user context
  currentUser: AppUser | null

  // Master Data Actions
  addCOA: (coa: Omit<COA, "id" | "createdAt">) => void
  addUnit: (unit: Omit<UnitKerja, "id" | "createdAt">) => void
  addRCC: (rcc: Omit<RCC, "id" | "createdAt">) => void
  addFiscalYear: (fy: Omit<FiscalYear, "id" | "createdAt">) => void
  addBudgetCategory: (bc: Omit<BudgetCategory, "id" | "createdAt">) => void
  addUser: (user: Omit<AppUser, "id" | "createdAt">) => void
  addVendor: (vendor: Omit<Vendor, "id" | "createdAt">) => void // New Vendor action

  // User Context
  setCurrentUser: (user: AppUser) => void

  // Getters
  getCOAsByActive: (active: boolean) => COA[]
  getUnitsByActive: (active: boolean) => UnitKerja[]
  getRCCsByUnit: (unitId: string) => RCC[]
  getActiveFiscalYear: () => FiscalYear | undefined
  getUsersByRole: (role: UserRole) => AppUser[]
  getVendorsByActive: (active: boolean) => Vendor[] // New Vendor getter
}

export const useMasterDataStore = create<MasterDataStore>((set, get) => {
  // Initialize with sample data
  const initialCOAs: COA[] = [
    { id: "COA-1", code: "6110", name: "Personnel Expenses", category: "OPEX", active: true, createdAt: new Date() },
    {
      id: "COA-2",
      code: "6120",
      name: "Travel & Transportation",
      category: "OPEX",
      active: true,
      createdAt: new Date(),
    },
    { id: "COA-3", code: "6130", name: "Equipment & Supplies", category: "OPEX", active: true, createdAt: new Date() },
    { id: "COA-4", code: "6140", name: "IT Infrastructure", category: "CAPEX", active: true, createdAt: new Date() },
    {
      id: "COA-5",
      code: "6150",
      name: "Utilities & Maintenance",
      category: "OPEX",
      active: true,
      createdAt: new Date(),
    },
  ]

  const initialUnits: UnitKerja[] = [
    {
      id: "UNIT-1",
      code: "FIN",
      name: "Finance Dept",
      description: "Finance Department",
      active: true,
      createdAt: new Date(),
    },
    {
      id: "UNIT-2",
      code: "IT",
      name: "IT Dept",
      description: "Information Technology",
      active: true,
      createdAt: new Date(),
    },
    {
      id: "UNIT-3",
      code: "ADM",
      name: "Admin Dept",
      description: "Administration",
      active: true,
      createdAt: new Date(),
    },
    { id: "UNIT-4", code: "HR", name: "HR Dept", description: "Human Resources", active: true, createdAt: new Date() },
    {
      id: "UNIT-5",
      code: "OPS",
      name: "Operations Dept",
      description: "Operations",
      active: true,
      createdAt: new Date(),
    },
  ]

  const initialRCCs: RCC[] = [
    {
      id: "RCC-1",
      code: "FIN-01",
      name: "Finance Operations",
      unitId: "UNIT-1",
      manager: "Budi",
      active: true,
      createdAt: new Date(),
    },
    {
      id: "RCC-2",
      code: "IT-01",
      name: "Infrastructure",
      unitId: "UNIT-2",
      manager: "Andi",
      active: true,
      createdAt: new Date(),
    },
    {
      id: "RCC-3",
      code: "ADM-01",
      name: "General Admin",
      unitId: "UNIT-3",
      manager: "Siti",
      active: true,
      createdAt: new Date(),
    },
  ]

  const initialFiscalYears: FiscalYear[] = [
    {
      id: "FY-2025",
      year: 2025,
      name: "Fiscal Year 2025",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      status: "active",
      createdAt: new Date(),
    },
    {
      id: "FY-2026",
      year: 2026,
      name: "Fiscal Year 2026",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      status: "planning",
      createdAt: new Date(),
    },
  ]

  const initialBudgetCategories: BudgetCategory[] = [
    {
      id: "BC-1",
      code: "OPEX",
      name: "Operating Expense",
      description: "Regular operational expenses",
      active: true,
      createdAt: new Date(),
    },
    {
      id: "BC-2",
      code: "CAPEX",
      name: "Capital Expenditure",
      description: "Capital investment expenses",
      active: true,
      createdAt: new Date(),
    },
  ]

  const initialUsers: AppUser[] = [
    {
      id: "USER-1",
      name: "Budi Operator",
      email: "budi@company.com",
      role: UserRole.OPERATOR,
      unitId: "UNIT-1",
      active: true,
      createdAt: new Date(),
    },
    {
      id: "USER-2",
      name: "Siti Approval",
      email: "siti@company.com",
      role: UserRole.APPROVAL,
      unitId: "UNIT-1",
      active: true,
      createdAt: new Date(),
    },
    {
      id: "USER-3",
      name: "Ahmad Finance",
      email: "ahmad@company.com",
      role: UserRole.FINANCE,
      active: true,
      createdAt: new Date(),
    },
  ]

  const initialVendors: Vendor[] = [
    {
      id: "VND-1",
      code: "PT-001",
      name: "PT Tech Solutions",
      contactPerson: "Budi Santoso",
      email: "budi@techsolutions.com",
      phone: "021-123456",
      address: "Jakarta, Indonesia",
      active: true,
      createdAt: new Date(),
    },
    {
      id: "VND-2",
      code: "PT-002",
      name: "PT Supplies Indonesia",
      contactPerson: "Ani Wijaya",
      email: "ani@supplies.com",
      phone: "021-654321",
      address: "Surabaya, Indonesia",
      active: true,
      createdAt: new Date(),
    },
    {
      id: "VND-3",
      code: "PT-003",
      name: "CV Maintenance Services",
      contactPerson: "Rudi Hermawan",
      email: "rudi@maintenance.com",
      phone: "021-789012",
      address: "Bandung, Indonesia",
      active: true,
      createdAt: new Date(),
    },
  ]

  return {
    coas: initialCOAs,
    units: initialUnits,
    rccs: initialRCCs,
    fiscalYears: initialFiscalYears,
    budgetCategories: initialBudgetCategories,
    users: initialUsers,
    vendors: initialVendors,
    currentUser: initialUsers[0],

    addCOA: (coa) =>
      set((state) => ({
        coas: [...state.coas, { ...coa, id: `COA-${Date.now()}`, createdAt: new Date() }],
      })),

    addUnit: (unit) =>
      set((state) => ({
        units: [...state.units, { ...unit, id: `UNIT-${Date.now()}`, createdAt: new Date() }],
      })),

    addRCC: (rcc) =>
      set((state) => ({
        rccs: [...state.rccs, { ...rcc, id: `RCC-${Date.now()}`, createdAt: new Date() }],
      })),

    addFiscalYear: (fy) =>
      set((state) => ({
        fiscalYears: [...state.fiscalYears, { ...fy, id: `FY-${fy.year}`, createdAt: new Date() }],
      })),

    addBudgetCategory: (bc) =>
      set((state) => ({
        budgetCategories: [...state.budgetCategories, { ...bc, id: `BC-${Date.now()}`, createdAt: new Date() }],
      })),

    addUser: (user) =>
      set((state) => ({
        users: [...state.users, { ...user, id: `USER-${Date.now()}`, createdAt: new Date() }],
      })),

    addVendor: (vendor) =>
      set((state) => ({
        vendors: [...state.vendors, { ...vendor, id: `VND-${Date.now()}`, createdAt: new Date() }],
      })),

    setCurrentUser: (user) =>
      set(() => ({
        currentUser: user,
      })),

    getCOAsByActive: (active) => {
      const state = get()
      return state.coas.filter((c) => c.active === active)
    },

    getUnitsByActive: (active) => {
      const state = get()
      return state.units.filter((u) => u.active === active)
    },

    getRCCsByUnit: (unitId) => {
      const state = get()
      return state.rccs.filter((r) => r.unitId === unitId)
    },

    getActiveFiscalYear: () => {
      const state = get()
      return state.fiscalYears.find((fy) => fy.status === "active")
    },

    getUsersByRole: (role) => {
      const state = get()
      return state.users.filter((u) => u.role === role && u.active)
    },

    getVendorsByActive: (active) => {
      const state = get()
      return state.vendors.filter((v) => v.active === active)
    },
  }
})
