"use client"

import { Search, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getCurrentUser } from "@/lib/local-storage"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { NotificationCenter } from "./notification-center"

export function Header() {
  const router = useRouter()
  const [userName, setUserName] = useState("User")
  const [userRole, setUserRole] = useState("Loading...")

  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      setUserName(user.full_name || user.email || "User")
      setUserRole(user.role || "user")
    }
  }, [])

  const handleSignOut = async () => {
    if (typeof window !== "undefined") {
      localStorage.clear()
    }
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="h-16 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search documents, CAPAs, audits..."
            className="pl-10 bg-muted/50 border-0 focus:bg-background transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <NotificationCenter />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-accent transition-colors">
              <User className="h-4 w-4" />
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 animate-in">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/dashboard/users")}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/dashboard/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive cursor-pointer" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
