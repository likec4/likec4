import type { BBox, DiagramNode, NonEmptyArray } from '@likec4/core/types';
import type { Compound, Step } from './_types';
export declare class SequenceViewLayouter {
    #private;
    constructor({ actors, steps, compounds, }: {
        actors: NonEmptyArray<DiagramNode>;
        steps: Array<Step>;
        compounds: Array<Compound>;
    });
    getParallelBoxes(): Array<BBox & {
        parallelPrefix: string;
    }>;
    getActorBox(actor: DiagramNode): BBox;
    getCompoundBoxes(): Array<BBox & {
        node: DiagramNode;
        depth: number;
    }>;
    getPortCenter(step: Step, type: 'source' | 'target'): {
        cx: number;
        cy: any;
        height: number;
    };
    getViewBounds(): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    private actorBox;
    private addActors;
    private addStep;
    private addParallelRect;
    private addCompound;
    private ensureRow;
    private newVar;
    /**
     * Adds a required constraint:
     * Also adds a weak constraint == if the operator is <= or >=
     */
    private require;
    /**
     * Adds a constraint with medium strength by default
     */
    private constraint;
    private put;
}
