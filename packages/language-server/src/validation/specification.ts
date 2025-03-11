import { type ValidationCheck, AstUtils } from 'langium'
import { ast } from '../ast'
import type { LikeC4Services } from '../module'
import { projectIdFrom } from '../utils'
import { RESERVED_WORDS, tryOrLog } from './_shared'

export const specificationRuleChecks = (
  _: LikeC4Services,
): ValidationCheck<ast.SpecificationRule> => {
  return tryOrLog((node, accept) => {
    if (node.$containerIndex && node.$containerIndex > 0) {
      accept('warning', `Prefer one specification per document`, {
        node: node,
        property: 'name',
      })
    }
  })
}

export const modelRuleChecks = (_: LikeC4Services): ValidationCheck<ast.Model> => {
  return tryOrLog((node, accept) => {
    if (node.$containerIndex && node.$containerIndex > 0) {
      accept('warning', `Prefer one model per document`, {
        node: node,
        property: 'name',
      })
    }
  })
}

export const globalsChecks = (_: LikeC4Services): ValidationCheck<ast.Globals> => {
  return tryOrLog((node, accept) => {
    if (node.$containerIndex && node.$containerIndex > 0) {
      accept('warning', `Prefer one global block per document`, {
        node: node,
        property: 'name',
      })
    }
  })
}

export const elementKindChecks = (services: LikeC4Services): ValidationCheck<ast.ElementKind> => {
  const index = services.shared.workspace.IndexManager
  return tryOrLog((node, accept) => {
    if (RESERVED_WORDS.includes(node.name)) {
      accept('error', `Reserved word: ${node.name}`, {
        node: node,
        property: 'name',
      })
    }
    const projectId = projectIdFrom(node)
    const sameKind = index
      .projectElements(projectId, ast.ElementKind)
      .filter(n => n.name === node.name && n.node !== node)
      .head()
    if (sameKind) {
      const isAnotherDoc = sameKind.documentUri !== AstUtils.getDocument(node).uri
      accept('error', `Duplicate element kind '${node.name}'`, {
        node: node,
        property: 'name',
        ...isAnotherDoc && {
          relatedInformation: [
            {
              location: {
                range: sameKind.nameSegment!.range,
                uri: sameKind.documentUri.toString(),
              },
              message: `conflicting definition`,
            },
          ],
        },
      })
    }
  })
}

export const deploymentNodeKindChecks = (services: LikeC4Services): ValidationCheck<ast.DeploymentNodeKind> => {
  const index = services.shared.workspace.IndexManager
  return tryOrLog((node, accept) => {
    if (RESERVED_WORDS.includes(node.name)) {
      accept('error', `Reserved word: ${node.name}`, {
        node: node,
        property: 'name',
      })
    }
    const projectId = projectIdFrom(node)
    const sameKind = index
      .projectElements(projectId, ast.DeploymentNodeKind)
      .filter(n => n.name === node.name && n.node !== node)
      .head()
    if (sameKind) {
      const isAnotherDoc = sameKind.documentUri !== AstUtils.getDocument(node).uri
      accept('error', `Duplicate deploymentNode kind '${node.name}'`, {
        node: node,
        property: 'name',
        ...isAnotherDoc && {
          relatedInformation: [
            {
              location: {
                range: sameKind.nameSegment!.range,
                uri: sameKind.documentUri.toString(),
              },
              message: `conflicting definition`,
            },
          ],
        },
      })
    }
  })
}

export const tagChecks = (services: LikeC4Services): ValidationCheck<ast.Tag> => {
  const index = services.shared.workspace.IndexManager
  return tryOrLog((node, accept) => {
    const tagname = '#' + node.name
    const projectId = projectIdFrom(node)
    const sameTag = index
      .projectElements(projectId, ast.Tag)
      .filter(n => n.name === tagname && n.node !== node)
      .head()
    if (sameTag) {
      const isAnotherDoc = sameTag.documentUri !== AstUtils.getDocument(node).uri
      accept(
        'error',
        `Duplicate tag '${node.name}'`,
        {
          node,
          property: 'name',
          ...isAnotherDoc && {
            relatedInformation: [
              {
                location: {
                  range: sameTag.nameSegment!.range,
                  uri: sameTag.documentUri.toString(),
                },
                message: `conflicting definition`,
              },
            ],
          },
        },
      )
    }
  })
}

export const relationshipChecks = (
  services: LikeC4Services,
): ValidationCheck<ast.RelationshipKind> => {
  const index = services.shared.workspace.IndexManager
  return tryOrLog((node, accept) => {
    if (RESERVED_WORDS.includes(node.name)) {
      accept('error', `Reserved word: ${node.name}`, {
        node: node,
        property: 'name',
      })
    }
    const projectId = projectIdFrom(node)
    const sameKinds = index
      .projectElements(projectId, ast.RelationshipKind)
      .filter(n => n.name === node.name)
      .limit(2)
      .count()
    if (sameKinds > 1) {
      accept('error', `Duplicate RelationshipKind '${node.name}'`, {
        node: node,
        property: 'name',
      })
    }
  })
}

export const globalPredicateChecks = (
  services: LikeC4Services,
): ValidationCheck<ast.GlobalPredicateGroup | ast.GlobalDynamicPredicateGroup> => {
  const index = services.shared.workspace.IndexManager
  return tryOrLog((node, accept) => {
    const projectId = projectIdFrom(node)

    const predicateGroups = index.projectElements(projectId, ast.GlobalPredicateGroup)
    const dynamicPredicateGroups = index.projectElements(projectId, ast.GlobalDynamicPredicateGroup)
    const sameName = predicateGroups
      .concat(dynamicPredicateGroups)
      .filter(s => s.name === node.name)
      .limit(2)
      .count()
    if (sameName > 1) {
      accept('error', `Duplicate GlobalPredicateGroup or GlobalDynamicPredicateGroup name '${node.name}'`, {
        node: node,
        property: 'name',
      })
    }
  })
}

export const globalStyleIdChecks = (
  services: LikeC4Services,
): ValidationCheck<ast.GlobalStyleId> => {
  const index = services.shared.workspace.IndexManager
  return tryOrLog((node, accept) => {
    const projectId = projectIdFrom(node)
    const sameName = index
      .projectElements(projectId, ast.GlobalStyleId)
      .filter(s => s.name === node.name)
      .limit(2)
      .count()
    if (sameName > 1) {
      accept('error', `Duplicate GlobalStyleId name '${node.name}'`, {
        node: node,
        property: 'name',
      })
    }
  })
}
