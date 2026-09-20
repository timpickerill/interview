import type { OrgRole, PublisherPermission, SystemRole } from './constants'

export type OrgSummary = {
  id: string
  name: string
  slug: string
  createdAt: string
  publisherCount: number
  userCount: number
}

export type PublisherSummary = {
  id: string
  name: string
  createdAt: string
  userCount: number
}

export type UserAccess = {
  publisherId: string
  publisherName: string
  permissions: PublisherPermission[]
}

export type OrgUser = {
  id: string
  name: string
  email: string
  systemRole: SystemRole
  role: OrgRole
  joinedAt: string
  access: UserAccess[]
}

export type OrgDetail = {
  id: string
  name: string
  slug: string
  createdAt: string
  publishers: PublisherSummary[]
  users: OrgUser[]
}
