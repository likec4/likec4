import type { Fqn, ProjectId } from '@likec4/core'
import type { AstNode } from 'langium'
import { AstUtils } from 'langium'
import { uniqueBy } from 'remeda'
import type { Range } from 'vscode-languageserver-types'
import { ast } from '../ast'
import type { LikeC4Services } from '../module'
import { type ListItem, isListItem } from './text-edits'

/**
 * Where an element is referenced from.
 */
export type ReferenceKind =
  | 'relation'
  | 'extend-element'
  | 'extend-relation'
  | 'extend-deployment'
  | 'deployed-instance'
  | 'deployment-relation'
  | 'view-predicate'
  | 'deployment-view-predicate'
  | 'global'
  | 'import'
  | 'view-scope'
  | 'dynamic-step'
  | 'diff'
  | 'other'

export type ReferenceFix =
  | { type: 'delete'; node: AstNode }
  | { type: 'list-item'; item: ListItem }

export interface SourceReference {
  kind: ReferenceKind
  uri: string
  range: Range
  /**
   * Node that holds the reference
   */
  node: AstNode
  /**
   * How the reference is removed, `null` if it cannot be removed automatically
   */
  fix: ReferenceFix | null
}

function outermostStep(step: ast.StepOrSeries): ast.StepOrSeries {
  let current = step
  while (ast.isStepOrSeries(current.$container)) {
    current = current.$container
  }
  return current
}

function predicateKind(item: ListItem): ReferenceKind {
  switch (true) {
    case ast.isImported(item):
      return 'import'
    case !!AstUtils.getContainerOfType(item, ast.isGlobals):
      return 'global'
    case !!AstUtils.getContainerOfType(item, ast.isDeploymentView):
      return 'deployment-view-predicate'
    default:
      return 'view-predicate'
  }
}

/**
 * Classifies the node that holds a reference to a removed element.
 * References inside diffs are never changed: the owner of the diff decides how to update it.
 */
export function classifyReference(node: AstNode): Pick<SourceReference, 'kind' | 'fix'> {
  if (AstUtils.hasContainerOfType(node, ast.isModelDiff)) {
    return { kind: 'diff', fix: null }
  }
  let child: AstNode = node
  for (let current: AstNode | undefined = node; current; child = current, current = current.$container) {
    switch (true) {
      case isListItem(current):
        return { kind: predicateKind(current), fix: { type: 'list-item', item: current } }
      case ast.isStepOrSeries(current):
        return { kind: 'dynamic-step', fix: { type: 'delete', node: outermostStep(current) } }
      case ast.isExtendElement(current):
        return { kind: 'extend-element', fix: { type: 'delete', node: current } }
      case ast.isExtendRelation(current):
        return { kind: 'extend-relation', fix: { type: 'delete', node: current } }
      case ast.isExtendDeployment(current):
        return { kind: 'extend-deployment', fix: { type: 'delete', node: current } }
      case ast.isRelation(current):
        return { kind: 'relation', fix: { type: 'delete', node: current } }
      case ast.isDeployedInstance(current):
        return { kind: 'deployed-instance', fix: { type: 'delete', node: current } }
      case ast.isDeploymentRelation(current):
        return { kind: 'deployment-relation', fix: { type: 'delete', node: current } }
      case ast.isElementView(current):
        return child === current.viewOf
          ? { kind: 'view-scope', fix: { type: 'delete', node: current } }
          : { kind: 'other', fix: null }
    }
  }
  return { kind: 'other', fix: null }
}

/**
 * Finds and classifies all references to the given nodes.
 */
export function findSourceReferences(services: LikeC4Services, targets: ReadonlyArray<AstNode>): SourceReference[] {
  const references = services.references.References
  const documents = services.shared.workspace.LangiumDocuments
  const locator = services.workspace.AstNodeLocator
  const found = uniqueBy(
    targets.flatMap(target => references.findReferences(target, { includeDeclaration: false }).toArray()),
    reference => `${reference.sourceUri.toString()}#${reference.segment.offset}`,
  )
  return found.flatMap(reference => {
    const document = documents.getDocument(reference.sourceUri)
    const node = document ? locator.getAstNode(document.parseResult.value, reference.sourcePath) : undefined
    return node
      ? [{ ...classifyReference(node), uri: reference.sourceUri.toString(), range: reference.segment.range, node }]
      : []
  })
}

/**
 * Element definitions of the model (elements added by diffs are skipped).
 */
export function findElementDefinitions(
  services: LikeC4Services,
  projectId: ProjectId,
  fqns: ReadonlyArray<Fqn>,
): ast.Element[] {
  const fqnIndex = services.likec4.FqnIndex
  const documents = services.shared.workspace.LangiumDocuments
  const locator = services.workspace.AstNodeLocator
  return fqns.flatMap(fqn =>
    fqnIndex.byFqn(projectId, fqn).toArray().flatMap(description => {
      const document = documents.getDocument(description.documentUri)
      const node = document ? locator.getAstNode(document.parseResult.value, description.path) : undefined
      return node && ast.isElement(node) && !AstUtils.hasContainerOfType(node, ast.isModelDiff) ? [node] : []
    })
  )
}
