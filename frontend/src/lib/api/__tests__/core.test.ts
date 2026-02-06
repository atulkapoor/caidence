import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAuthHeaders, authenticatedFetch, API_BASE_URL } from '../core'

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
  localStorage.clear()
  // Reset window.location
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { href: '/' },
  })
})

describe('API_BASE_URL', () => {
  it('is /api/v1', () => {
    expect(API_BASE_URL).toBe('/api/v1')
  })
})

describe('getAuthHeaders', () => {
  it('returns auth header when token exists', async () => {
    localStorage.setItem('token', 'test-jwt')

    const headers = await getAuthHeaders()

    expect(headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-jwt',
    })
  })

  it('returns only Content-Type when no token', async () => {
    const headers = await getAuthHeaders()

    expect(headers).toEqual({
      'Content-Type': 'application/json',
    })
  })
})

describe('authenticatedFetch', () => {
  it('adds auth headers to request', async () => {
    localStorage.setItem('token', 'jwt-123')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
    })

    await authenticatedFetch('/api/v1/test')

    const [, options] = mockFetch.mock.calls[0]
    expect(options.headers.Authorization).toBe('Bearer jwt-123')
    expect(options.headers['Content-Type']).toBe('application/json')
  })

  it('merges custom headers with auth headers', async () => {
    localStorage.setItem('token', 'jwt-123')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
    })

    await authenticatedFetch('/api/v1/test', {
      headers: { 'X-Custom': 'value' },
    })

    const [, options] = mockFetch.mock.calls[0]
    expect(options.headers.Authorization).toBe('Bearer jwt-123')
    expect(options.headers['X-Custom']).toBe('value')
  })

  it('passes method and body through', async () => {
    localStorage.setItem('token', 'jwt-123')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
    })

    await authenticatedFetch('/api/v1/test', {
      method: 'POST',
      body: JSON.stringify({ data: 'test' }),
    })

    const [, options] = mockFetch.mock.calls[0]
    expect(options.method).toBe('POST')
    expect(options.body).toBe('{"data":"test"}')
  })

  it('redirects to login on 401', async () => {
    localStorage.setItem('token', 'expired')
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    })

    await authenticatedFetch('/api/v1/protected')

    expect(localStorage.getItem('token')).toBeNull()
    expect(window.location.href).toBe('/login')
  })

  it('does not redirect on non-401 errors', async () => {
    localStorage.setItem('token', 'valid-jwt')
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    await authenticatedFetch('/api/v1/test')

    expect(localStorage.getItem('token')).toBe('valid-jwt')
  })

  it('returns the response object', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'test' }),
    })

    const response = await authenticatedFetch('/api/v1/test')

    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
  })
})
