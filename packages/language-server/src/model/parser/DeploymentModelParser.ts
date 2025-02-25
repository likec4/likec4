import type * as c4 from '@likec4/core'
import { FqnRef, isNonEmptyArray, LinkedList, nameFromFqn, nonexhaustive, nonNullable } from '@likec4/core'
import { filter, first, isEmpty, isTruthy, map, mapToObj, pipe } from 'remeda'
import {
  type LikeC4LangiumDocument,
  type ParsedAstDeployment,
  type ParsedAstDeploymentRelation,
  type ParsedAstExtend,
  ast,
  toElementStyle,
  toRelationshipStyleExcludeDefaults,
} from '../../ast'
import { logWarnError } from '../../logger'
import { elementRef } from '../../utils/elementRef'
import { stringHash } from '../../utils/stringHash'
import { removeIndent, toSingleLine } from './Base'
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
    if (ast.isDeployedInstance(el)) {
      yield el
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
      const id = this.resolveFqn(astNode)
      const kind = nonNullable(astNode.kind.ref, 'DeploymentKind not resolved').name as c4.DeploymentNodeKind
      const tags = this.convertTags(astNode.body)
      const stylePropsAst = astNode.body?.props.find(ast.isElementStyleProperty)?.props
      const style = toElementStyle(stylePropsAst, isValid)
      const metadata = this.getMetadata(astNode.body?.props.find(ast.isMetadataProperty))

      const bodyProps = pipe(
        astNode.body?.props ?? [],
        filter(isValid),
        filter(ast.isElementStringProperty),
        mapToObj(p => [p.key, p.value || undefined]),
      )

      const title = removeIndent(astNode.title ?? bodyProps.title)
      const description = removeIndent(bodyProps.description)
      const technology = toSingleLine(bodyProps.technology)

      const links = this.convertLinks(astNode.body)

      // Property has higher priority than from style
      const iconProp = astNode.body?.props.find(ast.isIconProperty)
      if (iconProp && isValid(iconProp)) {
        const value = iconProp.libicon?.ref?.name ?? iconProp.value
        if (isTruthy(value)) {
          style.icon = value as c4.IconUrl
        }
      }

      return {
        id,
        kind,
        title: title ?? nameFromFqn(id),
        ...(metadata && { metadata }),
        ...(tags && { tags }),
        ...(links && isNonEmptyArray(links) && { links }),
        ...(isTruthy(technology) && { technology }),
        ...(isTruthy(description) && { description }),
        style,
      }
    }

    parseDeployedInstance(astNode: ast.DeployedInstance): ParsedAstDeployment.Instance {
      const isValid = this.isValid
      const id = this.resolveFqn(astNode)
      const element = this.resolveFqn(nonNullable(elementRef(astNode.element), 'DeployedInstance element not found'))

      const tags = this.convertTags(astNode.body)
      const stylePropsAst = astNode.body?.props.find(ast.isElementStyleProperty)?.props
      const style = toElementStyle(stylePropsAst, isValid)
      const metadata = this.getMetadata(astNode.body?.props.find(ast.isMetadataProperty))

      const bodyProps = pipe(
        astNode.body?.props ?? [],
        filter(isValid),
        filter(ast.isElementStringProperty),
        mapToObj(p => [p.key, p.value || undefined]),
      )

      const title = removeIndent(astNode.title ?? bodyProps.title)
      const description = removeIndent(bodyProps.description)
      const technology = toSingleLine(bodyProps.technology)

      const links = this.convertLinks(astNode.body)

      // Property has higher priority than from style
      const iconProp = astNode.body?.props.find(ast.isIconProperty)
      if (iconProp && isValid(iconProp)) {
        const value = iconProp.libicon?.ref?.name ?? iconProp.value
        if (isTruthy(value)) {
          style.icon = value as c4.IconUrl
        }
      }

      return {
        id,
        element,
        ...(metadata && { metadata }),
        ...(title && { title }),
        ...(tags && { tags }),
        ...(links && isNonEmptyArray(links) && { links }),
        ...(isTruthy(technology) && { technology }),
        ...(isTruthy(description) && { description }),
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

    parseDeploymentRelation(astNode: ast.DeploymentRelation): ParsedAstDeploymentRelation {
      const isValid = this.isValid
      const astPath = this.getAstNodePath(astNode)
      const source = FqnRef.toDeploymentRef(this.parseFqnRef(astNode.source))
      const target = FqnRef.toDeploymentRef(this.parseFqnRef(astNode.target))

      const tags = this.convertTags(astNode) ?? this.convertTags(astNode.body)
      const links = this.convertLinks(astNode.body)
      const kind = astNode.kind?.ref?.name as (c4.RelationshipKind | undefined)
      const metadata = this.getMetadata(astNode.body?.props.find(ast.isMetadataProperty))

      const bodyProps = mapToObj(
        astNode.body?.props.filter(ast.isRelationStringProperty) ?? [],
        p => [p.key, p.value as string | undefined],
      )

      const navigateTo = pipe(
        astNode.body?.props ?? [],
        filter(ast.isRelationNavigateToProperty),
        map(p => p.value.view.ref?.name),
        filter(isTruthy),
        first(),
      )

      const title = removeIndent(astNode.title ?? bodyProps.title)
      const description = removeIndent(bodyProps.description)
      const technology = toSingleLine(astNode.technology) ?? removeIndent(bodyProps.technology)

      const styleProp = astNode.body?.props.find(ast.isRelationStyleProperty)

      const id = stringHash(
        'deployment',
        astPath,
        source.id,
        target.id,
      ) as c4.RelationId

      return {
        id,
        source,
        target,
        ...title && { title },
        ...(metadata && { metadata }),
        ...(isTruthy(technology) && { technology }),
        ...(isTruthy(description) && { description }),
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
