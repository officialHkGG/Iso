"use client"

import { useState, useEffect } from "react"
import { complianceStorage, getISOSystem } from "@/lib/local-storage"
import type { ComplianceItem } from "@/lib/local-storage"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, Circle, Clock } from "lucide-react"

export function ComplianceDashboard() {
  const [items, setItems] = useState<ComplianceItem[]>([])
  const [isoSystem, setISOSystem] = useState(getISOSystem())

  useEffect(() => {
    void loadItems()
  }, [isoSystem])

  const loadItems = async () => {
    await complianceStorage.initializeForISO(isoSystem.value)
    const loadedItems = await complianceStorage.getByISO(isoSystem.value)
    setItems(loadedItems)
  }

  const updateStatus = async (id: string, status: ComplianceItem["status"]) => {
    await complianceStorage.update(id, { status })
    await loadItems()
  }

  const completedCount = items.filter((item) => item.status === "completed").length
  const inProgressCount = items.filter((item) => item.status === "in_progress").length
  const notStartedCount = items.filter((item) => item.status === "not_started").length
  const completionRate = items.length > 0 ? (completedCount / items.length) * 100 : 0

  const categories = [...new Set(items.map((item) => item.category))]

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{Math.round(completionRate)}%</div>
              <Progress value={completionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold">{completedCount}</span>
              <span className="text-sm text-muted-foreground">/ {items.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-2xl font-bold">{inProgressCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Not Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-gray-400" />
              <span className="text-2xl font-bold">{notStartedCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requirements by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Requirements</CardTitle>
          <CardDescription>Track {isoSystem.label} compliance requirements by category</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={categories[0] || "all"}>
            <TabsList
              className="grid w-full"
              style={{ gridTemplateColumns: `repeat(${Math.min(categories.length, 6)}, 1fr)` }}
            >
              {categories.slice(0, 6).map((category) => (
                <TabsTrigger key={category} value={category} className="text-xs">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
            {categories.map((category) => (
              <TabsContent key={category} value={category} className="space-y-4">
                {items
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="mt-1">
                        {item.status === "completed" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                        {item.status === "in_progress" && <Clock className="h-5 w-5 text-blue-600" />}
                        {item.status === "not_started" && <Circle className="h-5 w-5 text-gray-400" />}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-semibold">{item.requirement}</h4>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                          <Badge
                            variant={
                              item.status === "completed"
                                ? "default"
                                : item.status === "in_progress"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {item.status.replace("_", " ")}
                          </Badge>
                        </div>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground">
                            <strong>Notes:</strong> {item.notes}
                          </p>
                        )}
                        <div className="flex gap-2">
                          {item.status !== "not_started" && (
                            <Button size="sm" variant="outline" onClick={() => updateStatus(item.id, "not_started")}>
                              Reset
                            </Button>
                          )}
                          {item.status !== "in_progress" && (
                            <Button size="sm" variant="outline" onClick={() => updateStatus(item.id, "in_progress")}>
                              Start
                            </Button>
                          )}
                          {item.status !== "completed" && (
                            <Button size="sm" onClick={() => updateStatus(item.id, "completed")}>
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
