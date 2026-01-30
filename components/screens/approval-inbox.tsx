"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useBudgetStore } from "@/lib/store"
import { useMasterDataStore } from "@/lib/master-data-store"
import { useCurrentUser } from "@/lib/user-context"
import { useToast } from "@/lib/hooks/use-toast"
import type { Budget, BudgetRevision, Commitment, ActualPayment } from "@/lib/types"
import { CheckCircle, AlertCircle } from "lucide-react"

export function ApprovalInbox() {
  const budgetStore = useBudgetStore()
  const masterDataStore = useMasterDataStore()
  const currentUser = useCurrentUser()
  const { toast } = useToast()

  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState("budgets")
  const [selectedItem, setSelectedItem] = useState<Budget | BudgetRevision | Commitment | ActualPayment | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const pendingApprovals = budgetStore.getPendingSupervisorApprovals(currentUser?.unitId || "")

  // Role-based access control: Only SUPERVISOR can access Approval Inbox
  if (currentUser?.role !== "supervisor") {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You do not have permission to access Approval Inbox. Only Supervisor role can review and approve budgets for their unit.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const handleApprove = (item: Budget | BudgetRevision | Commitment | ActualPayment) => {
    setIsProcessing(true)

    try {
      let itemType = ""

      if ("initialAmount" in item) {
        budgetStore.approveBudgetBySupervisor(item.id, currentUser?.id || "")
        itemType = "Budget"
      } else if ("oldAmount" in item) {
        budgetStore.approveUnitRevision(item.id, currentUser?.id || "")
        itemType = "Revision"
      } else if ("vendorName" in item) {
        budgetStore.approveUnitCommitment(item.id, currentUser?.id || "")
        itemType = "Commitment (SPK)"
      } else {
        budgetStore.approveUnitActual(item.id, currentUser?.id || "")
        itemType = "Actual Payment"
      }

      setRefreshKey((prev) => prev + 1)

      toast({
        title: "Approved Successfully",
        description: `${itemType} has been approved by supervisor and sent to Admin for final review.`,
        action: {
          label: "Dismiss",
          onClick: () => {},
        },
      })

      setSelectedItem(null)
      setIsProcessing(false)
    } catch (error) {
      toast({
        title: "Approval Failed",
        description: "An error occurred while approving. Please try again.",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  const handleReject = (item: Budget | BudgetRevision | Commitment | ActualPayment) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a rejection reason.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      let itemType = ""

      if ("initialAmount" in item) {
        budgetStore.rejectBudgetBySupervisor(item.id, currentUser?.id || "", rejectionReason)
        itemType = "Budget"
      } else if ("oldAmount" in item) {
        budgetStore.rejectUnitRevision(item.id, currentUser?.id || "", rejectionReason)
        itemType = "Revision"
      } else if ("vendorName" in item) {
        budgetStore.rejectUnitCommitment(item.id, currentUser?.id || "", rejectionReason)
        itemType = "Commitment (SPK)"
      } else {
        budgetStore.rejectUnitActual(item.id, currentUser?.id || "", rejectionReason)
        itemType = "Actual Payment"
      }

      setRefreshKey((prev) => prev + 1)

      toast({
        title: "Rejected Successfully",
        description: `${itemType} has been rejected. The requester has been notified and can resubmit after making corrections.`,
      })

      setShowRejectDialog(false)
      setRejectionReason("")
      setSelectedItem(null)
      setIsProcessing(false)
    } catch (error) {
      toast({
        title: "Rejection Failed",
        description: "An error occurred while rejecting. Please try again.",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Approval Inbox</h1>
          <p className="text-muted-foreground mt-2">Review and approve submissions from your unit</p>
          <div className="flex gap-4 mt-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Total Pending: </span>
              <span className="font-semibold text-blue-600">
                {pendingApprovals.budgets.length +
                  pendingApprovals.revisions.length +
                  pendingApprovals.commitments.length +
                  pendingApprovals.actuals.length}
              </span>
            </div>
          </div>
        </div>

        {pendingApprovals.budgets.length +
          pendingApprovals.revisions.length +
          pendingApprovals.commitments.length +
          pendingApprovals.actuals.length ===
          0 && (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 mb-6">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200 ml-2">
              All items have been reviewed! Your inbox is clear.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="budgets">
              Budgets{" "}
              <Badge variant="secondary" className="ml-2">
                {pendingApprovals.budgets.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="revisions">
              Revisions{" "}
              <Badge variant="secondary" className="ml-2">
                {pendingApprovals.revisions.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="commitments">
              Commitments{" "}
              <Badge variant="secondary" className="ml-2">
                {pendingApprovals.commitments.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="actuals">
              Actuals{" "}
              <Badge variant="secondary" className="ml-2">
                {pendingApprovals.actuals.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* BUDGETS */}
          <TabsContent value="budgets">
            {pendingApprovals.budgets.length === 0 ? (
              <Alert>
                <AlertDescription>No pending budget approvals</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.budgets.map((budget) => (
                  <Card key={budget.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">{budget.id}</p>
                          <p className="text-sm text-muted-foreground">
                            Rp {budget.initialAmount.toLocaleString("id-ID")} | FY {budget.fiscalYear} | {budget.coa}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Submitted by: {budget.createdBy}</p>
                        </div>
                        <Button size="sm" onClick={() => setSelectedItem(budget)}>
                          Review
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* REVISIONS */}
          <TabsContent value="revisions">
            {pendingApprovals.revisions.length === 0 ? (
              <Alert>
                <AlertDescription>No pending revision approvals</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.revisions.map((revision) => (
                  <Card key={revision.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">{revision.id}</p>
                          <p className="text-sm text-muted-foreground">
                            Budget {revision.budgetId} | Rp {revision.oldAmount.toLocaleString("id-ID")} → Rp{" "}
                            {revision.newAmount.toLocaleString("id-ID")}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Submitted by: {revision.createdBy}</p>
                        </div>
                        <Button size="sm" onClick={() => setSelectedItem(revision)}>
                          Review
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* COMMITMENTS */}
          <TabsContent value="commitments">
            {pendingApprovals.commitments.length === 0 ? (
              <Alert>
                <AlertDescription>No pending commitment approvals</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.commitments.map((commitment) => (
                  <Card key={commitment.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">{commitment.spkNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {commitment.vendorName} | Rp {commitment.amount.toLocaleString("id-ID")}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Submitted by: {commitment.createdBy}</p>
                        </div>
                        <Button size="sm" onClick={() => setSelectedItem(commitment)}>
                          Review
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ACTUALS */}
          <TabsContent value="actuals">
            {pendingApprovals.actuals.length === 0 ? (
              <Alert>
                <AlertDescription>No pending actual payment approvals</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.actuals.map((actual) => (
                  <Card key={actual.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">{actual.invoiceNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {actual.vendorName} | Rp {actual.amount.toLocaleString("id-ID")}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Submitted by: {actual.createdBy}</p>
                        </div>
                        <Button size="sm" onClick={() => setSelectedItem(actual)}>
                          Review
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedItem}
        onOpenChange={() => {
          if (!isProcessing) {
            setSelectedItem(null)
            setShowRejectDialog(false)
            setRejectionReason("")
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
            <DialogDescription>
              {selectedItem &&
                ("initialAmount" in selectedItem
                  ? `Budget ${selectedItem.id}`
                  : "oldAmount" in selectedItem
                    ? `Revision ${selectedItem.id}`
                    : "vendorName" in selectedItem
                      ? `Commitment ${selectedItem.spkNumber}`
                      : `Actual ${selectedItem.invoiceNumber}`)}
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6">
              {/* Details Section */}
              <div className="border-t pt-4">
                {(() => {
                  if ("initialAmount" in selectedItem) return renderBudgetDetails(selectedItem as Budget)
                  if ("oldAmount" in selectedItem) return renderRevisionDetails(selectedItem as BudgetRevision)
                  if ("vendorName" in selectedItem) return renderCommitmentDetails(selectedItem as Commitment)
                  return renderActualDetails(selectedItem as ActualPayment)
                })()}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end border-t pt-4">
                {!showRejectDialog ? (
                  <>
                    <Button
                      variant="outline"
                      disabled={isProcessing}
                      onClick={() => {
                        setShowRejectDialog(true)
                      }}
                    >
                      Reject
                    </Button>
                    <Button disabled={isProcessing} onClick={() => handleApprove(selectedItem)}>
                      {isProcessing ? "Processing..." : "Approve"}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="w-full">
                      <label className="block text-sm font-medium mb-2">Rejection Reason *</label>
                      <Textarea
                        placeholder="Explain why you are rejecting this submission..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        disabled={isProcessing}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        disabled={isProcessing}
                        onClick={() => {
                          setShowRejectDialog(false)
                          setRejectionReason("")
                        }}
                      >
                        Cancel
                      </Button>
                      <Button variant="destructive" disabled={isProcessing} onClick={() => handleReject(selectedItem)}>
                        {isProcessing ? "Processing..." : "Confirm Reject"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function renderBudgetDetails(budget: Budget) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Budget ID</p>
          <p className="font-semibold">{budget.id}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Amount</p>
          <p className="font-semibold">Rp {budget.initialAmount.toLocaleString("id-ID")}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Fiscal Year</p>
          <p className="font-semibold">{budget.fiscalYear}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Type</p>
          <p className="font-semibold capitalize">{budget.budgetType}</p>
        </div>
        <div className="col-span-2">
          <p className="text-sm text-muted-foreground">COA</p>
          <p className="font-semibold">{budget.coa}</p>
        </div>
        <div className="col-span-2">
          <p className="text-sm text-muted-foreground">Justification</p>
          <p className="text-sm">{budget.justification}</p>
        </div>
      </div>
    </div>
  )
}

function renderRevisionDetails(revision: BudgetRevision) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Revision ID</p>
          <p className="font-semibold">{revision.id}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Budget ID</p>
          <p className="font-semibold">{revision.budgetId}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Old Amount</p>
          <p className="font-semibold">Rp {revision.oldAmount.toLocaleString("id-ID")}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">New Amount</p>
          <p className="font-semibold text-green-600">Rp {revision.newAmount.toLocaleString("id-ID")}</p>
        </div>
        <div className="col-span-2">
          <p className="text-sm text-muted-foreground">Reason</p>
          <p className="text-sm">{revision.reason}</p>
        </div>
      </div>
    </div>
  )
}

function renderCommitmentDetails(commitment: Commitment) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">SPK Number</p>
          <p className="font-semibold">{commitment.spkNumber}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Amount</p>
          <p className="font-semibold">Rp {commitment.amount.toLocaleString("id-ID")}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Vendor</p>
          <p className="font-semibold">{commitment.vendorName}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Contact</p>
          <p className="font-semibold">{commitment.vendorContact}</p>
        </div>
        <div className="col-span-2">
          <p className="text-sm text-muted-foreground">Description</p>
          <p className="text-sm">{commitment.description}</p>
        </div>
      </div>
    </div>
  )
}

function renderActualDetails(actual: ActualPayment) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Invoice Number</p>
          <p className="font-semibold">{actual.invoiceNumber}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Amount</p>
          <p className="font-semibold">Rp {actual.amount.toLocaleString("id-ID")}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Vendor</p>
          <p className="font-semibold">{actual.vendorName}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Payment Method</p>
          <p className="font-semibold">{actual.paymentMethod}</p>
        </div>
        <div className="col-span-2">
          <p className="text-sm text-muted-foreground">Description</p>
          <p className="text-sm">{actual.description}</p>
        </div>
      </div>
    </div>
  )
}
