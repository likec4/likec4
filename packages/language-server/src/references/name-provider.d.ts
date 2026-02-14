import { type AstNode, type CstNode, DefaultNameProvider } from 'langium';
import type { LikeC4Services } from '../module';
export declare class LikeC4NameProvider extends DefaultNameProvider {
    protected services: LikeC4Services;
    constructor(services: LikeC4Services);
    getNameStrict(node: AstNode): string;
    getName(node: AstNode): string | undefined;
    getNameNode(node: AstNode): CstNode | undefined;
}
