'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AddUserForm } from '@/components/AddUserForm'
import { CreatePublisherForm } from '@/components/CreatePublisherForm'
import { ErrorAlert } from '@/components/ErrorAlert'
import { Loading } from '@/components/Loading'
import { OrgSwitcher } from '@/components/OrgSwitcher'
import { PublisherList } from '@/components/PublisherList'
import { UserList } from '@/components/UserList'
import { useApi } from '@/lib/use-api'
import type { OrgDetail } from '@/lib/types'

type Panel = 'publisher' | 'user' | null

export default function OrganizationPage({ params }: { params: { id: string } }) {
  const { data: org, error, loading, reload } = useApi<OrgDetail>(`/api/organizations/${params.id}`)
  const [panel, setPanel] = useState<Panel>(null)
  const [notice, setNotice] = useState('')

  const toggle = (p: Exclude<Panel, null>) => setPanel((cur) => (cur === p ? null : p))
  const done = (message: string) => {
    setPanel(null)
    setNotice(message)
    reload()
  }

  const btn =
    'rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600'

  return (
    <>
      <nav className="mb-4 flex flex-wrap items-center justify-between gap-2" aria-label="Organization navigation">
        <Link href="/" className="text-sm text-blue-700 underline">← All organizations</Link>
        <OrgSwitcher currentId={params.id} />
      </nav>

      {/* Announces success messages to screen readers; always mounted so the change is read out. */}
      <div role="status" aria-live="polite" className="mb-2 min-h-5 text-sm text-green-800">{notice}</div>

      {loading && !org && <Loading label="Loading organization" />}
      {error && (
        <div className="space-y-3">
          <ErrorAlert message={error.message} onRetry={reload} />
          <Link href="/" className="text-sm text-blue-700 underline">Back to organizations</Link>
        </div>
      )}

      {org && (
        <div className="space-y-8">
          <header>
            <h1 className="text-2xl font-semibold">{org.name}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {org.slug} · created {new Date(org.createdAt).toLocaleDateString()} · {org.publishers.length}{' '}
              {org.publishers.length === 1 ? 'publisher' : 'publishers'} · {org.users.length}{' '}
              {org.users.length === 1 ? 'user' : 'users'}
            </p>
          </header>

          <section aria-labelledby="publishers-heading" className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 id="publishers-heading" className="text-lg font-semibold">Publishers</h2>
              <button type="button" className={btn} aria-expanded={panel === 'publisher'} onClick={() => toggle('publisher')}>
                {panel === 'publisher' ? 'Cancel' : 'New publisher'}
              </button>
            </div>
            {panel === 'publisher' && (
              <CreatePublisherForm orgId={org.id} onCreated={() => done('Publisher created.')} />
            )}
            <PublisherList publishers={org.publishers} />
          </section>

          <section aria-labelledby="users-heading" className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 id="users-heading" className="text-lg font-semibold">Users</h2>
              <button type="button" className={btn} aria-expanded={panel === 'user'} onClick={() => toggle('user')}>
                {panel === 'user' ? 'Cancel' : 'Add user'}
              </button>
            </div>
            {panel === 'user' && <AddUserForm orgId={org.id} publishers={org.publishers} onAdded={done} />}
            <UserList users={org.users} />
          </section>
        </div>
      )}
    </>
  )
}
