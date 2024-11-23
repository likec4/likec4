import { nonexhaustive } from '@likec4/core'
import {
  type AstNode,
  type AstNodeDescription,
  DefaultScopeComputation,
  MultiMap,
  type PrecomputedScopes
} from 'langium'
import { filter, forEachObj, groupBy, isNullish, isTruthy, pipe } from 'remeda'
import type { CancellationToken } from 'vscode-languageserver'
import { ast, type LikeC4LangiumDocument } from '../ast'
import { logError } from '../logger'
import type { LikeC4Services } from '../module'

type ElementsContainer = ast.Model | ast.ElementBody | ast.ExtendElementBody

export class LikeC4ScopeComputation extends DefaultScopeComputation {
  constructor(services: LikeC4Services) {
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
    modelViews: ast.ModelViews[] | undefined,
    docExports: AstNodeDescription[],
    document: LikeC4LangiumDocument
  ) {
    const views = modelViews?.flatMap(m => m.views)
    if (isNullish(views) || views.length === 0) {
      return
    }
    for (const viewAst of views) {
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
        ...s.deploymentNodes,
        ...s.tags,
        ...s.colors
      ])
    ) {
      try {
        switch (true) {
          case ast.isSpecificationDeploymentNodeKind(spec):
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
    modelDeployments: ast.ModelDeployments[] | undefined,
    docExports: AstNodeDescription[],
    document: LikeC4LangiumDocument
  ) {
    const nodes = modelDeployments?.flatMap(m => m.elements)
    if (isNullish(nodes) || nodes.length === 0) {
      return
    }
    for (const node of nodes) {
      try {
        if (ast.isDeploymentNode(node) && isTruthy(node.name)) {
          docExports.push(this.descriptions.createDescription(node, node.name, document))
        }
      } catch (e) {
        logError(e)
      }
    }
  }

  override computeLocalScopes(
    document: LikeC4LangiumDocument,
    _cancelToken?: CancellationToken
  ): Promise<PrecomputedScopes> {
    return new Promise(resolve => {
      const root = document.parseResult.value
      const descedants = [] as AstNodeDescription[]
      const scopes = new MultiMap<AstNode, AstNodeDescription>()
      for (const model of root.models) {
        try {
          descedants.push(
            ...this.processContainer(model, scopes, document)
          )
        } catch (e) {
          logError(e)
        }
      }

      pipe(
        descedants,
        groupBy(desc => desc.name),
        forEachObj(descs => {
          if (descs.length === 1) {
            scopes.add(root, descs[0])
          }
        })
      )
      resolve(scopes)
    })
  }

  protected processContainer(
    container: ElementsContainer,
    scopes: PrecomputedScopes,
    document: LikeC4LangiumDocument
  ): AstNodeDescription[] {
    const localScope = new MultiMap<string, AstNodeDescription>()
    const descedants = [] as AstNodeDescription[]

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
          descedants.push(
            ...this.processContainer(subcontainer, scopes, document)
          )
        } catch (e) {
          logError(e)
        }
      }
    }

    if (descedants.length) {
      pipe(
        descedants,
        filter(desc => !localScope.has(desc.name)),
        groupBy(desc => desc.name),
        forEachObj((descs, name) => {
          if (descs.length === 1) {
            localScope.add(name, descs[0])
          }
        })
      )
    }
    const local = localScope.values().toArray()
    scopes.addAll(container, local)
    return local
  }
}
