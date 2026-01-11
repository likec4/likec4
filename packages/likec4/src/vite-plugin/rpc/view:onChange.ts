import k from 'tinyrainbow'
import type { IfAny } from 'type-fest'
import type { InferCustomEventPayload, MinimalPluginContextWithoutEnvironment } from 'vite'
import type { PluginRPCParams } from './index'
import type { LikeC4VitePluginRpc } from './protocol'
import { sendError } from './sendError'

const eventName = 'likec4:client:view:onChange'

type OnChangePayload = IfAny<
  InferCustomEventPayload<typeof eventName>,
  never,
  InferCustomEventPayload<typeof eventName>
>

export function handleOnViewChange(
  this: MinimalPluginContextWithoutEnvironment,
  {
    logger,
    likec4,
    server,
  }: PluginRPCParams,
) {
  server.hot.on(eventName, async (data: OnChangePayload) => {
    try {
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
    } catch (e) {
      const error = e as Error
      logger.error(error)
      sendError(server, { name: error.name, error: error.stack ?? error.message })
    }
  })
}

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
