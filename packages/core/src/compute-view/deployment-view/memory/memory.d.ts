import type { DeploymentElementModel } from '../../../model';
import { type DeploymentConnectionModel } from '../../../model';
import type { AnyAux, Expression } from '../../../types';
import { customInspectSymbol } from '../../../utils/const';
import { type ComputeCtx, type StageExpression, AbstractMemory } from '../../memory';
import { StageExclude } from '../stages/stage-exclude';
import { StageInclude } from '../stages/stage-include';
export type Ctx = ComputeCtx<DeploymentElementModel<AnyAux>, DeploymentConnectionModel<AnyAux>, Memory, StageInclude, StageExclude, Expression<AnyAux>>;
export declare class Memory extends AbstractMemory<Ctx> {
    static empty(): Memory;
    stageInclude(expr: StageExpression<Ctx>): StageInclude;
    stageExclude(expr: StageExpression<Ctx>): StageExclude;
    mutableState(): Ctx['MutableState'];
    update(newstate: Partial<Ctx['MutableState']>): Memory;
    equals(other: unknown): boolean;
    diff(state: Memory): {
        added: {
            elements: any;
            explicits: any;
            final: any;
            connections: any;
        };
        removed: {
            elements: any;
            explicits: any;
            final: any;
            connections: any;
        };
    };
    toString(): string;
    [customInspectSymbol](_depth: unknown, _inspectOptions: unknown, _inspect: unknown): string;
}
