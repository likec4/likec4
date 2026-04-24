import { Anthropic } from '@anthropic-ai/sdk'
import { type ComputedLikeC4ModelData, nonNullable } from '@likec4/core'
import { LikeC4Styles } from '@likec4/core/styles'
import { configureLogger, getAnsiColorFormatter, getConsoleSink, logger } from '@likec4/log'
import ollama from 'ollama'
import { chunk } from 'remeda'
import { $, echo, fs } from 'zx'
import { enhanceLayoutWithAI } from './src/graphviz/ai/orchestrator'
import type { AILayoutProvider } from './src/graphviz/ai/types'
import { GraphvizLayouter } from './src/graphviz/GraphvizLayoter'

const claude = new Anthropic()

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
      lowestLevel: 'trace',
    },
  ],
})

const systemPrompt = fs.readFileSync('src/graphviz/ai/prompt-system.md', 'utf-8')

// const viewId = 'amazon_sqs'
const viewId = 'acceptance'
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
    let response = ''
    const params = [
      '--bare',
      '--effort',
      'medium',
      '--verbose',
      '--model',
      'opus',
      '--output-format',
      'text',
      '--no-session-persistence',
      '--tools',
      '',
      '--no-chrome',
      // '--setting-sources',
      // 'local',
      '--append-system-prompt-file',
      './src/graphviz/ai/prompt-system.md',
      '--disable-slash-commands',
    ]
    for await (
      const _ of $({
        input: diagram,
      })`claude ${params} -p ${userPrompt}`
    ) {
      process.stdout.write(_)
      response += _
    }
    return response
  },
}

const claudeClient: AILayoutProvider = {
  name: 'claude',
  sendRequest: async ({ diagram, userPrompt }) => {
    const stream = claude.messages
      .stream({
        model: 'claude-opus-4-6',
        max_tokens: 5000,
        system: systemPrompt,
        thinking: {
          type: 'adaptive',
          display: 'summarized',
        },
        output_config: {
          effort: 'medium',
        },
        stream: true,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              { type: 'text', text: diagram },
            ],
          },
        ],
      })
      .on('text', (err) => {
        process.stdout.write(err)
      })
      .on('thinking', (thinking) => {
        process.stdout.write(thinking)
      })

    // for await (const event of stream) {
    //   if (event.type === 'content_block_start') {
    //     console.log(`\nStarting ${event.content_block.type} block...`)
    //   } else if (event.type === 'content_block_delta') {
    //     if (event.delta.type === 'thinking_delta') {
    //       process.stdout.write(event.delta.thinking)
    //     } else if (event.delta.type === 'text_delta') {
    //       process.stdout.write(event.delta.text)
    //     }
    //   }
    // }

    const message = await stream.finalMessage()
    logger.debug`Usage ${message.usage}`
    const content = nonNullable(message.content.find(c => c.type === 'text'), 'No text content in final message')
    return content.text
    // return await $({
    //   input: diagram,
    // })`claude --effort low --append-system-prompt-file ./src/graphviz/ai/prompt-system.md -p ${userPrompt}`
    //   .text()
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
        { role: 'user', content: userPrompt + '\n\n' + diagram },
      ],
      think: 'medium',
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
const hints = await enhanceLayoutWithAI(amazonView, claudeClient)

echo`Layout 2`

// const layout2 = await layouter.aiLayout({
//   view: amazonView,
//   styles: LikeC4Styles.DEFAULT,
// }, nonNullable(hints))

const layout2 = layouter.printToDot({
  view: amazonView,
  styles: LikeC4Styles.DEFAULT,
}, nonNullable(hints))

fs.writeFileSync('layout2.dot', layout2)

await $({ input: layout2 })`dot -Tpng -o ${viewId + suffix + '_2.png'}`
