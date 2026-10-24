import * as React from "react"
import { Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-border/40 bg-background/40 backdrop-blur-md shadow-sm space-y-4",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-muted/30 border border-border/40 text-muted-foreground/60 shadow-inner">
        {icon || <Inbox className="w-7 h-7" />}
      </div>

      <div className="space-y-1 max-w-sm">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {action && (
        <Button
          onClick={action.onClick}
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl border-border/40 bg-background/60 shadow-sm hover:bg-accent"
        >
          {action.icon}
          <span>{action.label}</span>
        </Button>
      )}
    </div>
  )
}
