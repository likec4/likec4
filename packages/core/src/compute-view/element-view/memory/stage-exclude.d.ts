import type { RelationshipModel } from '../../../model/RelationModel';
import type { MutableState, StageExpression } from '../../memory';
import { AbstractStageExclude } from '../../memory';
import type { ActiveGroupCtx, ActiveGroupMemory, Ctx } from './memory';
export declare class StageExclude<C extends Ctx = Ctx> extends AbstractStageExclude<C> {
    excludeRelations(excluded: ReadonlySet<RelationshipModel<any>>): this;
    /**
     * Precommit hook
     */
    protected precommit(state: MutableState<C>): MutableState<C>;
    protected postcommit(state: C['MutableState']): C["MutableState"];
}
export declare class ActiveGroupStageExclude extends StageExclude {
    readonly memory: ActiveGroupMemory;
    readonly expression: StageExpression<ActiveGroupCtx>;
    constructor(memory: ActiveGroupMemory, expression: StageExpression<ActiveGroupCtx>);
}
