"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBudgetStore } from "@/lib/store"
import { useAuthStore } from "@/lib/auth-store"
import { BudgetStatus, CommitmentStatus, ActualStatus, BudgetType } from "@/lib/types"

export function ActualRealization() {
  const store = useBudgetStore()
  const authUser = useAuthStore((state) => state.getCurrentUser())
  const [selectedBudgetId, setSelectedBudgetId] = useState("")
  const [selectedCommitmentId, setSelectedCommitmentId] = useState("")
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    invoiceDate: "",
    vendorName: "",
    amount: "",
    paymentMethod: "transfer",
    description: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const approvedBudgets = useMemo(() => {
    return store.budgets.filter((b) => b.status === BudgetStatus.ACTIVE || b.status === BudgetStatus.APPROVED_ADMIN)
  }, [store.budgets])

  const selectedBudget = approvedBudgets.find((b) => b.id === selectedBudgetId)
  const isProjectBudget = selectedBudget?.budgetType === BudgetType.PROJECT

  const approvedCommitments = useMemo(() => {
    if (!selectedBudgetId) return []
    return store.commitments.filter((c) => 
      c.budgetId === selectedBudgetId && 
      (c.status === CommitmentStatus.APPROVED_FINANCE || c.status === CommitmentStatus.APPROVED_UNIT)
    )
  }, [selectedBudgetId, store.commitments])

  const remainingCommitment = useMemo(() => {
    if (!selectedCommitmentId) return 0
    const commitment = store.commitments.find((c) => c.id === selectedCommitmentId)
    if (!commitment) return 0

    const posted = store.actuals
      .filter((a) => a.commitmentId === selectedCommitmentId && a.status === ActualStatus.POSTED)
      .reduce((sum, a) => sum + a.amount, 0)

    return Math.max(0, commitment.amount - posted)
  }, [selectedCommitmentId, store.commitments, store.actuals])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!selectedBudgetId) newErrors.budget = "Please select a budget"
    if (isProjectBudget && !selectedCommitmentId) {
      newErrors.commitment = "Project budgets require a commitment reference"
    }
    if (!formData.invoiceNumber.trim()) newErrors.invoiceNumber = "Invoice number is required"
    if (!formData.invoiceDate) newErrors.invoiceDate = "Invoice date is required"
    if (!formData.amount || Number(formData.amount) <= 0) newErrors.amount = "Amount must be greater than 0"

    if (selectedCommitmentId && Number(formData.amount) > remainingCommitment) {
      newErrors.amountExceeds = `Amount cannot exceed remaining commitment (Rp ${remainingCommitment.toLocaleString("id-ID")})`
    }

    if (!formData.description.trim()) newErrors.description = "Description is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent, action: "draft" | "post") => {
    e.preventDefault()
    if (!validateForm() || !selectedBudget) return

    const newActual = {
      budgetId: selectedBudgetId,
      commitmentId: selectedCommitmentId || undefined,
      invoiceNumber: formData.invoiceNumber,
      invoiceDate: new Date(formData.invoiceDate),
      vendorName: formData.vendorName,
      amount: Number(formData.amount),
      paymentMethod: formData.paymentMethod,
      description: formData.description,
      status: ActualStatus.DRAFT,
      createdBy: authUser?.id || "unknown",
    }

    store.createActual(newActual)

    if (action === "post") {
      const lastActual = store.actuals[store.actuals.length - 1]
      store.submitActual(lastActual.id)
      store.postActual(lastActual.id)
    }

    setSubmitted(true)
    setTimeout(() => {
      setSelectedBudgetId("")
      setSelectedCommitmentId("")
      setFormData({
        invoiceNumber: "",
        invoiceDate: "",
        vendorName: "",
        amount: "",
        paymentMethod: "transfer",
        description: "",
      })
      setSubmitted(false)
    }, 2000)
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Actual Realization</h2>
        <p className="text-muted-foreground mt-1">
          Record actual invoice/payment against commitments. Project budgets require SPK reference; Routine can post
          without SPK.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Record Actual Payment</CardTitle>
          <CardDescription>Upload invoice and post payment to reduce commitment</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleSubmit(e, "post")} className="space-y-6">
            {submitted && (
              <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 px-4 py-3 rounded">
                Actual payment posted successfully!
              </div>
            )}

            {/* Budget Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Select Budget <span className="text-destructive">*</span>
              </label>
              <Select value={selectedBudgetId} onValueChange={setSelectedBudgetId}>
                <SelectTrigger className={errors.budget ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select an approved budget" />
                </SelectTrigger>
                <SelectContent>
                  {approvedBudgets.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No approved budgets available</div>
                  ) : (
                    approvedBudgets.map((budget) => (
                      <SelectItem key={budget.id} value={budget.id}>
                        {budget.projectName || "Routine"} ({budget.budgetType})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.budget && <p className="text-xs text-destructive">{errors.budget}</p>}
            </div>

            {/* Commitment Selection (Required for Project) */}
            {selectedBudget && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Reference Commitment (SPK)
                  {isProjectBudget && <span className="text-destructive">*</span>}
                </label>
                <Select value={selectedCommitmentId} onValueChange={setSelectedCommitmentId}>
                  <SelectTrigger className={errors.commitment ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select commitment" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedCommitments.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No approved commitments</div>
                    ) : (
                      approvedCommitments.map((commitment) => {
                        const remaining = store.commitments
                          .filter((c) => c.id === commitment.id)
                          .reduce((sum, c) => {
                            const posted = store.actuals
                              .filter((a) => a.commitmentId === c.id && a.status === ActualStatus.POSTED)
                              .reduce((s, a) => s + a.amount, 0)
                            return c.amount - posted
                          }, 0)

                        return (
                          <SelectItem key={commitment.id} value={commitment.id}>
                            {commitment.spkNumber} - {commitment.vendorName} (Rem: Rp{" "}
                            {remaining.toLocaleString("id-ID")})
                          </SelectItem>
                        )
                      })
                    )}
                  </SelectContent>
                </Select>
                {errors.commitment && <p className="text-xs text-destructive">{errors.commitment}</p>}
              </div>
            )}

            {/* Remaining Commitment Display */}
            {selectedCommitmentId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-foreground font-medium">Remaining Commitment (Read-only)</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  Rp {remainingCommitment.toLocaleString("id-ID")}
                </p>
                <p className="text-xs text-blue-700 mt-1">Amount available to post against this SPK</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Invoice Number <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g., INV-2025-001"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  className={errors.invoiceNumber ? "border-destructive" : ""}
                />
                {errors.invoiceNumber && <p className="text-xs text-destructive">{errors.invoiceNumber}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Invoice Date <span className="text-destructive">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                  className={errors.invoiceDate ? "border-destructive" : ""}
                />
                {errors.invoiceDate && <p className="text-xs text-destructive">{errors.invoiceDate}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Vendor Name</label>
                <Input
                  placeholder="Vendor name (optional)"
                  value={formData.vendorName}
                  onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Payment Method</label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer">Bank Transfer</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Amount (Rp) <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                placeholder="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className={errors.amount ? "border-destructive" : ""}
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
              {errors.amountExceeds && <p className="text-xs text-destructive">{errors.amountExceeds}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Description <span className="text-destructive">*</span>
              </label>
              <textarea
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder="Describe the payment details..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={(e) => handleSubmit(e as any, "draft")}
                className="flex-1"
              >
                Save Draft
              </Button>
              <Button type="submit" className="flex-1">
                Post Payment
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
