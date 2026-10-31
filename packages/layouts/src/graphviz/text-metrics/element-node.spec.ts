import { LikeC4Styles } from '@likec4/core/styles'
import type { ComputedNode } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { elementNodeBox } from './element-node'

type Node = Parameters<typeof elementNodeBox>[0]

const node = (props: Partial<Node> & { title: string }): Node => ({
  technology: null,
  description: null,
  icon: null,
  shape: 'rectangle',
  style: {},
  ...props,
} satisfies Pick<ComputedNode, 'title' | 'technology' | 'description' | 'icon' | 'shape' | 'style'>)

const styles = LikeC4Styles.DEFAULT

// Expected lines are rendered in Chromium with the default theme
describe('elementNodeBox', () => {
  it('keeps the size of the node when the content fits', () => {
    expect(elementNodeBox(node({ title: 'Medium node', technology: 'Node.js' }), styles)).toEqual({
      width: 320,
      height: 180,
      title: ['Medium node'],
      technology: ['Node.js'],
      description: [],
    })
  })

  it('limits title lines and hides technology and description on xs', () => {
    const box = elementNodeBox(
      node({
        title: 'Extra small node with a rather long title that wraps',
        technology: 'Technology',
        description: { txt: 'Description' },
        style: { size: 'xs' },
      }),
      styles,
    )
    expect(box).toMatchObject({ width: 180, height: 100, technology: [], description: [] })
    expect(box!.title).toHaveLength(2)
  })

  it('keeps technology on a single line', () => {
    const box = elementNodeBox(
      node({
        title: 'Title',
        technology: 'A very long technology string that does not fit into a single line of the node',
      }),
      styles,
    )
    expect(box!.technology).toHaveLength(1)
  })

  it('limits description lines', () => {
    const description = {
      txt: 'This element has a really long description that is going to wrap to five lines and then it is '
        + 'clamped by the line clamp, because the description is limited to five lines on medium nodes. '
        + 'Some more text to be sure that it is clamped.',
    }
    expect(elementNodeBox(node({ title: 'Long description', description }), styles)!.description).toHaveLength(5)
    expect(
      elementNodeBox(node({ title: 'Long description', description, style: { size: 'sm' } }), styles)!.description,
    ).toHaveLength(3)
  })

  it('preserves explicit line breaks', () => {
    const box = elementNodeBox(node({ title: 'Title', description: { txt: 'Line one\nLine two\nLine three' } }), styles)
    expect(box!.description).toEqual(['Line one', 'Line two', 'Line three'])
  })

  it('icon on the side takes width from the text', () => {
    const description = { txt: 'Icon on the left takes some width from the text, so the text wraps earlier' }
    const withoutIcon = elementNodeBox(node({ title: 'Title', description }), styles)!
    const withIcon = elementNodeBox(node({ title: 'Title', description, icon: 'tech:swift' }), styles)!
    expect(withIcon.description.length).toBeGreaterThan(withoutIcon.description.length)
  })

  it('grows the node when icon on the top does not fit', () => {
    // Chromium: 204px
    const box = elementNodeBox(
      node({
        title: 'Icon on the top',
        technology: 'Kafka',
        description: {
          txt: 'Icon on the top adds to the height of the content, together with the description of several lines',
        },
        icon: 'tech:kafka',
        style: { iconPosition: 'top' },
      }),
      styles,
    )
    expect(box).toMatchObject({ width: 320, height: 204 })
  })

  it('skips nodes with fixed sizing', () => {
    expect(elementNodeBox(node({ title: 'Fixed', style: { sizing: 'fixed' } }), styles)).toBeNull()
  })
})
