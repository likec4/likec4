import { DefaultDocumentValidator } from 'langium';
export class LikeC4DocumentValidator extends DefaultDocumentValidator {
    services;
    constructor(services) {
        super(services);
        this.services = services;
    }
    /**
     * If the document is excluded, then we skip validation and return an empty array of diagnostics.
     */
    async validateDocument(document, options, cancelToken) {
        if (this.services.shared.workspace.ProjectsManager.isExcluded(document)) {
            return [];
        }
        return await super.validateDocument(document, options, cancelToken);
    }
}
