import { themeToVars } from '@mantine/vanilla-extract'

export {
  vars,
  xyvars,
} from './theme-vars.css'

export const rootClassName = 'likec4-diagram-root'
export const whereNotReducedGraphics = `:where(.${rootClassName}:not([data-likec4-reduced-graphics]))`
export const whereReducedGraphics = `:where(.${rootClassName}:is([data-likec4-reduced-graphics="true"]))`
export const whereSmallZoom = `:where([data-likec4-zoom-small="true"])`

export const whereLight = ':where([data-mantine-color-scheme="light"])'
export const whereDark = ':where([data-mantine-color-scheme="dark"])'

export const easings = {
  out: 'cubic-bezier(0, 0, 0.40, 1)',
  inOut: 'cubic-bezier(0.50, 0, 0.2, 1)',
}

export const transitions = {
  fast: `all 130ms ${easings.inOut}`,
}

export const mantine = themeToVars({})
