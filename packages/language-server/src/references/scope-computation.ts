import {
  DefaultScopeComputation,
  MultiMap,
  type AstNode,
  type AstNodeDescription,
  type PrecomputedScopes
} from 'langium'
import { hasAtLeast, isEmpty } from 'remeda'
import type { CancellationToken } from 'vscode-languageserver'
import { ast, type LikeC4LangiumDocument } from '../ast'
import { logError } from '../logger'

type ElementsContainer = ast.Model | ast.ElementBody | ast.ExtendElementBody

export class LikeC4ScopeComputation extends DefaultScopeComputation {
  override computeExports(
    document: LikeC4LangiumDocument,
    _cancelToken: CancellationToken
  ): Promise<AstNodeDescription[]> {
    try {
      const { specifications, models, views } = document.parseResult.value

      const docExports: AstNodeDescription[] = []

      for (const spec of specifications.flatMap(s => s.elements)) {
        if (spec.kind && !isEmpty(spec.kind.name)) {
          docExports.push(this.descriptions.createDescription(spec.kind, spec.kind.name, document))
        }
      }
      for (const spec of specifications.flatMap(s => s.tags)) {
        if (spec.tag && !isEmpty(spec.tag.name)) {
          docExports.push(this.descriptions.createDescription(spec.tag, spec.tag.name, document))
          docExports.push(
            this.descriptions.createDescription(spec.tag, '#' + spec.tag.name, document)
          )
        }
      }
      for (const spec of specifications.flatMap(s => s.relationships)) {
        if (spec.kind && !isEmpty(spec.kind.name)) {
          docExports.push(this.descriptions.createDescription(spec.kind, spec.kind.name, document))
        }
      }

      // Only root model elements are exported
      for (const elAst of models.flatMap(m => m.elements)) {
        if (ast.isElement(elAst) && !isEmpty(elAst.name)) {
          docExports.push(this.descriptions.createDescription(elAst, elAst.name, document))
        }
      }

      for (const viewAst of views.flatMap(v => v.views)) {
        if (viewAst.name && !isEmpty(viewAst.name)) {
          docExports.push(this.descriptions.createDescription(viewAst, viewAst.name, document))
        }
      }

      return Promise.resolve(docExports)
    } catch (e) {
      logError(e)
      return Promise.reject(e)
    }
  }

  override async computeLocalScopes(
    document: LikeC4LangiumDocument,
    _cancelToken: CancellationToken
  ): Promise<PrecomputedScopes> {
    const root = document.parseResult.value
    const scopes = new MultiMap<AstNode, AstNodeDescription>()
    if (hasAtLeast(root.models, 1)) {
      const nested = this.processContainer(root.models[0], scopes, document)
      scopes.addAll(root, nested.values())
    }
    return Promise.resolve(scopes)
  }

  protected processContainer(
    container: ElementsContainer,
    scopes: PrecomputedScopes,
    document: LikeC4LangiumDocument
  ) {
    const localScope = new MultiMap<string, AstNodeDescription>()
    const nestedScopes = new MultiMap<string, AstNodeDescription>()
    for (const el of container.elements) {
      if (ast.isRelation(el)) {
        continue
      }

      let subcontainer
      if (ast.isElement(el) && !isEmpty(el.name)) {
        localScope.add(el.name, this.descriptions.createDescription(el, el.name, document))
        subcontainer = el.body
      } else if (ast.isExtendElement(el)) {
        subcontainer = el.body
      }

      if (subcontainer && subcontainer.elements.length > 0) {
        const nested = this.processContainer(subcontainer, scopes, document)
        for (const [nestedName, desc] of nested) {
          nestedScopes.add(nestedName, desc)
        }
      }
    }

    for (const [name, descriptions] of nestedScopes.entriesGroupedByKey()) {
      // If name is unique for current scope
      if (!localScope.has(name) && descriptions.length === 1) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        localScope.add(name, descriptions[0]!)
      }
    }
    scopes.addAll(container, localScope.values())
    return localScope
  }
}
