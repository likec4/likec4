import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { IconRenderer } from './IconRenderer'

describe('IconRenderer', () => {
  it('inlines decodable SVG data URLs so iconColor can style currentColor', () => {
    const svgDataUrl =
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3Cpath stroke="currentColor"/%3E%3C/svg%3E'

    const html = renderToStaticMarkup(
      <IconRenderer
        element={{
          id: 'test',
          title: 'Test',
          icon: svgDataUrl,
        }} />,
    )

    expect(html).toContain('<svg')
    expect(html).toContain('stroke="currentColor"')
    expect(html).not.toContain('<img')
  })

  it('falls back to an image when an SVG data URL cannot be decoded', () => {
    const svgDataUrl =
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><path stroke="currentColor"/></svg>'

    const html = renderToStaticMarkup(
      <IconRenderer
        element={{
          id: 'test',
          title: 'Test',
          icon: svgDataUrl,
        }} />,
    )

    expect(html).toContain('class="likec4-element-icon"')
    expect(html).toContain('<img')
    expect(html).toContain('src="data:image/svg+xml,')
  })
})
