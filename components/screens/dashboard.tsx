"use client"

import { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { AlertCircle, TrendingUp, Lock } from "lucide-react"
import { useBudgetStore } from "@/lib/store"
import { BudgetStatus, ActualStatus } from "@/lib/types"

export function Dashboard() {
  const store = useBudgetStore()
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(String(currentYear))

  const budgetTotals = useMemo(() => {
    const approvedBudgets = store.budgets.filter(
      (b) => b.fiscalYear === Number(selectedYear) && (b.status === BudgetStatus.ACTIVE || b.status === "active"),
    )

    let totalBudget = 0
    let totalCommitted = 0
    let totalActual = 0

    approvedBudgets.forEach((budget) => {
      const balance = store.getBudgetBalance(budget.id)
      totalBudget += balance.approvedBudget
      totalCommitted += balance.totalCommitted
      totalActual += balance.totalActual
    })

    return {
      totalBudget,
      totalCommitted,
      totalActual,
      available: Math.max(0, totalBudget - totalCommitted - totalActual),
    }
  }, [store.budgets, store.commitments, store.actuals, selectedYear])

  const pendingApprovals = useMemo(() => {
    const { budgets, revisions, commitments, actuals } = store.getPendingApprovals()
    return {
      budgets: budgets.filter((b) => b.fiscalYear === Number(selectedYear)),
      revisions: revisions.filter((r) => {
        const budget = store.budgets.find((b) => b.id === r.budgetId)
        return budget && budget.fiscalYear === Number(selectedYear)
      }),
      commitments: commitments.filter((c) => c.fiscalYear === Number(selectedYear)),
      actuals: actuals.filter((a) => {
        const budget = store.budgets.find((b) => b.id === a.budgetId)
        return budget && budget.fiscalYear === Number(selectedYear)
      }),
    }
  }, [store, selectedYear])

  const totalPending =
    pendingApprovals.budgets.length +
    pendingApprovals.revisions.length +
    pendingApprovals.commitments.length +
    pendingApprovals.actuals.length

  const chartData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return months.map((month, idx) => {
      const monthData = {
        month,
        budget: budgetTotals.totalBudget > 0 ? Math.round(budgetTotals.totalBudget / 12) : 0,
        actual: 0,
      }

      // Calculate actual for this month
      const approvedBudgets = store.budgets.filter(
        (b) => b.fiscalYear === Number(selectedYear) && (b.status === BudgetStatus.ACTIVE || b.status === "active"),
      )
      const monthActual = approvedBudgets.reduce((sum, budget) => {
        const monthTransactions = store.actuals.filter((a) => {
          if (a.budgetId !== budget.id || a.status !== ActualStatus.POSTED) return false
          const date = new Date(a.postedAt || a.createdAt)
          return date.getMonth() === idx && date.getFullYear() === Number(selectedYear)
        })
        return sum + monthTransactions.reduce((s, t) => s + t.amount, 0)
      }, 0)

      monthData.actual = monthActual
      return monthData
    })
  }, [store.budgets, store.actuals, selectedYear, budgetTotals])

  const summaryData = [
    { name: "Total Budget", value: budgetTotals.totalBudget, color: "#3b82f6" },
    { name: "Commitment", value: budgetTotals.totalCommitted, color: "#f59e0b" },
    { name: "Actual", value: budgetTotals.totalActual, color: "#10b981" },
    { name: "Available", value: budgetTotals.available, color: "#8b5cf6" },
  ]

  const formatCurrency = (value: number) => `Rp ${(value / 1000000).toFixed(0)}M`

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground mt-1">Budget overview and pending approvals for Finance team.</p>
        </div>
        <div className="w-48">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger>
              <SelectValue placeholder="Select Fiscal Year" />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2].map((offset) => {
                const year = currentYear + offset
                return (
                  <SelectItem key={year} value={String(year)}>
                    Fiscal Year {year}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {store.budgets.filter((b) => b.status === BudgetStatus.SUBMITTED).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-900">Pending Budget Approvals</p>
            <p className="text-sm text-amber-800 mt-1">
              {store.budgets.filter((b) => b.status === BudgetStatus.SUBMITTED).length} budget request(s) require
              Finance approval before becoming available for spending.
            </p>
          </div>
        </div>
      )}

      {budgetTotals.available < budgetTotals.totalBudget * 0.1 && budgetTotals.totalBudget > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-900">Low Available Budget</p>
            <p className="text-sm text-red-800 mt-1">
              Available budget is only {Math.round((budgetTotals.available / budgetTotals.totalBudget) * 100)}% of total
              approved budget.
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-foreground">
                Rp {budgetTotals.totalBudget.toLocaleString("id-ID")}
              </p>
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Approved budgets (locked)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Commitment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              Rp {budgetTotals.totalCommitted.toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {budgetTotals.totalBudget > 0
                ? Math.round((budgetTotals.totalCommitted / budgetTotals.totalBudget) * 100)
                : 0}
              % of budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">Rp {budgetTotals.totalActual.toLocaleString("id-ID")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {budgetTotals.totalBudget > 0
                ? Math.round((budgetTotals.totalActual / budgetTotals.totalBudget) * 100)
                : 0}
              % of budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">Rp {budgetTotals.available.toLocaleString("id-ID")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {budgetTotals.totalBudget > 0 ? Math.round((budgetTotals.available / budgetTotals.totalBudget) * 100) : 0}
              % remaining
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Budget vs Actual by Month</CardTitle>
            <CardDescription>Monthly comparison for FY {selectedYear}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Bar dataKey="budget" fill="var(--color-chart-1)" />
                <Bar dataKey="actual" fill="var(--color-chart-2)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Allocation</CardTitle>
            <CardDescription>Current distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={summaryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value">
                  {summaryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      <Card
        className={Object.values(pendingApprovals).some((arr) => arr.length > 0) ? "border-amber-200 bg-amber-50" : ""}
      >
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pending Approvals</span>
            {Object.values(pendingApprovals).some((arr) => arr.length > 0) && (
              <span className="bg-amber-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                {Object.values(pendingApprovals).reduce((sum, arr) => sum + arr.length, 0)}
              </span>
            )}
          </CardTitle>
          <CardDescription>Requests awaiting Finance approval</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.values(pendingApprovals).every((arr) => arr.length === 0) ? (
            <p className="text-muted-foreground text-sm">No pending approvals</p>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.budgets.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-2">Budget Planning ({pendingApprovals.budgets.length})</p>
                  <div className="space-y-1">
                    {pendingApprovals.budgets.map((budget) => (
                      <div key={budget.id} className="text-sm p-2 bg-background rounded border border-border">
                        <div className="flex justify-between">
                          <span>{budget.projectName || "Routine"}</span>
                          <span className="font-mono">Rp {budget.initialAmount.toLocaleString("id-ID")}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{budget.unit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendingApprovals.revisions.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-2">Revisions ({pendingApprovals.revisions.length})</p>
                  <div className="space-y-1">
                    {pendingApprovals.revisions.map((rev) => (
                      <div key={rev.id} className="text-sm p-2 bg-background rounded border border-border">
                        <div className="flex justify-between">
                          <span>Revision</span>
                          <span className={`font-mono ${rev.difference > 0 ? "text-emerald-600" : "text-destructive"}`}>
                            {rev.difference > 0 ? "+" : ""}Rp {rev.difference.toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendingApprovals.commitments.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-2">Commitments ({pendingApprovals.commitments.length})</p>
                  <div className="space-y-1">
                    {pendingApprovals.commitments.map((spk) => (
                      <div key={spk.id} className="text-sm p-2 bg-background rounded border border-border">
                        <div className="flex justify-between">
                          <span>{spk.spkNumber}</span>
                          <span className="font-mono">Rp {spk.amount.toLocaleString("id-ID")}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{spk.vendorName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendingApprovals.actuals.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-2">Actuals ({pendingApprovals.actuals.length})</p>
                  <div className="space-y-1">
                    {pendingApprovals.actuals.map((actual) => (
                      <div key={actual.id} className="text-sm p-2 bg-background rounded border border-border">
                        <div className="flex justify-between">
                          <span>{actual.description}</span>
                          <span className="font-mono">Rp {actual.amount.toLocaleString("id-ID")}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{actual.postedAt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
