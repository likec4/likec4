import type * as aux from './_aux';
import type { ExclusiveUnion } from './_common';
type AnyAux = aux.Any;
export declare namespace FqnRef {
    /**
     * Reference to logical model element
     */
    interface ElementRef<A extends AnyAux = AnyAux> {
        project?: never;
        model: aux.ElementId<A>;
    }
    function isElementRef<A extends AnyAux>(ref: FqnRef<A>): ref is ElementRef<A>;
    /**
     * Reference to imported logical model element
     */
    interface ImportRef<A extends AnyAux = AnyAux> {
        project: aux.ProjectId<A>;
        model: aux.ElementId<A>;
    }
    function isImportRef<A extends AnyAux>(ref: FqnRef<A>): ref is ImportRef<A>;
    function flatten<A extends AnyAux>(ref: FqnRef<A>): aux.StrictFqn<A>;
    type ModelRef<A extends AnyAux = AnyAux> = ImportRef<A> | ElementRef<A>;
    function isModelRef<A extends AnyAux>(ref: FqnRef<A>): ref is ModelRef<A>;
    /**
     * Represents a reference to an instance within a deployment.
     *
     * @template D - The type representing the deployment fqn. Defaults to `Fqn`.
     * @template M - The type representing the model fqn. Defaults to `Fqn`.
     *
     * @property {D} deployment - TThe fully qualified name (FQN) of the deployed instance.
     * @property {M} element - The element reference within the deployment.
     */
    interface InsideInstanceRef<A extends AnyAux = AnyAux> {
        deployment: aux.DeploymentId<A>;
        element: aux.ElementId<A>;
    }
    function isInsideInstanceRef<A extends AnyAux>(ref: FqnRef<A>): ref is InsideInstanceRef<A>;
    /**
     * Represents a reference to a deployment element.
     *
     * @template F - The type of the fully qualified name (FQN) of the deployment element. Defaults to `Fqn`.
     * @property {F} deployment - The fully qualified name (FQN) of the deployment element.
     */
    interface DeploymentElementRef<A extends AnyAux> {
        deployment: aux.DeploymentId<A>;
        element?: never;
    }
    function isDeploymentElementRef<A extends AnyAux>(ref: FqnRef<A>): ref is DeploymentElementRef<A>;
    type DeploymentRef<A extends AnyAux> = DeploymentElementRef<A> | InsideInstanceRef<A>;
    function isDeploymentRef<A extends AnyAux>(ref: FqnRef<A>): ref is DeploymentRef<A>;
}
export type FqnRef<A extends AnyAux = AnyAux> = ExclusiveUnion<{
    DeploymentRef: FqnRef.DeploymentRef<A>;
    ModelRef: FqnRef.ModelRef<A>;
}>;
export {};
