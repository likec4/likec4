import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createCustomization, customizeComponents } from '../../customization'
import { type ElementShapeProps, ElementShape } from './ElementShape'

const data: ElementShapeProps['data'] = { shape: 'cylinder', width: 320, height: 180 }

/**
 * {@link createCustomization} for spec slots: they are not registered in `Customizables`
 */
const specCustomization = (...args: Parameters<typeof customizeComponents>) => {
  return createCustomization({
    components: customizeComponents(...args),
  })
}

describe('ElementShape slot', () => {
  it('renders the built-in shape without customization', () => {
    const html = renderToStaticMarkup(<ElementShape data={data} />)

    expect(html).toContain('viewBox="0 0 320 180"')
    expect(html).toContain('likec4-shape-outline')
  })

  it('renders the replacement with the props of the shape', () => {
    const CustomizationProvider = specCustomization({
      ElementShape: ({ data }) => <i data-custom-shape={`${data.shape}:${data.width}x${data.height}`} />,
    })
    const html = renderToStaticMarkup(
      <CustomizationProvider>
        <ElementShape data={data} />
      </CustomizationProvider>,
    )

    expect(html).toBe('<i data-custom-shape="cylinder:320x180"></i>')
  })

  it('gives the built-in shape to the wrapper', () => {
    const CustomizationProvider = specCustomization(({ wrap }) => ({
      ElementShape: wrap(({ Original, ...props }) => (
        <g data-wrapped>
          <Original {...props} />
        </g>
      )),
    }))
    const html = renderToStaticMarkup(
      <CustomizationProvider>
        <ElementShape data={data} />
      </CustomizationProvider>,
    )

    expect(html).toContain('<g data-wrapped="true">')
    expect(html).toContain('viewBox="0 0 320 180"')
  })
})
