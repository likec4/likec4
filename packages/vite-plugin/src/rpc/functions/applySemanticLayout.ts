import { invariant } from '@likec4/core'
import { enhanceLayoutWithAI } from '@likec4/layouts/ai'
import k from 'tinyrainbow'
import type { LikeC4VitePluginRpc } from '../protocol'
import type { PluginRPCParams } from '../rpc'

export async function applySemanticLayout({
  logger,
  ai,
  likec4,
}: PluginRPCParams, data: Parameters<LikeC4VitePluginRpc['applySemanticLayout']>[0]) {
  invariant(ai, 'AI is not configured')
  logger.info([
    k.green('semantic:layout'),
    k.dim('project:'),
    data.projectId,
    k.dim('view:'),
    data.viewId,
  ].join(' '))

  const { chat, EventType } = await import('@tanstack/ai')

  const model = await likec4.computedModel(data.projectId)
  const view = model.findView(data.viewId)
  invariant(view, `View ${data.viewId} not found in project ${data.projectId}`)

  logger.info([
    k.green('semantic:layout'),
    k.dim('call'),
    ai.adapter.name,
  ].join(' '))

  const hints = await enhanceLayoutWithAI(
    view.$view,
    {
      name: ai.adapter.name,
      async sendRequest({ systemPrompt, userPrompt, diagram }) {
        const stream = chat({
          ...ai,
          systemPrompts: [systemPrompt],
          stream: true,
          messages: [{
            role: 'user',
            content: [{
              type: 'text',
              content: systemPrompt,
            }, {
              type: 'text',
              content: userPrompt,
            }, {
              type: 'text',
              content: diagram,
            }],
          }],
        })
        let content = ''
        for await (const chunk of stream) {
          switch (chunk.type) {
            case EventType.TEXT_MESSAGE_CONTENT: {
              process.stdout.write(chunk.delta)
              content += chunk.delta
              break
            }
            case EventType.REASONING_MESSAGE_CONTENT: {
              process.stdout.write(chunk.delta)
              break
            }
          }
        }

        return content
      },
    },
  )

  if (!hints) {
    logger.warn([
      k.yellow('semantic:layout'),
      'No semantic layout generated',
    ].join(' '))
    return
  }

  logger.info([
    k.green('semantic:layout'),
    k.dim('apply ai hints to layout'),
  ].join(' '))

  const result = await likec4.views.layoutView({
    viewId: data.viewId,
    projectId: data.projectId,
    layoutHints: hints,
  })

  if (!result) {
    logger.error([
      k.red('semantic:layout'),
      'layout hints failed',
    ].join(' '))
    return
  }

  logger.info([
    k.green('semantic:layout'),
    k.dim('save view snapshot'),
  ].join(' '))

  const applyResult = await likec4.editor.applyChange({
    viewId: data.viewId,
    projectId: data.projectId,
    change: {
      op: 'save-view-snapshot',
      layout: result.diagram,
    },
  })

  if (!applyResult.success) {
    logger.error([
      k.red('semantic:layout'),
      'apply change failed',
      applyResult.error,
    ].join(' '))
    const err = new Error(applyResult.error)
    err.stack = applyResult.error
    throw err
  }

  logger.info([
    k.green('semantic:layout'),
    k.dim('project:'),
    data.projectId,
    k.dim('view:'),
    data.viewId,
    '✅',
  ].join(' '))
}
