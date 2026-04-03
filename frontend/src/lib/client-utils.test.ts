import { buildDisplayUsername, buildMatchmakerQuery, parseJsonPayload } from './client-utils'

describe('client-utils', () => {
  it('parses valid JSON payloads', () => {
    const value = parseJsonPayload<{ move: number }>('{"move":3}', { move: -1 })
    expect(value.move).toBe(3)
  })

  it('returns fallback on invalid JSON', () => {
    const value = parseJsonPayload<{ move: number }>('not-json', { move: -1 })
    expect(value.move).toBe(-1)
  })

  it('builds display username from fallback user id', () => {
    expect(buildDisplayUsername('abcd1234', '')).toBe('Playerabcd')
  })

  it('builds mode matchmaker query', () => {
    expect(buildMatchmakerQuery('timed')).toBe('+properties.mode:timed')
  })
})
