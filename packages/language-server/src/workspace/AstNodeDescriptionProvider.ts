import {
  type AstNode,
  type AstNodeDescription,
  type LangiumDocument,
  AstUtils,
  DefaultAstNodeDescriptionProvider,
} from 'langium'
import type { LikeC4Services } from '../module'

export class AstNodeDescriptionProvider extends DefaultAstNodeDescriptionProvider {
  constructor(protected services: LikeC4Services) {
    super(services)
  }

  override createDescription(node: AstNode, name: string | undefined, document?: LangiumDocument): AstNodeDescription {
    const doc = document ?? AstUtils.getDocument(node)
    const description = super.createDescription(node, name, document)
    doc.likec4ProjectId ??= this.services.shared.workspace.ProjectsManager.belongsTo(doc.uri)
    description.likec4ProjectId = doc.likec4ProjectId
    return description
  }
}
