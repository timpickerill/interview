import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { handle } from '@/lib/http'

export const dynamic = 'force-dynamic'

// GET /api/organizations — list for the dashboard / org switcher.
export const GET = handle(async () => {
  const orgs = await db.organization.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { publishers: true, memberships: true } } },
  })
  return NextResponse.json({
    organizations: orgs.map((o) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      createdAt: o.createdAt,
      publisherCount: o._count.publishers,
      userCount: o._count.memberships,
    })),
  })
})
