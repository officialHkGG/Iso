"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ISO_SYSTEMS, getISOSystem, setISOSystem } from "@/lib/local-storage"
import { cn } from "@/lib/utils"

export function ISOSelector() {
  const [open, setOpen] = useState(false)
  const [selectedSystem, setSelectedSystem] = useState<(typeof ISO_SYSTEMS)[number]>(ISO_SYSTEMS[0])

  useEffect(() => {
    const currentSystem = getISOSystem()
    setSelectedSystem(currentSystem)
  }, [])

  const handleSelect = (systemValue: string) => {
    const system = ISO_SYSTEMS.find((s) => s.value === systemValue)
    if (system) {
      setSelectedSystem(system)
      setISOSystem(systemValue)
      setOpen(false)
      // Refresh the page to update the UI
      window.location.reload()
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-card hover:bg-accent transition-colors"
        >
          <div className="text-left">
            <div className="font-semibold text-sm">{selectedSystem.label}</div>
            <div className="text-xs text-muted-foreground">{selectedSystem.description}</div>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search ISO standards..." />
          <CommandEmpty>No ISO standard found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {ISO_SYSTEMS.map((system) => (
                <CommandItem key={system.value} value={system.value} onSelect={handleSelect}>
                  <Check
                    className={cn("mr-2 h-4 w-4", selectedSystem.value === system.value ? "opacity-100" : "opacity-0")}
                  />
                  <div>
                    <div className="font-medium">{system.label}</div>
                    <div className="text-xs text-muted-foreground">{system.description}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
