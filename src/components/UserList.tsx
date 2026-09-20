import type { OrgUser } from '@/lib/types'

const label = (s: string) => s.toLowerCase().replace(/_/g, ' ')

export function UserList({ users }: { users: OrgUser[] }) {
  if (users.length === 0) return <p className="text-slate-600">No users yet.</p>
  return (
    <ul className="space-y-3">
      {users.map((u) => (
        <li key={u.id} className="rounded-lg border border-slate-200 p-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-medium">{u.name}</span>
            <span className="text-sm text-slate-600">{u.email}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded bg-slate-100 px-2 py-0.5">Org role: {label(u.role)}</span>
            {u.systemRole === 'SYSTEM_ADMIN' && (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-900">System admin</span>
            )}
          </div>
          {u.access.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No publisher access.</p>
          ) : (
            <table className="mt-3 w-full text-left text-sm">
              <caption className="sr-only">Publisher access for {u.name}</caption>
              <thead className="text-slate-600">
                <tr>
                  <th scope="col" className="w-1/3 py-1 pr-2 font-normal">Publisher</th>
                  <th scope="col" className="py-1 font-normal">Permissions</th>
                </tr>
              </thead>
              <tbody>
                {u.access.map((a) => (
                  <tr key={a.publisherId} className="border-t border-slate-100 align-top">
                    <th scope="row" className="py-1 pr-2 font-medium">{a.publisherName}</th>
                    <td className="py-1">
                      {a.permissions.length === 0 ? (
                        <span className="text-slate-500">none</span>
                      ) : (
                        <ul className="flex flex-wrap gap-1">
                          {a.permissions.map((p) => (
                            <li key={p} className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-900">
                              {label(p)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </li>
      ))}
    </ul>
  )
}
