import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AppUser } from "./master-data-types"

export interface AuthSession {
  user: AppUser
  loginTime: Date
  lastActivity: Date
}

interface AuthStore {
  // Session state
  session: AuthSession | null
  isAuthenticated: boolean

  // Auth actions
  login: (username: string, password: string) => { success: boolean; error?: string }
  logout: () => void
  getCurrentUser: () => AppUser | null

  // Theme preference
  theme: "light" | "dark"
  setTheme: (theme: "light" | "dark") => void
  toggleTheme: () => void
}

// Sample user database with hardcoded credentials for demo
const DEMO_USERS = [
  {
    id: "OP-001",
    username: "operator1",
    password: "operator123",
    name: "Budi Operator",
    role: "operator" as const,
    unitId: "UNIT-1",
    email: "budi@company.com",
  },
  {
    id: "SV-001",
    username: "supervisor1",
    password: "supervisor123",
    name: "Andi Supervisor",
    role: "supervisor" as const,
    unitId: "UNIT-1",
    email: "andi@company.com",
  },
  {
    id: "SV-002",
    username: "supervisor2",
    password: "supervisor123",
    name: "Dina Supervisor",
    role: "supervisor" as const,
    unitId: "UNIT-2",
    email: "dina@company.com",
  },
  {
    id: "ADM-001",
    username: "admin",
    password: "admin123",
    name: "Siti Admin",
    role: "admin_budget" as const,
    unitId: undefined,
    email: "siti@company.com",
  },
]

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      session: null,
      isAuthenticated: false,
      theme: "light",

      login: (username: string, password: string) => {
        const user = DEMO_USERS.find((u) => u.username === username && u.password === password)

        if (!user) {
          return { success: false, error: "Invalid username or password" }
        }

        const session: AuthSession = {
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            unitId: user.unitId,
            email: user.email,
            createdAt: new Date(),
          },
          loginTime: new Date(),
          lastActivity: new Date(),
        }

        set({ session, isAuthenticated: true })
        return { success: true }
      },

      logout: () => {
        set({ session: null, isAuthenticated: false })
      },

      getCurrentUser: () => {
        const { session } = get()
        return session?.user || null
      },

      setTheme: (theme: "light" | "dark") => {
        set({ theme })
      },

      toggleTheme: () => {
        const { theme } = get()
        set({ theme: theme === "light" ? "dark" : "light" })
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
)
