import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { decodeSvgDataUrl, IconRenderer } from './IconRenderer'

vi.mock('./vscode', () => ({
  ExtensionApi: {
    readLocalIcon: vi.fn<(_: string) => Promise<{ base64data: string | null }>>(),
  },
}))

describe('IconRenderer', () => {
  it('renders bootstrap icons as a colorable mask instead of an image', () => {
    const html = renderToStaticMarkup(
      <IconRenderer
        node={{
          id: 'test',
          title: 'Test',
          icon: 'bootstrap:file-earmark-code',
        }} />,
    )

    expect(html).not.toContain('<img')
    expect(html).toContain('https://icons.like-c4.dev/bootstrap/file-earmark-code.svg')
    expect(html).toContain('background-color:currentColor')
  })

  it('keeps non-bootstrap bundled icons as CDN images', () => {
    const html = renderToStaticMarkup(
      <IconRenderer
        node={{
          id: 'test',
          title: 'Test',
          icon: 'tech:react',
        }} />,
    )

    expect(html).toContain('<img')
    expect(html).toContain('src="https://icons.like-c4.dev/tech/react.svg"')
  })

  it('decodes SVG data URLs so local SVG icons can inherit currentColor', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><path stroke="currentColor"/></svg>'

    expect(decodeSvgDataUrl(`data:image/svg+xml;base64,${btoa(svg)}`)).toBe(svg)
  })
})
