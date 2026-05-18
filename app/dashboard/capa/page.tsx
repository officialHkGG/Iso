"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { capaStorage, profileStorage } from "@/lib/local-storage"
import { CAPADialog } from "@/components/capa-dialog"
import { CAPAActions } from "@/components/capa-actions"
import { useState, useEffect } from "react"

export default function CAPAPage() {
  const [users, setUsers] = useState<any[]>([])
  const [capas, setCapas] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("All Priorities")
  const [statusFilter, setStatusFilter] = useState("All Status")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [loadedUsers, loadedCapas] = await Promise.all([profileStorage.getAll(), capaStorage.getAll()])
    setUsers(loadedUsers)
    setCapas(loadedCapas)
  }

  const openCapas = capas?.filter((c) => c.status === "open" || c.status === "in_progress") || []
  const closedCapas = capas?.filter((c) => c.status === "closed") || []
  const inProgressCapas = capas?.filter((c) => c.status === "in_progress") || []
  const overdueCapas =
    capas?.filter((c) => {
      if (!c.due_date || c.status === "closed") return false
      return new Date(c.due_date) < new Date()
    }) || []

  const closedThisMonth =
    capas?.filter((c) => {
      if (c.status !== "closed" || !c.completion_date) return false
      const completionDate = new Date(c.completion_date)
      const now = new Date()
      return completionDate.getMonth() === now.getMonth() && completionDate.getFullYear() === now.getFullYear()
    }) || []

  const filteredOpenCapas = openCapas.filter((capa) => {
    const matchesSearch =
      !searchTerm ||
      capa.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      capa.capa_number?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPriority = priorityFilter === "All Priorities" || capa.priority === priorityFilter
    const matchesStatus = statusFilter === "All Status" || capa.status === statusFilter
    return matchesSearch && matchesPriority && matchesStatus
  })

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">CAPA Management</h1>
          <p className="text-muted-foreground mt-1">Corrective and Preventive Actions tracking</p>
        </div>
        <CAPADialog users={users || []} onSuccess={loadData} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="transition-smooth hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open CAPAs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div className="text-2xl font-bold">{openCapas.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-smooth hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-info" />
              </div>
              <div className="text-2xl font-bold">{inProgressCapas.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-smooth hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div className="text-2xl font-bold">{overdueCapas.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-smooth hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Closed This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div className="text-2xl font-bold">{closedThisMonth.length}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active CAPAs</TabsTrigger>
          <TabsTrigger value="closed">Closed CAPAs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active CAPAs</CardTitle>
                  <CardDescription>Open and in-progress corrective and preventive actions</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search CAPAs..."
                    className="pl-10 bg-muted/50 border-0 focus:bg-background transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Priorities">All Priorities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Status">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredOpenCapas.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>CAPA Number</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOpenCapas.map((capa) => (
                      <TableRow key={capa.id} className="cursor-pointer transition-smooth hover:bg-muted/50">
                        <TableCell className="font-mono text-sm">{capa.capa_number}</TableCell>
                        <TableCell className="font-medium">{capa.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {capa.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              capa.priority === "critical" || capa.priority === "high"
                                ? "destructive"
                                : capa.priority === "medium"
                                  ? "default"
                                  : "secondary"
                            }
                            className="capitalize"
                          >
                            {capa.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={capa.status === "open" ? "outline" : "default"}>{capa.status}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {capa.assigned?.full_name || "Unassigned"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {capa.due_date ? new Date(capa.due_date).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell>
                          <CAPAActions capa={capa} users={users || []} onUpdate={loadData} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {searchTerm || priorityFilter !== "All Priorities" || statusFilter !== "All Status"
                      ? "No CAPAs match your filters."
                      : "No active CAPAs found."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="closed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Closed CAPAs</CardTitle>
              <CardDescription>Completed corrective and preventive actions</CardDescription>
            </CardHeader>
            <CardContent>
              {closedCapas.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>CAPA Number</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Closed Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {closedCapas.map((capa) => (
                      <TableRow key={capa.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-mono text-sm">{capa.capa_number}</TableCell>
                        <TableCell className="font-medium">{capa.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {capa.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {capa.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {capa.assigned?.full_name || "Unassigned"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {capa.completion_date ? new Date(capa.completion_date).toLocaleDateString() : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No closed CAPAs found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>CAPA by Type</CardTitle>
                <CardDescription>Distribution of corrective vs preventive actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Corrective Actions</span>
                      <span className="font-medium">
                        {capas && capas.length > 0
                          ? Math.round((capas.filter((c) => c.type === "corrective").length / capas.length) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-destructive"
                        style={{
                          width: `${capas && capas.length > 0 ? (capas.filter((c) => c.type === "corrective").length / capas.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Preventive Actions</span>
                      <span className="font-medium">
                        {capas && capas.length > 0
                          ? Math.round((capas.filter((c) => c.type === "preventive").length / capas.length) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${capas && capas.length > 0 ? (capas.filter((c) => c.type === "preventive").length / capas.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Effectiveness Rate</CardTitle>
                <CardDescription>Percentage of effective CAPAs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-4xl font-bold text-success">
                    {capas && capas.length > 0
                      ? Math.round(
                          (capas.filter((c) => c.effectiveness_verified && c.status === "closed").length /
                            capas.filter((c) => c.status === "closed").length) *
                            100,
                        )
                      : 0}
                    %
                  </div>
                  <p className="text-sm text-muted-foreground">Based on follow-up verification</p>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success"
                      style={{
                        width: `${capas && capas.length > 0 ? (capas.filter((c) => c.effectiveness_verified && c.status === "closed").length / capas.filter((c) => c.status === "closed").length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
