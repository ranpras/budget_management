"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useBudgetStore } from "@/lib/store"
import { useMasterDataStore } from "@/lib/master-data-store"
import { BudgetType, BudgetStatus } from "@/lib/types"
import { useCurrentUser } from "@/lib/user-context"
import { useAuthStore } from "@/lib/auth-store"

export function BudgetPlanning() {
  const budgetStore = useBudgetStore()
  const masterDataStore = useMasterDataStore()
  const currentUser = useCurrentUser()
  const authUser = useAuthStore((state) => state.getCurrentUser())

  const [budgetType, setBudgetType] = useState<BudgetType>(BudgetType.ROUTINE)
  const [formData, setFormData] = useState({
    fiscalYear: String(masterDataStore.getActiveFiscalYear()?.year || new Date().getFullYear()),
    rccId: "",
    budgetType: BudgetType.ROUTINE,
    projectId: "",
    projectName: "",
    coaCode: "",
    amount: "",
    justification: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [showSubmitted, setShowSubmitted] = useState(false)

  const coas = masterDataStore.getCOAsByActive(true)
  const rccs = masterDataStore.getRCCsByUnit(currentUser?.unitId || "")
  const activeFY = masterDataStore.getActiveFiscalYear()

  // Role-based access control: Only OPERATOR can create budgets
  if (currentUser?.role !== "operator") {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>
              You do not have permission to create budgets. Only Operator role can submit budget requests.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validate master data exists
    if (coas.length === 0) newErrors.masterCoa = "No active COA master data found. Admin must setup COA first."
    if (rccs.length === 0) newErrors.masterRcc = "No RCC master data found for your unit. Admin must setup RCC first."
    if (!activeFY) newErrors.masterFy = "No active fiscal year. Admin must setup fiscal year first."

    if (!formData.coaCode) newErrors.coa = "Chart of Accounts is required"
    if (!formData.amount || Number(formData.amount) <= 0) newErrors.amount = "Amount must be greater than 0"
    if (!formData.justification.trim()) newErrors.justification = "Justification is required"
    if (!formData.rccId) newErrors.rcc = "RCC / Cost Center is required"

    if (budgetType === BudgetType.PROJECT) {
      if (!formData.projectId.trim()) newErrors.projectId = "Project ID is required for Project budgets"
      if (!formData.projectName.trim()) newErrors.projectName = "Project Name is required for Project budgets"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveDraft = () => {
    if (!validateForm()) return

    const unitName = masterDataStore.units.find((u) => u.id === currentUser?.unitId)?.name || currentUser?.unitId || ""
    const coaObj = coas.find((c) => c.code === formData.coaCode)

    const newBudget = {
      fiscalYear: Number(formData.fiscalYear),
      unit: unitName,
      unitId: currentUser?.unitId || "",
      rccId: formData.rccId,
      budgetType,
      projectId: budgetType === BudgetType.PROJECT ? formData.projectId : undefined,
      projectName: budgetType === BudgetType.PROJECT ? formData.projectName : undefined,
      coa: coaObj?.code || formData.coaCode,
      initialAmount: Number(formData.amount),
      status: BudgetStatus.DRAFT,
      justification: formData.justification,
      createdBy: authUser?.id || "unknown",
    }

    budgetStore.createBudget(newBudget)
    setShowSubmitted(true)

    setTimeout(() => {
      setFormData({
        fiscalYear: String(activeFY?.year || new Date().getFullYear()),
        rccId: "",
        budgetType: BudgetType.ROUTINE,
        projectId: "",
        projectName: "",
        coaCode: "",
        amount: "",
        justification: "",
      })
      setShowSubmitted(false)
      setBudgetType(BudgetType.ROUTINE)
    }, 2000)
  }

  const handleSubmitBudget = () => {
    if (!validateForm()) return

    const unitName = masterDataStore.units.find((u) => u.id === currentUser?.unitId)?.name || currentUser?.unitId || ""
    const coaObj = coas.find((c) => c.code === formData.coaCode)

    const newBudget = {
      fiscalYear: Number(formData.fiscalYear),
      unit: unitName,
      unitId: currentUser?.unitId || "",
      rccId: formData.rccId,
      budgetType,
      projectId: budgetType === BudgetType.PROJECT ? formData.projectId : undefined,
      projectName: budgetType === BudgetType.PROJECT ? formData.projectName : undefined,
      coa: coaObj?.code || formData.coaCode,
      initialAmount: Number(formData.amount),
      status: BudgetStatus.SUBMITTED,
      justification: formData.justification,
      createdBy: authUser?.id || "unknown",
    }

    budgetStore.createBudget(newBudget)
    setSubmitted(true)

    setTimeout(() => {
      setFormData({
        fiscalYear: String(activeFY?.year || new Date().getFullYear()),
        rccId: "",
        budgetType: BudgetType.ROUTINE,
        projectId: "",
        projectName: "",
        coaCode: "",
        amount: "",
        justification: "",
      })
      setSubmitted(false)
      setBudgetType(BudgetType.ROUTINE)
    }, 2000)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Budget Planning</h1>
        <p className="text-muted-foreground mt-2">Create and submit new budgets for approval</p>
      </div>

      {showSubmitted && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
          <AlertDescription className="text-green-800 dark:text-green-200">
            Budget saved as draft successfully
          </AlertDescription>
        </Alert>
      )}

      {submitted && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
          <AlertDescription className="text-green-800 dark:text-green-200">
            Budget submitted successfully for approval
          </AlertDescription>
        </Alert>
      )}

      {/* Master Data Validation Warnings */}
      {coas.length === 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            No active Chart of Accounts (COA) found. Contact Admin to setup master data.
          </AlertDescription>
        </Alert>
      )}

      {rccs.length === 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            No RCC/Cost Center data found for your unit. Contact Admin to setup master data for your unit.
          </AlertDescription>
        </Alert>
      )}

      {!activeFY && (
        <Alert variant="destructive">
          <AlertDescription>
            No active Fiscal Year defined. Contact Admin to setup fiscal year.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>New Budget</CardTitle>
          <CardDescription>Fill in the details to create a budget request</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fiscal Year</label>
              <Select
                value={formData.fiscalYear}
                onValueChange={(value) => setFormData({ ...formData, fiscalYear: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {masterDataStore.fiscalYears.map((fy) => (
                    <SelectItem key={fy.id} value={String(fy.year)}>
                      {fy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Unit Kerja</label>
              <Input
                type="text"
                value={masterDataStore.units.find((u) => u.id === currentUser?.unitId)?.name || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Auto-assigned from your login</p>
            </div>
          </div>

          {/* Budget Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Budget Type</label>
            <Select
              value={budgetType}
              onValueChange={(value) => {
                setBudgetType(value as BudgetType)
                setFormData({ ...formData, budgetType: value as BudgetType })
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={BudgetType.ROUTINE}>Routine</SelectItem>
                <SelectItem value={BudgetType.PROJECT}>Project</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Project Fields */}
          {budgetType === BudgetType.PROJECT && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Project ID <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g., PROJ-001"
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className={errors.projectId ? "border-red-500" : ""}
                />
                {errors.projectId && <p className="text-xs text-red-500">{errors.projectId}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Project name"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  className={errors.projectName ? "border-red-500" : ""}
                />
                {errors.projectName && <p className="text-xs text-red-500">{errors.projectName}</p>}
              </div>
            </div>
          )}

          {/* COA and RCC */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Chart of Accounts (COA) <span className="text-red-500">*</span>
              </label>
              <Select value={formData.coaCode} onValueChange={(value) => setFormData({ ...formData, coaCode: value })}>
                <SelectTrigger className={errors.coa ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select COA" />
                </SelectTrigger>
                <SelectContent>
                  {coas.map((coa) => (
                    <SelectItem key={coa.id} value={coa.code}>
                      {coa.code} - {coa.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.coa && <p className="text-xs text-red-500">{errors.coa}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                RCC / Cost Center <span className="text-red-500">*</span>
              </label>
              <Select value={formData.rccId} onValueChange={(value) => setFormData({ ...formData, rccId: value })}>
                <SelectTrigger className={errors.rcc ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select RCC" />
                </SelectTrigger>
                <SelectContent>
                  {rccs.map((rcc) => (
                    <SelectItem key={rcc.id} value={rcc.id}>
                      {rcc.code} - {rcc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.rcc && <p className="text-xs text-red-500">{errors.rcc}</p>}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Budget Amount (Rp) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              placeholder="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className={errors.amount ? "border-red-500" : ""}
            />
            {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
          </div>

          {/* Justification */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Justification <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Explain the purpose and justification for this budget..."
              value={formData.justification}
              onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
              className={`min-h-24 ${errors.justification ? "border-red-500" : ""}`}
            />
            {errors.justification && <p className="text-xs text-red-500">{errors.justification}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6">
            <Button variant="outline" onClick={handleSaveDraft} disabled={coas.length === 0 || rccs.length === 0 || !activeFY}>
              Save as Draft
            </Button>
            <Button onClick={handleSubmitBudget} disabled={coas.length === 0 || rccs.length === 0 || !activeFY}>
              Submit for Approval
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
