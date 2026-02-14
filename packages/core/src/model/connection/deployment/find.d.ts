import type { AnyAux } from '../../../types';
import type { DeploymentElementModel } from '../../DeploymentElementModel';
import { DeploymentConnectionModel } from './DeploymentConnectionModel';
/**
 * Resolve connection from source to target
 * If direction is `both`, also look for reverse connection
 *
 * @default direction directed
 */
export declare function findConnection<M extends AnyAux>(source: DeploymentElementModel<M>, target: DeploymentElementModel<NoInfer<M>>, direction: 'directed'): readonly [DeploymentConnectionModel<M>] | readonly [];
export declare function findConnection<M extends AnyAux>(source: DeploymentElementModel<M>, target: DeploymentElementModel<NoInfer<M>>, direction: 'both'): readonly [DeploymentConnectionModel<M>, DeploymentConnectionModel<M>] | readonly [DeploymentConnectionModel<M>] | readonly [];
export declare function findConnection<M extends AnyAux>(source: DeploymentElementModel<M>, target: DeploymentElementModel<NoInfer<M>>, direction?: 'directed' | 'both'): readonly [DeploymentConnectionModel<M>, DeploymentConnectionModel<M>] | readonly [DeploymentConnectionModel<M>] | readonly [];
/**
 * Resolve all connections between element and others
 * By default, look for both directions.
 *
 * @default direction both
 */
export declare function findConnectionsBetween<M extends AnyAux>(element: DeploymentElementModel<M>, others: Iterable<DeploymentElementModel<NoInfer<M>>>, direction?: 'directed' | 'both'): readonly DeploymentConnectionModel<M>[];
/**
 * Resolve all connections within a given set of elements
 */
export declare function findConnectionsWithin<M extends AnyAux>(elements: Iterable<DeploymentElementModel<M>>): readonly DeploymentConnectionModel<M>[];
