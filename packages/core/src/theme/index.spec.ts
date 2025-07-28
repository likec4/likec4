import { describe, it } from 'vitest'
import { computeColorValues } from '.'
import {darkValue, lightValue} from './__test__/theme-index'

describe('index', () => {

  it('lightColor', ({ expect }) => {
    expect(computeColorValues("#caf2ff")).toEqual(lightValue)
  })

  it('darkColor', ({ expect }) => {
    expect(computeColorValues("#1F32C4")).toEqual(darkValue)
  })
})
