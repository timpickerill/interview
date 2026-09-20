'use client'

import Link from 'next/link'
import { ErrorAlert } from '@/components/ErrorAlert'
import { Loading } from '@/components/Loading'
import { useApi } from '@/lib/use-api'
import type { OrgSummary } from '@/lib/types'

export default function HomePage() {
  const { data, error, loading, reload } = useApi<{ organizations: OrgSummary[] }>('/api/organizations')

  return (
    <>
      <h1 className="text-2xl font-semibold">Organizations</h1>
      <p className="mt-1 text-slate-600">Select an organization to manage its publishers and users.</p>

      <div className="mt-6">
        {loading && <Loading label="Loading organizations" />}
        {error && <ErrorAlert message={error.message} onRetry={reload} />}
        {data && data.organizations.length === 0 && <p className="text-slate-600">No organizations yet.</p>}
        {data && data.organizations.length > 0 && (
          <ul className="grid gap-3 sm:grid-cols-2">
            {data.organizations.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/organizations/${o.id}`}
                  className="block rounded-lg border border-slate-200 p-4 hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <span className="block font-medium">{o.name}</span>
                  <span className="mt-1 block text-sm text-slate-600">
                    {o.publisherCount} {o.publisherCount === 1 ? 'publisher' : 'publishers'} · {o.userCount}{' '}
                    {o.userCount === 1 ? 'user' : 'users'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
