import { type Fqn, isSameHierarchy } from '@likec4/core'
import { AstUtils, type ValidationCheck } from 'langium'
import { ast } from '../ast'
import { elementRef } from '../elementRef'
import type { LikeC4Services } from '../module'
import type { LikeC4NameProvider } from '../references'
import { RESERVED_WORDS, tryOrLog } from './_shared'

const { getDocument } = AstUtils

export const deploymentNodeChecks = (services: LikeC4Services): ValidationCheck<ast.DeploymentNode> => {
  const DeploymentsIndex = services.likec4.DeploymentsIndex
  const Names = services.references.NameProvider
  return tryOrLog((el, accept) => {
    const nodeName = Names.getName(el)
    if (!nodeName) {
      accept('error', 'DeploymentNode must be named', {
        node: el
      })
      return
    }
    const range = Names.getNameNode(el)?.range

    if (RESERVED_WORDS.includes(nodeName)) {
      accept('error', `Reserved word: ${nodeName}`, {
        node: el,
        ...range && { range }
      })
    }
    const fqnName = DeploymentsIndex.getFqnName(el)

    const withSameName = DeploymentsIndex.byFqn(fqnName).limit(2).toArray()
    if (withSameName.length > 1) {
      accept(
        'error',
        `Duplicate node name "${fqnName}"`,
        {
          node: el,
          ...range && { range }
        }
      )
    }
  })
}

export const deployedArtifactChecks = (services: LikeC4Services): ValidationCheck<ast.DeployedArtifact> => {
  const DeploymentsIndex = services.likec4.DeploymentsIndex
  const Names = services.references.NameProvider as LikeC4NameProvider
  const Locator = services.workspace.AstNodeLocator
  return tryOrLog((el, accept) => {
    const artifactName = Names.getName(el)
    if (!artifactName) {
      accept('error', 'Deployed artifact must be named, unique inside node', {
        node: el
      })
      return
    }
    const range = Names.getNameNode(el)?.range

    if (RESERVED_WORDS.includes(artifactName)) {
      accept('error', `Reserved word: ${artifactName}`, {
        node: el,
        ...range && { range }
      })
    }
    const fqnName = DeploymentsIndex.getFqnName(el)

    const withSameName = DeploymentsIndex.byFqn(fqnName).limit(2).toArray()
    if (withSameName.length > 1) {
      accept(
        'error',
        `Duplicate artifact name "${fqnName}"`,
        {
          node: el,
          ...range && { range }
        }
      )
    }
  })
}

export const deploymentRelationChecks = (services: LikeC4Services): ValidationCheck<ast.DeploymentRelation> => {
  const DeploymentsIndex = services.likec4.DeploymentsIndex
  const Names = services.references.NameProvider as LikeC4NameProvider
  const Locator = services.workspace.AstNodeLocator
  const fqnIndex = services.likec4.FqnIndex
  return tryOrLog((el, accept) => {
    const source = el.source.current.ref
    const target = el.target.current.ref

    if (!source || !target) {
      return
    }

    if (ast.isDeploymentNode(source) !== ast.isDeploymentNode(target)) {
      const range = el.target.$cstNode?.range ?? el.source.$cstNode?.range
      accept('error', 'Relation must be between elements/artifacts or nodes', {
        node: el,
        ...range && { range }
      })
      return
    }
    const sourceEl = ast.isDeployedArtifact(source)
      ? elementRef(source.element)
      : source
    const targetEl = ast.isDeployedArtifact(target)
      ? elementRef(target.element)
      : target

    if (!sourceEl || !targetEl) {
      return
    }

    const sourceFqn = ast.isElement(sourceEl) ? fqnIndex.getFqn(sourceEl) : DeploymentsIndex.getFqnName(sourceEl) as Fqn
    if (!sourceFqn) {
      accept('error', 'Source not resolved', {
        node: el,
        property: 'source'
      })
    }

    const targetFqn = ast.isElement(targetEl) ? fqnIndex.getFqn(targetEl) : DeploymentsIndex.getFqnName(targetEl) as Fqn
    if (!targetFqn) {
      accept('error', 'Target not resolved', {
        node: el,
        property: 'target'
      })
    }

    if (!!sourceFqn && sourceFqn === targetFqn) {
      accept('error', 'Self-relation is not allowed', {
        node: el
      })
      return
    }

    if (sourceFqn && targetFqn && isSameHierarchy(sourceFqn, targetFqn)) {
      accept('error', 'Invalid parent-child relationship', {
        node: el
      })
    }
  })
}
