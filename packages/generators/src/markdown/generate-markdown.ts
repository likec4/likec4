import type { LikeC4Model, LikeC4ViewModel } from '@likec4/core/model'
import type { aux } from '@likec4/core/types'
import { CompositeGeneratorNode, NL, toString } from 'langium/generate'
import { generateMermaid } from '../mmd/generate-mmd'

type ViewModel = LikeC4ViewModel<aux.Unknown>

/**
 * Appends a single view to the document as a level-3 heading, its optional
 * description, and a fenced Mermaid diagram.
 */
function appendView(doc: CompositeGeneratorNode, view: ViewModel): void {
  doc.append('### ', view.titleOrId, NL, NL)
  if (view.description.nonEmpty) {
    doc.append(view.description.md, NL, NL)
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
  doc.append('# ', model.project.title ?? model.projectId, NL, NL)
  if (options.description) {
    doc.append(options.description, NL, NL)
  }

  for (const view of model.views()) {
    if (view.$view.sourcePath === undefined) continue
    appendView(doc, view)
  }

  return toString(doc)
}
