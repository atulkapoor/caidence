import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { login, register, fetchCurrentUser } from '../auth'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
  localStorage.clear()
})

describe('login', () => {
  it('sends correct credentials as form-encoded data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ access_token: 'test-token', token_type: 'bearer' }),
    })

    await login({ email: 'user@test.com', password: 'password123' })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toContain('/auth/login')
    expect(options.method).toBe('POST')
    expect(options.headers['Content-Type']).toBe('application/x-www-form-urlencoded')

    // Body should be URLSearchParams with username=email
    const body = options.body as URLSearchParams
    expect(body.get('username')).toBe('user@test.com')
    expect(body.get('password')).toBe('password123')
  })

  it('returns token on successful login', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ access_token: 'jwt-token-123', token_type: 'bearer' }),
    })

    const result = await login({ email: 'user@test.com', password: 'pass' })

    expect(result.access_token).toBe('jwt-token-123')
  })

  it('throws error on failed login', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ detail: 'Invalid credentials' }),
    })

    await expect(login({ email: 'user@test.com', password: 'wrong' }))
      .rejects.toThrow('Invalid credentials')
  })

  it('throws generic error when no detail in response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({}),
    })

    await expect(login({ email: 'user@test.com', password: 'wrong' }))
      .rejects.toThrow('Login failed')
  })
})

describe('register', () => {
  it('sends registration data as JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 1, email: 'new@test.com' }),
    })

    await register({
      full_name: 'Test User',
      email: 'new@test.com',
      password: 'secure123',
    })

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toContain('/auth/register')
    expect(options.method).toBe('POST')
    expect(options.headers['Content-Type']).toBe('application/json')

    const body = JSON.parse(options.body)
    expect(body.email).toBe('new@test.com')
    expect(body.full_name).toBe('Test User')
    expect(body.password).toBe('secure123')
  })

  it('sends optional role field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 1 }),
    })

    await register({
      full_name: 'Admin User',
      email: 'admin@test.com',
      password: 'pass',
      role: 'admin',
    })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.role).toBe('admin')
  })

  it('throws error on registration failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ detail: 'Email already registered' }),
    })

    await expect(register({
      full_name: 'Test',
      email: 'existing@test.com',
      password: 'pass',
    })).rejects.toThrow('Email already registered')
  })
})

describe('fetchCurrentUser', () => {
  it('sends Authorization header with stored token', async () => {
    localStorage.setItem('token', 'my-jwt-token')

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: 1,
        email: 'user@test.com',
        full_name: 'Test User',
        role: 'admin',
        organization_id: 1,
        is_active: true,
        is_approved: true,
      }),
    })

    const user = await fetchCurrentUser()

    const [, options] = mockFetch.mock.calls[0]
    expect(options.headers.Authorization).toBe('Bearer my-jwt-token')
    expect(user.email).toBe('user@test.com')
    expect(user.role).toBe('admin')
  })

  it('throws error when no token in localStorage', async () => {
    // No token set
    await expect(fetchCurrentUser()).rejects.toThrow('No token found')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('throws error on non-ok response', async () => {
    localStorage.setItem('token', 'expired-token')

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    })

    await expect(fetchCurrentUser()).rejects.toThrow('Failed to fetch user')
  })
})
