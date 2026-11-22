import type { LikeC4Model, LikeC4ViewModel } from '@likec4/core/model'
import type { aux } from '@likec4/core/types'
import { escapeInlineMarkdown, resolveMarkdownRefs } from '@likec4/core/utils'
import { CompositeGeneratorNode } from 'langium/generate'
import { generateMermaid } from '../mmd/generate-mmd'
import { NL, toStringLF } from '../newline'

type ViewModel = LikeC4ViewModel<aux.Unknown>

/**
 * Text for an ATX heading. Titles are plain text and may span lines, but a heading
 * is one line, and characters such as `*`, `<` or a trailing `#` would be read as Markdown.
 * GFM extended autolinks (`www.example.com`, `https://example.com`, `team@example.com`) must also
 * be escaped so they render as literal text rather than links.
 */
function headingText(title: string): string {
  return escapeInlineMarkdown(title.replace(/\s*[\r\n]+\s*/g, ' ').trim())
    .replace(/(\w+):\/\//g, '$1\\://')
    .replace(/\bwww\./g, 'www\\.')
    .replace(/(?<=[\w.+-])@/g, '\\@')
}

/**
 * Appends a single view to the document as a level-3 heading, its optional
 * description, and a fenced Mermaid diagram.
 */
function appendView(doc: CompositeGeneratorNode, view: ViewModel): void {
  doc.append('### ', headingText(view.titleOrId), NL, NL)
  if (view.description.nonEmpty) {
    // Refs (`[[fqn]]`) become titles (escaped, rendered literally), the rest of markdown is kept
    doc.append(resolveMarkdownRefs(view.description.md, view.$model.resolveMarkdownRef, { escape: true }), NL, NL)
  }
  doc.append('```mermaid', NL, generateMermaid(view).trimEnd(), NL, '```', NL, NL)
}

export type GenerateMarkdownOptions = {
  /**
   * `LikeC4Project` has no description field of its own yet, so callers source this from
   * wherever they keep it (e.g. the project config's `metadata` bag) and pass it through.
   * If a first-class description ever lands on `LikeC4Project`, read it from the model
   * directly instead and drop this option.
   */
  description?: string
}

/**
 * Renders a LikeC4 model as a Markdown document: the project title, an optional
 * description, and every authored view as a Mermaid diagram. Views without a
 * `sourcePath` (e.g. auto-generated index views) are skipped.
 */
export function generateMarkdown(
  model: LikeC4Model<aux.Unknown>,
  options: GenerateMarkdownOptions = {},
): string {
  const doc = new CompositeGeneratorNode()
  doc.append('# ', headingText(model.project.title ?? model.projectId), NL, NL)
  if (options.description) {
    doc.append(options.description, NL, NL)
  }

  for (const view of model.views()) {
    if (view.$view.sourcePath === undefined) continue
    appendView(doc, view)
  }

  return toStringLF(doc)
}
