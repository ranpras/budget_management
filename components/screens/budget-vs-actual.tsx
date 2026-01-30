"use client"

import { useState, useMemo, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, Eye } from "lucide-react"
import { useBudgetStore } from "@/lib/store"
import { useMasterDataStore } from "@/lib/master-data-store"
import { useCurrentUser } from "@/lib/user-context"
import { BudgetStatus, CommitmentStatus, ActualStatus } from "@/lib/types"

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

interface DrillDownModalProps {
  isOpen: boolean
  title: string
  transactions: any[]
  onClose: () => void
}

function DrillDownModal({ isOpen, title, transactions, onClose }: DrillDownModalProps) {
  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transaction Details: {title}</DialogTitle>
          <DialogDescription>
            {transactions.length} transaction(s) in this period
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No transactions</p>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted border-b">
                    <th className="px-3 py-2 text-left font-semibold">Date</th>
                    <th className="px-3 py-2 text-left font-semibold">Document</th>
                    <th className="px-3 py-2 text-left font-semibold">Type</th>
                    <th className="px-3 py-2 text-left font-semibold">Vendor</th>
                    <th className="px-3 py-2 text-right font-semibold">Amount</th>
                    <th className="px-3 py-2 text-left font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((trans, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="px-3 py-2 text-sm">
                        {trans.date ? new Date(trans.date).toLocaleDateString("id-ID") : "-"}
                      </td>
                      <td className="px-3 py-2 text-sm font-mono">{trans.docNumber || "-"}</td>
                      <td className="px-3 py-2 text-sm">{trans.type || "-"}</td>
                      <td className="px-3 py-2 text-sm">{trans.vendor || "-"}</td>
                      <td className="px-3 py-2 text-right font-mono">
                        Rp {(trans.amount || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{trans.description || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function BudgetVsActual() {
  const store = useBudgetStore()
  const masterDataStore = useMasterDataStore()
  const currentUser = useCurrentUser()
  const currentYear = new Date().getFullYear()

  const [activeTab, setActiveTab] = useState("project")
  const [selectedYear, setSelectedYear] = useState(String(currentYear))
  const [drillDownOpen, setDrillDownOpen] = useState(false)
  const [drillDownData, setDrillDownData] = useState<{
    title: string
    transactions: any[]
  } | null>(null)

  // Strict data source: Calculate Budget Baseline (approved budgets only)
  const getBudgetBaseline = useCallback(() => {
    const year = Number(selectedYear)
    return store.budgets
      .filter(b => b.status === BudgetStatus.APPROVED_ADMIN && b.fiscalYear === year)
      .map(budget => ({
        projectId: budget.projectId || "",
        coaId: budget.coaId,
        unitId: budget.unitKerjaId,
        fiscalYear: budget.fiscalYear,
        nominalBudget: budget.amount,
        budgetId: budget.id,
        projectType: budget.projectType,
        projectStatus: budget.projectStatus,
        budgetType: budget.budgetType,
        coaName: masterDataStore.getCoaName(budget.coaId),
        projectName: masterDataStore.getProjectName(budget.projectId || ""),
        unitName: masterDataStore.getUnitName(budget.unitKerjaId),
      }))
  }, [store.budgets, selectedYear, masterDataStore])

  // Strict data source: Calculate Commitments (approved SPK only)
  const getCommitments = useCallback(() => {
    return store.commitments
      .filter(c => c.status === CommitmentStatus.APPROVED_FINANCE)
      .reduce((acc: any, commitment) => {
        const key = `${commitment.projectId}-${commitment.coaId}-${commitment.unitKerjaId}`
        if (!acc[key]) {
          acc[key] = {
            projectId: commitment.projectId,
            coaId: commitment.coaId,
            unitId: commitment.unitKerjaId,
            commitmentAmount: 0,
            latestSpkDate: commitment.createdAt,
            vendor: commitment.vendorId,
          }
        }
        acc[key].commitmentAmount += commitment.amount || 0
        if (new Date(commitment.createdAt) > new Date(acc[key].latestSpkDate)) {
          acc[key].latestSpkDate = commitment.createdAt
          acc[key].vendor = commitment.vendorId
        }
        return acc
      }, {})
  }, [store.commitments])

  // Strict data source: Calculate Actual Realization (approved actuals only)
  const getActualsByMonth = useCallback(() => {
    return store.actuals
      .filter(a => a.status === ActualStatus.APPROVED)
      .reduce((acc: any, actual) => {
        const key = `${actual.projectId}-${actual.coaId}-${actual.unitKerjaId}`
        const month = new Date(actual.paymentDate).getMonth()
        
        if (!acc[key]) {
          acc[key] = {
            projectId: actual.projectId,
            coaId: actual.coaId,
            unitId: actual.unitKerjaId,
            actualToDate: 0,
            monthlyActuals: Array(12).fill(0),
            transactions: Array(12).fill(null).map(() => []),
          }
        }
        
        acc[key].actualToDate += actual.amount || 0
        acc[key].monthlyActuals[month] += actual.amount || 0
        acc[key].transactions[month].push({
          date: actual.paymentDate,
          docNumber: actual.invoiceNumber,
          type: "Actual",
          vendor: actual.vendorId,
          amount: actual.amount,
          description: actual.description,
        })
        
        return acc
      }, {})
  }, [store.actuals])

  // Combine data sources with strict JOIN logic
  const processedData = useMemo(() => {
    const baseline = getBudgetBaseline()
    const commitments = getCommitments()
    const actuals = getActualsByMonth()

    return baseline
      .filter(row => {
        // Role-based visibility filter
        if (currentUser && currentUser.unitId) {
          if (currentUser.role !== "admin_budget") {
            return row.unitId === currentUser.unitId
          }
        }
        return true
      })
      .map(budgetRow => {
        const key = `${budgetRow.projectId}-${budgetRow.coaId}-${budgetRow.unitId}`
        const commitment = commitments[key] || {}
        const actual = actuals[key] || { actualToDate: 0, monthlyActuals: Array(12).fill(0), transactions: Array(12).fill([]) }

        return {
          ...budgetRow,
          commitmentAmount: commitment.commitmentAmount || 0,
          latestSpkDate: commitment.latestSpkDate,
          vendor: commitment.vendor,
          actualToDate: actual.actualToDate,
          monthlyActuals: actual.monthlyActuals,
          transactions: actual.transactions,
          // Derived fields per spec
          remainingAfterPayment: Math.max(0, budgetRow.nominalBudget - actual.actualToDate),
          remainingAfterSpk: Math.max(0, budgetRow.nominalBudget - (commitment.commitmentAmount || 0)),
          total: actual.monthlyActuals.reduce((sum, m) => sum + m, 0),
        }
      })
  }, [getBudgetBaseline, getCommitments, getActualsByMonth, currentUser])

  // Filter by budget type
  const filteredData = useMemo(() => {
    if (activeTab === "project") {
      return processedData.filter(row => row.budgetType === "project")
    } else {
      return processedData.filter(row => row.budgetType === "routine" || row.budgetType === "opex")
    }
  }, [processedData, activeTab])

  // Hide rows where Nominal Budget = 0
  const displayData = useMemo(() => {
    return filteredData.filter(row => row.nominalBudget > 0)
  }, [filteredData])

  const handleDrillDown = (month: number, row: any) => {
    const monthName = monthNames[month]
    setDrillDownData({
      title: `${row.projectName} - ${monthName}`,
      transactions: row.transactions[month] || [],
    })
    setDrillDownOpen(true)
  }

  const handleExportExcel = () => {
    const header = [
      "No", "Project Type", "Project ID", "Project Name", "Kelompok Biaya", "CAPEX/OPEX",
      "Unit Kerja", "Project Status", "Fiscal Year", "Nominal Budget", "Actual To Date",
      "Remaining after Payment", "Commitment (Approved SPK)", "Remaining after SPK",
      "Forecast/Planned Commitment", "Vendor (latest)", "Latest SPK Date", "Latest Payment Date",
      ...monthNames, "TOTAL"
    ]

    const rows = displayData.map((row, idx) => [
      idx + 1,
      row.projectType || "-",
      row.projectId || "-",
      row.projectName,
      row.coaName,
      row.budgetType?.toUpperCase() || "-",
      row.unitName,
      row.projectStatus || "-",
      row.fiscalYear,
      row.nominalBudget,
      row.actualToDate,
      row.remainingAfterPayment,
      row.commitmentAmount,
      row.remainingAfterSpk,
      "N/A",
      row.vendor || "-",
      row.latestSpkDate ? new Date(row.latestSpkDate).toLocaleDateString("id-ID") : "-",
      row.transactions && row.transactions.flat().length > 0
        ? new Date(
            Math.max(
              ...row.transactions.flat().map((t: any) => new Date(t.date).getTime())
            )
          ).toLocaleDateString("id-ID")
        : "-",
      ...row.monthlyActuals.map(m => m),
      row.total,
    ])

    const csv = [header, ...rows]
    const csvContent = csv.map(row => 
      row.map(cell => 
        typeof cell === "number" ? cell : (cell ? String(cell).replace(/"/g, '""') : "-")
      ).join(",")
    ).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `budget-vs-actual-${activeTab}-${selectedYear}.csv`
    link.click()
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Budget vs Realisasi Monitoring</h2>
          <p className="text-muted-foreground mt-1">
            Read-only financial reporting module - All values calculated from approved transactions only
          </p>
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="project">Budget Project (CAPEX)</TabsTrigger>
          <TabsTrigger value="routine">Budget Rutin (OPEX)</TabsTrigger>
        </TabsList>

        {/* TAB 1: Budget Project */}
        <TabsContent value="project" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Budget Monitoring</CardTitle>
              <CardDescription>
                Click any monthly amount to view transaction details. All data from approved budgets, commitments, and actuals only.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {displayData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No approved project budgets for FY {selectedYear}</p>
                </div>
              ) : (
                <div className="overflow-x-auto border rounded-lg bg-white">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b">
                        <th className="px-2 py-2 text-left font-semibold sticky left-0 bg-slate-100 z-10">No</th>
                        <th className="px-2 py-2 text-left font-semibold">Type</th>
                        <th className="px-2 py-2 text-left font-semibold">Project ID</th>
                        <th className="px-2 py-2 text-left font-semibold">Project Name</th>
                        <th className="px-2 py-2 text-left font-semibold">Kelompok Biaya</th>
                        <th className="px-2 py-2 text-center font-semibold">CAPEX</th>
                        <th className="px-2 py-2 text-left font-semibold">Unit Kerja</th>
                        <th className="px-2 py-2 text-left font-semibold">Status</th>
                        <th className="px-2 py-2 text-center font-semibold">FY</th>
                        <th className="px-2 py-2 text-right font-semibold">Nominal Budget</th>
                        <th className="px-2 py-2 text-right font-semibold">Actual To Date</th>
                        <th className="px-2 py-2 text-right font-semibold">Remaining after Payment</th>
                        <th className="px-2 py-2 text-right font-semibold">Commitment (SPK)</th>
                        <th className="px-2 py-2 text-right font-semibold">Remaining after SPK</th>
                        <th className="px-2 py-2 text-right font-semibold">Forecast</th>
                        <th className="px-2 py-2 text-left font-semibold">Vendor (latest)</th>
                        <th className="px-2 py-2 text-center font-semibold">Latest SPK</th>
                        <th className="px-2 py-2 text-center font-semibold">Latest Payment</th>
                        {monthNames.map((month) => (
                          <th key={month} className="px-2 py-2 text-right font-semibold">
                            {month.substring(0, 3)}
                          </th>
                        ))}
                        <th className="px-2 py-2 text-right font-semibold">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayData.map((row, idx) => (
                        <tr key={row.budgetId} className="border-b hover:bg-blue-50">
                          <td className="px-2 py-2 font-medium sticky left-0 bg-white">{idx + 1}</td>
                          <td className="px-2 py-2">{row.projectType || "-"}</td>
                          <td className="px-2 py-2 font-mono text-xs">{row.projectId || "-"}</td>
                          <td className="px-2 py-2 font-medium">{row.projectName}</td>
                          <td className="px-2 py-2">{row.coaName}</td>
                          <td className="px-2 py-2 text-center">{row.budgetType?.toUpperCase()}</td>
                          <td className="px-2 py-2 text-sm">{row.unitName}</td>
                          <td className="px-2 py-2 text-sm">{row.projectStatus || "-"}</td>
                          <td className="px-2 py-2 text-center">{row.fiscalYear}</td>
                          <td className="px-2 py-2 text-right font-mono">
                            Rp {row.nominalBudget.toLocaleString("id-ID")}
                          </td>
                          <td className="px-2 py-2 text-right font-mono">
                            Rp {row.actualToDate.toLocaleString("id-ID")}
                          </td>
                          <td className="px-2 py-2 text-right font-mono">
                            Rp {row.remainingAfterPayment.toLocaleString("id-ID")}
                          </td>
                          <td className="px-2 py-2 text-right font-mono">
                            Rp {row.commitmentAmount.toLocaleString("id-ID")}
                          </td>
                          <td className="px-2 py-2 text-right font-mono">
                            Rp {row.remainingAfterSpk.toLocaleString("id-ID")}
                          </td>
                          <td className="px-2 py-2 text-right">N/A</td>
                          <td className="px-2 py-2 text-sm">{row.vendor || "-"}</td>
                          <td className="px-2 py-2 text-center text-xs">
                            {row.latestSpkDate ? new Date(row.latestSpkDate).toLocaleDateString("id-ID") : "-"}
                          </td>
                          <td className="px-2 py-2 text-center text-xs">
                            {row.transactions && row.transactions.flat().length > 0
                              ? new Date(
                                  Math.max(
                                    ...row.transactions.flat().map((t: any) => new Date(t.date).getTime())
                                  )
                                ).toLocaleDateString("id-ID")
                              : "-"}
                          </td>
                          {row.monthlyActuals.map((amount, month) => (
                            <td
                              key={month}
                              className="px-2 py-2 text-right font-mono text-xs cursor-pointer hover:bg-yellow-100"
                              onClick={() => handleDrillDown(month, row)}
                            >
                              {amount > 0 ? (
                                <button className="hover:underline flex items-center justify-end gap-1">
                                  Rp {amount.toLocaleString("id-ID")}
                                  <Eye className="w-3 h-3" />
                                </button>
                              ) : (
                                "-"
                              )}
                            </td>
                          ))}
                          <td className="px-2 py-2 text-right font-mono font-semibold">
                            Rp {row.total.toLocaleString("id-ID")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Budget Rutin */}
        <TabsContent value="routine" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Routine Budget (OPEX) Monitoring</CardTitle>
              <CardDescription>
                Operational expenditure monitoring. Click any monthly amount to view transaction details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {displayData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No approved routine budgets for FY {selectedYear}</p>
                </div>
              ) : (
                <div className="overflow-x-auto border rounded-lg bg-white">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b">
                        <th className="px-2 py-2 text-left font-semibold sticky left-0 bg-slate-100 z-10">No</th>
                        <th className="px-2 py-2 text-left font-semibold">Kelompok Biaya</th>
                        <th className="px-2 py-2 text-left font-semibold">Deskripsi Biaya</th>
                        <th className="px-2 py-2 text-left font-semibold">Unit Kerja</th>
                        <th className="px-2 py-2 text-left font-semibold">Status</th>
                        <th className="px-2 py-2 text-center font-semibold">FY</th>
                        <th className="px-2 py-2 text-right font-semibold">Nominal Budget (OPEX)</th>
                        {monthNames.map((month) => (
                          <th key={month} className="px-2 py-2 text-right font-semibold">
                            {month.substring(0, 3)}
                          </th>
                        ))}
                        <th className="px-2 py-2 text-right font-semibold">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayData.map((row, idx) => (
                        <tr key={row.budgetId} className="border-b hover:bg-blue-50">
                          <td className="px-2 py-2 font-medium sticky left-0 bg-white">{idx + 1}</td>
                          <td className="px-2 py-2">{row.coaName}</td>
                          <td className="px-2 py-2 text-sm">{row.projectName}</td>
                          <td className="px-2 py-2 text-sm">{row.unitName}</td>
                          <td className="px-2 py-2 text-sm">{row.projectStatus || "-"}</td>
                          <td className="px-2 py-2 text-center">{row.fiscalYear}</td>
                          <td className="px-2 py-2 text-right font-mono">
                            Rp {row.nominalBudget.toLocaleString("id-ID")}
                          </td>
                          {row.monthlyActuals.map((amount, month) => (
                            <td
                              key={month}
                              className="px-2 py-2 text-right font-mono text-xs cursor-pointer hover:bg-yellow-100"
                              onClick={() => handleDrillDown(month, row)}
                            >
                              {amount > 0 ? (
                                <button className="hover:underline flex items-center justify-end gap-1">
                                  Rp {amount.toLocaleString("id-ID")}
                                  <Eye className="w-3 h-3" />
                                </button>
                              ) : (
                                "-"
                              )}
                            </td>
                          ))}
                          <td className="px-2 py-2 text-right font-mono font-semibold">
                            Rp {row.total.toLocaleString("id-ID")}
                          </td>
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

      {/* Drill-down Modal */}
      <DrillDownModal
        isOpen={drillDownOpen}
        title={drillDownData?.title || ""}
        transactions={drillDownData?.transactions || []}
        onClose={() => {
          setDrillDownOpen(false)
          setDrillDownData(null)
        }}
      />
    </div>
  )
}
