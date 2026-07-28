import type { LikeC4Model, LikeC4ViewModel } from '@likec4/core/model'
import type { aux } from '@likec4/core/types'
import { CompositeGeneratorNode, NL, toString } from 'langium/generate'
import { generateMermaid } from '../mmd/generate-mmd'

type ViewModel = LikeC4ViewModel<aux.Unknown>

function appendView(doc: CompositeGeneratorNode, view: ViewModel): void {
  doc.append('### ', view.titleOrId, NL, NL)
  if (view.description.nonEmpty) {
    doc.append(view.description.md, NL, NL)
  }
  doc.append('```mermaid', NL, generateMermaid(view).trimEnd(), NL, '```', NL, NL)
}

export function generateMarkdown(model: LikeC4Model<aux.Unknown>): string {
  const doc = new CompositeGeneratorNode()
  doc.append('# ', model.project.title ?? model.projectId, NL, NL)

  for (const view of model.views()) {
    if (view.$view.sourcePath === undefined) continue
    appendView(doc, view)
  }

  return toString(doc)
}
