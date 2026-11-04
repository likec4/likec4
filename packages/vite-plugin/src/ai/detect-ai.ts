import type { AnyTextAdapter } from '@tanstack/ai'
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

async function loadOpenAI(): Promise<AIOptions<any>> {
  logger.info(
    'Found ' + k.yellow('OPENAI_API_KEY') + k.dim(', loading @tanstack/ai-openai'),
  )
  await ensurePackage('@tanstack/ai-openai')
  const { openaiText } = await import('@tanstack/ai-openai')
  return {
    adapter: openaiText(
      chooseModel('OPENAI_CHAT_MODEL', 'gpt-5.5'),
    ),
    modelOptions: {
      reasoning: {
        effort: 'medium',
      },
    },
    maxTokens,
  }
}

async function loadOpenRouter(): Promise<AIOptions<any>> {
  logger.info(
    'Found ' + k.yellow('OPENROUTER_API_KEY') + k.dim(', loading @tanstack/ai-openrouter'),
  )
  await ensurePackage('@tanstack/ai-openrouter')
  const { openRouterText } = await import('@tanstack/ai-openrouter')
  return {
    adapter: openRouterText(
      chooseModel('OPENROUTER_CHAT_MODEL', 'openai/gpt-5.6-sol'),
    ),
    maxTokens,
  }
}

// const defaultModel = 'claude-sonnet-5-5' satisfies typeof ANTHROPIC_MODELS[number]
async function loadAnthropic(): Promise<AIOptions<any>> {
  logger.info(
    'Found ' + k.yellow('ANTHROPIC_API_KEY') + k.dim(', loading @tanstack/ai-anthropic'),
  )
  await ensurePackage('@tanstack/ai-anthropic')
  const { anthropicText } = await import('@tanstack/ai-anthropic')
  return {
    adapter: anthropicText(
      chooseModel('ANTHROPIC_CHAT_MODEL', 'claude-sonnet-5-5'),
    ),
    maxTokens,
  }
}

async function loadGemini(): Promise<AIOptions<any>> {
  logger.info(
    'Found ' + k.yellow('GEMINI_API_KEY') + k.dim(', loading @tanstack/ai-gemini'),
  )
  await ensurePackage('@tanstack/ai-gemini')
  const { geminiText } = await import('@tanstack/ai-gemini')
  return {
    adapter: geminiText(
      chooseModel('GEMINI_CHAT_MODEL', 'gemini-3.5-flash'),
    ),
    maxTokens,
  }
}

async function loadOllama(): Promise<AIOptions<any>> {
  const ollamaDefaultModel = 'qwen3' as const
  logger.info(
    'Found ' + k.yellow('OLLAMA_HOST') + k.dim(', loading @tanstack/ai-ollama'),
  )
  await ensurePackage('@tanstack/ai-ollama')
  const { ollamaText } = await import('@tanstack/ai-ollama')
  const model = chooseModel('OLLAMA_CHAT_MODEL', ollamaDefaultModel)
  return {
    adapter: ollamaText(ollamaDefaultModel),
    modelOptions: {
      model,
      think: 'low',
    },
    maxTokens,
  }
}

const minimaxDefaultModel = 'MiniMax-M3.1-Flash' as const
const minimaxBaseURLs = {
  global_en: 'https://api.minimax.io/v1',
  cn_zh: 'https://api.minimaxi.com/v1',
} as const

function chooseMiniMaxBaseURL(): string {
  const region = env['MINIMAX_REGION']?.trim().toLowerCase()
  if (region === 'cn_zh' || region === 'cn' || region === 'cn-zh' || region === 'china') {
    return minimaxBaseURLs.cn_zh
  }
  return minimaxBaseURLs.global_en
}

async function loadMiniMax(): Promise<AIOptions> {
  const baseURL = chooseMiniMaxBaseURL()
  logger.info(
    'Found ' +
      k.yellow('MINIMAX_API_KEY') +
      k.dim(', loading OpenAI-compatible adapter on ') +
      k.green(baseURL),
  )
  await ensurePackage('@tanstack/ai-openai')
  const { createOpenaiChatCompletions } = await import('@tanstack/ai-openai')
  const apiKey = env['MINIMAX_API_KEY'] as string
  const model = chooseModel('MINIMAX_CHAT_MODEL', minimaxDefaultModel)
  return {
    adapter: createOpenaiChatCompletions(
      model as never,
      apiKey,
      { baseURL },
    ) as unknown as AnyTextAdapter,
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

  if (isTruthy(env['MINIMAX_API_KEY'])) {
    return loadMiniMax
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
