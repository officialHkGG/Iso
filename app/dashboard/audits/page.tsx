"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Calendar, CheckCircle2, AlertCircle, Clock } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { auditStorage, findingStorage, profileStorage } from "@/lib/local-storage"
import { AuditDialog } from "@/components/audit-dialog"
import { AuditActions } from "@/components/audit-actions"
import { useState, useEffect } from "react"

export default function AuditsPage() {
  const [audits, setAudits] = useState<any[]>([])
  const [findings, setFindings] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [loadedAudits, loadedFindings, loadedUsers] = await Promise.all([
      auditStorage.getAll(),
      findingStorage.getAll(),
      profileStorage.getAll(),
    ])
    setAudits(loadedAudits)
    setFindings(loadedFindings)
    setUsers(loadedUsers)
  }

  const scheduledAudits = audits?.filter((a) => a.status === "planned") || []
  const completedAudits = audits?.filter((a) => a.status === "completed" || a.status === "closed") || []
  const inProgressAudits = audits?.filter((a) => a.status === "in_progress") || []
  const openFindings = findings?.filter((f) => f.status === "open" || f.status === "in_progress") || []

  const completedThisYear =
    audits?.filter((a) => {
      if (a.status !== "completed" && a.status !== "closed") return false
      if (!a.completion_date) return false
      const completionDate = new Date(a.completion_date)
      const now = new Date()
      return completionDate.getFullYear() === now.getFullYear()
    }) || []

  const filteredScheduled = scheduledAudits.filter(
    (audit) =>
      !searchTerm ||
      audit.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.audit_number?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Management</h1>
          <p className="text-muted-foreground mt-1">Track internal, external, and supplier audits</p>
        </div>
        <AuditDialog users={users} onSuccess={loadData} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled Audits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-info" />
              <div className="text-2xl font-bold">{scheduledAudits.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              <div className="text-2xl font-bold">{inProgressAudits.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div className="text-2xl font-bold">{openFindings.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed This Year</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div className="text-2xl font-bold">{completedThisYear.length}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Audits</TabsTrigger>
          <TabsTrigger value="completed">Completed Audits</TabsTrigger>
          <TabsTrigger value="findings">Audit Findings</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Audits</CardTitle>
              <CardDescription>Upcoming internal, external, and supplier audits</CardDescription>
              <div className="flex items-center gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search audits..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredScheduled.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Audit Number</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Auditor</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredScheduled.map((audit) => (
                      <TableRow key={audit.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-mono text-sm">{audit.audit_number}</TableCell>
                        <TableCell className="font-medium">{audit.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {audit.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{audit.scope}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {audit.auditor?.full_name || "Unassigned"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {audit.audit_date ? new Date(audit.audit_date).toLocaleDateString() : "TBD"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{audit.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <AuditActions audit={audit} users={users} onUpdate={loadData} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {searchTerm ? "No audits match your search." : "No scheduled audits found."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Audits</CardTitle>
              <CardDescription>Historical audit records and results</CardDescription>
            </CardHeader>
            <CardContent>
              {completedAudits.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Audit Number</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Auditor</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Findings</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedAudits.map((audit) => (
                      <TableRow key={audit.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-mono text-sm">{audit.audit_number}</TableCell>
                        <TableCell className="font-medium">{audit.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {audit.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{audit.scope}</TableCell>
                        <TableCell className="text-muted-foreground">{audit.auditor?.full_name || "Unknown"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {audit.completion_date ? new Date(audit.completion_date).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={audit.findings_count === 0 ? "default" : "destructive"}>
                            {audit.findings_count || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <AuditActions audit={audit} users={users} onUpdate={loadData} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No completed audits found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="findings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Findings</CardTitle>
              <CardDescription>Non-conformances and observations from audits</CardDescription>
            </CardHeader>
            <CardContent>
              {findings && findings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Finding Number</TableHead>
                      <TableHead>Audit</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Clause</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {findings.map((finding) => (
                      <TableRow key={finding.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-mono text-sm">{finding.finding_number}</TableCell>
                        <TableCell className="font-mono text-sm">{finding.audit?.audit_number || "N/A"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              finding.severity === "major"
                                ? "destructive"
                                : finding.severity === "minor"
                                  ? "default"
                                  : "secondary"
                            }
                            className="capitalize"
                          >
                            {finding.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md">{finding.description}</TableCell>
                        <TableCell>
                          <Badge variant={finding.status === "closed" ? "default" : "outline"}>{finding.status}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{finding.clause_reference || "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No audit findings found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
