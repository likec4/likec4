import { invariant } from '@likec4/core'
import { AstUtils, type ValidationCheck } from 'langium'
import { ast, isLikeC4LangiumDocument } from '../ast'
import type { LikeC4Services } from '../module'
import type { LikeC4NameProvider } from '../references'
import { RESERVED_WORDS, tryOrLog } from './_shared'

const { getDocument } = AstUtils

export const deployedArtifactChecks = (services: LikeC4Services): ValidationCheck<ast.DeployedArtifact> => {
  const DeploymentsIndex = services.likec4.DeploymentsIndex
  const Names = services.references.NameProvider as LikeC4NameProvider
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

    const node = el.$container.$container
    invariant(ast.isDeploymentNode(node), 'Parent of DeployedArtifact must be a DeploymentNode')
    const nodeName = Names.getName(node)
    if (!nodeName) {
      return
    }

    const doc = getDocument(el)
    invariant(isLikeC4LangiumDocument(doc), 'Document must be a LikeC4LangiumDocument')

    const withSameName = DeploymentsIndex.get(doc)
      .artifacts(nodeName)
      .filter(a => a.name === artifactName && a.node !== el)
      .head()
    if (withSameName) {
      accept(
        'error',
        `Duplicate artifact name "${artifactName}" in node "${nodeName}"`,
        {
          node: el,
          ...range && { range }
        }
      )
    }
  })
}
