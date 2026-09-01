import { NewLineNode } from 'langium/generate'

/**
 * Line separator for all generated output.
 *
 * Langium's own `NL` resolves to `os.EOL`, which emits CRLF on Windows and makes
 * generated artifacts (Markdown, Mermaid, D2, PlantUML, LikeC4 DSL) differ per platform.
 * Generators must be deterministic, so always emit LF.
 */
export const NL = new NewLineNode('\n')
