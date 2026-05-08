import type { AnthropicTextAdapter } from '@tanstack/ai-anthropic'
import type { GeminiTextAdapter } from '@tanstack/ai-gemini'
import type { OllamaTextAdapter } from '@tanstack/ai-ollama'
import type { OpenAITextAdapter } from '@tanstack/ai-openai'
import { isTruthy, once } from 'remeda'
import { env } from 'std-env'
import { ensurePackage } from '../ensurePackage'
import { logger as rootLogger } from '../logger'
import type { AIOptions } from '../plugin'
import { k } from '../virtuals/_shared'

const logger = rootLogger.getChild('ai')

function chooseModel<T extends string>(envKey: string, defaultModel: T): T {
  let model = env[envKey] as T | undefined
  if (!model) {
    logger.info(
      'I will use ' +
        k.green(defaultModel) +
        ' model ' +
        k.dim('you can override with ') +
        k.yellow(envKey) +
        k.dim(' env var'),
    )
    model = defaultModel
  }
  return model
}

const maxTokens = 16000

const openaiDefaultModel = 'gpt-5.2' as const
async function loadOpenAI(): Promise<AIOptions<OpenAITextAdapter<typeof openaiDefaultModel>>> {
  logger.info(
    'Found ' + k.yellow('OPENAI_API_KEY') + k.dim(', loading @tanstack/ai-openai'),
  )
  await ensurePackage('@tanstack/ai-openai')
  const { openaiText } = await import('@tanstack/ai-openai')
  return {
    adapter: openaiText(
      chooseModel('OPENAI_CHAT_MODEL', openaiDefaultModel),
    ),
    modelOptions: {
      reasoning: {
        effort: 'medium',
      },
    },
    maxTokens,
  }
}

async function loadOpenRouter(): Promise<AIOptions> {
  logger.info(
    'Found ' + k.yellow('OPENROUTER_API_KEY') + k.dim(', loading @tanstack/ai-openrouter'),
  )
  await ensurePackage('@tanstack/ai-openrouter')
  const { openRouterText } = await import('@tanstack/ai-openrouter')
  return {
    adapter: openRouterText(
      chooseModel('OPENROUTER_CHAT_MODEL', 'openai/gpt-5.4'),
    ),
    maxTokens,
  }
}

const defaultModel = 'claude-sonnet-4-6' as const
async function loadAnthropic(): Promise<AIOptions<AnthropicTextAdapter<typeof defaultModel>>> {
  logger.info(
    'Found ' + k.yellow('ANTHROPIC_API_KEY') + k.dim(', loading @tanstack/ai-anthropic'),
  )
  await ensurePackage('@tanstack/ai-anthropic')
  const { anthropicText } = await import('@tanstack/ai-anthropic')
  return {
    adapter: anthropicText(
      chooseModel('ANTHROPIC_CHAT_MODEL', defaultModel),
    ),
    maxTokens,
  }
}

const geminiDefaultModel = 'gemini-2.5-pro' as const
async function loadGemini(): Promise<AIOptions<GeminiTextAdapter<typeof geminiDefaultModel>>> {
  logger.info(
    'Found ' + k.yellow('GEMINI_API_KEY') + k.dim(', loading @tanstack/ai-gemini'),
  )
  await ensurePackage('@tanstack/ai-gemini')
  const { geminiText } = await import('@tanstack/ai-gemini')
  return {
    adapter: geminiText(
      chooseModel('GEMINI_CHAT_MODEL', geminiDefaultModel),
    ),
    maxTokens,
  }
}

const ollamaDefaultModel = 'qwen3' as const
async function loadOllama(): Promise<AIOptions<OllamaTextAdapter<typeof ollamaDefaultModel>>> {
  logger.info(
    'Found ' + k.yellow('OLLAMA_HOST') + k.dim(', loading @tanstack/ai-ollama'),
  )
  await ensurePackage('@tanstack/ai-ollama')
  const { ollamaText } = await import('@tanstack/ai-ollama')
  const model = chooseModel('OLLAMA_CHAT_MODEL', ollamaDefaultModel)
  return {
    adapter: ollamaText(model),
    modelOptions: {
      model,
      think: 'low',
    },
    maxTokens,
  }
}

/**
 * Picks the appropriate AI loader based on available environment variables.
 * Returns undefined if no AI provider is configured.
 */
function pickLoader(): undefined | (() => Promise<AIOptions>) {
  if (isTruthy(env['OPENAI_API_KEY'])) {
    return loadOpenAI
  }

  if (isTruthy(env['OPENROUTER_API_KEY'])) {
    return loadOpenRouter
  }

  if (isTruthy(env['ANTHROPIC_API_KEY'])) {
    return loadAnthropic
  }

  if (isTruthy(env['GEMINI_API_KEY'])) {
    return loadGemini
  }

  if (isTruthy(env['OLLAMA_HOST'])) {
    return loadOllama
  }

  return undefined
}

export const detectAI = once(async (): Promise<AIOptions | undefined> => {
  const loader = pickLoader()
  if (loader) {
    await ensurePackage('@tanstack/ai')
    const options = await loader()
    logger.info([
      'AI configured with',
      k.green(options.adapter.name),
      'adapter',
      k.dim('you can disable it in plugin options'),
    ].join(' '))
    return options
  }
  return undefined
})
