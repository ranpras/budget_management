"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMasterDataStore } from "@/lib/master-data-store"
import { useAuthStore } from "@/lib/auth-store"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function MasterData() {
  const currentUser = useAuthStore((state) => state.getCurrentUser())
  const {
    coas,
    units,
    rccs,
    fiscalYears,
    budgetCategories,
    addCOA,
    addUnit,
    addRCC,
    addFiscalYear,
    addBudgetCategory,
  } = useMasterDataStore()

  // Access control: Only ADMIN_BUDGET can access Master Data
  if (currentUser?.role !== "admin_budget") {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You do not have permission to access Master Data. Only Admin Budget role can manage master data.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const [activeTab, setActiveTab] = useState("coa")

  // COA Form
  const [coaForm, setCoaForm] = useState({ code: "", name: "", category: "", active: true })
  const handleAddCOA = () => {
    if (coaForm.code && coaForm.name && coaForm.category) {
      addCOA(coaForm)
      setCoaForm({ code: "", name: "", category: "", active: true })
    }
  }

  // Unit Form
  const [unitForm, setUnitForm] = useState({ code: "", name: "", description: "", active: true })
  const handleAddUnit = () => {
    if (unitForm.code && unitForm.name) {
      addUnit(unitForm)
      setUnitForm({ code: "", name: "", description: "", active: true })
    }
  }

  // RCC Form
  const [rccForm, setRccForm] = useState({ code: "", name: "", unitId: "", manager: "", active: true })
  const [selectedRCCUnit, setSelectedRCCUnit] = useState("")
  const handleAddRCC = () => {
    if (rccForm.code && rccForm.name && selectedRCCUnit) {
      addRCC({ ...rccForm, unitId: selectedRCCUnit })
      setRccForm({ code: "", name: "", unitId: "", manager: "", active: true })
      setSelectedRCCUnit("")
    }
  }

  // Fiscal Year Form
  const [fyForm, setFyForm] = useState({ year: "", startDate: "", endDate: "", status: "planning" as const })
  const handleAddFY = () => {
    if (fyForm.year && fyForm.startDate && fyForm.endDate) {
      addFiscalYear({
        year: Number(fyForm.year),
        name: `Fiscal Year ${fyForm.year}`,
        startDate: new Date(fyForm.startDate),
        endDate: new Date(fyForm.endDate),
        status: fyForm.status,
      })
      setFyForm({ year: "", startDate: "", endDate: "", status: "planning" })
    }
  }

  // Budget Category Form
  const [bcForm, setBcForm] = useState({ code: "", name: "", description: "", active: true })
  const handleAddBC = () => {
    if (bcForm.code && bcForm.name) {
      addBudgetCategory(bcForm)
      setBcForm({ code: "", name: "", description: "", active: true })
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Master Data Management</h1>
          <p className="text-muted-foreground mt-2">Maintain core reference data for budgeting system</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="coa">Chart of Accounts</TabsTrigger>
            <TabsTrigger value="unit">Units</TabsTrigger>
            <TabsTrigger value="rcc">RCC / Cost Center</TabsTrigger>
            <TabsTrigger value="fy">Fiscal Year</TabsTrigger>
            <TabsTrigger value="category">Budget Category</TabsTrigger>
          </TabsList>

          {/* CHART OF ACCOUNTS */}
          <TabsContent value="coa" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Chart of Accounts</CardTitle>
                <CardDescription>Create new COA entries for budget classifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      placeholder="Code (e.g., 6110)"
                      value={coaForm.code}
                      onChange={(e) => setCoaForm({ ...coaForm, code: e.target.value })}
                    />
                    <Input
                      placeholder="Name"
                      value={coaForm.name}
                      onChange={(e) => setCoaForm({ ...coaForm, name: e.target.value })}
                    />
                    <Select
                      value={coaForm.category}
                      onValueChange={(value) => setCoaForm({ ...coaForm, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEX">OPEX</SelectItem>
                        <SelectItem value="CAPEX">CAPEX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddCOA} className="w-full">
                    Add COA
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Chart of Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {coas.map((coa) => (
                    <div key={coa.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-semibold">
                          {coa.code} - {coa.name}
                        </p>
                        <p className="text-sm text-muted-foreground">{coa.category}</p>
                      </div>
                      <Badge variant={coa.active ? "default" : "secondary"}>{coa.active ? "Active" : "Inactive"}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* UNITS */}
          <TabsContent value="unit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Unit / Department</CardTitle>
                <CardDescription>Create new organizational units</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      placeholder="Code"
                      value={unitForm.code}
                      onChange={(e) => setUnitForm({ ...unitForm, code: e.target.value })}
                    />
                    <Input
                      placeholder="Name"
                      value={unitForm.name}
                      onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                    />
                    <Input
                      placeholder="Description"
                      value={unitForm.description}
                      onChange={(e) => setUnitForm({ ...unitForm, description: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddUnit} className="w-full">
                    Add Unit
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Units</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {units.map((unit) => (
                    <div key={unit.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-semibold">
                          {unit.code} - {unit.name}
                        </p>
                        <p className="text-sm text-muted-foreground">{unit.description}</p>
                      </div>
                      <Badge variant={unit.active ? "default" : "secondary"}>
                        {unit.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* RCC / COST CENTER */}
          <TabsContent value="rcc" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add RCC / Cost Center</CardTitle>
                <CardDescription>Create cost centers within units</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <Input
                      placeholder="Code"
                      value={rccForm.code}
                      onChange={(e) => setRccForm({ ...rccForm, code: e.target.value })}
                    />
                    <Input
                      placeholder="Name"
                      value={rccForm.name}
                      onChange={(e) => setRccForm({ ...rccForm, name: e.target.value })}
                    />
                    <Select value={selectedRCCUnit} onValueChange={setSelectedRCCUnit}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Manager"
                      value={rccForm.manager}
                      onChange={(e) => setRccForm({ ...rccForm, manager: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddRCC} className="w-full">
                    Add RCC
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing RCC / Cost Centers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rccs.map((rcc) => {
                    const unit = units.find((u) => u.id === rcc.unitId)
                    return (
                      <div key={rcc.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-semibold">
                            {rcc.code} - {rcc.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Unit: {unit?.name} | Manager: {rcc.manager}
                          </p>
                        </div>
                        <Badge variant={rcc.active ? "default" : "secondary"}>
                          {rcc.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FISCAL YEAR */}
          <TabsContent value="fy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Fiscal Year</CardTitle>
                <CardDescription>Define fiscal year periods</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <Input
                      placeholder="Year (e.g., 2025)"
                      type="number"
                      value={fyForm.year}
                      onChange={(e) => setFyForm({ ...fyForm, year: e.target.value })}
                    />
                    <Input
                      placeholder="Start Date"
                      type="date"
                      value={fyForm.startDate}
                      onChange={(e) => setFyForm({ ...fyForm, startDate: e.target.value })}
                    />
                    <Input
                      placeholder="End Date"
                      type="date"
                      value={fyForm.endDate}
                      onChange={(e) => setFyForm({ ...fyForm, endDate: e.target.value })}
                    />
                    <Select
                      value={fyForm.status}
                      onValueChange={(value) => setFyForm({ ...fyForm, status: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddFY} className="w-full">
                    Add Fiscal Year
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Fiscal Years</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {fiscalYears.map((fy) => (
                    <div key={fy.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-semibold">{fy.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(fy.startDate).toLocaleDateString()} - {new Date(fy.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={fy.status === "active" ? "default" : "secondary"}>{fy.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BUDGET CATEGORY */}
          <TabsContent value="category" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Budget Category</CardTitle>
                <CardDescription>Define budget classifications (OPEX, CAPEX, etc.)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      placeholder="Code"
                      value={bcForm.code}
                      onChange={(e) => setBcForm({ ...bcForm, code: e.target.value })}
                    />
                    <Input
                      placeholder="Name"
                      value={bcForm.name}
                      onChange={(e) => setBcForm({ ...bcForm, name: e.target.value })}
                    />
                    <Input
                      placeholder="Description"
                      value={bcForm.description}
                      onChange={(e) => setBcForm({ ...bcForm, description: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddBC} className="w-full">
                    Add Category
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {budgetCategories.map((bc) => (
                    <div key={bc.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-semibold">
                          {bc.code} - {bc.name}
                        </p>
                        <p className="text-sm text-muted-foreground">{bc.description}</p>
                      </div>
                      <Badge variant={bc.active ? "default" : "secondary"}>{bc.active ? "Active" : "Inactive"}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
