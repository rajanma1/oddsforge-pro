import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "border-transparent bg-zinc-50 text-zinc-900 hover:bg-zinc-50/80",
    secondary: "border-transparent bg-zinc-800 text-zinc-50 hover:bg-zinc-800/80",
    destructive: "border-transparent bg-red-900 text-zinc-50 hover:bg-red-900/80",
    outline: "text-zinc-50",
    success: "border-transparent bg-emerald-900/50 text-emerald-400 border border-emerald-800",
    warning: "border-transparent bg-amber-900/50 text-amber-400 border border-amber-800"
  }
  return (
    <div className={cn("inline-flex items-center rounded-md border border-zinc-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2", variants[variant], className)} {...props} />
  )
}

export { Badge }
