export const SYSTEM_ROLES = ['USER', 'SYSTEM_ADMIN'] as const
export const ORG_ROLES = ['OWNER', 'ADMIN', 'MEMBER'] as const
export const PUBLISHER_PERMISSIONS = ['VIEW', 'EDIT', 'PUBLISH', 'MANAGE_USERS'] as const

export type SystemRole = (typeof SYSTEM_ROLES)[number]
export type OrgRole = (typeof ORG_ROLES)[number]
export type PublisherPermission = (typeof PUBLISHER_PERMISSIONS)[number]
