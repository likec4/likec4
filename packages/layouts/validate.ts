import { type ComputedLikeC4ModelData, nonNullable } from '@likec4/core'
import { LikeC4Styles } from '@likec4/core/styles'
import { configureLogger, getAnsiColorFormatter, getConsoleSink, logger } from '@likec4/log'
import ollama from 'ollama'
import { $, echo, fs } from 'zx'
import { S } from '../core/dist/_chunks/index5.d.mts'
import { enhanceLayoutWithAI } from './src/graphviz/ai/orchestrator'
import type { AILayoutProvider } from './src/graphviz/ai/types'
import { GraphvizLayouter } from './src/graphviz/GraphvizLayoter'
configureLogger({
  reset: true,
  sinks: {
    console: getConsoleSink({
      formatter: getAnsiColorFormatter(),
    }),
  },
  loggers: [
    {
      category: 'likec4',
      sinks: ['console'],
      lowestLevel: 'debug',
    },
  ],
})

const systemPrompt = fs.readFileSync('src/graphviz/ai/prompt-system.md', 'utf-8')

// const viewId = 'amazon'
const viewId = 'cloud_ui'
// const viewId = 'production'
// const viewId = 'cloud_next'
const suffix = '_v2'

const model = fs.readJsonSync('./model.json') as ComputedLikeC4ModelData
const amazonView = model.views[viewId]!
const layouter = new GraphvizLayouter()

const layout1 = await layouter.layout({
  view: amazonView,
  styles: LikeC4Styles.DEFAULT,
})

$.quiet = false
$.verbose = true

echo`Layout 1`

await $({ input: layout1.dot })`dot -Tpng -o ${viewId + suffix + '_1.png'}`

echo`Call AI`

const claudeCli: AILayoutProvider = {
  name: 'claude',
  sendRequest: async ({ diagram, userPrompt }) => {
    return await $({
      input: diagram,
    })`claude --model sonnet --append-system-prompt ${systemPrompt} -p ${userPrompt}`
      .text()
  },
}

const ollamaProvider: AILayoutProvider = {
  name: 'ollama',
  sendRequest: async ({ diagram, userPrompt }) => {
    const model = 'qwen3.5:9b'
    // const model = 'gemma3:4b'
    logger.debug('Calling Ollama with model={model}\n{diagram}', { model, diagram })

    const stream = await ollama.chat({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${userPrompt}\n\n${diagram}` },
      ],
      think: 'low',
      stream: true,
    })

    let inThinking = false
    let content = ''

    for await (const chunk of stream) {
      if (chunk.message.thinking) {
        if (!inThinking) {
          inThinking = true
          process.stdout.write('Thinking:\n')
        }
        process.stdout.write(chunk.message.thinking)
      } else if (chunk.message.content) {
        if (inThinking) {
          inThinking = false
          process.stdout.write('\n\nAnswer:\n')
        }
        process.stdout.write(chunk.message.content)
        // accumulate the partial content
        content += chunk.message.content
      }
    }

    return content
  },
}

// const hints = await enhanceLayoutWithAI(amazonView, ollamaProvider)
const hints = await enhanceLayoutWithAI(amazonView, claudeCli)

echo`Layout 2`

const layout2 = await layouter.aiLayout({
  view: amazonView,
  styles: LikeC4Styles.DEFAULT,
}, nonNullable(hints))

fs.writeFileSync('layout2.dot', layout2.dot)

await $({ input: layout2.dot })`dot -Tpng -o ${viewId + suffix + '_2.png'}`
