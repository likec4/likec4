import {
  type AstNode,
  type AstNodeDescription,
  DefaultScopeComputation,
  MultiMap,
  type PrecomputedScopes
} from 'langium'
import { isEmpty, isTruthy } from 'remeda'
import type { CancellationToken } from 'vscode-languageserver'
import { ast, type LikeC4LangiumDocument } from '../ast'
import { logError } from '../logger'

type ElementsContainer = ast.Model | ast.ElementBody | ast.ExtendElementBody

export class LikeC4ScopeComputation extends DefaultScopeComputation {
  override computeExports(
    document: LikeC4LangiumDocument,
    _cancelToken?: CancellationToken
  ): Promise<AstNodeDescription[]> {
    return new Promise(resolve => {
      const docExports: AstNodeDescription[] = []
      const { specifications, models, views } = document.parseResult.value

      try {
        for (const spec of specifications.flatMap(s => [...s.elements, ...s.relationships])) {
          if (spec.kind && isTruthy(spec.kind.name)) {
            docExports.push(
              this.descriptions.createDescription(spec.kind, spec.kind.name, document)
            )
          }
        }
      } catch (e) {
        logError(e)
      }

      try {
        for (const spec of specifications.flatMap(s => s.tags)) {
          if (spec.tag && isTruthy(spec.tag.name)) {
            docExports.push(
              this.descriptions.createDescription(spec.tag, '#' + spec.tag.name, document)
            )
          }
        }
      } catch (e) {
        logError(e)
      }

      try {
        for (const elAst of models.flatMap(m => m.elements)) {
          if (ast.isElement(elAst) && isTruthy(elAst.name)) {
            docExports.push(this.descriptions.createDescription(elAst, elAst.name, document))
          }
        }
      } catch (e) {
        logError(e)
      }

      try {
        for (const viewAst of views.flatMap(v => v.views)) {
          if (isTruthy(viewAst.name)) {
            docExports.push(this.descriptions.createDescription(viewAst, viewAst.name, document))
          }
        }
      } catch (e) {
        logError(e)
      }
      resolve(docExports)
    })
  }

  override computeLocalScopes(
    document: LikeC4LangiumDocument,
    _cancelToken?: CancellationToken
  ): Promise<PrecomputedScopes> {
    return new Promise(resolve => {
      const root = document.parseResult.value
      const scopes = new MultiMap<AstNode, AstNodeDescription>()
      for (const model of root.models) {
        try {
          const nested = this.processContainer(model, scopes, document)
          scopes.addAll(root, nested.values())
        } catch (e) {
          logError(e)
        }
      }
      resolve(scopes)
    })
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
      if (ast.isElement(el)) {
        if (isTruthy(el.name)) {
          localScope.add(el.name, this.descriptions.createDescription(el, el.name, document))
        }
        subcontainer = el.body
      } else if (ast.isExtendElement(el)) {
        subcontainer = el.body
      }

      if (subcontainer && subcontainer.elements.length > 0) {
        try {
          const nested = this.processContainer(subcontainer, scopes, document)
          for (const [nestedName, desc] of nested) {
            nestedScopes.add(nestedName, desc)
          }
        } catch (e) {
          logError(e)
        }
      }
    }

    if (nestedScopes.size > 0) {
      for (const [name, descriptions] of nestedScopes.entriesGroupedByKey()) {
        // If name is unique for current scope
        if (!localScope.has(name) && descriptions.length === 1) {
          localScope.add(name, descriptions[0]!)
        }
      }
    }
    scopes.addAll(container, localScope.values())
    return localScope
  }
}
