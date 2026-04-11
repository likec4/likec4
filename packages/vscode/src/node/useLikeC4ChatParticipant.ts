import { enhanceLayoutWithAI } from '@likec4/layouts/ai'
import { loggable } from '@likec4/log'
import { defineService, extensionContext, toValue, useDisposable } from 'reactive-vscode'
import vscode from 'vscode'
import { commands } from '../meta.ts'
import { useDiagramPanel } from '../panel/useDiagramPanel.ts'
import { useExtensionLogger } from '../useExtensionLogger.ts'
import { useMessenger } from '../useMessenger.ts'
import { useRpc } from '../useRpc.ts'

export const useLikeC4ChatParticipant = defineService(() => {
  const { logger, output, logWarn } = useExtensionLogger()
  const preview = useDiagramPanel()
  const messenger = useMessenger()
  const rpc = useRpc()

  const participant = useDisposable(vscode.chat.createChatParticipant(
    'likec4.layout-assistant',
    async (req, context, stream, token) => {
      logger.debug`Received chat request with command ${req.command}, model: ${req.model.family}`

      if (req.command !== 'semantic-layout') {
        stream.warning(`@likec4-layout only processes "semantic-layout" command for now.`)
        return
      }

      const viewId = toValue(preview.viewId)
      const projectId = toValue(preview.projectId)
      if (!viewId || !projectId) {
        stream.warning(`Couldn't find any opened view\n\n`)
        stream.button({
          title: 'Open view',
          command: commands.openPreview,
        })
        return
      }

      // Fetch the computed model to get the view
      const modelResult = await rpc.fetchComputedModel(projectId)
      if (!modelResult?.model) {
        stream.warning(
          new vscode.MarkdownString(
            `Failed to fetch model for project \`${projectId}\`.\n\nMake sure the project is properly loaded and try again.`,
          ),
        )
        return
      }

      const computedView = modelResult.model.views[viewId]
      if (!computedView) {
        stream.warning(`View "${viewId}" not found in model.`)
        return
      }
      if (computedView._type === 'dynamic') {
        stream.warning(`@likec4 cannot enhance layout of dynamic views.`)
        return
      }
      const location = await rpc.locate({ view: viewId, projectId }).catch(err => {
        logWarn(err)
        return null
      })
      if (!location) {
        stream.warning(`Failed to locate view "${viewId}". Make sure the view is properly loaded and try again.`)
        return
      }

      messenger.broadcastAiLayoutUpdate({
        viewId,
        projectId,
        state: 'in-progress',
      })

      stream.markdown(`I will analyze view \`${viewId}\``)
      stream.anchor(location)
      stream.markdown(` (project \`${projectId}\`) and suggest layout.\n`)

      stream.progress(`Analyzing view...`)

      const cancelStream = new vscode.CancellationTokenSource()
      token.onCancellationRequested(() => {
        cancelStream.cancel()
      })

      let hints
      try {
        hints = await enhanceLayoutWithAI<vscode.CancellationToken>(
          computedView,
          {
            name: req.model.family,
            sendRequest: async ({ diagram, systemPrompt, userPrompt }, cancelToken) => {
              const messsages = [
                vscode.LanguageModelChatMessage.Assistant(systemPrompt),
                vscode.LanguageModelChatMessage.User(userPrompt + '\n\n' + diagram),
              ]

              const res = await req.model.sendRequest(
                messsages,
                {
                  justification: 'LikeC4 needs AI assistance to optimize diagram layout',
                  tools: [],
                },
                cancelToken,
              )

              let text = ''
              for await (const chunk of res.text) {
                if (cancelToken.isCancellationRequested) {
                  throw new vscode.CancellationError()
                }
                if (text === '') {
                  stream.markdown(`Received response from AI, processing...`)
                }
                text += chunk
              }

              return text
            },
          },
          cancelStream.token,
        )
      } finally {
        cancelStream.dispose()
      }

      if (!hints) {
        messenger.broadcastAiLayoutUpdate({ viewId, projectId, state: 'failed' })
        stream.warning(`AI could not generate layout suggestions for this view.`)
        return
      }
      if (token.isCancellationRequested) {
        messenger.broadcastAiLayoutUpdate({ viewId, projectId, state: 'failed' })
        stream.warning(`Layout enhancement cancelled.`)
        return
      }

      stream.progress(`Received AI layout hints...`)

      const { reasoning, ..._hints } = hints

      const md = new vscode.MarkdownString(`\n\n## Reasoning\n${reasoning}\n\n## Layout Hints\n`)
      md.appendCodeblock(JSON.stringify(_hints, null, 2), 'json')

      stream.markdown(md)
      stream.progress(`Applying layout hints...`)

      // Re-layout the view with AI hints
      const result = await rpc.layoutView({ viewId, projectId, hints }).catch(err => {
        logWarn(err)
        return null
      })

      if (!result) {
        messenger.broadcastAiLayoutUpdate({ viewId, projectId, state: 'failed' })
        stream.warning(`Failed to apply AI-enhanced layout. \nCheck output for details.`)
        return
      }

      output.debug(`Generated DOT with AI-enhanced layout:\n${result.dot}`)
      const res = await rpc
        .changeView({
          viewId,
          projectId,
          change: {
            op: 'save-view-snapshot',
            layout: result.diagram,
          },
        }).catch(err => {
          logWarn(err)
          return {
            success: false as const,
            error: loggable(err),
          }
        })

      if (!res.success) {
        messenger.broadcastAiLayoutUpdate({ viewId, projectId, state: 'failed' })
        stream.warning(`Failed to apply AI-enhanced layout.\nCheck output for details.\n${res.error}`)
        return
      }

      messenger.broadcastAiLayoutUpdate({ viewId, projectId, state: 'completed' })
      stream.markdown(`\n\n ✅ View updated`)

      if (res.location) {
        stream.markdown(` (saved `)
        stream.anchor(res.location.uri)
        stream.markdown(`)`)
      }
    },
  ))

  participant.iconPath = vscode.Uri.joinPath(extensionContext.value!.extensionUri, 'data/icon-256-light.png')
  // participant.titleProvider = {
  //   provideChatTitle: (context, token) => {
  //     return 'LikeC4 View Layout'
  //   },
  // }
  // useChatParticipant('likec4', , {
  //   iconPath: vscode.Uri.joinPath(extensionContext.value!.extensionUri, 'data/icon-256-light.png'),
  // })
})
