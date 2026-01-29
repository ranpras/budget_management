"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useBudgetStore } from "@/lib/store"
import { useMasterDataStore } from "@/lib/master-data-store"
import { useCurrentUser } from "@/lib/user-context"

export function MySubmissions() {
  const budgetStore = useBudgetStore()
  const masterDataStore = useMasterDataStore()
  const currentUser = useCurrentUser()

  const myBudgets = budgetStore.getBudgetsByUnit(currentUser?.unitId || "")
  const myCommitments = budgetStore.getCommitmentsByUnit(currentUser?.unitId || "")
  const myActuals = budgetStore.getActualsByUnit(currentUser?.unitId || "")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "submitted":
        return "bg-yellow-100 text-yellow-800"
      case "approved_unit":
        return "bg-blue-100 text-blue-800"
      case "approved_finance":
        return "bg-green-100 text-green-800"
      case "active":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Submissions</h1>
          <p className="text-muted-foreground mt-2">Track status of your budget submissions</p>
        </div>

        <Tabs defaultValue="budgets" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="budgets">Budgets ({myBudgets.length})</TabsTrigger>
            <TabsTrigger value="commitments">Commitments ({myCommitments.length})</TabsTrigger>
            <TabsTrigger value="actuals">Actuals ({myActuals.length})</TabsTrigger>
          </TabsList>

          {/* BUDGETS */}
          <TabsContent value="budgets" className="space-y-4">
            {myBudgets.length === 0 ? (
              <Alert>
                <AlertDescription>No budget submissions yet</AlertDescription>
              </Alert>
            ) : (
              myBudgets.map((budget) => (
                <Card key={budget.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold">{budget.id}</p>
                          <Badge className={getStatusColor(budget.status)}>
                            {budget.status.replace(/_/g, " ").toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Rp {budget.initialAmount.toLocaleString("id-ID")} | FY {budget.fiscalYear} | {budget.coa}
                        </p>
                        <p className="text-sm text-muted-foreground">{budget.justification}</p>
                        {budget.rejectionReason && (
                          <p className="text-sm text-red-600 mt-2">
                            <strong>Rejection Reason:</strong> {budget.rejectionReason}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(budget.createdAt).toLocaleDateString("id-ID")}
                        </p>
                        {budget.approvedUnitAt && (
                          <p className="text-xs text-green-600">
                            Unit Approved: {new Date(budget.approvedUnitAt).toLocaleDateString("id-ID")}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* COMMITMENTS */}
          <TabsContent value="commitments" className="space-y-4">
            {myCommitments.length === 0 ? (
              <Alert>
                <AlertDescription>No commitment submissions yet</AlertDescription>
              </Alert>
            ) : (
              myCommitments.map((commitment) => (
                <Card key={commitment.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold">{commitment.spkNumber}</p>
                          <Badge className={getStatusColor(commitment.status)}>
                            {commitment.status.replace(/_/g, " ").toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {commitment.vendorName} | Rp {commitment.amount.toLocaleString("id-ID")}
                        </p>
                        <p className="text-sm text-muted-foreground">{commitment.description}</p>
                        {commitment.rejectionReason && (
                          <p className="text-sm text-red-600 mt-2">
                            <strong>Rejection Reason:</strong> {commitment.rejectionReason}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(commitment.createdAt).toLocaleDateString("id-ID")}
                        </p>
                        {commitment.approvedUnitAt && (
                          <p className="text-xs text-green-600">
                            Unit Approved: {new Date(commitment.approvedUnitAt).toLocaleDateString("id-ID")}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* ACTUALS */}
          <TabsContent value="actuals" className="space-y-4">
            {myActuals.length === 0 ? (
              <Alert>
                <AlertDescription>No actual payment submissions yet</AlertDescription>
              </Alert>
            ) : (
              myActuals.map((actual) => (
                <Card key={actual.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold">{actual.invoiceNumber}</p>
                          <Badge className={getStatusColor(actual.status)}>
                            {actual.status.replace(/_/g, " ").toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {actual.vendorName} | Rp {actual.amount.toLocaleString("id-ID")} | {actual.paymentMethod}
                        </p>
                        <p className="text-sm text-muted-foreground">{actual.description}</p>
                        {actual.rejectionReason && (
                          <p className="text-sm text-red-600 mt-2">
                            <strong>Rejection Reason:</strong> {actual.rejectionReason}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(actual.createdAt).toLocaleDateString("id-ID")}
                        </p>
                        {actual.approvedUnitAt && (
                          <p className="text-xs text-green-600">
                            Unit Approved: {new Date(actual.approvedUnitAt).toLocaleDateString("id-ID")}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
