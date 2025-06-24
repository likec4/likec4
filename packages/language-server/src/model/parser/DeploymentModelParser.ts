import type * as c4 from '@likec4/core'
import { FqnRef, invariant, isNonEmptyArray, LinkedList, nameFromFqn, nonexhaustive, nonNullable } from '@likec4/core'
import { filter, first, isDefined, isEmpty, isTruthy, map, mapToObj, pipe } from 'remeda'
import {
  type LikeC4LangiumDocument,
  type ParsedAstDeployment,
  type ParsedAstDeploymentRelation,
  type ParsedAstExtend,
  ast,
  toRelationshipStyleExcludeDefaults,
} from '../../ast'
import { logWarnError } from '../../logger'
import { stringHash } from '../../utils/stringHash'
import type { WithExpressionV2 } from './FqnRefParser'

export type WithDeploymentModel = ReturnType<typeof DeploymentModelParser>

function* streamDeploymentModel(doc: LikeC4LangiumDocument) {
  const traverseStack = LinkedList.from<ast.DeploymentRelation | ast.DeploymentElement | ast.ExtendDeployment>(
    doc.parseResult.value.deployments.flatMap(m => m.elements),
  )
  const relations = [] as ast.DeploymentRelation[]
  let el
  while ((el = traverseStack.shift())) {
    if (ast.isDeploymentRelation(el)) {
      relations.push(el)
      continue
    }
    if (el.body && el.body.elements.length > 0) {
      for (const child of el.body.elements) {
        traverseStack.push(child)
      }
    }
    yield el
  }
  yield* relations
  return
}

