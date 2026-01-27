import k from 'tinyrainbow'
import type { PluginRPCParams } from './index'
import type { LikeC4VitePluginRpc } from './protocol'

export async function updateView({
  logger,
  likec4,
  server,
}: PluginRPCParams, data: Parameters<LikeC4VitePluginRpc['updateView']>[0]) {
  logger.info([
    k.green('view:onChange'),
    k.dim('project') + ':',
    data.projectId,
    k.dim('view') + ':',
    data.viewId,
    k.dim('change') + ':',
    data.change.op,
  ].join(' '))
  const result = await likec4.editor.applyChange(data)
  if (!result.success) {
    logger.error(`Failed to apply view change:\n${result.error}`)
    const err = new Error(result.error)
    err.stack = result.error
    throw err
  }
  logger.info([
    k.green('view:onChange'),
    '✅',
  ].join(' '))
}
