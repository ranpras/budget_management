"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBudgetStore } from "@/lib/store"
import { RevisionStatus, BudgetStatus, ActualStatus, CommitmentStatus } from "@/lib/types"

export function BudgetRevision() {
  const store = useBudgetStore()
  const [selectedBudgetId, setSelectedBudgetId] = useState("")
  const [newAmount, setNewAmount] = useState("")
  const [reason, setReason] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const approvedBudgets = useMemo(() => {
    return store.budgets.filter((b) => b.status === BudgetStatus.APPROVED && b.status !== BudgetStatus.CLOSED)
  }, [store.budgets])

  const selectedBudget = approvedBudgets.find((b) => b.id === selectedBudgetId)
  const balance = selectedBudget ? store.getBudgetBalance(selectedBudgetId) : null

  const totalCommittedAndActual = useMemo(() => {
    if (!selectedBudgetId) return 0
    const committed = store.commitments
      .filter((c) => c.budgetId === selectedBudgetId && c.status === CommitmentStatus.APPROVED)
      .reduce((sum, c) => sum + c.amount, 0)
    const actual = store.actuals
      .filter((a) => a.budgetId === selectedBudgetId && a.status === ActualStatus.POSTED)
      .reduce((sum, a) => sum + a.amount, 0)
    return committed + actual
  }, [selectedBudgetId, store.commitments, store.actuals])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!selectedBudgetId) newErrors.budget = "Please select a budget"
    if (!newAmount || Number(newAmount) <= 0) newErrors.amount = "New amount must be greater than 0"
    if (!reason.trim()) newErrors.reason = "Reason is required"

    if (balance && Number(newAmount) < totalCommittedAndActual) {
      newErrors.constraint = `Cannot reduce budget below committed+actual (Rp ${totalCommittedAndActual.toLocaleString("id-ID")})`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm() || !balance) return

    const oldAmount = balance.approvedBudget
    const difference = Number(newAmount) - oldAmount

    // Create revision
    store.createRevision({
      budgetId: selectedBudgetId,
      oldAmount,
      newAmount: Number(newAmount),
      difference,
      reason,
      status: RevisionStatus.DRAFT,
    })

    // Get the newly created revision and submit it
    const lastRevision = store.revisions[store.revisions.length - 1]
    store.submitRevision(lastRevision.id)

    setSubmitted(true)
    setTimeout(() => {
      setSelectedBudgetId("")
      setNewAmount("")
      setReason("")
      setSubmitted(false)
    }, 2000)
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Budget Revision / Unbudget</h2>
        <p className="text-muted-foreground mt-1">
          Adjust approved budget allocations during the fiscal year. Cannot reduce below committed amounts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revise Budget Allocation</CardTitle>
          <CardDescription>Select an approved budget and adjust the amount</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {submitted && (
              <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 px-4 py-3 rounded">
                Budget revision submitted for Finance approval!
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Select Approved Budget <span className="text-destructive">*</span>
              </label>
              <Select value={selectedBudgetId} onValueChange={setSelectedBudgetId}>
                <SelectTrigger className={errors.budget ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select approved budget" />
                </SelectTrigger>
                <SelectContent>
                  {approvedBudgets.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No approved budgets found</div>
                  ) : (
                    approvedBudgets.map((budget) => (
                      <SelectItem key={budget.id} value={budget.id}>
                        {budget.projectName || "Routine"} ({budget.unit}) - Rp{" "}
                        {budget.initialAmount.toLocaleString("id-ID")}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.budget && <p className="text-xs text-destructive">{errors.budget}</p>}
            </div>

            {selectedBudget && balance && (
              <div className="space-y-4">
                {/* Current Status */}
                <div className="bg-muted p-4 rounded-lg border border-border space-y-2">
                  <p className="text-sm font-medium text-foreground">Current Budget Status</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Approved Budget</p>
                      <p className="font-mono font-bold">Rp {balance.approvedBudget.toLocaleString("id-ID")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Committed</p>
                      <p className="font-mono font-bold">Rp {balance.totalCommitted.toLocaleString("id-ID")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Actual</p>
                      <p className="font-mono font-bold">Rp {balance.totalActual.toLocaleString("id-ID")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Available</p>
                      <p className="font-mono font-bold text-emerald-600">
                        Rp {balance.availableBudget.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Constraint Warning */}
                {totalCommittedAndActual > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-amber-900">Unbudget Constraint</p>
                    <p className="text-sm text-amber-800 mt-1">
                      Cannot reduce budget below Rp {totalCommittedAndActual.toLocaleString("id-ID")} (committed +
                      actual)
                    </p>
                  </div>
                )}

                {/* Old vs New Amount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Old Amount (Rp)</label>
                    <Input type="number" value={balance.approvedBudget} disabled className="bg-muted font-mono" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      New Amount (Rp) <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className={errors.amount ? "border-destructive" : ""}
                    />
                    {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
                  </div>
                </div>

                {/* Difference Display */}
                {newAmount && (
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-foreground">Difference:</span>
                      <span
                        className={`text-lg font-bold font-mono ${
                          Number(newAmount) > balance.approvedBudget ? "text-emerald-600" : "text-destructive"
                        }`}
                      >
                        {Number(newAmount) > balance.approvedBudget ? "+" : ""}Rp{" "}
                        {(Number(newAmount) - balance.approvedBudget).toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Reason for Revision <span className="text-destructive">*</span>
              </label>
              <textarea
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                rows={5}
                placeholder="Explain the business reason for this budget revision..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              {errors.reason && <p className="text-xs text-destructive">{errors.reason}</p>}
              {errors.constraint && <p className="text-xs text-destructive">{errors.constraint}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={!selectedBudgetId}>
              Submit Revision Request
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
