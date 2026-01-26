import k from 'tinyrainbow'
import type { PluginRPCParams } from './index'
import type { LikeC4VitePluginRpc } from './protocol'
import { sendError } from './sendError'

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
    sendError(server, { name: 'LikeC4ViewChangeError', error: result.error })
    return
  }
  logger.info([
    k.green('view:onChange'),
    '✅',
  ].join(' '))
}
