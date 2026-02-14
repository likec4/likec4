import { type AstNode, type AstNodeDescription, type LangiumDocument, DefaultAstNodeDescriptionProvider } from 'langium';
import type { LikeC4Services } from '../module';
export declare class AstNodeDescriptionProvider extends DefaultAstNodeDescriptionProvider {
    protected services: LikeC4Services;
    constructor(services: LikeC4Services);
    createDescription(node: AstNode, name: string | undefined, document?: LangiumDocument): AstNodeDescription;
}
