export const ComponentName = {
  View: WEBCOMPONENT_PREFIX + '-view',
  Browser: WEBCOMPONENT_PREFIX + '-browser'
}

let BASE = import.meta.env.BASE_URL
if (!BASE.endsWith('/')) {
  BASE = BASE + '/'
}

export const useHashHistory = __USE_HASH_HISTORY__ === true

export const basepath = useHashHistory ? '/' : BASE

export const withOverviewGraph = __USE_OVERVIEW_GRAPH__ === true

export const isDevelopment = import.meta.env.DEV

export const krokiD2SvgUrl = import.meta.env.VITE_KROKI_D2_SVG_URL || 'https://kroki.io/d2/svg'
