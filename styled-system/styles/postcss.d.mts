import { type PluginOptions } from '@pandacss/dev/postcss'
import type { PluginCreator } from 'postcss'

declare const pandaCss: PluginCreator<PluginOptions>

export { pandaCss as default }
