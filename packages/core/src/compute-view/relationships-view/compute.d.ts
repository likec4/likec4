import type { LikeC4Model } from '../../model';
import type { AnyAux, aux } from '../../types';
import type { RelationshipsViewData } from './_types';
export declare function computeRelationshipsView<M extends AnyAux>(subjectId: aux.ElementId<M>, likec4model: LikeC4Model<M>, scopeViewId: aux.ViewId<M> | null, scope?: 'global' | 'view'): RelationshipsViewData<M>;
