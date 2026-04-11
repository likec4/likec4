import { readFileSync, writeFileSync } from 'node:fs'

const systemPrompt = readFileSync('src/graphviz/ai/prompt-system.md', 'utf-8')

const generated = `export const LAYOUT_SYSTEM_PROMPT = ${JSON.stringify(systemPrompt)} as const\n`

writeFileSync('src/graphviz/ai/prompt-system.generated.ts', generated, 'utf-8')
