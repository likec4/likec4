import { EdgeLabelMetrics } from '@likec4/core/styles'
import { describe, expect, it } from 'vitest'
import { measureEdgeLabel } from './measure-edge-label'

// There is no canvas in tests, so labels are estimated (see estimateLabel)
describe('measureEdgeLabel', () => {
  const { paddingBlock, paddingInline, gap, actionButtonSize } = EdgeLabelMetrics
  const lineHeight = EdgeLabelMetrics.label.fontSize * EdgeLabelMetrics.label.lineHeight

  it('includes paddings', () => {
    const measured = measureEdgeLabel({ label: 'calls' })
    expect(measured.label).toBe('calls')
    expect(measured.height).toBe(Math.ceil(lineHeight + 2 * paddingBlock))
    expect(measured.width).toBeGreaterThan(2 * paddingInline)
  })

  it('reserves space for the action button', () => {
    const without = measureEdgeLabel({ label: 'calls' })
    const withButton = measureEdgeLabel({ label: 'calls', withActionButton: true })
    expect(withButton.height - without.height).toBe(gap + actionButtonSize)
  })

  it('does not exceed max width', () => {
    const measured = measureEdgeLabel({
      label: 'a very long label that has to be wrapped into several lines to fit',
      maxWidth: 100,
    })
    expect(measured.width).toBeLessThanOrEqual(100 + 2 * paddingInline)
  })

  it('technology only', () => {
    const measured = measureEdgeLabel({ label: null, technology: 'HTTPS' })
    expect(measured.label).toBeNull()
    expect(measured.height).toBe(Math.ceil(EdgeLabelMetrics.technology.fontSize + 2 * paddingBlock))
  })
})
