import { nonexhaustive } from '@likec4/core'
import {
  type AstNode,
  type AstNodeDescription,
  DefaultScopeComputation,
  MultiMap,
  type PrecomputedScopes
} from 'langium'
import { isNullish, isTruthy } from 'remeda'
import type { CancellationToken } from 'vscode-languageserver'
import { ast, type LikeC4LangiumDocument } from '../ast'
import { logError } from '../logger'
import type { LikeC4Services } from '../module'

type ElementsContainer = ast.Model | ast.ElementBody | ast.ExtendElementBody

export class LikeC4ScopeComputation extends DefaultScopeComputation {
  constructor(private services: LikeC4Services) {
    super(services)
  }

  override async computeExports(
    document: LikeC4LangiumDocument,
    _cancelToken?: CancellationToken
  ): Promise<AstNodeDescription[]> {
    const docExports: AstNodeDescription[] = []
    try {
      const { specifications, models, views, globals, likec4lib, deployments } = document.parseResult.value

      // Process library
      this.exportLibrary(likec4lib, docExports, document)

      // Process specification
      this.exportSpecification(specifications, docExports, document)

      // Process models
      this.exportModel(models, docExports, document)

      // Process views
      this.exportViews(views, docExports, document)

      // Process global
      this.exportGlobals(globals, docExports, document)

      this.exportDeployments(deployments, docExports, document)
    } catch (e) {
      logError(e)
    }
    return docExports
  }

  private exportViews(
    views: ast.ModelViews[] | undefined,
    docExports: AstNodeDescription[],
    document: LikeC4LangiumDocument
  ) {
    if (isNullish(views) || views.length === 0) {
      return
    }
    for (const viewAst of views.flatMap(v => v.views)) {
      try {
        if (isTruthy(viewAst.name)) {
          docExports.push(this.descriptions.createDescription(viewAst, viewAst.name, document))
        }
      } catch (e) {
        logError(e)
      }
    }
  }

  private exportGlobals(
    globals: ast.Globals[] | undefined,
    docExports: AstNodeDescription[],
    document: LikeC4LangiumDocument
  ) {
    if (isNullish(globals) || globals.length === 0) {
      return
    }
    for (const globalPredicateAst of globals.flatMap(g => g.predicates)) {
      try {
        const id = globalPredicateAst
        if (isTruthy(id.name)) {
          docExports.push(this.descriptions.createDescription(id, id.name, document))
        }
      } catch (e) {
        logError(e)
      }
    }
    for (const globalStyleAst of globals.flatMap(g => g.styles)) {
      try {
        const id = globalStyleAst.id
        if (isTruthy(id.name)) {
          docExports.push(this.descriptions.createDescription(id, id.name, document))
        }
      } catch (e) {
        logError(e)
      }
    }
  }

  private exportModel(
    models: ast.Model[] | undefined,
    docExports: AstNodeDescription[],
    document: LikeC4LangiumDocument
  ) {
    if (isNullish(models) || models.length === 0) {
      return
    }
    for (const elAst of models.flatMap(m => m.elements)) {
      try {
        if (ast.isElement(elAst) && isTruthy(elAst.name)) {
          docExports.push(this.descriptions.createDescription(elAst, elAst.name, document))
        }
      } catch (e) {
        logError(e)
      }
    }
  }

  private exportLibrary(
    likec4lib: ast.LikeC4Lib[] | undefined,
    docExports: AstNodeDescription[],
    document: LikeC4LangiumDocument
  ) {
    if (isNullish(likec4lib)) {
      return
    }
    try {
      for (const iconAst of likec4lib.flatMap(l => l.icons)) {
        docExports.push(this.descriptions.createDescription(iconAst, iconAst.name, document))
      }
    } catch (e) {
      logError(e)
    }
  }

  private exportSpecification(
    specifications: ast.SpecificationRule[] | undefined,
    docExports: AstNodeDescription[],
    document: LikeC4LangiumDocument
  ) {
    if (isNullish(specifications) || specifications.length === 0) {
      return
    }
    for (
      const spec of specifications.flatMap(s => [
        ...s.elements,
        ...s.relationships,
        ...s.tags,
        ...s.colors
      ])
    ) {
      try {
        switch (true) {
          case ast.isSpecificationElementKind(spec): {
            if (isTruthy(spec.kind.name)) {
              docExports.push(
                this.descriptions.createDescription(spec.kind, spec.kind.name, document)
              )
            }
            continue
          }
          case ast.isSpecificationTag(spec): {
            if (isTruthy(spec.tag.name)) {
              docExports.push(
                this.descriptions.createDescription(spec.tag, '#' + spec.tag.name, document)
              )
            }
            continue
          }
          case ast.isSpecificationRelationshipKind(spec): {
            if (isTruthy(spec.kind.name)) {
              docExports.push(
                this.descriptions.createDescription(spec.kind, spec.kind.name, document),
                this.descriptions.createDescription(spec.kind, '.' + spec.kind.name, document)
              )
            }
            continue
          }
          case ast.isSpecificationColor(spec): {
            if (isTruthy(spec.name.name)) {
              docExports.push(
                this.descriptions.createDescription(spec.name, spec.name.name, document)
              )
            }
            continue
          }
          // Thow error if not exhaustive
          default:
            nonexhaustive(spec)
        }
      } catch (e) {
        logError(e)
      }
    }
  }

  private exportDeployments(
    deployments: ast.ModelDeployments[] | undefined,
    docExports: AstNodeDescription[],
    document: LikeC4LangiumDocument
  ) {
    if (isNullish(deployments) || deployments.length === 0) {
      return
    }
    const deploymentsIndex = this.services.likec4.DeploymentsIndex.get(document)
    docExports.push(...deploymentsIndex.rootNodes())
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
