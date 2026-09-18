import { defineConfig } from 'reactive-vscode'
import { type NestedScopedConfigs, scopedConfigs } from './meta.ts'

export const config = defineConfig<NestedScopedConfigs>(
  scopedConfigs.scope,
  // scopedConfigs.defaults,
)
