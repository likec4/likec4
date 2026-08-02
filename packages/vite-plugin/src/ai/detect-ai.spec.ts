import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  ensurePackage: vi.fn(async () => undefined),
  createOpenaiChat: vi.fn((model: string, apiKey: string, config: { baseURL?: string }) => ({
    name: 'openai',
    model,
    apiKey,
    config,
  })),
}))

vi.mock('../ensurePackage', () => ({
  ensurePackage: mocks.ensurePackage,
}))

vi.mock('@tanstack/ai-openai', () => ({
  createOpenaiChat: mocks.createOpenaiChat,
}))

const resetEnv = () => {
  delete process.env['OPENAI_API_KEY']
  delete process.env['OPENROUTER_API_KEY']
  delete process.env['ANTHROPIC_API_KEY']
  delete process.env['GEMINI_API_KEY']
  delete process.env['OLLAMA_HOST']
  delete process.env['MINIMAX_API_KEY']
  delete process.env['MINIMAX_CHAT_MODEL']
  delete process.env['MINIMAX_REGION']
}

describe('detectAI', () => {
  beforeEach(() => {
    vi.resetModules()
    mocks.ensurePackage.mockClear()
    mocks.createOpenaiChat.mockClear()
    resetEnv()
  })

  it('loads MiniMax with the global endpoint and default model', async () => {
    process.env['MINIMAX_API_KEY'] = 'mm-test-key'

    const { detectAI } = await import('./detect-ai')
    const options = await detectAI()

    expect(mocks.ensurePackage).toHaveBeenCalledWith('@tanstack/ai')
    expect(mocks.createOpenaiChat).toHaveBeenCalledWith('MiniMax-M3', 'mm-test-key', {
      baseURL: 'https://api.minimax.io/v1',
    })
    expect(options).toMatchObject({
      maxTokens: 16000,
      adapter: {
        name: 'openai',
        model: 'MiniMax-M3',
        apiKey: 'mm-test-key',
        config: {
          baseURL: 'https://api.minimax.io/v1',
        },
      },
    })
  })

  it('switches to the CN endpoint and alternate model when configured', async () => {
    process.env['MINIMAX_API_KEY'] = 'mm-test-key'
    process.env['MINIMAX_CHAT_MODEL'] = 'MiniMax-M2.7'
    process.env['MINIMAX_REGION'] = 'cn_zh'

    const { detectAI } = await import('./detect-ai')
    await detectAI()

    expect(mocks.createOpenaiChat).toHaveBeenCalledWith('MiniMax-M2.7', 'mm-test-key', {
      baseURL: 'https://api.minimaxi.com/v1',
    })
  })
})
