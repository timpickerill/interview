import { PrismaClient } from '@prisma/client'
import type { OrgRole, PublisherPermission, SystemRole } from '../src/lib/constants'

const db = new PrismaClient()

type Grant = { publisher: string; permissions: PublisherPermission[] }
type Member = { email: string; role: OrgRole; grants: Grant[] }
type Org = { name: string; slug: string; publishers: string[]; members: Member[] }

const users: { email: string; name: string; systemRole: SystemRole }[] = [
  { email: 'ada.admin@example.com', name: 'Ada Admin', systemRole: 'SYSTEM_ADMIN' },
  { email: 'maria.santos@example.com', name: 'Maria Santos', systemRole: 'USER' },
  { email: 'james.okafor@example.com', name: 'James Okafor', systemRole: 'USER' },
  { email: 'priya.raman@example.com', name: 'Priya Raman', systemRole: 'USER' },
  { email: 'liam.oconnor@example.com', name: "Liam O'Connor", systemRole: 'USER' },
  { email: 'chen.wei@example.com', name: 'Chen Wei', systemRole: 'USER' },
  { email: 'sofia.rossi@example.com', name: 'Sofia Rossi', systemRole: 'USER' },
  { email: 'noah.berg@example.com', name: 'Noah Berg', systemRole: 'USER' },
  { email: 'zara.hussain@example.com', name: 'Zara Hussain', systemRole: 'USER' },
  { email: 'tom.rivera@example.com', name: 'Tom Rivera', systemRole: 'USER' },
]

const orgs: Org[] = [
  {
    name: 'Northwind Media',
    slug: 'northwind-media',
    publishers: ['Northwind Daily', 'Northwind Sports', 'Northwind Weekend', 'Northwind Business'],
    members: [
      { email: 'maria.santos@example.com', role: 'OWNER', grants: [
        { publisher: 'Northwind Daily', permissions: ['VIEW', 'EDIT', 'PUBLISH', 'MANAGE_USERS'] },
        { publisher: 'Northwind Sports', permissions: ['VIEW', 'EDIT', 'PUBLISH', 'MANAGE_USERS'] },
        { publisher: 'Northwind Weekend', permissions: ['VIEW', 'EDIT', 'PUBLISH', 'MANAGE_USERS'] },
        { publisher: 'Northwind Business', permissions: ['VIEW', 'EDIT', 'PUBLISH', 'MANAGE_USERS'] },
      ] },
      { email: 'james.okafor@example.com', role: 'ADMIN', grants: [
        { publisher: 'Northwind Daily', permissions: ['VIEW', 'EDIT', 'MANAGE_USERS'] },
        { publisher: 'Northwind Sports', permissions: ['VIEW', 'EDIT'] },
      ] },
      { email: 'priya.raman@example.com', role: 'MEMBER', grants: [
        { publisher: 'Northwind Business', permissions: ['VIEW', 'EDIT', 'PUBLISH'] },
      ] },
      { email: 'liam.oconnor@example.com', role: 'MEMBER', grants: [
        { publisher: 'Northwind Sports', permissions: ['VIEW'] },
        { publisher: 'Northwind Weekend', permissions: ['VIEW', 'EDIT'] },
      ] },
      // Multi-org user: also a member of Harbor & Vale below.
      { email: 'chen.wei@example.com', role: 'MEMBER', grants: [
        { publisher: 'Northwind Daily', permissions: ['VIEW'] },
      ] },
    ],
  },
  {
    name: 'Harbor & Vale Press',
    slug: 'harbor-vale-press',
    publishers: ['Harbor Books', 'Vale Magazine', 'Harbor Kids'],
    members: [
      { email: 'sofia.rossi@example.com', role: 'OWNER', grants: [
        { publisher: 'Harbor Books', permissions: ['VIEW', 'EDIT', 'PUBLISH', 'MANAGE_USERS'] },
        { publisher: 'Vale Magazine', permissions: ['VIEW', 'EDIT', 'PUBLISH', 'MANAGE_USERS'] },
        { publisher: 'Harbor Kids', permissions: ['VIEW', 'EDIT', 'PUBLISH', 'MANAGE_USERS'] },
      ] },
      { email: 'chen.wei@example.com', role: 'ADMIN', grants: [
        { publisher: 'Vale Magazine', permissions: ['VIEW', 'EDIT', 'PUBLISH'] },
        { publisher: 'Harbor Books', permissions: ['VIEW', 'EDIT'] },
      ] },
      { email: 'noah.berg@example.com', role: 'MEMBER', grants: [
        { publisher: 'Harbor Kids', permissions: ['VIEW', 'EDIT'] },
      ] },
      // Member with no publisher access yet.
      { email: 'tom.rivera@example.com', role: 'MEMBER', grants: [] },
    ],
  },
  {
    name: 'Lumen Digital',
    slug: 'lumen-digital',
    publishers: ['Lumen News', 'Lumen Podcasts'],
    members: [
      { email: 'zara.hussain@example.com', role: 'OWNER', grants: [
        { publisher: 'Lumen News', permissions: ['VIEW', 'EDIT', 'PUBLISH', 'MANAGE_USERS'] },
        { publisher: 'Lumen Podcasts', permissions: ['VIEW', 'EDIT', 'PUBLISH', 'MANAGE_USERS'] },
      ] },
      { email: 'tom.rivera@example.com', role: 'ADMIN', grants: [
        { publisher: 'Lumen Podcasts', permissions: ['VIEW', 'EDIT', 'PUBLISH'] },
      ] },
      { email: 'priya.raman@example.com', role: 'MEMBER', grants: [
        { publisher: 'Lumen News', permissions: ['VIEW'] },
      ] },
    ],
  },
]

async function main() {
  // Children first; order matters only for clarity since FKs cascade.
  await db.publisherPermission.deleteMany()
  await db.publisherAccess.deleteMany()
  await db.membership.deleteMany()
  await db.publisher.deleteMany()
  await db.organization.deleteMany()
  await db.user.deleteMany()

  const userIds = new Map<string, string>()
  for (const u of users) {
    const created = await db.user.create({ data: u })
    userIds.set(u.email, created.id)
  }

  for (const o of orgs) {
    const org = await db.organization.create({ data: { name: o.name, slug: o.slug } })
    const publisherIds = new Map<string, string>()
    for (const name of o.publishers) {
      const p = await db.publisher.create({ data: { orgId: org.id, name } })
      publisherIds.set(name, p.id)
    }
    for (const m of o.members) {
      const userId = userIds.get(m.email)!
      await db.membership.create({ data: { orgId: org.id, userId, role: m.role } })
      for (const g of m.grants) {
        await db.publisherAccess.create({
          data: {
            orgId: org.id,
            userId,
            publisherId: publisherIds.get(g.publisher)!,
            permissions: { create: g.permissions.map((permission) => ({ permission })) },
          },
        })
      }
    }
  }

  const counts = {
    users: await db.user.count(),
    organizations: await db.organization.count(),
    memberships: await db.membership.count(),
    publishers: await db.publisher.count(),
    access: await db.publisherAccess.count(),
    permissions: await db.publisherPermission.count(),
  }
  console.log('Seeded:', counts)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
