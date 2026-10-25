import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  variant?: "default" | "search"
  containerClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, containerClassName, type, variant = "default", ...props }, ref) => {
    if (variant === "search") {
      return (
        <div className={cn("relative w-full group", containerClassName)}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-accent/70 pointer-events-none transition-colors group-focus-within:text-theme-accent" />
          <input
            type={type || "search"}
            className={cn(
              "flex h-9 w-full rounded-full bg-background/50 pl-9 pr-4 py-1 text-sm border border-theme-accent/45 shadow-[0_0_12px_0_hsl(var(--theme-accent)/0.10)] backdrop-blur-md transition-all placeholder:text-muted-foreground",
              "hover:border-theme-accent/70 focus:bg-background focus:border-theme-accent focus:shadow-[0_0_18px_0_hsl(var(--theme-accent)/0.25)] focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
      )
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-xl bg-background/50 px-3.5 py-1 text-sm border border-border/45 shadow-sm backdrop-blur-md transition-all placeholder:text-muted-foreground",
          "hover:border-theme-accent/60 focus:bg-background focus:border-theme-accent focus:shadow-[0_0_14px_0_hsl(var(--theme-accent)/0.22)] focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

/**
 * Buscador preconfigurado con ícono de lupa integrado y borde de acento temático.
 */
export const SearchInput = React.forwardRef<HTMLInputElement, Omit<InputProps, "variant">>(
  (props, ref) => <Input variant="search" ref={ref} {...props} />
)
SearchInput.displayName = "SearchInput"

export { Input }
