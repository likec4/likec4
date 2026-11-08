import { readFileSync, writeFileSync } from 'node:fs'
import { generateFonts } from './generate-fonts'

const systemPrompt = readFileSync('src/graphviz/ai/prompt-system.md', 'utf-8')

const generated = `export const LAYOUT_SYSTEM_PROMPT = \`
${systemPrompt.replace(/`/g, '\\`')}
\`.trim()`

writeFileSync('src/graphviz/ai/prompt-system.generated.ts', generated, 'utf-8')

writeFileSync('src/graphviz/text-metrics/fonts.generated.ts', await generateFonts(), 'utf-8')
