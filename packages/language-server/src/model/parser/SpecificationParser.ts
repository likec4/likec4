import type * as c4 from '@likec4/core'
import type { HexColorLiteral } from '@likec4/core'
import { filter, isNonNullish, isTruthy, mapToObj, pipe } from 'remeda'
import { ast, toElementStyle, toRelationshipStyleExcludeDefaults } from '../../ast'
import { logger, logWarnError } from '../../logger'
import { type Base, removeIndent } from './Base'

export function SpecificationParser<TBase extends Base>(B: TBase) {
  return class SpecificationParser extends B {
    parseSpecification() {
      const {
        parseResult: {
          value: {
            specifications
          }
        },
        c4Specification
      } = this.doc
      const isValid = this.isValid

      const element_specs = specifications.flatMap(s => s.elements.filter(this.isValid))
      for (const { kind, props } of element_specs) {
        try {
          const kindName = kind.name as c4.ElementKind
          if (!isTruthy(kindName)) {
            continue
          }
          if (kindName in c4Specification.elements) {
            logger.warn(`Element kind "${kindName}" is already defined`)
            continue
          }
          const style = props.find(ast.isElementStyleProperty)
          const bodyProps = pipe(
            props.filter(ast.isSpecificationElementStringProperty) ?? [],
            filter(p => this.isValid(p) && isNonNullish(p.value)),
            mapToObj(p => [p.key, removeIndent(p.value)] satisfies [string, string])
          )
          c4Specification.elements[kindName] = {
            ...bodyProps,
            style: {
              ...toElementStyle(style?.props, this.isValid)
            }
          }
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
            mapToObj(p => [p.key, removeIndent(p.value)] satisfies [string, string])
          )
          c4Specification.relationships[kindName] = {
            ...bodyProps,
            ...toRelationshipStyleExcludeDefaults(props, this.isValid)
          }
        } catch (e) {
          logWarnError(e)
        }
      }

      const tags_specs = specifications.flatMap(s => s.tags.filter(this.isValid))
      for (const tagSpec of tags_specs) {
        const tag = tagSpec.tag.name as c4.Tag
        if (isTruthy(tag)) {
          c4Specification.tags.add(tag)
        }
      }

      const deploymentNodes_specs = specifications.flatMap(s => s.deploymentNodes.filter(isValid))
      for (const deploymentNode of deploymentNodes_specs) {
        try {
          Object.assign(c4Specification.deployments, this.parseSpecificationDeploymentNodeKind(deploymentNode))
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
            color: color as HexColorLiteral
          }
        } catch (e) {
          logWarnError(e)
        }
      }
    }

    parseSpecificationDeploymentNodeKind(
      { kind, props }: ast.SpecificationDeploymentNodeKind
    ): { [key: c4.DeploymentNodeKind]: c4.DeploymentNodeKindSpecification } {
      const kindName = kind.name as c4.DeploymentNodeKind
      if (!isTruthy(kindName)) {
        throw new Error('DeploymentNodeKind name is not resolved')
      }

      const style = props.find(ast.isElementStyleProperty)
      const bodyProps = pipe(
        props.filter(ast.isSpecificationElementStringProperty) ?? [],
        filter(p => this.isValid(p) && isNonNullish(p.value)),
        mapToObj(p => [p.key, removeIndent(p.value)] satisfies [string, string])
      )
      return {
        [kindName]: {
          ...bodyProps,
          style: {
            ...toElementStyle(style?.props, this.isValid)
          }
        }
      }
    }
  }
}
