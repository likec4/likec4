import { describe, expect, it } from 'vitest'
import { title, useHashHistory, withoutDefault } from './options'

describe('withoutDefault', () => {
  it('drops the default and keeps it in the help', () => {
    const option = withoutDefault(title)

    expect(option).not.toHaveProperty('default')
    expect(option.defaultDescription).toBe('"LikeC4"')
    expect(option.alias).toBe(title.alias)
  })

  it('keeps an option without the default as is', () => {
    expect(withoutDefault(useHashHistory)).toEqual(useHashHistory)
  })
})
