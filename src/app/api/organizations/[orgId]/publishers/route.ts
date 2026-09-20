import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { badRequest, conflict, handle, notFound, readJson } from '@/lib/http'

// POST /api/organizations/[orgId]/publishers — create a publisher in this org.
export const POST = handle(async (req: Request, { params }: { params: { orgId: string } }) => {
  const body = await readJson(req)
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name || name.length > 100) {
    throw badRequest('Invalid publisher', { name: 'Name is required (max 100 characters)' })
  }

  const org = await db.organization.findUnique({ where: { id: params.orgId }, select: { id: true } })
  if (!org) throw notFound('Organization not found')

  try {
    const publisher = await db.publisher.create({ data: { orgId: org.id, name } })
    return NextResponse.json(
      { id: publisher.id, name: publisher.name, createdAt: publisher.createdAt, userCount: 0 },
      { status: 201 }
    )
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw conflict('Publisher already exists', { name: 'This organization already has a publisher with that name' })
    }
    throw e
  }
})
