"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Eye } from "lucide-react"

const reportsData = [
  {
    id: 1,
    name: "Budget Summary Report",
    description: "Overview of total budget, commitment, and actual spending",
    generatedDate: "2024-01-15",
    type: "Summary",
  },
  {
    id: 2,
    name: "Monthly Spending Report",
    description: "Detailed breakdown of spending by month and COA",
    generatedDate: "2024-01-15",
    type: "Detailed",
  },
  {
    id: 3,
    name: "Variance Analysis",
    description: "Comparison between budgeted and actual spending",
    generatedDate: "2024-01-14",
    type: "Analysis",
  },
  {
    id: 4,
    name: "COA Breakdown",
    description: "Spending distribution across Chart of Accounts",
    generatedDate: "2024-01-14",
    type: "Summary",
  },
]

export function Reports() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Reports</h2>
          <p className="text-muted-foreground mt-1">View and download financial reports (Read-only)</p>
        </div>
        <div className="w-48">
          <Select defaultValue="2024">
            <SelectTrigger>
              <SelectValue placeholder="Select Fiscal Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">Fiscal Year 2024</SelectItem>
              <SelectItem value="2023">Fiscal Year 2023</SelectItem>
              <SelectItem value="2022">Fiscal Year 2022</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reportsData.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">{report.name}</h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {report.type}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{report.description}</p>
                  <p className="text-xs text-muted-foreground">Generated: {report.generatedDate}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                  <Button size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Documentation</CardTitle>
          <CardDescription>Information about available reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-foreground mb-2">Budget Summary Report</h4>
            <p className="text-sm text-muted-foreground">
              Shows total allocations, commitments, and actual spending across all budget codes for your unit.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">Monthly Spending Report</h4>
            <p className="text-sm text-muted-foreground">
              Provides month-by-month breakdown of spending activities and trends throughout the fiscal year.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">Variance Analysis</h4>
            <p className="text-sm text-muted-foreground">
              Identifies differences between planned budgets and actual spending for performance analysis.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
