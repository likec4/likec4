import * as c4 from '@likec4/core'
import { nonNullable } from '@likec4/core/utils'
import { filter, isNonNullish, isNullish, isTruthy, mapToObj, omitBy, pipe } from 'remeda'
import { ast, parseMarkdownAsString, toRelationshipStyleExcludeDefaults } from '../../ast'
import { logger, logWarnError } from '../../logger'
import { type Base, removeIndent } from './Base'

export function SpecificationParser<TBase extends Base>(B: TBase) {
  return class SpecificationParser extends B {
    parseSpecification() {
      const {
        parseResult: {
          value: {
            specifications,
          },
        },
        c4Specification,
      } = this.doc
      const isValid = this.isValid

      for (const elementSpec of specifications.flatMap(s => s.elements.filter(isValid))) {
        try {
          Object.assign(c4Specification.elements, this.parseElementSpecificationNode(elementSpec))
        } catch (e) {
          logWarnError(e)
        }
      }

      for (const deploymentNodeSpec of specifications.flatMap(s => s.deploymentNodes.filter(isValid))) {
        try {
          Object.assign(c4Specification.deployments, this.parseElementSpecificationNode(deploymentNodeSpec))
        } catch (e) {
          logWarnError(e)
        }
      }

      const relations_specs = specifications.flatMap(s => s.relationships.filter(this.isValid))
      for (const { kind, props } of relations_specs) {
        try {
          const kindName = kind.name as c4.RelationshipKind
          if (!isTruthy(kindName)) {
            continue
          }
          if (kindName in c4Specification.relationships) {
            logger.warn(`Relationship kind "${kindName}" is already defined`)
            continue
          }
          const bodyProps = pipe(
            props.filter(ast.isSpecificationRelationshipStringProperty) ?? [],
            filter(p => this.isValid(p) && isNonNullish(p.value)),
            mapToObj(p => [p.key, removeIndent(parseMarkdownAsString(p.value))!] satisfies [string, string]),
            omitBy(isNullish),
          )
          c4Specification.relationships[kindName] = {
            ...bodyProps,
            ...toRelationshipStyleExcludeDefaults(props, this.isValid),
          }
        } catch (e) {
          logWarnError(e)
        }
      }

      const tags_specs = specifications.flatMap(s => s.tags.filter(this.isValid))
      for (const tagSpec of tags_specs) {
        try {
          const tag = tagSpec.tag.name as c4.Tag
          const astPath = this.getAstNodePath(tagSpec.tag)
          const color = tagSpec.color && this.parseColorLiteral(tagSpec.color)
          if (isTruthy(tag)) {
            c4Specification.tags[tag] = {
              astPath,
              ...(color ? { color } : {}),
            }
          }
        } catch (e) {
          logWarnError(e)
        }
      }

      const colors_specs = specifications.flatMap(s => s.colors.filter(isValid))
      for (const { name, color } of colors_specs) {
        try {
          const colorName = name.name as c4.CustomColor
          if (colorName in c4Specification.colors) {
            logger.warn(`Custom color "${colorName}" is already defined`)
            continue
          }
          c4Specification.colors[colorName] = {
            color: nonNullable(this.parseColorLiteral(color), `Color "${colorName}" is not valid: ${color}`),
          }
        } catch (e) {
          logWarnError(e)
        }
      }
    }

    parseElementSpecificationNode(
      specAst: ast.SpecificationElementKind,
    ): { [key: c4.ElementKind]: c4.ElementSpecification }
    parseElementSpecificationNode(
      specAst: ast.SpecificationDeploymentNodeKind,
    ): { [key: c4.DeploymentKind]: c4.ElementSpecification }
    parseElementSpecificationNode(specAst: ast.SpecificationDeploymentNodeKind | ast.SpecificationElementKind) {
      const { kind, props } = specAst
      const kindName = kind.name
      if (!isTruthy(kindName)) {
        throw new Error('DeploymentNodeKind name is not resolved')
      }
      const tags = this.parseTags(specAst)
      const style = this.parseElementStyle(props.find(ast.isElementStyleProperty))
      const links = this.parseLinks(specAst)
      const bodyProps = pipe(
        props.filter(ast.isSpecificationElementStringProperty) ?? [],
        filter(p => this.isValid(p)),
        mapToObj(p => [p.key, p.value as ast.MarkdownOrString | undefined]),
      )

      const { title, description, technology } = this.parseTitleDescriptionTechnology(
        {
          title: undefined,
          description: undefined,
          technology: undefined,
        },
        bodyProps,
      )
      const notation = removeIndent(parseMarkdownAsString(bodyProps.notation))

      return {
        [kindName]: {
          ...(title && { title }),
          ...(description && { description }),
          ...(technology && { technology }),
          ...(notation && { notation }),
          ...(tags && { tags }),
          ...(links && c4.isNonEmptyArray(links) && { links }),
          style,
        } satisfies c4.ElementSpecification,
      }
    }
  }
}
