"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, GraduationCap, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { trainingStorage, profileStorage } from "@/lib/local-storage"
import { TrainingDialog } from "@/components/training-dialog"
import { TrainingActions } from "@/components/training-actions"
import { useState, useEffect } from "react"

export default function TrainingPage() {
  const [trainingRecords, setTrainingRecords] = useState<any[]>([])
  const [allProfiles, setAllProfiles] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [loadedTraining, loadedProfiles] = await Promise.all([trainingStorage.getAll(), profileStorage.getAll()])
    setTrainingRecords(loadedTraining)
    setAllProfiles(loadedProfiles)
  }

  const completions =
    trainingRecords?.flatMap((record) =>
      (record.completions || []).map((comp: any) => ({
        ...comp,
        training_id: record.id,
        training: { title: record.title, type: record.type },
      })),
    ) || []

  const activeCourses = trainingRecords?.filter((t) => t.status === "completed") || []
  const compliantEmployees =
    allProfiles?.filter((profile) => {
      const userCompletions = completions?.filter((c) => c.user_id === profile.id && c.status === "valid") || []
      return userCompletions.length > 0
    }) || []

  const pendingTraining =
    allProfiles?.filter((profile) => {
      const userCompletions = completions?.filter((c) => c.user_id === profile.id && c.status === "pending") || []
      return userCompletions.length > 0
    }) || []

  const overdueEmployees =
    allProfiles?.filter((profile) => {
      const userCompletions = completions?.filter((c) => c.user_id === profile.id && c.status === "expired") || []
      return userCompletions.length > 0
    }) || []

  const filteredRecords = trainingRecords.filter(
    (record) =>
      !searchTerm ||
      record.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.training_number?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training Management</h1>
          <p className="text-muted-foreground mt-1">Track employee training and competency records</p>
        </div>
        <TrainingDialog onSuccess={loadData} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <div className="text-2xl font-bold">{activeCourses.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Compliant Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div className="text-2xl font-bold text-success">{compliantEmployees.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Training</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              <div className="text-2xl font-bold text-warning">{pendingTraining.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div className="text-2xl font-bold text-destructive">{overdueEmployees.length}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses">Training Courses</TabsTrigger>
          <TabsTrigger value="employees">Employee Records</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Status</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Training Courses</CardTitle>
              <CardDescription>Available training programs and completion rates</CardDescription>
              <div className="flex items-center gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search courses..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredRecords && filteredRecords.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Training Number</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((course) => {
                      return (
                        <TableRow key={course.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-mono text-sm">{course.training_number}</TableCell>
                          <TableCell className="font-medium">{course.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {course.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {course.duration_hours ? `${course.duration_hours}h` : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                course.status === "completed"
                                  ? "default"
                                  : course.status === "scheduled"
                                    ? "secondary"
                                    : "outline"
                              }
                              className="capitalize"
                            >
                              {course.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{course.instructor || "N/A"}</TableCell>
                          <TableCell>
                            <TrainingActions training={course} onUpdate={loadData} />
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
                      ? "No training courses match your search."
                      : "No training courses found. Create your first training course to get started."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee Training Records</CardTitle>
              <CardDescription>Individual training completion and compliance status</CardDescription>
            </CardHeader>
            <CardContent>
              {allProfiles && allProfiles.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Valid</TableHead>
                      <TableHead>Expired</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allProfiles.map((profile) => {
                      const userCompletions = completions?.filter((c) => c.user_id === profile.id) || []
                      const validCompletions = userCompletions.filter((c) => c.status === "valid")
                      const expiredCompletions = userCompletions.filter((c) => c.status === "expired")
                      const status =
                        expiredCompletions.length > 0
                          ? "overdue"
                          : validCompletions.length > 0
                            ? "compliant"
                            : "pending"

                      return (
                        <TableRow key={profile.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium">{profile.full_name || "Unknown"}</TableCell>
                          <TableCell className="text-muted-foreground capitalize">
                            {profile.department || "N/A"}
                          </TableCell>
                          <TableCell className="text-center">{userCompletions.length}</TableCell>
                          <TableCell className="text-center">{validCompletions.length}</TableCell>
                          <TableCell className="text-center">
                            {expiredCompletions.length > 0 && (
                              <Badge variant="destructive">{expiredCompletions.length}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                status === "compliant" ? "default" : status === "pending" ? "secondary" : "destructive"
                              }
                              className="capitalize"
                            >
                              {status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No employee records found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Overall Compliance</CardTitle>
                <CardDescription>Company-wide training compliance rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-4xl font-bold text-success">
                    {allProfiles && allProfiles.length > 0
                      ? Math.round((compliantEmployees.length / allProfiles.length) * 100)
                      : 0}
                    %
                  </div>
                  <Progress
                    value={
                      allProfiles && allProfiles.length > 0 ? (compliantEmployees.length / allProfiles.length) * 100 : 0
                    }
                    className="h-3"
                  />
                  <p className="text-sm text-muted-foreground">
                    {compliantEmployees.length} of {allProfiles?.length || 0} employees are compliant
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance by Department</CardTitle>
                <CardDescription>Training completion rates per department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allProfiles &&
                    Array.from(new Set(allProfiles.map((p) => p.department).filter(Boolean))).map((dept) => {
                      const deptEmployees = allProfiles.filter((p) => p.department === dept)
                      const deptCompliant = deptEmployees.filter((emp) =>
                        compliantEmployees.some((c) => c.id === emp.id),
                      )
                      const complianceRate =
                        deptEmployees.length > 0 ? Math.round((deptCompliant.length / deptEmployees.length) * 100) : 0

                      return (
                        <div key={dept} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="capitalize">{dept}</span>
                            <span className="font-medium">{complianceRate}%</span>
                          </div>
                          <Progress value={complianceRate} />
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
