import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  ensurePackage: vi.fn<(pkg: string) => Promise<void>>(async () => undefined),
}))

vi.mock('../ensurePackage', () => ({
  ensurePackage: mocks.ensurePackage,
}))

describe.sequential('detectAI MiniMax requests', () => {
  beforeEach(() => {
    vi.resetModules()
    mocks.ensurePackage.mockClear()
    for (
      const key of [
        'OPENAI_API_KEY',
        'OPENROUTER_API_KEY',
        'ANTHROPIC_API_KEY',
        'GEMINI_API_KEY',
        'OLLAMA_HOST',
        'MINIMAX_CHAT_MODEL',
        'MINIMAX_REGION',
      ]
    ) {
      vi.stubEnv(key, undefined)
    }
    vi.stubEnv('MINIMAX_API_KEY', 'mm-test-key')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  for (const region of [undefined, 'global_en', 'cn_zh', 'cn', 'cn-zh', ' China ']) {
    it.each([undefined, 'MiniMax-M3', 'MiniMax-M2.7', 'custom-minimax-model'])(
      `sends %s through Chat Completions in region ${region ?? 'default'}`,
      async (model) => {
        vi.stubEnv('MINIMAX_REGION', region)
        vi.stubEnv('MINIMAX_CHAT_MODEL', model)
        const expectedModel = model ?? 'MiniMax-M3.1-Flash'
        const fetchMock = vi.fn<typeof fetch>(async () => {
          const chunk = {
            id: 'chat-test',
            object: 'chat.completion.chunk',
            created: 0,
            model: expectedModel,
            choices: [{ index: 0, delta: { content: 'Hello' }, finish_reason: 'stop' }],
          }
          return new Response(`data: ${JSON.stringify(chunk)}\n\ndata: [DONE]\n\n`, {
            headers: { 'Content-Type': 'text/event-stream' },
          })
        })
        vi.stubGlobal('fetch', fetchMock)

        const { detectAI } = await import('./detect-ai')
        const options = await detectAI()
        expect(options).toBeDefined()
        if (!options) throw new Error('MiniMax was not detected')
        expect(mocks.ensurePackage).toHaveBeenCalledWith('@tanstack/ai')
        expect(mocks.ensurePackage).toHaveBeenCalledWith('@tanstack/ai-openai')

        expect(options.maxTokens).toBe(16000)
        const imageUrl = 'https://example.com/diagram.png'
        const hasImage = !model || model === 'MiniMax-M3'
        const content = hasImage
          ? [
            { type: 'text' as const, content: 'Hello' },
            { type: 'image' as const, source: { type: 'url' as const, value: imageUrl } },
          ]
          : 'Hello'

        // Exercise the same chat entry point used by the AI server and semantic layout.
        const { chat, EventType } = await import('@tanstack/ai')
        const chunks = []
        for await (
          const chunk of chat({
            ...options,
            systemPrompts: ['You are a helpful assistant.'],
            messages: [{ role: 'user', content }],
          })
        ) {
          chunks.push(chunk)
        }
        expect(chunks).toContainEqual(expect.objectContaining({
          type: EventType.TEXT_MESSAGE_CONTENT,
          delta: 'Hello',
        }))
        expect(fetchMock).toHaveBeenCalledTimes(1)
        const [input, init] = fetchMock.mock.calls[0]!
        const request = new Request(input, init)
        const host = !region || region === 'global_en' ? 'api.minimax.io' : 'api.minimaxi.com'
        expect(request.url).toBe(`https://${host}/v1/chat/completions`)
        expect(request.headers.get('authorization')).toBe('Bearer mm-test-key')
        const body = await request.json()
        expect(body).toMatchObject({
          model: expectedModel,
          stream: true,
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            {
              role: 'user',
              content: hasImage
                ? [
                  { type: 'text', text: 'Hello' },
                  { type: 'image_url', image_url: { url: imageUrl, detail: 'auto' } },
                ]
                : 'Hello',
            },
          ],
        })
        // Omission keeps MiniMax's adaptive thinking and default Flash effort.
        for (const key of ['thinking', 'reasoning_effort', 'reasoning_split', 'service_tier']) {
          expect(body).not.toHaveProperty(key)
        }
      },
    )
  }
})
