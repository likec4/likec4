import type { EdgeId, NonEmptyReadonlyArray } from '@likec4/core';
import type { ElementModel, LikeC4ViewModel, RelationshipModel } from '@likec4/core/model';
import type { AnyAux } from '@likec4/core/types';
export interface RelationshipDetailsViewData {
    sources: ReadonlySet<ElementModel>;
    relationships: ReadonlySet<RelationshipModel>;
    targets: ReadonlySet<ElementModel>;
}
export declare function computeEdgeDetailsViewData(edges: NonEmptyReadonlyArray<EdgeId>, view: LikeC4ViewModel<AnyAux>): RelationshipDetailsViewData;
export declare function computeRelationshipDetailsViewData({ source, target, }: {
    source: ElementModel;
    target: ElementModel;
}): RelationshipDetailsViewData;
