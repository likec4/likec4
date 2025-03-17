import { type PluginOptions, pandacss } from '@pandacss/dev/postcss'
import type { PluginCreator } from 'postcss'

const pandaCss = pandacss as any as PluginCreator<PluginOptions>

export default pandaCss
