'use client'

import { FormEvent, useState } from 'react'
import { api, ApiRequestError } from '@/lib/api-client'

export function CreatePublisherForm({ orgId, onCreated }: { orgId: string; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setFieldError(null)
    try {
      await api(`/api/organizations/${orgId}/publishers`, { method: 'POST', body: JSON.stringify({ name }) })
      setName('')
      onCreated()
    } catch (err) {
      if (err instanceof ApiRequestError && err.fields?.name) setFieldError(err.fields.name)
      else setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-slate-200 p-4" noValidate>
      <div>
        <label htmlFor="publisher-name" className="block text-sm font-medium">Publisher name</label>
        <input
          id="publisher-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          aria-invalid={!!fieldError}
          aria-describedby={fieldError ? 'publisher-name-error' : undefined}
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        />
        {fieldError && <p id="publisher-name-error" className="mt-1 text-sm text-red-700">{fieldError}</p>}
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-blue-700 px-3 py-1.5 text-sm text-white hover:bg-blue-800 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
      >
        {submitting ? 'Creating…' : 'Create publisher'}
      </button>
    </form>
  )
}
