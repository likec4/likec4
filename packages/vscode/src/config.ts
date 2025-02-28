import { defineConfigObject } from 'reactive-vscode'
import { type NestedScopedConfigs, scopedConfigs } from './meta'

export const config = defineConfigObject<NestedScopedConfigs>(
  scopedConfigs.scope,
  scopedConfigs.defaults,
)
