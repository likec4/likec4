import type { PluginOptions } from '@pandacss/dev/postcss'
import type * as postcss from 'postcss'

declare function pandaCss(options?: PluginOptions): postcss.Plugin

export { pandaCss as default }
