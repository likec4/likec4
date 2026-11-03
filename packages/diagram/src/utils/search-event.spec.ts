import { describe, expect, it } from 'vitest'
import { isEventFromSearch } from './search-event'

const el = (dataset: Record<string, string> = {}) => ({ dataset }) as unknown as EventTarget

const eventWithPath = (...path: EventTarget[]) => ({ composedPath: () => path })

describe('isEventFromSearch', () => {
  it('detects events from inside the search overlay', () => {
    const input = el()
    const search = el({ likec4Search: 'true' })
    expect(isEventFromSearch(eventWithPath(input, search, el()))).toBe(true)
  })

  it('ignores events from overlays and the document', () => {
    expect(isEventFromSearch(eventWithPath(el(), el({ likec4Color: 'primary' })))).toBe(false)
    expect(isEventFromSearch(eventWithPath({} as EventTarget))).toBe(false)
  })
})
