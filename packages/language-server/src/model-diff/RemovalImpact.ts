import { type DiagramView, type ProjectId, ViewId } from '@likec4/core'
import {
  type RemovalImpact,
  computeAdhocView,
  computeRemovalImpact,
  markRemovalImpact,
  removalImpactViewPredicates,
} from '@likec4/core/compute-view'
import { type AstNode, AstUtils } from 'langium'
import { uniqueBy } from 'remeda'
import type { Location } from 'vscode-languageserver-types'
import type { LikeC4Services } from '../module'
import { type ReferenceKind, type SourceReference, findElementDefinitions, findSourceReferences } from './references'
import { type DocumentEdits, type ListItem, listOwner, removeListItems } from './text-edits'

/**
 * How a reference is handled when the element is removed:
 * - `removed`: removed together with the element
 * - `optional`: removed only if requested (views scoped to the element, dynamic view steps)
 * - `manual`: must be fixed manually (for example, references inside diffs)
 */
export type ReferenceResolution = 'removed' | 'optional' | 'manual'

export interface RemovalImpactReference {
  kind: ReferenceKind
  location: Location
  /**
   * Source text of the node with the reference (single line)
   */
  text: string
  resolution: ReferenceResolution
}

export interface RemovalImpactReport {
  projectId: ProjectId
  impact: RemovalImpact
  references: RemovalImpactReference[]
}

export interface SafeDeleteOptions {
  /**
   * Also remove elements left without relationships
   */
  includeOrphans?: boolean | undefined
  /**
   * Also remove views scoped to removed elements
   */
  includeScopedViews?: boolean | undefined
  /**
   * Also remove dynamic view steps with removed elements
   */
  includeDynamicSteps?: boolean | undefined
}

function resolutionOf({ kind, fix }: SourceReference): ReferenceResolution {
  switch (true) {
    case !fix:
      return 'manual'
    case kind === 'view-scope':
    case kind === 'dynamic-step':
      return 'optional'
    default:
      return 'removed'
  }
}

function describe(node: AstNode): string {
  const text = (node.$cstNode?.text ?? '').replace(/\s+/g, ' ').trim()
  return text.length > 80 ? text.slice(0, 77) + '...' : text
}

function describedNode({ fix, node }: SourceReference): AstNode {
  switch (fix?.type) {
    case 'list-item':
      return listOwner(fix.item)
    case 'delete':
      return fix.node
    default:
      return node
  }
}

/**
 * Finds what removing elements takes with it (model and sources) and removes it.
 */
export class LikeC4RemovalImpact {
  constructor(private services: LikeC4Services) {}

  private async impactOf(targets: ReadonlyArray<string>, projectId: ProjectId | undefined, includeOrphans: boolean) {
    const model = await this.services.likec4.ModelBuilder.computeModel(projectId)
    let impact = computeRemovalImpact(model, targets)
    if (includeOrphans && impact.orphans.length > 0) {
      impact = computeRemovalImpact(model, [...impact.targets, ...impact.orphans])
    }
    return { model, impact }
  }

  private collect(projectId: ProjectId, impact: RemovalImpact) {
    const definitions = findElementDefinitions(this.services, projectId, impact.elements)
    const removedDefinitions = new Set<AstNode>(definitions)
    const isRemoved = (r: SourceReference) => AstUtils.hasContainerOfType(r.node, n => removedDefinitions.has(n))
    const references = findSourceReferences(this.services, definitions).filter(r => !isRemoved(r))
    // Relations and views of removed deployed instances
    const instances = references.flatMap(r =>
      r.kind === 'deployed-instance' && r.fix?.type === 'delete' ? [r.fix.node] : []
    )
    const instanceReferences = findSourceReferences(this.services, instances).filter(r => !isRemoved(r))
    return {
      definitions,
      // A node can reference several removed elements (e.g. `a -> removed.child` references `removed` and `child`)
      references: uniqueBy(
        [...references, ...instanceReferences],
        r => r.fix?.type === 'list-item' ? r.fix.item : (r.fix?.node ?? r.node),
      ),
    }
  }

  /**
   * Reports what removing the elements takes with it.
   * Returns `null` if none of the elements exists.
   */
  async analyze(targets: ReadonlyArray<string>, projectId?: ProjectId): Promise<RemovalImpactReport | null> {
    const { model, impact } = await this.impactOf(targets, projectId, false)
    if (impact.targets.length === 0) {
      return null
    }
    const modelProjectId = model.projectId as ProjectId
    const { references } = this.collect(modelProjectId, impact)
    return {
      projectId: modelProjectId,
      impact,
      references: references.map(reference => ({
        kind: reference.kind,
        location: { uri: reference.uri, range: reference.range },
        text: describe(describedNode(reference)),
        resolution: resolutionOf(reference),
      })),
    }
  }

  /**
   * Diagram of the removal impact: removed elements and relationships, their counterparts and orphans.
   */
  async impactView(targets: ReadonlyArray<string>, projectId?: ProjectId): Promise<DiagramView | null> {
    const { model, impact } = await this.impactOf(targets, projectId, false)
    if (impact.targets.length === 0) {
      return null
    }
    const view = markRemovalImpact(computeAdhocView(model, removalImpactViewPredicates(model, impact)), impact)
    const { diagram } = await this.services.likec4.Layouter.layout({
      view: {
        ...view,
        id: ViewId('removal-impact'),
        title: `Removal impact of ${impact.targets.join(', ')}`,
        hash: '',
        _type: 'element',
      },
      styles: model.$styles,
    })
    return diagram
  }

  /**
   * Adds edits that remove the elements and everything that references them.
   */
  async addEdits(
    edits: DocumentEdits,
    targets: ReadonlyArray<string>,
    projectId: ProjectId | undefined,
    options: SafeDeleteOptions,
  ): Promise<RemovalImpact> {
    const { model, impact } = await this.impactOf(targets, projectId, !!options.includeOrphans)
    const { definitions, references } = this.collect(model.projectId as ProjectId, impact)
    for (const definition of definitions) {
      edits.deleteNode(definition)
    }
    const isSkipped = ({ kind }: SourceReference) =>
      (kind === 'view-scope' && !options.includeScopedViews)
      || (kind === 'dynamic-step' && !options.includeDynamicSteps)
    const listItems = new Set<ListItem>()
    for (const reference of references) {
      const { fix } = reference
      if (!fix || isSkipped(reference)) {
        continue
      }
      if (fix.type === 'delete') {
        edits.deleteNode(fix.node)
      } else {
        listItems.add(fix.item)
      }
    }
    removeListItems(edits, listItems)
    return impact
  }
}
