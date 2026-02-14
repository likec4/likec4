import type { ProjectId } from '@likec4/core';
import { type LangiumDocument, type Stream } from 'langium';
import { type ParsedLikeC4LangiumDocument } from '../ast';
import type { LikeC4Services } from '../module';
export type ModelParsedListener = () => void;
declare const DocumentParserFromMixins: any;
export declare class DocumentParser extends DocumentParserFromMixins {
}
export declare class LikeC4ModelParser {
    private services;
    protected cachedParsers: any;
    constructor(services: LikeC4Services);
    documents(projectId: ProjectId): Stream<ParsedLikeC4LangiumDocument>;
    parse(doc: LangiumDocument): ParsedLikeC4LangiumDocument;
    forDocument(doc: LangiumDocument): DocumentParser;
    private createParser;
}
export {};
