'use client'

import { FormEvent, useState } from 'react'
import { api, ApiRequestError } from '@/lib/api-client'
import { ORG_ROLES, PUBLISHER_PERMISSIONS, SYSTEM_ROLES } from '@/lib/constants'
import type { OrgRole, PublisherPermission, SystemRole } from '@/lib/constants'
import type { PublisherSummary } from '@/lib/types'

const label = (s: string) => s.toLowerCase().replace(/_/g, ' ')
const inputCls =
  'mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600'

export function AddUserForm({
  orgId,
  publishers,
  onAdded,
}: {
  orgId: string
  publishers: PublisherSummary[]
  onAdded: (message: string) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [systemRole, setSystemRole] = useState<SystemRole>('USER')
  const [role, setRole] = useState<OrgRole>('MEMBER')
  // publisherId -> selected permissions. Presence of the key means access is granted.
  const [grants, setGrants] = useState<Record<string, PublisherPermission[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})

  function toggleAccess(id: string, on: boolean) {
    setGrants((g) => {
      const next = { ...g }
      if (on) next[id] = ['VIEW']
      else delete next[id]
      return next
    })
  }

  function togglePermission(id: string, p: PublisherPermission, on: boolean) {
    setGrants((g) => ({ ...g, [id]: on ? [...(g[id] ?? []), p] : (g[id] ?? []).filter((x) => x !== p) }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setFields({})
    try {
      const res = await api<{ name: string; attachedExisting: boolean }>(`/api/organizations/${orgId}/users`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          systemRole,
          role,
          publisherAccess: Object.entries(grants).map(([publisherId, permissions]) => ({ publisherId, permissions })),
        }),
      })
      setName('')
      setEmail('')
      setSystemRole('USER')
      setRole('MEMBER')
      setGrants({})
      onAdded(
        res.attachedExisting
          ? `${res.name} already existed and was added to this organization.`
          : `${res.name} was created and added to this organization.`
      )
    } catch (err) {
      if (err instanceof ApiRequestError && err.fields) setFields(err.fields)
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const fieldErr = (k: string) => fields[k] && <p id={`${k}-error`} className="mt-1 text-sm text-red-700">{fields[k]}</p>
  const aria = (k: string) => ({ 'aria-invalid': !!fields[k], 'aria-describedby': fields[k] ? `${k}-error` : undefined })

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-slate-200 p-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="user-name" className="block text-sm font-medium">Name</label>
          <input id="user-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} className={inputCls} {...aria('name')} />
          {fieldErr('name')}
        </div>
        <div>
          <label htmlFor="user-email" className="block text-sm font-medium">Email</label>
          <input id="user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} {...aria('email')} />
          {fieldErr('email')}
        </div>
        <div>
          <label htmlFor="user-system-role" className="block text-sm font-medium">System role</label>
          <select id="user-system-role" value={systemRole} onChange={(e) => setSystemRole(e.target.value as SystemRole)} className={inputCls}>
            {SYSTEM_ROLES.map((r) => <option key={r} value={r}>{label(r)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="user-org-role" className="block text-sm font-medium">Organization role</label>
          <select id="user-org-role" value={role} onChange={(e) => setRole(e.target.value as OrgRole)} className={inputCls}>
            {ORG_ROLES.map((r) => <option key={r} value={r}>{label(r)}</option>)}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Publisher access</legend>
        {publishers.length === 0 ? (
          <p className="mt-1 text-sm text-slate-600">Create a publisher first to grant access.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {publishers.map((p) => {
              const granted = p.id in grants
              return (
                <div key={p.id} className="rounded border border-slate-200 p-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input type="checkbox" checked={granted} onChange={(e) => toggleAccess(p.id, e.target.checked)} />
                    {p.name}
                  </label>
                  {granted && (
                    <fieldset className="ml-6 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                      <legend className="sr-only">Permissions for {p.name}</legend>
                      {PUBLISHER_PERMISSIONS.map((perm) => (
                        <label key={perm} className="flex items-center gap-1 text-sm">
                          <input
                            type="checkbox"
                            checked={grants[p.id].includes(perm)}
                            onChange={(e) => togglePermission(p.id, perm, e.target.checked)}
                          />
                          {label(perm)}
                        </label>
                      ))}
                    </fieldset>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {fieldErr('publisherAccess')}
      </fieldset>

      <p className="text-xs text-slate-500">
        If the email already belongs to a user, that user is added to this organization and their name and system role are left unchanged.
      </p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-blue-700 px-3 py-1.5 text-sm text-white hover:bg-blue-800 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
      >
        {submitting ? 'Adding…' : 'Add user'}
      </button>
    </form>
  )
}
