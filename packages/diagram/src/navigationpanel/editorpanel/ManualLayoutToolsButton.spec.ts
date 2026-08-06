import { describe, expect, it } from 'vitest'
import { manualLayoutTooltipProps } from './ManualLayoutToolsButton'

describe('manualLayoutTooltipProps', () => {
  it('leaves the tooltip uncontrolled while the tools are closed', () => {
    expect(manualLayoutTooltipProps(false)).toEqual({})
  })

  it('forces the tooltip closed while the tools are open', () => {
    expect(manualLayoutTooltipProps(true)).toEqual({ opened: false })
  })
})
