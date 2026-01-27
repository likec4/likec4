import type { LayoutedElementView } from '@likec4/core/types'
import k from 'tinyrainbow'
import type { LikeC4VitePluginRpc } from './protocol'
import type { PluginRPCParams } from './rpc'

export async function calcAdhocView({
  logger,
  likec4,
}: PluginRPCParams, data: Parameters<LikeC4VitePluginRpc['calcAdhocView']>[0]) {
  logger.info([
    k.green('adhoc:view'),
    k.dim('project:'),
    data.projectId,
  ].join(' '))
  const view = await likec4.views.adhocView(data.predicates, data.projectId)
  logger.info([
    k.green('adhoc:view'),
    '✅',
  ].join(' '))
  return view as LayoutedElementView
}
