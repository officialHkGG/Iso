"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  FileText,
  AlertTriangle,
  ClipboardCheck,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { documentStorage, capaStorage, auditStorage, findingStorage, getISOSystem } from "@/lib/local-storage"
import { useState, useEffect } from "react"

export default function DashboardPage() {
  const [documents, setDocuments] = useState<any[]>([])
  const [capas, setCapas] = useState<any[]>([])
  const [audits, setAudits] = useState<any[]>([])
  const [findings, setFindings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isoSystem, setIsoSystem] = useState<any>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [docsData, capasData, auditsData, findingsData] = await Promise.all([
          documentStorage.getAll(),
          capaStorage.getAll(),
          auditStorage.getAll(),
          findingStorage.getAll(),
        ])
        setDocuments(docsData)
        setCapas(capasData)
        setAudits(auditsData)
        setFindings(findingsData)
        setIsoSystem(getISOSystem())
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    )
  }

  const activeDocuments = documents?.filter((d) => d.status === "approved" || d.status === "in_review").length || 0
  const openCapas = capas?.filter((c) => c.status === "open" || c.status === "in_progress").length || 0
  const pendingAudits = audits?.filter((a) => a.status === "planned").length || 0
  const totalDocs = documents?.length || 0
  const approvedDocs = documents?.filter((d) => d.status === "approved").length || 0
  const complianceRate = totalDocs > 0 ? Math.round((approvedDocs / totalDocs) * 100) : 0

  const stats = [
    {
      title: "Active Documents",
      value: activeDocuments.toString(),
      change: "+12%",
      icon: FileText,
      trend: "up",
    },
    {
      title: "Open CAPAs",
      value: openCapas.toString(),
      change: openCapas > 0 ? `${openCapas} active` : "None",
      icon: AlertTriangle,
      trend: openCapas > 5 ? "up" : "down",
    },
    {
      title: "Pending Audits",
      value: pendingAudits.toString(),
      change: pendingAudits > 0 ? `${pendingAudits} scheduled` : "None scheduled",
      icon: ClipboardCheck,
      trend: "neutral",
    },
    {
      title: "Compliance Rate",
      value: `${complianceRate}%`,
      change: complianceRate >= 95 ? "Excellent" : complianceRate >= 80 ? "Good" : "Needs improvement",
      icon: TrendingUp,
      trend: complianceRate >= 95 ? "up" : "neutral",
    },
  ]

  const recentActivity = [
    {
      id: 1,
      type: "document",
      title: documents && documents.length > 0 ? `${documents[0].document_number} Created` : "No documents yet",
      time: "Recently",
      status: "completed",
    },
    {
      id: 2,
      type: "capa",
      title: capas && capas.length > 0 ? `${capas[0].capa_number} Opened` : "No CAPAs yet",
      time: "Recently",
      status: capas && capas.length > 0 ? capas[0].status : "pending",
    },
    {
      id: 3,
      type: "audit",
      title: audits && audits.length > 0 ? `${audits[0].audit_number} Scheduled` : "No audits yet",
      time: "Recently",
      status: "scheduled",
    },
    {
      id: 4,
      type: "training",
      title: "Training records available",
      time: "Check training module",
      status: "completed",
    },
  ]

  const reports = [
    {
      id: 1,
      name: "Monthly QMS Report",
      description: "Comprehensive quality metrics and KPIs",
      lastGenerated: new Date().toISOString().split("T")[0],
    },
    {
      id: 2,
      name: "CAPA Effectiveness Report",
      description: "Analysis of corrective action effectiveness",
      lastGenerated: new Date().toISOString().split("T")[0],
    },
    {
      id: 3,
      name: "Training Compliance Report",
      description: "Employee training status and compliance",
      lastGenerated: new Date().toISOString().split("T")[0],
    },
    {
      id: 4,
      name: "Audit Summary Report",
      description: "Audit findings and closure status",
      lastGenerated: new Date().toISOString().split("T")[0],
    },
  ]

  const downloadReport = (reportName = "QMS Dashboard Report") => {
    const payload = {
      report: reportName,
      generated_at: new Date().toISOString(),
      iso_system: isoSystem,
      summary: {
        active_documents: activeDocuments,
        open_capas: openCapas,
        pending_audits: pendingAudits,
        compliance_rate: complianceRate,
      },
      documents,
      capas,
      audits,
      findings,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${reportName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Quality Management System Overview</p>
        </div>
        <Button
          variant="outline"
          className="transition-smooth hover:shadow-sm bg-transparent"
          onClick={() => downloadReport()}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="transition-smooth hover:shadow-md hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p
                className={`text-xs mt-1 ${
                  stat.trend === "up"
                    ? "text-success"
                    : stat.trend === "down"
                      ? "text-destructive"
                      : "text-muted-foreground"
                }`}
              >
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates across the QMS</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="mt-1">
                        {activity.status === "completed" && <CheckCircle2 className="h-4 w-4 text-success" />}
                        {(activity.status === "pending" ||
                          activity.status === "open" ||
                          activity.status === "in_progress") && <AlertCircle className="h-4 w-4 text-warning" />}
                        {activity.status === "scheduled" && <Clock className="h-4 w-4 text-info" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
                <CardDescription>{isoSystem?.label || "ISO Standard"} requirements tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Document Control</span>
                      <span className="font-medium">{complianceRate}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-success transition-smooth" style={{ width: `${complianceRate}%` }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Risk Management</span>
                      <span className="font-medium">95%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-success transition-smooth" style={{ width: "95%" }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Training Records</span>
                      <span className="font-medium">98%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-success transition-smooth" style={{ width: "98%" }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>CAPA Effectiveness</span>
                      <span className="font-medium">{openCapas === 0 ? "100" : "92"}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-warning transition-smooth"
                        style={{ width: openCapas === 0 ? "100%" : "92%" }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Reports</CardTitle>
              <CardDescription>Generate and download compliance reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{report.name}</p>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                      <p className="text-xs text-muted-foreground">Last generated: {report.lastGenerated}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => downloadReport(report.name)}>
                      <Download className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
