import { LikeC4Styles as LikeC4StylesLib } from '@likec4/core/styles'
import { MantineProvider } from '@mantine/core'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { useLikeC4Styles } from './hooks/useLikeC4Styles'
import { LikeC4Styles } from './LikeC4Styles'

vi.mock('./hooks/useLikeC4Styles', () => ({ useLikeC4Styles: vi.fn<() => LikeC4StylesLib>() }))

describe('LikeC4Styles', () => {
  it('should render the custom CSS of the project', () => {
    vi.mocked(useLikeC4Styles).mockReturnValue(
      LikeC4StylesLib.from({
        customCss: { paths: ['x.css'], content: '.custom { color: red; }' },
      }),
    )

    const html = renderToStaticMarkup(
      <MantineProvider>
        <LikeC4Styles rootSelector="#root" />
      </MantineProvider>,
    )

    expect(html).toContain('.custom { color: red; }')
  })
})
