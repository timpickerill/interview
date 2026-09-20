import { NextResponse } from 'next/server'
import { handle, notFound } from '@/lib/http'
import { getOrgDetail } from '@/lib/org-detail'

// GET /api/organizations/[orgId] — org metadata, publishers, and its users
// with their publisher access and permissions.
export const GET = handle(async (_req: Request, { params }: { params: { orgId: string } }) => {
  const detail = await getOrgDetail(params.orgId)
  if (!detail) throw notFound('Organization not found')
  return NextResponse.json(detail)
})
