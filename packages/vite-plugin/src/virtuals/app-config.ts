import { logGenerating } from '../logger'
import type { LikeC4AppConfig } from '../types'
import type { VirtualModule } from './_shared'

export function createAppConfigModule(config: LikeC4AppConfig | undefined): VirtualModule {
  const {
    webcomponentPrefix = 'likec4',
    pageTitle = 'LikeC4',
    useHashHistory = false,
    theme = 'auto',
  } = config || {}
  return {
    id: 'likec4:app-config',
    virtualId: 'likec4:plugin/app-config.js',
    async load() {
      logGenerating('app-config')
      const code = `
export let ComponentName = {
  View: ${JSON.stringify(webcomponentPrefix + '-view')},
  Browser: ${JSON.stringify(webcomponentPrefix + '-browser')},
}

let BASE = import.meta.env.BASE_URL
if (!BASE.endsWith('/')) {
  BASE = BASE + '/'
}

export let pageTitle = ${JSON.stringify(pageTitle)}
export let useHashHistory = ${useHashHistory}

export let basepath = useHashHistory ? '/' : BASE

export let isDevelopment = import.meta.env.DEV

export let defaultTheme = ${JSON.stringify(theme)}

export let krokiD2SvgUrl = import.meta.env.VITE_KROKI_D2_SVG_URL || 'https://kroki.io/d2/svg'
export let krokiPumlSvgUrl = import.meta.env.VITE_KROKI_D2_SVG_URL || 'https://kroki.io/plantuml/svg'

`
      return code
    },
  }
}
