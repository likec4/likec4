import type { GeneratorNode } from 'langium/generate'
import { NewLineNode, toString } from 'langium/generate'

/**
 * Line separator for all generated output.
 *
 * Langium's own `NL` resolves to `os.EOL`, which emits CRLF on Windows and makes
 * generated artifacts (Markdown, Mermaid, D2, PlantUML, LikeC4 DSL) differ per platform.
 * Generators must be deterministic, so always emit LF.
 */
export const NL = new NewLineNode('\n')

/**
 * Renders a generator node with LF line endings.
 *
 * Some Langium helpers insert `os.EOL` internally (for example `joinToNode`'s
 * `appendNewLineIfNotEmpty`), so normalize the rendered output as well as using {@link NL}.
 */
export function toStringLF(node: GeneratorNode | undefined, defaultIndentation?: string | number): string {
  return toString(node, defaultIndentation).replaceAll('\r\n', '\n')
}
