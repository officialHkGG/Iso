"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CompanySettingsForm } from "@/components/company-settings-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { companySettingsStorage } from "@/lib/local-storage"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { toast } = useToast()
  const [integration, setIntegration] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState("MedTech Solutions Inc.")
  const [address, setAddress] = useState("123 Medical Device Blvd, Boston, MA 02101")
  const [phone, setPhone] = useState("+1 (555) 123-4567")
  const [email, setEmail] = useState("quality@medtech.com")

  const handleSaveGeneral = async () => {
    const existing = await companySettingsStorage.get()
    await companySettingsStorage.save({
      ...existing,
      companyName,
      address,
      phone,
      email,
      preparerName: existing?.preparerName || "",
      reviewerName: existing?.reviewerName || "",
    })
    toast({ title: "Settings saved", description: "Company information has been updated." })
  }

  const handleSavePreferences = () => {
    toast({ title: "Preferences saved", description: "System preferences are active for this workspace." })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage system configuration and preferences</p>
      </div>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company">Company Templates</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <CompanySettingsForm />
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Update your organization details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input id="company-name" value={companyName} onChange={(event) => setCompanyName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={address} onChange={(event) => setAddress(event.target.value)} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
                </div>
              </div>
              <Button onClick={handleSaveGeneral}>Save Changes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Preferences</CardTitle>
              <CardDescription>Configure system-wide settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Automatic Document Numbering</Label>
                  <p className="text-sm text-muted-foreground">Generate sequential document IDs automatically</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Electronic Signatures</Label>
                  <p className="text-sm text-muted-foreground">Enable 21 CFR Part 11 compliant e-signatures</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Audit Trail</Label>
                  <p className="text-sm text-muted-foreground">Log all system changes and user actions</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button onClick={handleSavePreferences}>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Configure when to receive email alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Document Review Due</Label>
                  <p className="text-sm text-muted-foreground">Notify when documents are due for review</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>CAPA Overdue</Label>
                  <p className="text-sm text-muted-foreground">Alert when CAPAs pass their due date</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Audit Scheduled</Label>
                  <p className="text-sm text-muted-foreground">Notify when new audits are scheduled</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Training Expiring</Label>
                  <p className="text-sm text-muted-foreground">Alert when training certifications are expiring</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regulatory Standards</CardTitle>
              <CardDescription>Configure your ISO standard in the sidebar selector</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>ISO 9001:2015</Label>
                  <p className="text-sm text-muted-foreground">Quality Management Systems</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>ISO 13485:2016</Label>
                  <p className="text-sm text-muted-foreground">Medical devices quality management</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>ISO 14001:2015</Label>
                  <p className="text-sm text-muted-foreground">Environmental Management</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>ISO 27001:2022</Label>
                  <p className="text-sm text-muted-foreground">Information Security Management</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>ISO 45001:2018</Label>
                  <p className="text-sm text-muted-foreground">Occupational Health & Safety</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>ISO 22000:2018</Label>
                  <p className="text-sm text-muted-foreground">Food Safety Management</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>External Integrations</CardTitle>
              <CardDescription>Connect with third-party systems</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>ERP System</Label>
                  <p className="text-sm text-muted-foreground">Sync with enterprise resource planning</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIntegration("ERP System")}>
                  Configure
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Document Management</Label>
                  <p className="text-sm text-muted-foreground">Connect to external document repository</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIntegration("Document Management")}>
                  Configure
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>LDAP/Active Directory</Label>
                  <p className="text-sm text-muted-foreground">Integrate with corporate directory</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIntegration("LDAP/Active Directory")}>
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(integration)} onOpenChange={(open) => !open && setIntegration(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure {integration}</DialogTitle>
            <DialogDescription>
              Store the connection details for this integration. These settings can be replaced with real API keys when
              your vendor account is ready.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="integration-url">Endpoint URL</Label>
              <Input id="integration-url" placeholder="https://example.com/api" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="integration-key">API Key</Label>
              <Input id="integration-key" type="password" placeholder="Paste API key" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIntegration(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast({ title: "Integration saved", description: `${integration} configuration was saved locally.` })
                setIntegration(null)
              }}
            >
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
