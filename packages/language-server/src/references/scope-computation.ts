import { nonexhaustive } from '@likec4/core'
import {
  type AstNode,
  type AstNodeDescription,
  type PrecomputedScopes,
  DefaultScopeComputation,
  MultiMap,
} from 'langium'
import { entries, filter, flatMap, forEachObj, groupBy, isNullish, isTruthy, pipe } from 'remeda'
import type { CancellationToken } from 'vscode-languageserver'
import { type LikeC4LangiumDocument, ast } from '../ast'
import { logWarnError } from '../logger'
import type { LikeC4Services } from '../module'

type ElementsContainer = ast.Model | ast.ElementBody | ast.ExtendElementBody
type DeploymentsContainer = ast.ModelDeployments | ast.DeploymentNodeBody | ast.ExtendDeploymentBody

function uniqueDescriptions(
  descs: AstNodeDescription[],
): AstNodeDescription[] {
  return pipe(
    descs,
    groupBy(desc => `${desc.type}.${desc.name}`),
    entries(),
    flatMap(([_, descs]) => descs.length === 1 ? descs : []),
  )
}

export class LikeC4ScopeComputation extends DefaultScopeComputation {
  constructor(services: LikeC4Services) {
    super(services)
  }

  override async computeExports(
    document: LikeC4LangiumDocument,
    _cancelToken?: CancellationToken,
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
      logWarnError(e)
    }
    return docExports
  }

  private exportViews(
    modelViews: ast.ModelViews[] | undefined,
    docExports: AstNodeDescription[],
    document: LikeC4LangiumDocument,
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
        logWarnError(e)
      }
    }
  }

  private exportGlobals(
    globals: ast.Globals[] | undefined,
    docExports: AstNodeDescription[],
    document: LikeC4LangiumDocument,
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
        logWarnError(e)
      }
    }
    for (const globalStyleAst of globals.flatMap(g => g.styles)) {
      try {
        const id = globalStyleAst.id
        if (isTruthy(id.name)) {
          docExports.push(this.descriptions.createDescription(id, id.name, document))
        }
      } catch (e) {
        logWarnError(e)
      }
    }
  }

  private exportModel(
    models: ast.Model[] | undefined,
    docExports: AstNodeDescription[],
    document: LikeC4LangiumDocument,
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
        logWarnError(e)
      }
    }
  }

  private exportLibrary(
    likec4lib: ast.LikeC4Lib[] | undefined,
    docExports: AstNodeDescription[],
    document: LikeC4LangiumDocument,
  ) {
    if (isNullish(likec4lib)) {
      return
    }
    try {
      for (const iconAst of likec4lib.flatMap(l => l.icons)) {
        docExports.push(this.descriptions.createDescription(iconAst, iconAst.name, document))
      }
    } catch (e) {
      logWarnError(e)
    }
  }

  private exportSpecification(
    specifications: ast.SpecificationRule[] | undefined,
    docExports: AstNodeDescription[],
    document: LikeC4LangiumDocument,
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
        ...s.colors,
      ])
    ) {
      try {
        switch (true) {
          case ast.isSpecificationDeploymentNodeKind(spec):
          case ast.isSpecificationElementKind(spec): {
            if (isTruthy(spec.kind.name)) {
              docExports.push(
                this.descriptions.createDescription(spec.kind, spec.kind.name, document),
              )
            }
            continue
          }
          case ast.isSpecificationTag(spec): {
            if (isTruthy(spec.tag.name)) {
              docExports.push(
                this.descriptions.createDescription(spec.tag, '#' + spec.tag.name, document),
              )
            }
            continue
          }
          case ast.isSpecificationRelationshipKind(spec): {
            if (isTruthy(spec.kind.name)) {
              docExports.push(
                this.descriptions.createDescription(spec.kind, spec.kind.name, document),
                this.descriptions.createDescription(spec.kind, '.' + spec.kind.name, document),
              )
            }
            continue
          }
          case ast.isSpecificationColor(spec): {
            if (isTruthy(spec.name.name)) {
              docExports.push(
                this.descriptions.createDescription(spec.name, spec.name.name, document),
              )
            }
            continue
          }
          // Thow error if not exhaustive
          default:
            nonexhaustive(spec)
        }
      } catch (e) {
        logWarnError(e)
      }
    }
  }

  private exportDeployments(
    modelDeployments: ast.ModelDeployments[] | undefined,
    docExports: AstNodeDescription[],
    document: LikeC4LangiumDocument,
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
        logWarnError(e)
      }
    }
  }

  override computeLocalScopes(
    document: LikeC4LangiumDocument,
    _cancelToken?: CancellationToken,
  ): Promise<PrecomputedScopes> {
    return new Promise(resolve => {
      const root = document.parseResult.value
      const descendants = [] as AstNodeDescription[]
      const scopes = new MultiMap<AstNode, AstNodeDescription>()

      for (const model of root.models) {
        try {
          descendants.push(
            ...this.processContainer(model, scopes, document),
          )
        } catch (e) {
          logWarnError(e)
        }
      }
      for (const deployment of root.deployments) {
        try {
          descendants.push(
            ...this.processDeployments(deployment, scopes, document),
          )
        } catch (e) {
          logWarnError(e)
        }
      }

      uniqueDescriptions(descendants).forEach(desc => {
        scopes.add(root, desc)
      })

      resolve(scopes)
    })
  }

  protected processContainer(
    container: ElementsContainer,
    scopes: PrecomputedScopes,
    document: LikeC4LangiumDocument,
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
            ...this.processContainer(subcontainer, scopes, document),
          )
        } catch (e) {
          logWarnError(e)
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
        }),
      )
    }
    const local = [...localScope.values()]
    scopes.addAll(container, local)
    return local
  }

  protected processDeployments(
    container: DeploymentsContainer,
    scopes: PrecomputedScopes,
    document: LikeC4LangiumDocument,
  ): AstNodeDescription[] {
    const localScope = new MultiMap<string, AstNodeDescription>()
    const descedants = [] as AstNodeDescription[]

    for (const el of container.elements) {
      if (ast.isDeploymentRelation(el)) {
        continue
      }

      if (!ast.isExtendDeployment(el)) {
        let name = this.nameProvider.getName(el)
        if (isTruthy(name)) {
          const desc = this.descriptions.createDescription(el, name, document)
          localScope.add(name, desc)
        }
      }

      if (!ast.isDeployedInstance(el) && el.body) {
        try {
          descedants.push(
            ...this.processDeployments(el.body, scopes, document),
          )
        } catch (e) {
          logWarnError(e)
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
        }),
      )
    }
    const local = [...localScope.values()]
    scopes.addAll(container, local)
    return local
  }
}
