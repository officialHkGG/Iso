"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Shield, AlertTriangle, TrendingDown } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { profileStorage, riskStorage } from "@/lib/local-storage"
import { RiskDialog } from "@/components/risk-dialog"
import { RiskActions } from "@/components/risk-actions"
import { useState, useEffect } from "react"

const getRiskLevel = (rpn: number) => {
  if (rpn >= 100) return { level: "Critical", color: "destructive" as const }
  if (rpn >= 50) return { level: "High", color: "destructive" as const }
  if (rpn >= 20) return { level: "Medium", color: "default" as const }
  return { level: "Low", color: "secondary" as const }
}

export default function RiskPage() {
  const [risks, setRisks] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [loadedRisks, loadedUsers] = await Promise.all([riskStorage.getAll(), profileStorage.getAll()])
    setRisks(loadedRisks)
    setUsers(loadedUsers)
  }

  const totalRisks = risks?.length || 0
  const highRisks = risks?.filter((r) => r.risk_level === "high" || r.risk_level === "critical") || []
  const mediumRisks = risks?.filter((r) => r.risk_level === "medium") || []
  const mitigatedRisks = risks?.filter((r) => r.status === "mitigated" || r.status === "closed") || []

  const filteredRisks = risks.filter(
    (risk) =>
      !searchTerm ||
      risk.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      risk.risk_number?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Risk Management</h1>
          <p className="text-muted-foreground mt-1">ISO 14971 compliant risk analysis and control</p>
        </div>
        <RiskDialog users={users} onSuccess={loadData} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <div className="text-2xl font-bold">{totalRisks}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div className="text-2xl font-bold text-destructive">{highRisks.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Medium Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div className="text-2xl font-bold text-warning">{mediumRisks.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mitigated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-success" />
              <div className="text-2xl font-bold text-success">{mitigatedRisks.length}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Risks</TabsTrigger>
          <TabsTrigger value="high">High Priority</TabsTrigger>
          <TabsTrigger value="matrix">Risk Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Register</CardTitle>
              <CardDescription>Complete list of identified hazards and risks</CardDescription>
              <div className="flex items-center gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search risks..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredRisks && filteredRisks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Risk Number</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>S</TableHead>
                      <TableHead>O</TableHead>
                      <TableHead>D</TableHead>
                      <TableHead>RPN</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRisks.map((risk) => {
                      const riskLevel = getRiskLevel(risk.rpn)
                      return (
                        <TableRow key={risk.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-mono text-sm">{risk.risk_number}</TableCell>
                          <TableCell className="font-medium max-w-xs">{risk.title}</TableCell>
                          <TableCell className="text-center">{risk.severity}</TableCell>
                          <TableCell className="text-center">{risk.occurrence}</TableCell>
                          <TableCell className="text-center">{risk.detection}</TableCell>
                          <TableCell className="font-bold text-center">{risk.rpn}</TableCell>
                          <TableCell>
                            <Badge variant={riskLevel.color} className="capitalize">
                              {risk.risk_level}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                risk.status === "identified"
                                  ? "outline"
                                  : risk.status === "mitigated"
                                    ? "default"
                                    : "secondary"
                              }
                              className="capitalize"
                            >
                              {risk.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {risk.owner?.full_name || "Unassigned"}
                          </TableCell>
                          <TableCell>
                            <RiskActions risk={risk} users={users} onUpdate={loadData} />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {searchTerm
                      ? "No risks match your search."
                      : "No risks found. Create your first risk assessment to get started."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>High Priority Risks</CardTitle>
              <CardDescription>Risks with RPN ≥ 50 requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              {highRisks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Risk Number</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>RPN</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Mitigation</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {highRisks.map((risk) => (
                      <TableRow key={risk.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-mono text-sm">{risk.risk_number}</TableCell>
                        <TableCell className="font-medium">{risk.title}</TableCell>
                        <TableCell className="font-bold text-destructive">{risk.rpn}</TableCell>
                        <TableCell>
                          <Badge
                            variant={risk.status === "identified" ? "destructive" : "default"}
                            className="capitalize"
                          >
                            {risk.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">{risk.mitigation_plan || "N/A"}</TableCell>
                        <TableCell className="text-muted-foreground">{risk.owner?.full_name || "Unassigned"}</TableCell>
                        <TableCell>
                          <RiskActions risk={risk} users={users} onUpdate={loadData} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No high priority risks found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Matrix</CardTitle>
              <CardDescription>Visual representation of risk severity and occurrence</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-6 gap-2">
                  <div className="col-span-1"></div>
                  <div className="text-center text-sm font-medium">1</div>
                  <div className="text-center text-sm font-medium">2</div>
                  <div className="text-center text-sm font-medium">3</div>
                  <div className="text-center text-sm font-medium">4</div>
                  <div className="text-center text-sm font-medium">5</div>

                  {[5, 4, 3, 2, 1].map((severity) => (
                    <>
                      <div key={`label-${severity}`} className="flex items-center justify-center text-sm font-medium">
                        {severity}
                      </div>
                      {[1, 2, 3, 4, 5].map((occurrence) => {
                        const rpn = severity * occurrence * 3
                        const riskLevel = getRiskLevel(rpn)
                        return (
                          <div
                            key={`${severity}-${occurrence}`}
                            className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${
                              riskLevel.level === "Critical" || riskLevel.level === "High"
                                ? "bg-destructive/20 text-destructive"
                                : riskLevel.level === "Medium"
                                  ? "bg-warning/20 text-warning"
                                  : "bg-success/20 text-success"
                            }`}
                          >
                            {rpn}
                          </div>
                        )
                      })}
                    </>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-success/20" />
                    <span>Low (RPN &lt; 20)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-warning/20" />
                    <span>Medium (RPN 20-49)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-destructive/20" />
                    <span>High/Critical (RPN ≥ 50)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
