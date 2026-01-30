"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, XCircle, Clock, Eye, AlertCircle } from "lucide-react"
import { useBudgetStore } from "@/lib/store"
import { useToast } from "@/lib/hooks/use-toast"
import { useCurrentUser } from "@/lib/user-context"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function FinanceApproval() {
  const store = useBudgetStore()
  const currentUser = useCurrentUser()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("budgets")
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedDetail, setSelectedDetail] = useState<{ type: string; data: any } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [revisionNotes, setRevisionNotes] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)

  // Role-based access control: Only ADMIN_BUDGET can access Finance Approval
  const hasPermission = currentUser?.role === "admin_budget"

  const pendingApprovals = useMemo(() => {
    return store.getPendingAdminApprovals()
  }, [store, refreshKey])

  const handleApprove = useCallback(async () => {
    if (!selectedDetail || !currentUser) return

    const { type, data } = selectedDetail
    setIsProcessing(true)

    try {
      if (type === "Budget") {
        store.approveBudgetByAdmin(data.id, currentUser.id)
        toast({
          title: "Budget Approved",
          description: `${data.projectName || "Routine"} has been finally approved.`,
        })
      }

      setDetailOpen(false)
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }, [selectedDetail, currentUser, store, toast])

  const handleReject = useCallback(async () => {
    if (!selectedDetail || !currentUser || !rejectionReason.trim()) return

    const { type, data } = selectedDetail
    setIsProcessing(true)

    try {
      if (type === "Budget") {
        store.rejectBudgetByAdmin(data.id, currentUser.id, rejectionReason)
        toast({
          title: "Budget Rejected",
          description: "The budget has been rejected and returned to the operator.",
        })
      }

      setDetailOpen(false)
      setRejectionReason("")
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }, [selectedDetail, currentUser, store, toast, rejectionReason])

  const handleRevise = useCallback(async () => {
    if (!selectedDetail || !currentUser || !revisionNotes.trim()) return

    const { type, data } = selectedDetail
    setIsProcessing(true)

    try {
      if (type === "Budget") {
        store.requestBudgetRevision(data.id, currentUser.id, revisionNotes)
        toast({
          title: "Revision Requested",
          description: "The operator has been notified to revise this budget.",
        })
      }

      setDetailOpen(false)
      setRevisionNotes("")
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to request revision",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }, [selectedDetail, currentUser, store, toast, revisionNotes])

  const openDetail = (type: string, data: any) => {
    setSelectedDetail({ type, data })
    setDetailOpen(true)
  }

  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You do not have permission to access Finance Approval. Only Admin Budget role can provide final approval for all budgets across units.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Admin Approval Center</h2>
        <p className="text-muted-foreground mt-1">Final approval of supervisor-approved requests</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Budgets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{pendingApprovals.budgets.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Awaiting final approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Revisions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{pendingApprovals.revisions.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Budget adjustments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Commitments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{pendingApprovals.commitments.length}</p>
            <p className="text-xs text-muted-foreground mt-1">SPK requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Actuals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{pendingApprovals.actuals.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Payments to post</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="budgets" className="flex gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Budgets</span>
            {pendingApprovals.budgets.length > 0 && (
              <Badge variant="destructive" className="ml-1 px-2">
                {pendingApprovals.budgets.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="revisions" className="flex gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Revisions</span>
            {pendingApprovals.revisions.length > 0 && (
              <Badge variant="destructive" className="ml-1 px-2">
                {pendingApprovals.revisions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="commitments" className="flex gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Commitments</span>
            {pendingApprovals.commitments.length > 0 && (
              <Badge variant="destructive" className="ml-1 px-2">
                {pendingApprovals.commitments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="actuals" className="flex gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Actuals</span>
            {pendingApprovals.actuals.length > 0 && (
              <Badge variant="destructive" className="ml-1 px-2">
                {pendingApprovals.actuals.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="budgets">
          <Card>
            <CardHeader>
              <CardTitle>Budget Approval Requests</CardTitle>
              <CardDescription>Final approval of supervisor-approved budgets</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingApprovals.budgets.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No pending budget approvals</p>
              ) : (
                <div className="space-y-3">
                  {pendingApprovals.budgets.map((budget) => (
                    <div key={budget.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{budget.projectName || "Routine OPEX"}</h4>
                            <Badge variant="outline">{budget.budgetType}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">Unit: {budget.unit}</p>
                          <p className="text-sm text-muted-foreground">Submitted by: {budget.createdBy}</p>
                          <p className="text-sm text-muted-foreground">Supervisor: {budget.approvedSupervisorBy}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-lg font-bold font-mono">
                            Rp {budget.initialAmount.toLocaleString("id-ID")}
                          </p>
                          <p className="text-xs text-muted-foreground">FY {budget.fiscalYear}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetail("Budget", budget)}
                          className="ml-auto"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revisions">
          <Card>
            <CardHeader>
              <CardTitle>Budget Revision Requests</CardTitle>
              <CardDescription>Requested adjustments to approved budgets</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">No pending revision approvals</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commitments">
          <Card>
            <CardHeader>
              <CardTitle>Commitment (SPK) Approval Requests</CardTitle>
              <CardDescription>Purchase orders and spending commitments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">No pending commitment approvals</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actuals">
          <Card>
            <CardHeader>
              <CardTitle>Actual Payment Requests</CardTitle>
              <CardDescription>Payment postings for approval</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">No pending actual approvals</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ApprovalDetailModal
        isOpen={detailOpen}
        type={selectedDetail?.type || ""}
        data={selectedDetail?.data}
        onClose={() => {
          setDetailOpen(false)
          setRejectionReason("")
          setRevisionNotes("")
        }}
        onApprove={handleApprove}
        onReject={handleReject}
        onRevise={handleRevise}
        isProcessing={isProcessing}
        rejectionReason={rejectionReason}
        onRejectReasonChange={setRejectionReason}
        revisionNotes={revisionNotes}
        onRevisionNotesChange={setRevisionNotes}
      />
    </div>
  )
}

function ApprovalDetailModal({
  isOpen,
  type,
  data,
  onClose,
  onApprove,
  onReject,
  onRevise,
  isProcessing,
  rejectionReason,
  onRejectReasonChange,
  revisionNotes,
  onRevisionNotesChange,
}: {
  isOpen: boolean
  type: string
  data: any
  onClose: () => void
  onApprove: () => void
  onReject: () => void
  onRevise: () => void
  isProcessing: boolean
  rejectionReason: string
  onRejectReasonChange: (reason: string) => void
  revisionNotes: string
  onRevisionNotesChange: (notes: string) => void
}) {
  const [actionMode, setActionMode] = useState<"view" | "reject" | "revise">("view")

  if (!isOpen || !data) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-3 sticky top-0 bg-background">
          <div>
            <CardTitle className="text-lg">{type} Details</CardTitle>
            <CardDescription className="text-xs mt-1">Admin final approval</CardDescription>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-muted-foreground hover:text-foreground text-xl disabled:opacity-50"
          >
            ✕
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          {actionMode === "view" && (
            <>
              {type === "Budget" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Project/Type</p>
                      <p className="font-medium">{data.projectName || "Routine"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Unit</p>
                      <p className="font-medium">{data.unit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">COA</p>
                      <p className="font-mono font-medium">{data.coa}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="font-mono font-bold">Rp {data.initialAmount.toLocaleString("id-ID")}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Submitted By</p>
                      <p className="text-sm font-medium">{data.createdBy}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Supervisor Approved By</p>
                      <p className="text-sm font-medium">{data.approvedSupervisorBy || "N/A"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Justification</p>
                    <p className="text-sm mt-1 p-2 bg-muted rounded">{data.justification}</p>
                  </div>
                </>
              )}
            </>
          )}

          {actionMode === "reject" && (
            <div className="space-y-3 border-t pt-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Rejection Reason</label>
                <Textarea
                  placeholder="Explain why this is rejected..."
                  value={rejectionReason}
                  onChange={(e) => onRejectReasonChange(e.target.value)}
                  className="mt-1 min-h-20"
                  disabled={isProcessing}
                />
              </div>
            </div>
          )}

          {actionMode === "revise" && (
            <div className="space-y-3 border-t pt-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Revision Notes</label>
                <Textarea
                  placeholder="Provide specific revision requests..."
                  value={revisionNotes}
                  onChange={(e) => onRevisionNotesChange(e.target.value)}
                  className="mt-1 min-h-20"
                  disabled={isProcessing}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t flex-wrap">
            {actionMode === "view" ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setActionMode("reject")}
                  disabled={isProcessing}
                  className="text-destructive"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button variant="outline" onClick={() => setActionMode("revise")} disabled={isProcessing}>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Request Revision
                </Button>
                <Button onClick={onApprove} disabled={isProcessing} className="ml-auto">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {isProcessing ? "Processing..." : "Approve (Final)"}
                </Button>
              </>
            ) : actionMode === "reject" ? (
              <>
                <Button variant="outline" onClick={() => setActionMode("view")} disabled={isProcessing}>
                  Back
                </Button>
                <Button
                  onClick={onReject}
                  disabled={isProcessing || !rejectionReason.trim()}
                  className="ml-auto text-destructive"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {isProcessing ? "Processing..." : "Confirm Rejection"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setActionMode("view")} disabled={isProcessing}>
                  Back
                </Button>
                <Button onClick={onRevise} disabled={isProcessing || !revisionNotes.trim()} className="ml-auto">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {isProcessing ? "Processing..." : "Send for Revision"}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
