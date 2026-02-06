import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchInfluencers, getInfluencerProfile } from '../discovery'

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
  localStorage.clear()
  localStorage.setItem('token', 'test-jwt')
})

describe('searchInfluencers', () => {
  it('transforms API response to InfluencerProfile format', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        total: 1500,
        accounts: [
          {
            user_id: '12345',
            profile: {
              username: 'fitnessguru',
              followers: 50000,
              engagement_percent: 5.2,
              full_name: 'Fitness Guru',
              picture: 'https://example.com/pic.jpg',
            },
          },
        ],
      }),
    })

    const results = await searchInfluencers('fitness', { platform: 'instagram' })

    expect(results).toHaveLength(1)
    expect(results[0].handle).toBe('fitnessguru')
    expect(results[0].followers).toBe(50000)
    expect(results[0].engagement_rate).toBe(5.2)
    expect(results[0].platform).toBe('INSTAGRAM')
    expect(results[0].image_url).toBe('https://example.com/pic.jpg')
  })

  it('returns empty array when no accounts in response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ total: 0 }),
    })

    const results = await searchInfluencers('nonexistent')

    expect(results).toEqual([])
  })

  it('calculates match_score based on engagement and followers', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        accounts: [
          {
            user_id: '1',
            profile: { username: 'high_engagement', followers: 100000, engagement_percent: 8.0 },
          },
          {
            user_id: '2',
            profile: { username: 'low_engagement', followers: 500, engagement_percent: 0.5 },
          },
        ],
      }),
    })

    const results = await searchInfluencers('test')

    // High engagement + high followers = higher score
    expect(results[0].match_score).toBeGreaterThan(results[1].match_score)
  })

  it('sends query and filters in POST body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ accounts: [] }),
    })

    await searchInfluencers('yoga', { platform: 'tiktok', min_reach: 10000 })

    const [, options] = mockFetch.mock.calls[0]
    const body = JSON.parse(options.body)
    expect(body.query).toBe('yoga')
    expect(body.filters.platform).toBe('tiktok')
    expect(body.filters.min_reach).toBe(10000)
  })

  it('throws error on failed search', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Server error'),
    })

    await expect(searchInfluencers('test')).rejects.toThrow('Failed to search influencers')
  })

  it('generates voice analysis based on engagement level', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        accounts: [
          { user_id: '1', profile: { username: 'a', followers: 1000, engagement_percent: 6.0 } },
          { user_id: '2', profile: { username: 'b', followers: 1000, engagement_percent: 3.0 } },
          { user_id: '3', profile: { username: 'c', followers: 1000, engagement_percent: 1.0 } },
        ],
      }),
    })

    const results = await searchInfluencers('test')

    // High engagement: Engaging, Authentic, Conversational
    expect(results[0].voice_analysis).toContain('Engaging')
    // Medium engagement: Professional, Clear, Informative
    expect(results[1].voice_analysis).toContain('Professional')
    // Low engagement: Consistent, Reliable, Steady
    expect(results[2].voice_analysis).toContain('Consistent')
  })

  it('handles missing profile fields gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        accounts: [
          { user_id: 'no-profile', profile: {} },
        ],
      }),
    })

    const results = await searchInfluencers('test')

    expect(results).toHaveLength(1)
    expect(results[0].handle).toBe('no-profile') // Falls back to user_id
    expect(results[0].followers).toBe(0)
    expect(results[0].engagement_rate).toBe(0)
  })
})

describe('getInfluencerProfile', () => {
  it('fetches profile by handle', async () => {
    const mockProfile = {
      handle: 'testuser',
      platform: 'INSTAGRAM',
      followers: 50000,
      engagement_rate: 5.0,
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProfile),
    })

    const result = await getInfluencerProfile('testuser')

    expect(result.handle).toBe('testuser')
    const [url] = mockFetch.mock.calls[0]
    expect(url).toContain('/discovery/influencers/testuser')
  })

  it('encodes special characters in handle', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ handle: 'user@name' }),
    })

    await getInfluencerProfile('user@name')

    const [url] = mockFetch.mock.calls[0]
    expect(url).toContain(encodeURIComponent('user@name'))
  })

  it('throws on failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })

    await expect(getInfluencerProfile('nonexistent')).rejects.toThrow('Failed to fetch influencer profile')
  })
})
