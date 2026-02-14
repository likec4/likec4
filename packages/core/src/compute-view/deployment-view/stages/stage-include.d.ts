import { type CtxConnection, type CtxElement, AbstractStageInclude } from '../../memory';
import type { Ctx } from '../memory/memory';
type Elem = CtxElement<Ctx>;
type Connection = CtxConnection<Ctx>;
export declare class StageInclude extends AbstractStageInclude<Ctx> {
    /**
     * Connects elements with existing ones in the memory
     */
    connectWithExisting(elements: Elem | Iterable<Elem>, direction?: 'in' | 'out' | 'both'): boolean;
    protected processConnections(connections: Connection[]): any;
}
export {};
