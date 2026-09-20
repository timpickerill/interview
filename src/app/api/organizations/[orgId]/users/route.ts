import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { badRequest, conflict, handle, notFound, readJson } from '@/lib/http'
import { ORG_ROLES, PUBLISHER_PERMISSIONS, SYSTEM_ROLES } from '@/lib/constants'
import type { OrgRole, PublisherPermission, SystemRole } from '@/lib/constants'

// SECURITY GAP (no authentication yet): this endpoint lets any caller create a
// SYSTEM_ADMIN, as the task requires. With auth, only an existing system admin
// may set systemRole, and only owners/admins of THIS org (or system admins) may
// add members or grant publisher permissions. See README "Known gaps".

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Grant = { publisherId: string; permissions: PublisherPermission[] }

function parse(body: Record<string, unknown>) {
  const fields: Record<string, string> = {}

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!EMAIL_RE.test(email) || email.length > 254) fields.email = 'A valid email is required'

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name || name.length > 100) fields.name = 'Name is required (max 100 characters)'

  const systemRole = (body.systemRole ?? 'USER') as SystemRole
  if (!SYSTEM_ROLES.includes(systemRole)) fields.systemRole = `Must be one of: ${SYSTEM_ROLES.join(', ')}`

  const role = (body.role ?? 'MEMBER') as OrgRole
  if (!ORG_ROLES.includes(role)) fields.role = `Must be one of: ${ORG_ROLES.join(', ')}`

  const grants: Grant[] = []
  const rawGrants = body.publisherAccess ?? []
  if (!Array.isArray(rawGrants)) {
    fields.publisherAccess = 'Must be an array'
  } else {
    const seen = new Set<string>()
    for (const g of rawGrants) {
      const publisherId = typeof g?.publisherId === 'string' ? g.publisherId : ''
      const perms: unknown = g?.permissions
      if (
        !publisherId ||
        !Array.isArray(perms) ||
        !perms.every((p) => PUBLISHER_PERMISSIONS.includes(p as PublisherPermission))
      ) {
        fields.publisherAccess = `Each entry needs a publisherId and permissions from: ${PUBLISHER_PERMISSIONS.join(', ')}`
        break
      }
      if (seen.has(publisherId)) {
        fields.publisherAccess = 'Duplicate publisherId'
        break
      }
      seen.add(publisherId)
      grants.push({ publisherId, permissions: Array.from(new Set(perms as PublisherPermission[])) })
    }
  }

  if (Object.keys(fields).length) throw badRequest('Invalid user', fields)
  return { email, name, systemRole, role, grants }
}

// POST /api/organizations/[orgId]/users — add a user to this org.
// Creates the user if the email is new; otherwise attaches the existing user
// (their name and systemRole are NOT overwritten). Membership and publisher
// grants are written in one transaction.
export const POST = handle(async (req: Request, { params }: { params: { orgId: string } }) => {
  const { email, name, systemRole, role, grants } = parse(await readJson(req))

  const org = await db.organization.findUnique({ where: { id: params.orgId }, select: { id: true } })
  if (!org) throw notFound('Organization not found')

  // Grants may only reference publishers of THIS org (the composite FK enforces it too).
  const ids = grants.map((g) => g.publisherId)
  if (ids.length) {
    const valid = await db.publisher.count({ where: { orgId: org.id, id: { in: ids } } })
    if (valid !== ids.length) {
      throw badRequest('Invalid user', { publisherAccess: 'Unknown publisher for this organization' })
    }
  }

  const result = await db.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { email } })
    if (existing) {
      const member = await tx.membership.findUnique({
        where: { orgId_userId: { orgId: org.id, userId: existing.id } },
      })
      if (member) throw conflict('User is already a member of this organization', { email: 'Already a member' })
    }

    const user = existing ?? (await tx.user.create({ data: { email, name, systemRole } }))
    await tx.membership.create({ data: { orgId: org.id, userId: user.id, role } })
    for (const g of grants) {
      await tx.publisherAccess.create({
        data: {
          orgId: org.id,
          userId: user.id,
          publisherId: g.publisherId,
          permissions: { create: g.permissions.map((permission) => ({ permission })) },
        },
      })
    }
    return { user, attached: !!existing }
  })

  return NextResponse.json(
    { id: result.user.id, email: result.user.email, name: result.user.name, attachedExisting: result.attached },
    { status: result.attached ? 200 : 201 }
  )
})
