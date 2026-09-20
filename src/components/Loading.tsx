export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">{label}…</span>
      {[0, 1, 2].map((i) => (
        <div key={i} aria-hidden="true" className="h-16 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  )
}
