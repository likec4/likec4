import { AstUtils, DefaultAstNodeDescriptionProvider, } from 'langium';
import { isLikeC4Builtin } from '../likec4lib';
export class AstNodeDescriptionProvider extends DefaultAstNodeDescriptionProvider {
    services;
    constructor(services) {
        super(services);
        this.services = services;
    }
    createDescription(node, name, document) {
        document ??= AstUtils.getDocument(node);
        const description = super.createDescription(node, name, document);
        if (!isLikeC4Builtin(document.uri)) {
            document.likec4ProjectId ??= this.services.shared.workspace.ProjectsManager.ownerProjectId(document);
            description.likec4ProjectId = document.likec4ProjectId;
        }
        return description;
    }
}
