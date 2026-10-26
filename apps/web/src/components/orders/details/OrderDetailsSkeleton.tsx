import { Skeleton } from "@/components/ui/skeleton"
import { GlassCard } from "@/components/ui/glass-card"

export function OrderDetailsSkeleton() {
  return (
    <div className="space-y-6">
      {/* ── Header Skeleton ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-7 sm:h-8 w-44 sm:w-56 rounded-xl" />
            <Skeleton className="h-4 w-64 rounded-lg" />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="h-8 w-32 rounded-full ml-1" />
        </div>
      </div>

      {/* ── Tabs Row Skeleton ─────────────────────────────────────────── */}
      <div className="flex gap-2 border-b border-border/30 pb-3">
        <Skeleton className="h-8 w-24 rounded-xl" />
        <Skeleton className="h-8 w-36 rounded-xl" />
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>

      {/* ── Main Content Grid Skeleton ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="md:col-span-2 space-y-4">
          <GlassCard padding="default" className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/20">
              <Skeleton className="h-5 w-40 rounded-lg" />
              <Skeleton className="h-4 w-24 rounded-lg" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-5/6 rounded-lg" />
              <Skeleton className="h-4 w-3/4 rounded-lg" />
            </div>
            <div className="pt-2 flex gap-3">
              <Skeleton className="h-10 flex-1 rounded-xl" />
              <Skeleton className="h-10 flex-1 rounded-xl" />
            </div>
          </GlassCard>

          <GlassCard padding="default" className="space-y-3">
            <Skeleton className="h-5 w-36 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-2/3 rounded-lg" />
            </div>
          </GlassCard>
        </div>

        {/* Right Column (1 col) */}
        <div className="space-y-4">
          <GlassCard padding="default" className="space-y-3">
            <Skeleton className="h-5 w-32 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-4/5 rounded-lg" />
              <Skeleton className="h-4 w-3/5 rounded-lg" />
            </div>
          </GlassCard>

          <GlassCard padding="default" className="space-y-3">
            <Skeleton className="h-5 w-28 rounded-lg" />
            <Skeleton className="h-8 w-36 rounded-xl" />
            <Skeleton className="h-4 w-24 rounded-lg" />
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
