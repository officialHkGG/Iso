"use client"

import { useState, useEffect } from "react"
import { changeLogStorage } from "@/lib/local-storage"
import type { ChangeLog } from "@/lib/local-storage"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, FileText, CheckCircle2, XCircle, Edit } from "lucide-react"

interface AuditTrailProps {
  entityType?: string
  entityId?: string
  limit?: number
}

export function AuditTrail({ entityType, entityId, limit = 50 }: AuditTrailProps) {
  const [logs, setLogs] = useState<ChangeLog[]>([])

  useEffect(() => {
    const loadLogs = async () => {
      if (entityType && entityId) {
        const entityLogs = await changeLogStorage.getByEntity(entityType, entityId)
        setLogs(entityLogs.slice(0, limit))
      } else {
        const allLogs = await changeLogStorage.getAll()
        setLogs(allLogs.slice(0, limit))
      }
    }

    void loadLogs()
  }, [entityType, entityId, limit])

  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "updated":
        return <Edit className="h-4 w-4 text-blue-600" />
      case "deleted":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "approved":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "created":
        return "bg-green-100 text-green-800"
      case "updated":
        return "bg-blue-100 text-blue-800"
      case "deleted":
        return "bg-red-100 text-red-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Audit Trail
        </CardTitle>
        <CardDescription>Comprehensive log of all changes and activities</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No audit logs found</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="mt-0.5">{getActionIcon(log.action)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                      <Badge variant="secondary">{log.entity_type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{new Date(log.performed_at).toLocaleString()}</p>
                    {Object.keys(log.changes).length > 0 && (
                      <div className="mt-2 text-xs">
                        <details className="cursor-pointer">
                          <summary className="text-muted-foreground hover:text-foreground">
                            View changes ({Object.keys(log.changes).length} fields)
                          </summary>
                          <div className="mt-2 space-y-1 pl-4 border-l-2 border-muted">
                            {Object.entries(log.changes).map(([key, value]) => (
                              <div key={key} className="text-muted-foreground">
                                <span className="font-medium">{key}:</span>{" "}
                                {typeof value === "object" && value !== null && "from" in value && "to" in value
                                  ? `${JSON.stringify(value.from)} → ${JSON.stringify(value.to)}`
                                  : JSON.stringify(value)}
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
