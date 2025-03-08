import {
  type AstNode,
  type AstNodeDescription,
  type LangiumDocument,
  AstUtils,
  DefaultAstNodeDescriptionProvider,
} from 'langium'
import type { LikeC4Services } from '../module'
import type { ProjectsManager } from './ProjectsManager'

export class AstNodeDescriptionProvider extends DefaultAstNodeDescriptionProvider {
  private projects: ProjectsManager

  constructor(services: LikeC4Services) {
    super(services)
    this.projects = services.shared.workspace.ProjectsManager
  }

  override createDescription(node: AstNode, name: string | undefined, document?: LangiumDocument): AstNodeDescription {
    const doc = document ?? AstUtils.getDocument(node)
    const description = super.createDescription(node, name, document)
    doc.likec4ProjectId ??= this.projects.belongsTo(doc.uri)
    description.likec4ProjectId = doc.likec4ProjectId
    return description
  }
}
