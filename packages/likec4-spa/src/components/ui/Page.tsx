import { LogoIcon } from '@likec4/diagram'
import { css } from '@likec4/styles/css'
import { styled } from '@likec4/styles/jsx'

/**
 * Horizontal padding of the page sections, so header, toolbar and content line up
 */
const padX = { base: '4', sm: '8', xl: '12' } as const

/**
 * Full-height page in the canvas color
 */
export const Page = styled('div', {
  base: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'surface.canvas',
    color: 'text',
    fontFamily: 'body',
    fontSize: 'md',
    lineHeight: '[1.45]',
  },
})

/**
 * Scrolls the page content below a fixed part
 */
export const PageScroll = styled('div', {
  base: {
    flex: '1',
    minHeight: '0',
    overflowY: 'auto',
  },
})

/**
 * Page title on the left, metrics on the right
 */
export const PageHeader = styled('section', {
  base: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '6',
    paddingTop: '6',
    paddingBottom: '6',
    paddingX: padX,
  },
})

/**
 * Logo (or burger) and the title
 */
export const PageHeading = styled('div', {
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: '3',
    minWidth: '0',
  },
})

export const PageTitle = styled('h1', {
  base: {
    margin: '0',
    fontFamily: 'display',
    fontSize: { base: '[22px]', sm: '[26px]' },
    lineHeight: '[1.1]',
    fontWeight: 'bold',
    letterSpacing: '[-0.02em]',
    color: 'text.display',
  },
})

const logo = css({
  flexShrink: '0',
  width: '[28px]',
  height: '[28px]',
})

export function PageLogo() {
  return <LogoIcon className={logo} aria-hidden />
}

/**
 * Full-width bar under the header
 */
export const Toolbar = styled('div', {
  base: {
    flexShrink: '0',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '3',
    paddingY: '3.5',
    paddingX: padX,
    borderTopWidth: '1',
    borderTopStyle: 'solid',
    borderBottomWidth: '1',
    borderBottomStyle: 'solid',
    borderColor: 'border.subtle',
    backgroundColor: 'surface.sunken',
  },
})

/**
 * Pushes the following toolbar items to the right
 */
export const ToolbarSpacer = styled('span', {
  base: {
    flex: '1',
  },
})

/**
 * Page content with the page paddings
 */
export const PageSection = styled('div', {
  base: {
    paddingTop: '8',
    paddingBottom: '12',
    paddingX: padX,
  },
})

/**
 * Framed area that fills the rest of the page, for a diagram
 */
export const PageCanvas = styled('main', {
  base: {
    flex: '1',
    minHeight: '0',
    position: 'relative',
    marginTop: '8',
    marginBottom: '10',
    marginX: padX,
    borderWidth: '1',
    borderStyle: 'solid',
    borderColor: 'border.subtle',
    borderRadius: 'md',
    overflow: 'hidden',
  },
})
