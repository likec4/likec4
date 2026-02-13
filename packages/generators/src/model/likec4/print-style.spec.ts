import type { ElementStyle } from '@likec4/core/types'
import { CompositeGeneratorNode, toString as nodeToString } from 'langium/generate'
import { describe, expect, it } from 'vitest'
import { printStyleBlock, printStyleProperties } from './print-style'

function render(fn: (node: CompositeGeneratorNode) => void): string {
  const node = new CompositeGeneratorNode()
  fn(node)
  return nodeToString(node)
}

describe('printStyleBlock', () => {
  it('does nothing for empty style', () => {
    const output = render(node => printStyleBlock({}, node))
    expect(output).toBe('')
  })

  it('prints shape', () => {
    const output = render(node => printStyleBlock({ shape: 'browser' }, node))
    expect(output).toContain('style {')
    expect(output).toContain('shape browser')
    expect(output).toContain('}')
  })

  it('prints color', () => {
    const output = render(node => printStyleBlock({ color: 'amber' } as Partial<ElementStyle>, node))
    expect(output).toContain('color amber')
  })

  it('prints opacity with percent', () => {
    const output = render(node => printStyleBlock({ opacity: 50 } as Partial<ElementStyle>, node))
    expect(output).toContain('opacity 50%')
  })

  it('prints multiple keyword', () => {
    const output = render(node => printStyleBlock({ multiple: true } as Partial<ElementStyle>, node))
    expect(output).toContain('multiple')
  })

  it('prints all style properties', () => {
    const style: Partial<ElementStyle> = {
      shape: 'storage',
      color: 'red',
      icon: 'aws:s3',
      iconColor: 'blue',
      iconSize: 'lg',
      iconPosition: 'top',
      border: 'dashed',
      opacity: 80,
      size: 'md',
      padding: 'sm',
      textSize: 'lg',
      multiple: true,
    } as Partial<ElementStyle>
    const output = render(node => printStyleBlock(style, node))
    expect(output).toContain('shape storage')
    expect(output).toContain('color red')
    expect(output).toContain('icon aws:s3')
    expect(output).toContain('iconColor blue')
    expect(output).toContain('iconSize lg')
    expect(output).toContain('iconPosition top')
    expect(output).toContain('border dashed')
    expect(output).toContain('opacity 80%')
    expect(output).toContain('size md')
    expect(output).toContain('padding sm')
    expect(output).toContain('textSize lg')
    expect(output).toContain('multiple')
  })
})

describe('printStyleProperties', () => {
  it('does nothing for empty style', () => {
    const output = render(node => printStyleProperties({}, node))
    expect(output).toBe('')
  })

  it('prints properties without wrapping style block', () => {
    const output = render(node => printStyleProperties({ shape: 'person' }, node))
    expect(output).toContain('shape person')
    expect(output).not.toContain('style {')
  })

  it('prints multiple properties', () => {
    const style: Partial<ElementStyle> = {
      color: 'green',
      border: 'solid',
    } as Partial<ElementStyle>
    const output = render(node => printStyleProperties(style, node))
    expect(output).toContain('color green')
    expect(output).toContain('border solid')
  })
})
