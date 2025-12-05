/**
 * @import {OnChange} from '@likec4/diagram'
 */

export const ComponentName = {
  View: WEBCOMPONENT_PREFIX + '-view',
  Browser: WEBCOMPONENT_PREFIX + '-browser',
}

let BASE = import.meta.env.BASE_URL
if (!BASE.endsWith('/')) {
  BASE = BASE + '/'
}

export const pageTitle = PAGE_TITLE
export const useHashHistory = __USE_HASH_HISTORY__ === true

export const basepath = useHashHistory ? '/' : BASE

export const withOverviewGraph = __USE_OVERVIEW_GRAPH__ === true

export const isDevelopment = import.meta.env.DEV

export const krokiD2SvgUrl = import.meta.env.VITE_KROKI_D2_SVG_URL || 'https://kroki.io/d2/svg'
export const krokiPumlSvgUrl = import.meta.env.VITE_KROKI_D2_SVG_URL || 'https://kroki.io/plantuml/svg'

/**
 * @type {boolean}
 */
export let isHotEnabled = false

/**
 * @type {OnChange|null}
 */
export let onViewChangeViaPlugin = null

if (import.meta.hot && import.meta.env.DEV) {
  isHotEnabled = true

  onViewChangeViaPlugin = (event) => {
    console.log('onChange event:', event)
    import.meta.hot.send('likec4:view:onChange', event)
  }
}
