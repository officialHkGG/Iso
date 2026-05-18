"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  AlertTriangle,
  ClipboardCheck,
  Users,
  GraduationCap,
  Shield,
  Settings,
  Upload,
  CheckSquare,
} from "lucide-react"
import { ISOSelector } from "./iso-selector"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Documents", href: "/dashboard/documents", icon: FileText },
  { name: "Bulk Upload", href: "/dashboard/bulk-upload", icon: Upload },
  { name: "Compliance", href: "/dashboard/compliance", icon: CheckSquare },
  { name: "CAPA", href: "/dashboard/capa", icon: AlertTriangle },
  { name: "Audits", href: "/dashboard/audits", icon: ClipboardCheck },
  { name: "Risk Management", href: "/dashboard/risk", icon: Shield },
  { name: "Training", href: "/dashboard/training", icon: GraduationCap },
  { name: "Users", href: "/dashboard/users", icon: Users },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shadow-sm">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-sm leading-tight">Lisora</h2>
            <p className="text-xs text-muted-foreground">QMS Platform</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-sidebar-border">
        <ISOSelector />
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive && "animate-in")} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/50">
        <p className="text-xs text-muted-foreground text-center font-medium">Lisora v1.0.0</p>
      </div>
    </div>
  )
}