export function DeploymentModelParser<TBase extends WithExpressionV2>(B: TBase) {
  return class DeploymentModelParser extends B {
    parseDeployment() {
      const doc = this.doc
      for (const el of streamDeploymentModel(doc)) {
        try {
          switch (true) {
            case ast.isDeploymentRelation(el): {
              if (this.isValid(el)) {
                doc.c4DeploymentRelations.push(this.parseDeploymentRelation(el))
              }
              break
            }
            case ast.isDeployedInstance(el):
              doc.c4Deployments.push(this.parseDeployedInstance(el))
              break
            case ast.isDeploymentNode(el): {
              doc.c4Deployments.push(this.parseDeploymentNode(el))
              break
            }
            case ast.isExtendDeployment(el): {
              const parsed = this.parseExtendDeployment(el)
              if (parsed) {
                doc.c4ExtendDeployments.push(parsed)
              }
              break
            }
            default:
              nonexhaustive(el)
          }
        } catch (e) {
          logWarnError(e)
        }
      }
    }

    parseDeploymentNode(astNode: ast.DeploymentNode): ParsedAstDeployment.Node {
      const isValid = this.isValid
      const id = this.resolveFqn(astNode) as unknown as c4.DeploymentFqn
      const kind = nonNullable(astNode.kind.ref, 'DeploymentKind not resolved').name as c4.DeploymentKind
      const tags = this.convertTags(astNode.body)
      const style = this.parseElementStyle(astNode.body?.props)
      const metadata = this.getMetadata(astNode.body?.props.find(ast.isMetadataProperty))

      const bodyProps = pipe(
        astNode.body?.props ?? [],
        filter(isValid),
        filter(ast.isElementStringProperty),
        mapToObj(p => [p.key, p.value as ast.MarkdownOrString | undefined]),
      )

      const { title, ...descAndTech } = this.parseTitleDescriptionTechnology(
        {
          title: astNode.title,
        },
        bodyProps,
      )

      const links = this.convertLinks(astNode.body)

      return {
        id,
        kind,
        title: title ?? nameFromFqn(id),
        ...(metadata && { metadata }),
        ...(tags && { tags }),
        ...(links && isNonEmptyArray(links) && { links }),
        ...descAndTech,
        style,
      }
    }

    parseDeployedInstance(astNode: ast.DeployedInstance): ParsedAstDeployment.Instance {
      const isValid = this.isValid
      const id = this.resolveFqn(astNode) as unknown as c4.DeploymentFqn
      const target = this.parseFqnRef(astNode.target.modelElement)
      invariant(FqnRef.isModelRef(target) || FqnRef.isImportRef(target), 'Target must be a model reference')
      // const element = FqnRef.toModelFqn(target)

      const tags = this.convertTags(astNode.body)
      const style = this.parseElementStyle(astNode.body?.props)
      const metadata = this.getMetadata(astNode.body?.props.find(ast.isMetadataProperty))

      const bodyProps = pipe(
        astNode.body?.props ?? [],
        filter(isValid),
        filter(ast.isElementStringProperty),
        mapToObj(p => [p.key, p.value as ast.MarkdownOrString | undefined]),
      )

      const titleDescAndTech = this.parseTitleDescriptionTechnology(
        {
          title: astNode.title,
        },
        bodyProps,
      )

      const links = this.convertLinks(astNode.body)

      return {
        id,
        element: target,
        ...(metadata && { metadata }),
        ...(tags && { tags }),
        ...(links && isNonEmptyArray(links) && { links }),
        ...titleDescAndTech,
        style,
      }
    }

    parseExtendDeployment(astNode: ast.ExtendDeployment): ParsedAstExtend | null {
      if (!this.isValid(astNode)) {
        return null
      }
      const id = this.resolveFqn(astNode)
      const tags = this.parseTags(astNode.body)
      const metadata = this.getMetadata(astNode.body?.props.find(ast.isMetadataProperty))
      const astPath = this.getAstNodePath(astNode)
      const links = this.parseLinks(astNode.body) ?? []

      if (!tags && isEmpty(metadata ?? {}) && isEmpty(links)) {
        return null
      }

      return {
        id,
        astPath,
        ...(metadata && { metadata }),
        ...(tags && { tags }),
        ...(links && isNonEmptyArray(links) && { links }),
      }
    }

    _resolveDeploymentRelationSource(node: ast.DeploymentRelation): FqnRef {
      if (isDefined(node.source)) {
        return this.parseFqnRef(node.source)
      }
      if (node.$container.$type === 'DeploymentNodeBody' || node.$container.$type === 'DeployedInstanceBody') {
        return {
          deployment: this.resolveFqn(node.$container.$container),
        }
      }
      throw new Error('RelationRefError: Invalid container for sourceless relation')
    }

    parseDeploymentRelation(astNode: ast.DeploymentRelation): ParsedAstDeploymentRelation {
      const isValid = this.isValid
      const astPath = this.getAstNodePath(astNode)
      const source = this._resolveDeploymentRelationSource(astNode)
      invariant(FqnRef.isDeploymentRef(source), 'Invalid source for deployment relation')
      const target = this.parseFqnRef(astNode.target)
      invariant(FqnRef.isDeploymentRef(target), 'Invalid target for deployment relation')

      const tags = this.convertTags(astNode) ?? this.convertTags(astNode.body)
      const links = this.convertLinks(astNode.body)
      const kind = (astNode.kind ?? astNode.dotKind?.kind)?.ref?.name as (c4.RelationshipKind | undefined)
      const metadata = this.getMetadata(astNode.body?.props.find(ast.isMetadataProperty))

      const bodyProps = pipe(
        astNode.body?.props ?? [],
        filter(ast.isRelationStringProperty),
        filter(p => isTruthy(p.value)),
        mapToObj(p => [p.key, p.value as ast.MarkdownOrString | undefined]),
      )

      const navigateTo = pipe(
        astNode.body?.props ?? [],
        filter(ast.isRelationNavigateToProperty),
        map(p => p.value.view.ref?.name),
        filter(isTruthy),
        first(),
      )

      const titleDescAndTech = this.parseTitleDescriptionTechnology(
        {
          title: astNode.title,
        },
        bodyProps,
      )

      const styleProp = astNode.body?.props.find(ast.isRelationStyleProperty)

      const id = stringHash(
        'deployment',
        astPath,
        source.deployment,
        target.deployment,
      ) as c4.RelationId

      return {
        id,
        source,
        target,
        ...titleDescAndTech,
        ...(metadata && { metadata }),
        ...(kind && { kind }),
        ...(tags && { tags }),
        ...(isNonEmptyArray(links) && { links }),
        ...toRelationshipStyleExcludeDefaults(styleProp?.props, isValid),
        ...(navigateTo && { navigateTo: navigateTo as c4.ViewId }),
        astPath,
      }
    }
  }
}
