import { isSameHierarchy, nonNullable } from '@likec4/core'
import { AstUtils, type ValidationCheck } from 'langium'
import { ast } from '../ast'
import type { LikeC4Services } from '../module'
import type { LikeC4NameProvider } from '../references'
import { instanceRef } from '../utils/deploymentRef'
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
    const range = nonNullable(Names.getNameNode(el), 'name CstNode not found').range

    if (RESERVED_WORDS.includes(nodeName)) {
      accept('error', `Reserved word: ${nodeName}`, {
        node: el,
        range
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
          range
        }
      )
    }
  })
}

export const deployedInstanceChecks = (services: LikeC4Services): ValidationCheck<ast.DeployedInstance> => {
  const DeploymentsIndex = services.likec4.DeploymentsIndex
  const Names = services.references.NameProvider as LikeC4NameProvider
  // const Locator = services.workspace.AstNodeLocator
  return tryOrLog((el, accept) => {
    const artifactName = Names.getName(el)
    if (!artifactName) {
      accept('error', 'Deployed instance must be named, unique inside node', {
        node: el
      })
      return
    }
    const range = nonNullable(Names.getNameNode(el), 'name CstNode not found').range

    if (RESERVED_WORDS.includes(artifactName)) {
      accept('error', `Reserved word: ${artifactName}`, {
        node: el,
        range
      })
    }
    const fqnName = DeploymentsIndex.getFqnName(el)

    const withSameName = DeploymentsIndex.byFqn(fqnName).limit(2).toArray()
    if (withSameName.length > 1) {
      accept(
        'error',
        `Duplicate instance name "${fqnName}"`,
        {
          node: el,
          range
        }
      )
    }
  })
}

export const deploymentRelationChecks = (services: LikeC4Services): ValidationCheck<ast.DeploymentRelation> => {
  const DeploymentsIndex = services.likec4.DeploymentsIndex
  // const Names = services.references.NameProvider as LikeC4NameProvider
  // const Locator = services.workspace.AstNodeLocator
  // const fqnIndex = services.likec4.FqnIndex
  return tryOrLog((el, accept) => {
    const source = el.source?.value?.ref
    const target = el.target?.value?.ref

    if (!source || !target) {
      return
    }

    if (
      ast.isElement(source) && ast.isDeploymentNode(target) || ast.isElement(target) && ast.isDeploymentNode(source)
    ) {
      const range = el.target.$cstNode?.range ?? el.source.$cstNode?.range
      accept('error', 'Relations between deployment nodes and instance internals are not supported', {
        node: el,
        ...range && { range }
      })
      return
    }

    const sourceEl = ast.isElement(source)
      ? instanceRef(el.source)
      : source

    if (!sourceEl) {
      accept('error', 'Source not resolved', {
        node: el,
        property: 'source'
      })
      return
    }
    const sourceFqn = DeploymentsIndex.getFqnName(sourceEl)

    const targetEl = ast.isElement(target)
      ? instanceRef(el.target)
      : target

    if (!targetEl) {
      accept('error', 'Target not resolved', {
        node: el,
        property: 'target'
      })
      return
    }
    const targetFqn = DeploymentsIndex.getFqnName(targetEl)

    if (isSameHierarchy(sourceFqn, targetFqn)) {
      accept('error', 'Invalid parent-child relationship', {
        node: el
      })
    }

    // const sourceFqn = ast.isElement(sourceEl) ? fqnIndex.getFqn(sourceEl) : DeploymentsIndex.getFqnName(sourceEl) as Fqn
    // if (!sourceFqn) {
    //   accept('error', 'Source not resolved', {
    //     node: el,
    //     property: 'source'
    //   })
    // }

    // const targetFqn = ast.isElement(targetEl) ? fqnIndex.getFqn(targetEl) : DeploymentsIndex.getFqnName(targetEl) as Fqn
    // if (!targetFqn) {
    //   accept('error', 'Target not resolved', {
    //     node: el,
    //     property: 'target'
    //   })
    // }

    // if (!!sourceFqn && sourceFqn === targetFqn) {
    //   accept('error', 'Self-relation is not allowed', {
    //     node: el
    //   })
    //   return
    // }

    // if (sourceFqn && targetFqn && isSameHierarchy(sourceFqn, targetFqn)) {
    //   accept('error', 'Invalid parent-child relationship', {
    //     node: el
    //   })
    // }
  })
}
