import type { LikeC4ViewModel } from '@likec4/core/model';
import * as z from 'zod/v3';
import type { LikeC4LanguageServices } from '../../LikeC4LanguageServices';
import type { Locate } from '../../protocol';
export declare const locationSchema: any;
export declare const projectIdSchema: any;
export declare const includedInViewsSchema: any;
export declare const includedInViews: (views: Iterable<LikeC4ViewModel>) => z.infer<typeof includedInViewsSchema>;
export declare const mkLocate: (languageServices: LikeC4LanguageServices, projectId: string) => (params: Locate.Params) => z.infer<typeof locationSchema>;
