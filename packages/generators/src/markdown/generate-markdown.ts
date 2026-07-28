import type { LikeC4Model, LikeC4ViewModel } from '@likec4/core/model'
import type { aux } from '@likec4/core/types'
import { CompositeGeneratorNode, NL, toString } from 'langium/generate'
import { generateMermaid } from '../mmd/generate-mmd'

type ViewModel = LikeC4ViewModel<aux.Unknown>

function groupBySourceFile(views: ViewModel[]): Map<string, ViewModel[]> {
  const groups = new Map<string, ViewModel[]>()
  for (const view of views) {
    const key = view.$view.sourcePath ?? ''
    const group = groups.get(key)
    if (group) {
      group.push(view)
    } else {
      groups.set(key, [view])
    }
  }
  return groups
}

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

  for (const [sourceFile, views] of groupBySourceFile([...model.views()])) {
    doc.append('## ', sourceFile, NL, NL)
    for (const view of views) {
      appendView(doc, view)
    }
  }

  return toString(doc)
}
