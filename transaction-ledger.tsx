"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, ChevronDown } from "lucide-react"
import { useBudgetStore } from "@/lib/store"
import { BudgetStatus, CommitmentStatus, ActualStatus } from "@/lib/types"

export function TransactionLedger() {
  const store = useBudgetStore()
  const [selectedBudgetId, setSelectedBudgetId] = useState("")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const approvedBudgets = useMemo(() => {
    return store.budgets.filter((b) => b.status === BudgetStatus.APPROVED)
  }, [store.budgets])

  const selectedBudget = approvedBudgets.find((b) => b.id === selectedBudgetId)
  const balance = selectedBudget ? store.getBudgetBalance(selectedBudgetId) : null

  const ledgerTransactions = useMemo(() => {
    if (!selectedBudgetId) return { budgets: [], commitments: [], actuals: [] }

    const budgetTx = store.budgets.find((b) => b.id === selectedBudgetId)
    const revisionTx = store.revisions.filter((r) => r.budgetId === selectedBudgetId)
    const commitmentTx = store.commitments.filter((c) => c.budgetId === selectedBudgetId)
    const actualTx = store.actuals.filter((a) => a.budgetId === selectedBudgetId)

    return { budgetTx, revisionTx, commitmentTx, actualTx }
  }, [selectedBudgetId, store])

  const toggleRowExpanded = (rowId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId)
    } else {
      newExpanded.add(rowId)
    }
    setExpandedRows(newExpanded)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case BudgetStatus.APPROVED:
      case CommitmentStatus.APPROVED:
      case ActualStatus.POSTED:
        return "bg-emerald-100 text-emerald-800"
      case BudgetStatus.SUBMITTED:
      case CommitmentStatus.SUBMITTED:
      case ActualStatus.SUBMITTED:
        return "bg-amber-100 text-amber-800"
      case BudgetStatus.DRAFT:
      case CommitmentStatus.DRAFT:
      case ActualStatus.DRAFT:
        return "bg-blue-100 text-blue-800"
      case BudgetStatus.REJECTED:
      case CommitmentStatus.CANCELLED:
      case ActualStatus.CANCELLED:
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleExportLedger = () => {
    if (!selectedBudget || !balance) return

    const csv = [
      ["Transaction Ledger Report"],
      [
        `Project: ${selectedBudget.projectName || "Routine"}`,
        `Unit: ${selectedBudget.unit}`,
        `COA: ${selectedBudget.coa}`,
        `Fiscal Year: ${selectedBudget.fiscalYear}`,
      ],
      [
        `Approved Budget: Rp ${balance.approvedBudget.toLocaleString("id-ID")}`,
        `Total Committed: Rp ${balance.totalCommitted.toLocaleString("id-ID")}`,
        `Total Actual: Rp ${balance.totalActual.toLocaleString("id-ID")}`,
        `Available: Rp ${balance.availableBudget.toLocaleString("id-ID")}`,
      ],
      [],
      ["Date", "Type", "Reference", "Amount", "Status", "Description"],
      ...[
        ...[
          {
            date: selectedBudget.createdAt,
            type: "Budget Approved",
            ref: selectedBudget.id,
            amount: balance.approvedBudget,
            status: selectedBudget.status,
            desc: selectedBudget.justification,
          },
        ],
        ...ledgerTransactions.revisionTx.map((r) => ({
          date: r.createdAt,
          type: "Revision",
          ref: r.id,
          amount: r.difference,
          status: r.status,
          desc: r.reason,
        })),
        ...ledgerTransactions.commitmentTx.map((c) => ({
          date: c.createdAt,
          type: "Commitment",
          ref: c.spkNumber,
          amount: c.amount,
          status: c.status,
          desc: c.description,
        })),
        ...ledgerTransactions.actualTx.map((a) => ({
          date: a.createdAt,
          type: "Actual",
          ref: a.invoiceNumber,
          amount: a.amount,
          status: a.status,
          desc: a.description,
        })),
      ]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((tx) => [new Date(tx.date).toLocaleDateString("id-ID"), tx.type, tx.ref, tx.amount, tx.status, tx.desc]),
    ]

    const csvContent = csv.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ledger-${selectedBudgetId}.csv`
    a.click()
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Transaction Ledger</h2>
          <p className="text-muted-foreground mt-1">
            Complete audit trail of all budget transactions for a specific budget
          </p>
        </div>
        {selectedBudgetId && (
          <Button onClick={handleExportLedger} className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Budget Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedBudgetId} onValueChange={setSelectedBudgetId}>
            <SelectTrigger>
              <SelectValue placeholder="Select an approved budget to view ledger" />
            </SelectTrigger>
            <SelectContent>
              {approvedBudgets.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">No approved budgets available</div>
              ) : (
                approvedBudgets.map((budget) => (
                  <SelectItem key={budget.id} value={budget.id}>
                    {budget.projectName || "Routine"} ({budget.unit}) - FY {budget.fiscalYear} - Rp{" "}
                    {budget.initialAmount.toLocaleString("id-ID")}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedBudget && balance && (
        <>
          {/* Budget Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Approved Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold font-mono text-foreground">
                  Rp {balance.approvedBudget.toLocaleString("id-ID")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{selectedBudget.projectName || "Routine"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Committed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold font-mono text-amber-600">
                  Rp {balance.totalCommitted.toLocaleString("id-ID")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {balance.approvedBudget > 0 ? Math.round((balance.totalCommitted / balance.approvedBudget) * 100) : 0}
                  % of budget
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Actual</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold font-mono text-emerald-600">
                  Rp {balance.totalActual.toLocaleString("id-ID")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {balance.approvedBudget > 0 ? Math.round((balance.totalActual / balance.approvedBudget) * 100) : 0}%
                  of budget
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold font-mono text-purple-600">
                  Rp {balance.availableBudget.toLocaleString("id-ID")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {balance.approvedBudget > 0
                    ? Math.round((balance.availableBudget / balance.approvedBudget) * 100)
                    : 0}
                  % remaining
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Details */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Complete ledger of all approved budget modifications and spending transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Budget Baseline */}
              <div className="border rounded-lg">
                <div
                  className="p-4 hover:bg-muted/50 cursor-pointer flex items-center justify-between"
                  onClick={() => toggleRowExpanded("budget-baseline")}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <ChevronDown
                        className={`w-5 h-5 text-muted-foreground transition-transform ${
                          expandedRows.has("budget-baseline") ? "rotate-0" : "-rotate-90"
                        }`}
                      />
                      <div>
                        <p className="font-semibold">Budget Baseline</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedBudget.createdAt).toLocaleDateString("id-ID")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-lg">Rp {balance.approvedBudget.toLocaleString("id-ID")}</p>
                    <Badge className={getStatusColor(selectedBudget.status)}>{selectedBudget.status}</Badge>
                  </div>
                </div>

                {expandedRows.has("budget-baseline") && (
                  <div className="px-4 py-3 bg-muted/30 border-t text-sm space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-muted-foreground text-xs">FY</p>
                        <p>{selectedBudget.fiscalYear}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">COA</p>
                        <p className="font-mono">{selectedBudget.coa}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Unit</p>
                        <p>{selectedBudget.unit}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Type</p>
                        <p className="capitalize">{selectedBudget.budgetType}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Justification</p>
                      <p className="mt-1">{selectedBudget.justification}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Revisions */}
              {ledgerTransactions.revisionTx.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-sm font-semibold text-muted-foreground">Budget Revisions</p>
                  {ledgerTransactions.revisionTx.map((revision) => (
                    <div key={revision.id} className="border rounded-lg">
                      <div
                        className="p-4 hover:bg-muted/50 cursor-pointer flex items-center justify-between"
                        onClick={() => toggleRowExpanded(revision.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <ChevronDown
                              className={`w-5 h-5 text-muted-foreground transition-transform ${
                                expandedRows.has(revision.id) ? "rotate-0" : "-rotate-90"
                              }`}
                            />
                            <div>
                              <p className="font-semibold">Revision - {revision.id}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(revision.createdAt).toLocaleDateString("id-ID")}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-mono font-bold text-lg ${
                              revision.difference > 0 ? "text-emerald-600" : "text-destructive"
                            }`}
                          >
                            {revision.difference > 0 ? "+" : ""}Rp {revision.difference.toLocaleString("id-ID")}
                          </p>
                          <Badge className={getStatusColor(revision.status)}>{revision.status}</Badge>
                        </div>
                      </div>

                      {expandedRows.has(revision.id) && (
                        <div className="px-4 py-3 bg-muted/30 border-t text-sm space-y-2">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-muted-foreground text-xs">Old Amount</p>
                              <p className="font-mono">Rp {revision.oldAmount.toLocaleString("id-ID")}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">New Amount</p>
                              <p className="font-mono">Rp {revision.newAmount.toLocaleString("id-ID")}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Difference</p>
                              <p className="font-mono font-bold">
                                {revision.difference > 0 ? "+" : ""}Rp {revision.difference.toLocaleString("id-ID")}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Reason</p>
                            <p className="mt-1">{revision.reason}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Commitments */}
              {ledgerTransactions.commitmentTx.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-sm font-semibold text-muted-foreground">Commitments (SPK)</p>
                  {ledgerTransactions.commitmentTx.map((commitment) => (
                    <div key={commitment.id} className="border rounded-lg">
                      <div
                        className="p-4 hover:bg-muted/50 cursor-pointer flex items-center justify-between"
                        onClick={() => toggleRowExpanded(commitment.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <ChevronDown
                              className={`w-5 h-5 text-muted-foreground transition-transform ${
                                expandedRows.has(commitment.id) ? "rotate-0" : "-rotate-90"
                              }`}
                            />
                            <div>
                              <p className="font-semibold">{commitment.spkNumber}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(commitment.createdAt).toLocaleDateString("id-ID")} • {commitment.vendorName}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-lg">Rp {commitment.amount.toLocaleString("id-ID")}</p>
                          <Badge className={getStatusColor(commitment.status)}>{commitment.status}</Badge>
                        </div>
                      </div>

                      {expandedRows.has(commitment.id) && (
                        <div className="px-4 py-3 bg-muted/30 border-t text-sm space-y-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-muted-foreground text-xs">Vendor Contact</p>
                              <p>{commitment.vendorContact || "-"}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Date Range</p>
                              <p className="text-sm">
                                {new Date(commitment.startDate).toLocaleDateString("id-ID")} -{" "}
                                {new Date(commitment.endDate).toLocaleDateString("id-ID")}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Description</p>
                            <p className="mt-1">{commitment.description}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Actuals */}
              {ledgerTransactions.actualTx.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-sm font-semibold text-muted-foreground">Actual Payments</p>
                  {ledgerTransactions.actualTx.map((actual) => {
                    const commitment = actual.commitmentId
                      ? store.commitments.find((c) => c.id === actual.commitmentId)
                      : null
                    return (
                      <div key={actual.id} className="border rounded-lg">
                        <div
                          className="p-4 hover:bg-muted/50 cursor-pointer flex items-center justify-between"
                          onClick={() => toggleRowExpanded(actual.id)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <ChevronDown
                                className={`w-5 h-5 text-muted-foreground transition-transform ${
                                  expandedRows.has(actual.id) ? "rotate-0" : "-rotate-90"
                                }`}
                              />
                              <div>
                                <p className="font-semibold">{actual.invoiceNumber}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(actual.invoiceDate).toLocaleDateString("id-ID")} • {actual.vendorName}
                                  {commitment && ` • SPK: ${commitment.spkNumber}`}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-bold text-lg">Rp {actual.amount.toLocaleString("id-ID")}</p>
                            <Badge className={getStatusColor(actual.status)}>{actual.status}</Badge>
                          </div>
                        </div>

                        {expandedRows.has(actual.id) && (
                          <div className="px-4 py-3 bg-muted/30 border-t text-sm space-y-2">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-muted-foreground text-xs">Payment Method</p>
                                <p className="capitalize">{actual.paymentMethod}</p>
                              </div>
                              {commitment && (
                                <div>
                                  <p className="text-muted-foreground text-xs">Linked SPK</p>
                                  <p>{commitment.spkNumber}</p>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Description</p>
                              <p className="mt-1">{actual.description}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {ledgerTransactions.revisionTx.length === 0 &&
                ledgerTransactions.commitmentTx.length === 0 &&
                ledgerTransactions.actualTx.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No transactions recorded for this budget</p>
                  </div>
                )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
