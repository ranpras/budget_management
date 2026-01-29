"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useBudgetStore } from "@/lib/store"
import { useMasterDataStore } from "@/lib/master-data-store"
import { useAuthStore } from "@/lib/auth-store"
import { BudgetStatus, CommitmentStatus } from "@/lib/types"

export function SpendingRequest() {
  const budgetStore = useBudgetStore()
  const masterDataStore = useMasterDataStore()
  const authUser = useAuthStore((state) => state.getCurrentUser())

  const [selectedBudgetId, setSelectedBudgetId] = useState("")
  const [selectedVendorId, setSelectedVendorId] = useState("")
  const [formData, setFormData] = useState({
    spkNumber: "",
    description: "",
    amount: "",
    startDate: "",
    endDate: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [showSubmitted, setShowSubmitted] = useState(false)

  const activeVendors = masterDataStore.getVendorsByActive(true)
  const selectedVendor = activeVendors.find((v) => v.id === selectedVendorId)

  const approvedBudgets = useMemo(() => {
    return budgetStore.budgets.filter((b) => 
      (b.status === BudgetStatus.ACTIVE || b.status === BudgetStatus.APPROVED_ADMIN) && 
      b.unitId === authUser?.unitId
    )
  }, [budgetStore.budgets, authUser?.unitId])

  const selectedBudget = approvedBudgets.find((b) => b.id === selectedBudgetId)
  const availableBudget = selectedBudget ? budgetStore.getBudgetBalance(selectedBudgetId).availableBudget : 0

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!selectedBudgetId) newErrors.budget = "Please select a budget"
    if (!formData.spkNumber.trim()) newErrors.spkNumber = "SPK Number is required"
    if (!selectedVendorId) newErrors.vendor = "Vendor is required"
    if (!formData.description.trim()) newErrors.description = "Description is required"
    if (!formData.amount || Number(formData.amount) <= 0) newErrors.amount = "Amount must be greater than 0"
    if (Number(formData.amount) > availableBudget) {
      newErrors.amountExceeds = `Amount cannot exceed available budget (Rp ${availableBudget.toLocaleString("id-ID")})`
    }
    if (!formData.startDate) newErrors.startDate = "Start date is required"
    if (!formData.endDate) newErrors.endDate = "End date is required"
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.dateRange = "End date must be after start date"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent, action: "draft" | "submit") => {
    e.preventDefault()
    if (!validateForm()) return
    if (!selectedBudget || !selectedVendor) return

    const commitmentId = `SPK-${Date.now()}`
    const newCommitment = {
      budgetId: selectedBudgetId,
      spkNumber: formData.spkNumber,
      fiscalYear: selectedBudget.fiscalYear,
      unit: selectedBudget.unit,
      unitId: selectedBudget.unitId,
      rccId: selectedBudget.rccId,
      vendorName: selectedVendor.name,
      vendorContact: `${selectedVendor.contactPerson} - ${selectedVendor.phone}`,
      description: formData.description,
      amount: Number(formData.amount),
      coa: selectedBudget.coa,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      status: action === "draft" ? CommitmentStatus.DRAFT : CommitmentStatus.SUBMITTED,
      createdBy: authUser?.id || "unknown",
    }

    budgetStore.createCommitment(newCommitment)

    if (action === "submit") {
      budgetStore.submitCommitment(commitmentId)
      setSubmitted(true)
    } else {
      setShowSubmitted(true)
    }

    setTimeout(() => {
      setSelectedBudgetId("")
      setSelectedVendorId("")
      setFormData({
        spkNumber: "",
        description: "",
        amount: "",
        startDate: "",
        endDate: "",
      })
      setSubmitted(false)
      setShowSubmitted(false)
    }, 2000)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Spending Request (SPK)</h1>
        <p className="text-muted-foreground mt-2">Create a commitment to lock budget allocation</p>
      </div>

      {showSubmitted && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
          <AlertDescription className="text-green-800 dark:text-green-200">
            Spending request saved as draft successfully
          </AlertDescription>
        </Alert>
      )}

      {submitted && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
          <AlertDescription className="text-green-800 dark:text-green-200">
            Spending request submitted successfully for approval
          </AlertDescription>
        </Alert>
      )}

      {approvedBudgets.length === 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            No approved budgets available. Please request budget approval first from Supervisor and Admin Budget roles.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>New Spending Request</CardTitle>
          <CardDescription>Create a commitment (SPK) against an approved budget</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={(e) => handleSubmit(e, "submit")} className="space-y-6">
            {/* Budget Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Select Budget <span className="text-red-500">*</span>
              </label>
              <Select value={selectedBudgetId} onValueChange={setSelectedBudgetId}>
                <SelectTrigger className={errors.budget ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select an approved budget" />
                </SelectTrigger>
                <SelectContent>
                  {approvedBudgets.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No approved budgets available</div>
                  ) : (
                    approvedBudgets.map((budget) => (
                      <SelectItem key={budget.id} value={budget.id}>
                        {budget.projectName || "Routine"} - Rp {budget.initialAmount.toLocaleString("id-ID")}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.budget && <p className="text-xs text-red-500">{errors.budget}</p>}
            </div>

            {/* Available Budget Display */}
            {selectedBudget && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-950 dark:border-blue-800">
                <p className="text-sm font-medium">Available Budget (Read-only)</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  Rp {availableBudget.toLocaleString("id-ID")}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  SPK Number <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g., SPK-2025-001"
                  value={formData.spkNumber}
                  onChange={(e) => setFormData({ ...formData, spkNumber: e.target.value })}
                  className={errors.spkNumber ? "border-red-500" : ""}
                />
                {errors.spkNumber && <p className="text-xs text-red-500">{errors.spkNumber}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Vendor <span className="text-red-500">*</span>
                </label>
                <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                  <SelectTrigger className={errors.vendor ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeVendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.vendor && <p className="text-xs text-red-500">{errors.vendor}</p>}
              </div>
            </div>

            {/* Vendor Contact Info */}
            {selectedVendor && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 dark:bg-gray-900 dark:border-gray-800">
                <p className="text-xs text-muted-foreground">Vendor Contact</p>
                <p className="font-medium">{selectedVendor.contactPerson}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedVendor.email} | {selectedVendor.phone}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Description <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Describe the scope of work or goods..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`min-h-20 ${errors.description ? "border-red-500" : ""}`}
              />
              {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Amount (Rp) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className={errors.amount ? "border-red-500" : ""}
                />
                {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
                {errors.amountExceeds && <p className="text-xs text-red-500">{errors.amountExceeds}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className={errors.startDate ? "border-red-500" : ""}
                />
                {errors.startDate && <p className="text-xs text-red-500">{errors.startDate}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  End Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className={errors.endDate ? "border-red-500" : ""}
                />
                {errors.endDate && <p className="text-xs text-red-500">{errors.endDate}</p>}
                {errors.dateRange && <p className="text-xs text-red-500">{errors.dateRange}</p>}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={(e) => handleSubmit(e as any, "draft")}>
                Save Draft
              </Button>
              <Button type="submit">Submit for Approval</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
