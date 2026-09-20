'use client'

import { useRouter } from 'next/navigation'
import { useApi } from '@/lib/use-api'
import type { OrgSummary } from '@/lib/types'

export function OrgSwitcher({ currentId }: { currentId: string }) {
  const router = useRouter()
  const { data, error, loading } = useApi<{ organizations: OrgSummary[] }>('/api/organizations')

  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor="org-switcher" className="text-slate-600">
        Switch organization
      </label>
      <select
        id="org-switcher"
        value={currentId}
        disabled={loading || !!error}
        onChange={(e) => router.push(`/organizations/${e.target.value}`)}
        className="rounded border border-slate-300 bg-white px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      >
        {data?.organizations.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
        {!data && <option value={currentId}>{error ? 'Unavailable' : 'Loading…'}</option>}
      </select>
    </div>
  )
}
