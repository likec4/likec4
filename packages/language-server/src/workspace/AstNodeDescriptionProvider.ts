import {
  type AstNode,
  type AstNodeDescription,
  type LangiumDocument,
  AstUtils,
  DefaultAstNodeDescriptionProvider,
} from 'langium'
import { isLikeC4Builtin } from '../likec4lib'
import type { LikeC4Services } from '../module'

export class AstNodeDescriptionProvider extends DefaultAstNodeDescriptionProvider {
  constructor(protected services: LikeC4Services) {
    super(services)
  }

  override createDescription(node: AstNode, name: string | undefined, document?: LangiumDocument): AstNodeDescription {
    document ??= AstUtils.getDocument(node)
    const description = super.createDescription(node, name, document)
    if (!isLikeC4Builtin(document.uri)) {
      document.likec4ProjectId ??= this.services.shared.workspace.ProjectsManager.ownerProjectId(document)
      description.likec4ProjectId = document.likec4ProjectId
    }
    return description
  }
}
