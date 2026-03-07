import { fromWorkspace } from '@likec4/language-services/node/without-mcp'
import { enhanceLayoutWithAI } from '@likec4/layouts/ai'
import spawn from 'nano-spawn'
import { writeFile } from 'node:fs/promises'

async function test() {
  await using languageServices = await fromWorkspace(
    '/Users/davydkov/conductor/workspaces/likec4/prague/packages/likec4/dev',
    {
      configureLogger: 'console',
      logLevel: 'trace',
      watch: false,
    },
  )

  const model = await languageServices.computedModel()

  const computedView = model.view('amazon').$view

  const hints = await enhanceLayoutWithAI(
    computedView,
    {
      name: 'Claude 2',
      async sendRequest({
        diagramdata,
        systemPrompt,
        userPrompt,
      }, signal) {
        const p = '/Users/davydkov/conductor/workspaces/likec4/prague/packages/likec4/src/prompt.txt'
        await writeFile(p, systemPrompt)
        await writeFile(
          '/Users/davydkov/conductor/workspaces/likec4/prague/packages/likec4/src/data.txt',
          diagramdata,
        )
        await writeFile(
          '/Users/davydkov/conductor/workspaces/likec4/prague/packages/likec4/src/userprompt.txt',
          userPrompt,
        )
        const r = await spawn('claude', [
          '--model',
          'sonnet',
          '--no-session-persistence',
          '--output-format',
          'json',
          '--system-prompt-file',
          p,
          '-p',
          userPrompt,
        ], {
          signal,
          stdin: {
            string: diagramdata,
          },
        })

        console.log('---------------Raw AI response:')
        console.log(r.output)
        console.log('---------------Parsed Result:')

        const { result } = JSON.parse(r.output)

        console.log(result)
        console.log('---------------')

        return result
      },
    },
  )

  if (!hints) {
    console.error('Failed to generate AI layout hints')
    return
  }

  const layoutResult = await languageServices.viewsService.layoutView({
    viewId: computedView.id,
    layoutHints: hints,
  })

  if (!layoutResult) {
    console.error('Failed to layout view')
    return
  }

  console.log('---------------')
  console.log(layoutResult.dot)
}

await test()
