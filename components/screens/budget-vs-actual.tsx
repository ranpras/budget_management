"use client"

import { useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download } from "lucide-react"
import { useBudgetStore } from "@/lib/store"
import { BudgetType } from "@/lib/types"

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

function DrillDownModal({ isOpen, data, onClose }: { isOpen: boolean; data: any; onClose: () => void }) {
  if (!isOpen || !data) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-96 overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>Month: {data.month}</CardDescription>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </CardHeader>
        <CardContent>
          {data.transactions && data.transactions.length > 0 ? (
            <div className="space-y-3">
              {data.transactions.map((trans: any, idx: number) => (
                <div key={idx} className="border-b pb-3 last:border-b-0">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Invoice</p>
                      <p className="font-mono font-medium">{trans.invoiceNumber}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-mono font-medium">{trans.invoiceDate.toLocaleDateString("id-ID")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Vendor</p>
                      <p className="font-medium">{trans.vendorName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Amount</p>
                      <p className="font-mono font-bold">Rp {trans.amount.toLocaleString("id-ID")}</p>
                    </div>
                  </div>
                  {trans.description && <p className="text-xs text-muted-foreground mt-2">{trans.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No transactions for this month</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function BudgetVsActual() {
  const store = useBudgetStore()
  const currentYear = new Date().getFullYear()
  const [activeTab, setActiveTab] = useState("project")
  const [selectedYear, setSelectedYear] = useState(String(currentYear))
  const [drillDownOpen, setDrillDownOpen] = useState(false)
  const [selectedDrillDown, setSelectedDrillDown] = useState<any>(null)

  const budgetVsActualData = useMemo(() => {
    const budgetType = activeTab === "project" ? BudgetType.PROJECT : BudgetType.ROUTINE
    return store.getBudgetVsActualData(Number(selectedYear), budgetType)
  }, [store, selectedYear, activeTab])

  const handleExportExcel = () => {
    const data = budgetVsActualData
    const csv = [
      ["Project Name", "Unit", "COA", "Budget", "Committed", "Total Actual", ...monthNames, "Balance", "Utilization %"],
      ...data.map((row) => [
        row.projectName,
        row.unit,
        row.coa,
        row.approvedBudget,
        row.totalCommitted,
        row.totalActual,
        ...row.monthlyActuals.map((m) => m.amount),
        row.balance,
        row.utilizationPercent.toFixed(2),
      ]),
    ]

    const csvContent = csv.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `budget-vs-actual-${selectedYear}.csv`
    a.click()
  }

  const handleCellDoubleClick = (transactions: any[], month: string) => {
    setSelectedDrillDown({ transactions, month })
    setDrillDownOpen(true)
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Budget vs Actual</h2>
          <p className="text-muted-foreground mt-1">Excel-like monitoring dashboard (Read-only calculations)</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2].map((offset) => {
                const year = currentYear + offset
                return (
                  <SelectItem key={year} value={String(year)}>
                    FY {year}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          <Button onClick={handleExportExcel} className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="project">Project Budget</TabsTrigger>
          <TabsTrigger value="routine">Routine Budget (OPEX)</TabsTrigger>
        </TabsList>

        <TabsContent value="project" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Budget Overview</CardTitle>
              <CardDescription>Double-click any monthly amount to view transaction details</CardDescription>
            </CardHeader>
            <CardContent>
              {budgetVsActualData.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No project budgets for FY {selectedYear}</p>
              ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted border-b">
                        <th className="px-3 py-2 text-left font-semibold sticky left-0 bg-muted">Project Name</th>
                        <th className="px-3 py-2 text-left font-semibold">Unit</th>
                        <th className="px-3 py-2 text-left font-semibold">COA</th>
                        <th className="px-3 py-2 text-right font-semibold">Budget</th>
                        <th className="px-3 py-2 text-right font-semibold">Committed</th>
                        {monthNames.map((month) => (
                          <th key={month} className="px-3 py-2 text-right font-semibold text-xs">
                            {month.slice(0, 3)}
                          </th>
                        ))}
                        <th className="px-3 py-2 text-right font-semibold">Total Actual</th>
                        <th className="px-3 py-2 text-right font-semibold">Balance</th>
                        <th className="px-3 py-2 text-right font-semibold">Util %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {budgetVsActualData.map((row) => (
                        <tr key={row.budgetId} className="border-b hover:bg-muted/50">
                          <td className="px-3 py-2 sticky left-0 bg-background font-medium">{row.projectName}</td>
                          <td className="px-3 py-2 text-sm">{row.unit}</td>
                          <td className="px-3 py-2 text-sm font-mono">{row.coa}</td>
                          <td className="px-3 py-2 text-right font-mono">
                            Rp {row.approvedBudget.toLocaleString("id-ID")}
                          </td>
                          <td className="px-3 py-2 text-right font-mono">
                            Rp {row.totalCommitted.toLocaleString("id-ID")}
                          </td>
                          {row.monthlyActuals.map((monthly) => (
                            <td
                              key={`${row.budgetId}-${monthly.month}`}
                              className="px-3 py-2 text-right font-mono cursor-pointer hover:bg-blue-50"
                              onDoubleClick={() =>
                                handleCellDoubleClick(monthly.transactions, monthNames[monthly.month - 1])
                              }
                            >
                              {monthly.amount > 0 ? `Rp ${monthly.amount.toLocaleString("id-ID")}` : "-"}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-right font-mono font-bold">
                            Rp {row.totalActual.toLocaleString("id-ID")}
                          </td>
                          <td className="px-3 py-2 text-right font-mono">
                            {row.balance >= 0 ? (
                              "Rp " + row.balance.toLocaleString("id-ID")
                            ) : (
                              <span className="text-destructive">
                                -Rp {Math.abs(row.balance).toLocaleString("id-ID")}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right font-mono">{row.utilizationPercent.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routine" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Routine Budget (OPEX)</CardTitle>
              <CardDescription>Double-click any monthly amount to view transaction details</CardDescription>
            </CardHeader>
            <CardContent>
              {budgetVsActualData.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No routine budgets for FY {selectedYear}</p>
              ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted border-b">
                        <th className="px-3 py-2 text-left font-semibold">Description</th>
                        <th className="px-3 py-2 text-left font-semibold">Unit</th>
                        <th className="px-3 py-2 text-right font-semibold">Budget</th>
                        {monthNames.map((month) => (
                          <th key={month} className="px-3 py-2 text-right font-semibold text-xs">
                            {month.slice(0, 3)}
                          </th>
                        ))}
                        <th className="px-3 py-2 text-right font-semibold">Total</th>
                        <th className="px-3 py-2 text-right font-semibold">Balance</th>
                        <th className="px-3 py-2 text-right font-semibold">Util %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {budgetVsActualData.map((row) => (
                        <tr key={row.budgetId} className="border-b hover:bg-muted/50">
                          <td className="px-3 py-2 font-medium">{row.projectName}</td>
                          <td className="px-3 py-2 text-sm">{row.unit}</td>
                          <td className="px-3 py-2 text-right font-mono">
                            Rp {row.approvedBudget.toLocaleString("id-ID")}
                          </td>
                          {row.monthlyActuals.map((monthly) => (
                            <td
                              key={`${row.budgetId}-${monthly.month}`}
                              className="px-3 py-2 text-right font-mono cursor-pointer hover:bg-green-50"
                              onDoubleClick={() =>
                                handleCellDoubleClick(monthly.transactions, monthNames[monthly.month - 1])
                              }
                            >
                              {monthly.amount > 0 ? `Rp ${monthly.amount.toLocaleString("id-ID")}` : "-"}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-right font-mono font-bold">
                            Rp {row.totalActual.toLocaleString("id-ID")}
                          </td>
                          <td className="px-3 py-2 text-right font-mono">
                            {row.balance >= 0 ? (
                              "Rp " + row.balance.toLocaleString("id-ID")
                            ) : (
                              <span className="text-destructive">
                                -Rp {Math.abs(row.balance).toLocaleString("id-ID")}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right font-mono">{row.utilizationPercent.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DrillDownModal
        isOpen={drillDownOpen}
        data={selectedDrillDown}
        onClose={() => {
          setDrillDownOpen(false)
          setSelectedDrillDown(null)
        }}
      />
    </div>
  )
}
