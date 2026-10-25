import { cn } from "@/lib/utils"

interface PageLoaderProps {
  fullscreen?: boolean
  message?: string
}

export function PageLoader({ fullscreen = false, message }: PageLoaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center select-none",
        fullscreen ? "h-screen w-full bg-background" : "min-h-[40vh] w-full py-16"
      )}
    >
      <div className="relative flex items-center justify-center">
        {/* Halo difuso de luz con el color temático del taller */}
        <div className="absolute w-12 h-12 rounded-full bg-theme-accent/25 blur-xl pointer-events-none" />

        {/* Spinner giratorio elegante */}
        <div className="w-8 h-8 rounded-full border-2 border-theme-accent/20 border-t-theme-accent animate-spin shadow-sm" />
      </div>

      {message && (
        <p className="mt-3 text-xs font-medium text-muted-foreground tracking-wide animate-pulse">
          {message}
        </p>
      )}
    </div>
  )
}
