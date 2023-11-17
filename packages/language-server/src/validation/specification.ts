import type { ValidationCheck } from 'langium'
import { ast } from '../ast'
import type { LikeC4Services } from '../module'

export const specificationRuleChecks = (
  _: LikeC4Services
): ValidationCheck<ast.SpecificationRule> => {
  return (node, accept) => {
    if (node.$containerIndex && node.$containerIndex > 0) {
      accept('error', `Only one specification per document is allowed`, {
        node: node,
        property: 'name'
      })
    }
  }
}

export const modelRuleChecks = (_: LikeC4Services): ValidationCheck<ast.Model> => {
  return (node, accept) => {
    if (node.$containerIndex && node.$containerIndex > 0) {
      accept('error', `Only one model per document is allowed`, {
        node: node,
        property: 'name'
      })
    }
  }
}

export const modelViewsChecks = (_: LikeC4Services): ValidationCheck<ast.ModelViews> => {
  return (node, accept) => {
    if (node.$containerIndex && node.$containerIndex > 0) {
      accept('error', `Only one views block per document is allowed`, {
        node: node,
        property: 'name'
      })
    }
  }
}

export const elementKindChecks = (services: LikeC4Services): ValidationCheck<ast.ElementKind> => {
  const index = services.shared.workspace.IndexManager
  return (node, accept) => {
    const sameKinds = index
      .allElements(ast.ElementKind)
      .filter(n => n.name === node.name)
      .limit(2)
      .count()
    if (sameKinds > 1) {
      accept('error', `Duplicate element kind '${node.name}'`, {
        node: node,
        property: 'name'
      })
    }
  }
}

export const tagChecks = (services: LikeC4Services): ValidationCheck<ast.Tag> => {
  const index = services.shared.workspace.IndexManager
  return (node, accept) => {
    const tagname = '#' + node.name
    const sameKinds = index
      .allElements(ast.Tag)
      .filter(n => n.name === tagname)
      .limit(2)
      .count()
    if (sameKinds > 1) {
      accept('error', `Duplicate tag '${node.name}'`, {
        node: node,
        property: 'name'
      })
    }
  }
}

export const relationshipChecks = (
  services: LikeC4Services
): ValidationCheck<ast.RelationshipKind> => {
  const index = services.shared.workspace.IndexManager
  return (node, accept) => {
    const sameKinds = index
      .allElements(ast.RelationshipKind)
      .filter(n => n.name === node.name)
      .limit(2)
      .count()
    if (sameKinds > 1) {
      accept('error', `Duplicate RelationshipKind '${node.name}'`, {
        node: node,
        property: 'name'
      })
    }
  }
}
