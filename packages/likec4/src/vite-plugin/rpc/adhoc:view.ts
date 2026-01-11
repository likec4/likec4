import type { LayoutedElementView } from '@likec4/core/types'
import k from 'tinyrainbow'
import type { IfAny } from 'type-fest'
import type { InferCustomEventPayload, MinimalPluginContextWithoutEnvironment } from 'vite'
import type { PluginRPCParams } from './index'
import type { LikeC4VitePluginRpc } from './protocol'
import { sendError } from './sendError'

const reqEventName = 'likec4:client:adhoc:predicates'
const respEventName = 'likec4:server:adhoc:view'

type RequestPayload = IfAny<
  InferCustomEventPayload<typeof reqEventName>,
  never,
  InferCustomEventPayload<typeof reqEventName>
>
type ResponsePayload = IfAny<
  InferCustomEventPayload<typeof respEventName>,
  never,
  InferCustomEventPayload<typeof respEventName>
>

export function handleAdhocRequest(
  this: MinimalPluginContextWithoutEnvironment,
  {
    logger,
    likec4,
    server,
  }: PluginRPCParams,
) {
  server.hot.on(reqEventName, async (data: RequestPayload) => {
    try {
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
      server.hot.send(
        respEventName,
        {
          id: data.id,
          view,
        } satisfies ResponsePayload,
      )
    } catch (e) {
      const error = e as Error
      logger.error(error)
      sendError(server, { name: error.name, error: error.stack ?? error.message })
    }
  })
}

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
