import { describe, it, expect } from 'vitest'
import {
  hasPermission,
  hasRole,
  isSuperAdmin,
  isAgencyLevel,
  isBrandLevel,
  getRoleDisplayName,
  getAllRoles,
  type UserRole,
  type Permission,
} from '../permissions'

describe('hasPermission', () => {
  it('root has all permissions', () => {
    const samplePermissions: Permission[] = [
      'admin:read', 'admin:write',
      'agency:read', 'agency:write',
      'brand:read', 'brand:write',
      'creators:read', 'creators:write',
      'campaign:read', 'campaign:write',
      'content:read', 'content:write',
      'analytics:read',
      'discovery:read', 'discovery:write',
    ]
    for (const perm of samplePermissions) {
      expect(hasPermission('root', perm)).toBe(true)
    }
  })

  it('super_admin has all permissions', () => {
    const samplePermissions: Permission[] = [
      'admin:read', 'admin:write',
      'agency:read', 'agency:write',
      'brand:read', 'brand:write',
      'creators:read', 'creators:write',
      'campaign:read', 'campaign:write',
      'content:read', 'content:write',
    ]
    for (const perm of samplePermissions) {
      expect(hasPermission('super_admin', perm)).toBe(true)
    }
  })

  it('viewer has read-only access to limited resources', () => {
    expect(hasPermission('viewer', 'content:read')).toBe(true)
    expect(hasPermission('viewer', 'campaign:read')).toBe(true)
    expect(hasPermission('viewer', 'analytics:read')).toBe(true)
    expect(hasPermission('viewer', 'content:write')).toBe(false)
    expect(hasPermission('viewer', 'admin:read')).toBe(false)
    expect(hasPermission('viewer', 'agency:read')).toBe(false)
  })

  it('creator can read and write content but not admin', () => {
    expect(hasPermission('creator', 'content:read')).toBe(true)
    expect(hasPermission('creator', 'content:write')).toBe(true)
    expect(hasPermission('creator', 'admin:read')).toBe(false)
    expect(hasPermission('creator', 'campaign:read')).toBe(false)
  })

  it('agency_admin has broad access but not admin', () => {
    expect(hasPermission('agency_admin', 'agency:read')).toBe(true)
    expect(hasPermission('agency_admin', 'agency:write')).toBe(true)
    expect(hasPermission('agency_admin', 'brand:write')).toBe(true)
    expect(hasPermission('agency_admin', 'campaign:write')).toBe(true)
    expect(hasPermission('agency_admin', 'admin:read')).toBe(false)
  })

  it('brand_member can read but not write brands/campaigns', () => {
    expect(hasPermission('brand_member', 'brand:read')).toBe(true)
    expect(hasPermission('brand_member', 'brand:write')).toBe(false)
    expect(hasPermission('brand_member', 'campaign:read')).toBe(true)
    expect(hasPermission('brand_member', 'campaign:write')).toBe(false)
  })

  it('brand_admin can write brands, creators, campaigns', () => {
    expect(hasPermission('brand_admin', 'brand:write')).toBe(true)
    expect(hasPermission('brand_admin', 'creators:write')).toBe(true)
    expect(hasPermission('brand_admin', 'campaign:write')).toBe(true)
    expect(hasPermission('brand_admin', 'agency:write')).toBe(false)
  })
})

describe('hasRole', () => {
  it('root meets any required role', () => {
    expect(hasRole('root', 'root')).toBe(true)
    expect(hasRole('root', 'super_admin')).toBe(true)
    expect(hasRole('root', 'viewer')).toBe(true)
  })

  it('super_admin meets any role except root', () => {
    expect(hasRole('super_admin', 'super_admin')).toBe(true)
    expect(hasRole('super_admin', 'viewer')).toBe(true)
    expect(hasRole('super_admin', 'creator')).toBe(true)
    expect(hasRole('super_admin', 'root')).toBe(false)
  })

  it('viewer does not meet admin role', () => {
    expect(hasRole('viewer', 'super_admin')).toBe(false)
    expect(hasRole('viewer', 'agency_admin')).toBe(false)
  })

  it('viewer meets its own role level', () => {
    expect(hasRole('viewer', 'viewer')).toBe(true)
  })

  it('agency_admin meets brand_admin but not super_admin', () => {
    expect(hasRole('agency_admin', 'brand_admin')).toBe(true)
    expect(hasRole('agency_admin', 'super_admin')).toBe(false)
  })

  it('hierarchy is correctly ordered', () => {
    const roles: UserRole[] = ['viewer', 'creator', 'brand_member', 'brand_admin', 'agency_member', 'agency_admin', 'super_admin', 'root']
    for (let i = 0; i < roles.length; i++) {
      for (let j = 0; j <= i; j++) {
        expect(hasRole(roles[i], roles[j])).toBe(true)
      }
    }
  })
})

describe('isSuperAdmin', () => {
  it('returns true for root and super_admin', () => {
    expect(isSuperAdmin('root')).toBe(true)
    expect(isSuperAdmin('super_admin')).toBe(true)
    expect(isSuperAdmin('agency_admin')).toBe(false)
    expect(isSuperAdmin('viewer')).toBe(false)
  })
})

describe('isAgencyLevel', () => {
  it('returns true for super_admin, agency_admin, agency_member', () => {
    expect(isAgencyLevel('super_admin')).toBe(true)
    expect(isAgencyLevel('agency_admin')).toBe(true)
    expect(isAgencyLevel('agency_member')).toBe(true)
  })

  it('returns false for brand and below', () => {
    expect(isAgencyLevel('brand_admin')).toBe(false)
    expect(isAgencyLevel('brand_member')).toBe(false)
    expect(isAgencyLevel('creator')).toBe(false)
    expect(isAgencyLevel('viewer')).toBe(false)
  })
})

describe('isBrandLevel', () => {
  it('returns true for agency and brand levels', () => {
    expect(isBrandLevel('super_admin')).toBe(true)
    expect(isBrandLevel('agency_admin')).toBe(true)
    expect(isBrandLevel('brand_admin')).toBe(true)
    expect(isBrandLevel('brand_member')).toBe(true)
  })

  it('returns false for creator and viewer', () => {
    expect(isBrandLevel('creator')).toBe(false)
    expect(isBrandLevel('viewer')).toBe(false)
  })
})

describe('getRoleDisplayName', () => {
  it('returns human-readable names', () => {
    expect(getRoleDisplayName('root')).toBe('Root')
    expect(getRoleDisplayName('super_admin')).toBe('Super Admin')
    expect(getRoleDisplayName('agency_admin')).toBe('Agency Admin')
    expect(getRoleDisplayName('brand_member')).toBe('Brand Member')
    expect(getRoleDisplayName('creator')).toBe('Creator')
    expect(getRoleDisplayName('viewer')).toBe('Viewer')
  })
})

describe('getAllRoles', () => {
  it('returns all 8 roles', () => {
    const roles = getAllRoles()
    expect(roles).toHaveLength(8)
  })

  it('each role has value and label', () => {
    const roles = getAllRoles()
    for (const role of roles) {
      expect(role).toHaveProperty('value')
      expect(role).toHaveProperty('label')
      expect(typeof role.value).toBe('string')
      expect(typeof role.label).toBe('string')
    }
  })

  it('includes root, super_admin, and viewer', () => {
    const roles = getAllRoles()
    const values = roles.map(r => r.value)
    expect(values).toContain('root')
    expect(values).toContain('super_admin')
    expect(values).toContain('viewer')
  })
})
