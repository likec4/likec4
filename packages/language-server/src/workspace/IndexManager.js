import { DefaultIndexManager, stream } from 'langium';
export class IndexManager extends DefaultIndexManager {
    services;
    constructor(services) {
        super(services);
        this.services = services;
    }
    async updateContent(document, cancelToken) {
        const projects = this.services.workspace.ProjectsManager;
        // Ensure the document is assigned to a project
        document.likec4ProjectId = projects.ownerProjectId(document);
        await super.updateContent(document, cancelToken);
    }
    projectElements(projectId, nodeType, uris) {
        const projects = this.services.workspace.ProjectsManager;
        let documentUris = stream(this.symbolIndex.keys());
        return documentUris
            .filter(uri => {
            if (uris && !uris.has(uri)) {
                return false;
            }
            return projects.isIncluded(projectId, uri);
        })
            .flatMap(uri => this.getFileDescriptions(uri, nodeType));
    }
}
