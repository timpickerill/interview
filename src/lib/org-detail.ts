import { db } from './db'

// Every relation below hangs off orgId, so nothing outside this org is reachable.
export async function getOrgDetail(orgId: string) {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    include: {
      publishers: {
        orderBy: { name: 'asc' },
        include: { _count: { select: { access: true } } },
      },
      memberships: {
        orderBy: { user: { name: 'asc' } },
        include: {
          user: true,
          publisherAccess: {
            include: { publisher: true, permissions: true },
          },
        },
      },
    },
  })
  if (!org) return null

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    createdAt: org.createdAt,
    publishers: org.publishers.map((p) => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
      userCount: p._count.access,
    })),
    users: org.memberships.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      systemRole: m.user.systemRole,
      role: m.role,
      joinedAt: m.createdAt,
      access: m.publisherAccess
        .map((a) => ({
          publisherId: a.publisherId,
          publisherName: a.publisher.name,
          permissions: a.permissions.map((p) => p.permission).sort(),
        }))
        .sort((a, b) => a.publisherName.localeCompare(b.publisherName)),
    })),
  }
}
