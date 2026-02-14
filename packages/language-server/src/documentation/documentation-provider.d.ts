import { type AstNode, type DocumentationProvider } from 'langium';
import type { LikeC4Services } from '../module';
export declare class LikeC4DocumentationProvider implements DocumentationProvider {
    private parser;
    private locator;
    constructor(services: LikeC4Services);
    getDocumentation(node: AstNode): string | undefined;
}
