import type { AnyAux } from '../../../types';
import type { ElementModel } from '../../ElementModel';
import { ConnectionModel } from './ConnectionModel';
/**
 * Resolve connection from source to target
 *
 * @param direction - if 'both', also returns connection from target to source
 * @default `directed`
 */
export declare function findConnection<A extends AnyAux>(source: ElementModel<A>, target: ElementModel<A>, direction?: 'directed' | 'both'): [ConnectionModel<A>, ConnectionModel<A>] | [ConnectionModel<A>] | [];
/**
 * Resolve all connections between element and others
 * @param direction - if 'directed', only look for outgoing connections from the element to others
 * @default `both`
 */
export declare function findConnectionsBetween<M extends AnyAux>(element: ElementModel<M>, others: Iterable<ElementModel<M>>, direction?: 'directed' | 'both'): readonly ConnectionModel<M>[];
/**
 * Resolve all connections within a given set of elements
 */
export declare function findConnectionsWithin<M extends AnyAux>(elements: Iterable<ElementModel<M>>): readonly ConnectionModel<M>[];
