"use client"

import { ComplianceDashboard } from "@/components/compliance-dashboard"

export default function CompliancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compliance Tracking</h1>
        <p className="text-muted-foreground mt-2">Monitor and manage ISO compliance requirements</p>
      </div>

      <ComplianceDashboard />
    </div>
  )
}
