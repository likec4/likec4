import { FqnRef, isSameHierarchy, nonNullable } from '@likec4/core'
import { type ValidationCheck, AstUtils } from 'langium'
import { ast } from '../ast'
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
        node: el,
      })
      return
    }
    const range = nonNullable(Names.getNameNode(el), 'name CstNode not found').range

    if (RESERVED_WORDS.includes(nodeName)) {
      accept('error', `Reserved word: ${nodeName}`, {
        node: el,
        range,
      })
    }
    const fqnName = DeploymentsIndex.getFqn(el)

    const withSameName = DeploymentsIndex.byFqn(fqnName).limit(2).toArray()
    if (withSameName.length > 1) {
      accept(
        'error',
        `Duplicate node name "${fqnName}"`,
        {
          node: el,
          range,
        },
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
        node: el,
      })
      return
    }
    const range = nonNullable(Names.getNameNode(el), 'name CstNode not found').range

    if (RESERVED_WORDS.includes(artifactName)) {
      accept('error', `Reserved word: ${artifactName}`, {
        node: el,
        range,
      })
    }

    const fqnName = DeploymentsIndex.getFqn(el)

    const withSameName = DeploymentsIndex.byFqn(fqnName).limit(2).toArray()
    if (withSameName.length > 1) {
      accept(
        'error',
        `Duplicate instance name "${fqnName}"`,
        {
          node: el,
          range,
        },
      )
    }
  })
}

export const deploymentRelationChecks = (services: LikeC4Services): ValidationCheck<ast.DeploymentRelation> => {
  const ModelParser = services.likec4.ModelParser
  return tryOrLog((el, accept) => {
    const source = el.source?.value?.ref
    if (!source) {
      let sourceCstText = el.source?.$cstNode?.text ?? ''
      accept('error', `DeploymentRelation source '${sourceCstText}' not resolved`, {
        node: el,
        property: 'source',
      })
      return
    }
    const target = el.target?.value?.ref
    if (!target) {
      let targetCstText = el.target?.$cstNode?.text ?? ''
      accept('error', `DeploymentRelation target '${targetCstText}' not resolved`, {
        node: el,
        property: 'target',
      })
      return
    }

    const doc = getDocument(el)
    const parser = ModelParser.forDocument(doc)

    const sourceFqnRef = parser.parseFqnRef(el.source)
    if (FqnRef.isModelRef(sourceFqnRef)) {
      accept('error', 'DeploymentRelation must refer deployment element', {
        node: el,
        property: 'source',
      })
      return
    }

    const targetFqnRef = parser.parseFqnRef(el.target)
    if (FqnRef.isModelRef(targetFqnRef)) {
      accept('error', 'DeploymentRelation must refer deployment element', {
        node: el,
        property: 'target',
      })
      return
    }

    if (isSameHierarchy(sourceFqnRef.deployment, targetFqnRef.deployment)) {
      accept('error', 'Invalid parent-child relationship', {
        node: el,
      })
    }
  })
}
