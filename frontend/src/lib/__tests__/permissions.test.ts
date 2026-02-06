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
  it('super_admin has all permissions', () => {
    const allPermissions: Permission[] = [
      'admin:access', 'admin:manage_users', 'admin:manage_billing',
      'agency:view', 'agency:manage',
      'brand:view', 'brand:manage', 'brand:create',
      'creator:view', 'creator:manage', 'creator:add',
      'campaign:view', 'campaign:manage',
      'content:view', 'content:create',
    ]
    for (const perm of allPermissions) {
      expect(hasPermission('super_admin', perm)).toBe(true)
    }
  })

  it('viewer only has content:view', () => {
    expect(hasPermission('viewer', 'content:view')).toBe(true)
    expect(hasPermission('viewer', 'content:create')).toBe(false)
    expect(hasPermission('viewer', 'admin:access')).toBe(false)
    expect(hasPermission('viewer', 'campaign:view')).toBe(false)
  })

  it('creator can view and create content but nothing else admin', () => {
    expect(hasPermission('creator', 'content:view')).toBe(true)
    expect(hasPermission('creator', 'content:create')).toBe(true)
    expect(hasPermission('creator', 'admin:access')).toBe(false)
    expect(hasPermission('creator', 'campaign:view')).toBe(false)
  })

  it('agency_admin has agency, brand, creator, campaign, content perms but not admin', () => {
    expect(hasPermission('agency_admin', 'agency:view')).toBe(true)
    expect(hasPermission('agency_admin', 'agency:manage')).toBe(true)
    expect(hasPermission('agency_admin', 'brand:create')).toBe(true)
    expect(hasPermission('agency_admin', 'campaign:manage')).toBe(true)
    expect(hasPermission('agency_admin', 'admin:access')).toBe(false)
  })

  it('brand_member can view but not manage', () => {
    expect(hasPermission('brand_member', 'brand:view')).toBe(true)
    expect(hasPermission('brand_member', 'brand:manage')).toBe(false)
    expect(hasPermission('brand_member', 'campaign:view')).toBe(true)
    expect(hasPermission('brand_member', 'campaign:manage')).toBe(false)
  })

  it('brand_admin can manage brands, creators, campaigns', () => {
    expect(hasPermission('brand_admin', 'brand:manage')).toBe(true)
    expect(hasPermission('brand_admin', 'creator:manage')).toBe(true)
    expect(hasPermission('brand_admin', 'campaign:manage')).toBe(true)
    expect(hasPermission('brand_admin', 'agency:manage')).toBe(false)
  })
})

describe('hasRole', () => {
  it('super_admin meets any required role', () => {
    expect(hasRole('super_admin', 'super_admin')).toBe(true)
    expect(hasRole('super_admin', 'viewer')).toBe(true)
    expect(hasRole('super_admin', 'creator')).toBe(true)
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
    const roles: UserRole[] = ['viewer', 'creator', 'brand_member', 'brand_admin', 'agency_member', 'agency_admin', 'super_admin']
    for (let i = 0; i < roles.length; i++) {
      // Each role should meet all roles below it
      for (let j = 0; j <= i; j++) {
        expect(hasRole(roles[i], roles[j])).toBe(true)
      }
    }
  })
})

describe('isSuperAdmin', () => {
  it('returns true only for super_admin', () => {
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
    expect(getRoleDisplayName('super_admin')).toBe('Super Admin')
    expect(getRoleDisplayName('agency_admin')).toBe('Agency Admin')
    expect(getRoleDisplayName('brand_member')).toBe('Brand Member')
    expect(getRoleDisplayName('creator')).toBe('Creator')
    expect(getRoleDisplayName('viewer')).toBe('Viewer')
  })
})

describe('getAllRoles', () => {
  it('returns all 7 roles', () => {
    const roles = getAllRoles()
    expect(roles).toHaveLength(7)
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

  it('includes super_admin and viewer', () => {
    const roles = getAllRoles()
    const values = roles.map(r => r.value)
    expect(values).toContain('super_admin')
    expect(values).toContain('viewer')
  })
})
