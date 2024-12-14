import type * as c4 from '@likec4/core'
import { FqnRef, isNonEmptyArray, nameFromFqn, nonexhaustive, nonNullable } from '@likec4/core'
import { filter, first, isTruthy, map, mapToObj, pipe } from 'remeda'
import {
  ast,
  type ParsedAstDeployment,
  type ParsedAstDeploymentRelation,
  toElementStyle,
  toRelationshipStyleExcludeDefaults
} from '../../ast'
import { logWarnError } from '../../logger'
import { elementRef } from '../../utils/elementRef'
import { stringHash } from '../../utils/stringHash'
import { removeIndent, toSingleLine } from './Base'
import type { WithExpressionV2 } from './FqnRefParser'

export type WithDeploymentModel = ReturnType<typeof DeploymentModelParser>

export function DeploymentModelParser<TBase extends WithExpressionV2>(B: TBase) {
  return class DeploymentModelParser extends B {
    parseDeployment() {
      type TraversePair = ast.DeployedInstance | ast.DeploymentNode | ast.DeploymentRelation
      const doc = this.doc
      const isValid = this.isValid
      const traverseStack: TraversePair[] = doc.parseResult.value.deployments.flatMap(d => d.elements)

      let next: TraversePair | undefined
      while ((next = traverseStack.shift())) {
        if (ast.isDeploymentRelation(next)) {
          doc.c4DeploymentRelations.push(this.parseDeploymentRelation(next))
          continue
        }
        if (!isValid(next)) {
          continue
        }
        try {
          switch (true) {
            case ast.isDeployedInstance(next):
              doc.c4Deployments.push(this.parseDeployedInstance(next))
              break
            case ast.isDeploymentNode(next): {
              doc.c4Deployments.push(this.parseDeploymentNode(next))
              if (next.body && next.body.elements.length > 0) {
                traverseStack.push(...next.body.elements)
              }
              break
            }
            default:
              nonexhaustive(next)
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
        mapToObj(p => [p.key, p.value || undefined])
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
        style
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
        mapToObj(p => [p.key, p.value || undefined])
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
        style
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
        p => [p.key, p.value as string | undefined]
      )

      const navigateTo = pipe(
        astNode.body?.props ?? [],
        filter(ast.isRelationNavigateToProperty),
        map(p => p.value.view.ref?.name),
        filter(isTruthy),
        first()
      )

      const title = removeIndent(astNode.title ?? bodyProps.title)
      const description = removeIndent(bodyProps.description)
      const technology = toSingleLine(astNode.technology) ?? removeIndent(bodyProps.technology)

      const styleProp = astNode.body?.props.find(ast.isRelationStyleProperty)

      const id = stringHash(
        'deployment',
        astPath,
        source.id,
        target.id
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
        astPath
      }
    }
  }
}
