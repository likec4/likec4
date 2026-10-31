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

  it('wraps long label to distinct lines', () => {
    const label = 'a very long label that has to be wrapped into several lines to fit'
    const measured = measureEdgeLabel({ label, maxWidth: 200 })
    const lines = measured.label!.split('\n')
    expect(lines.length).toBeGreaterThan(1)
    expect(lines.join(' ')).toBe(label)
  })

  it('keeps explicit line breaks and limits lines', () => {
    expect(measureEdgeLabel({ label: 'first\nsecond' }).label).toBe('first\nsecond')
    const many = Array.from({ length: 10 }, (_, i) => `line${i}`).join('\n')
    expect(measureEdgeLabel({ label: many }).label!.split('\n')).toHaveLength(EdgeLabelMetrics.label.maxLines)
  })

  it('technology only', () => {
    const measured = measureEdgeLabel({ label: null, technology: 'HTTPS' })
    expect(measured.label).toBeNull()
    expect(measured.height).toBe(Math.ceil(EdgeLabelMetrics.technology.fontSize + 2 * paddingBlock))
  })
})
