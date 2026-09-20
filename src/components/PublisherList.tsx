import type { PublisherSummary } from '@/lib/types'

export function PublisherList({ publishers }: { publishers: PublisherSummary[] }) {
  if (publishers.length === 0) return <p className="text-slate-600">No publishers yet.</p>
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {publishers.map((p) => (
        <li key={p.id} className="rounded-lg border border-slate-200 p-3">
          <span className="block font-medium">{p.name}</span>
          <span className="text-sm text-slate-600">
            {p.userCount} {p.userCount === 1 ? 'user' : 'users'} with access
          </span>
        </li>
      ))}
    </ul>
  )
}
