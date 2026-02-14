import { getParallelStepsPrefix, isStepEdgeId } from '@likec4/core/types';
import { DefaultMap, invariant, nonNullable } from '@likec4/core/utils';
import { flat, groupByProp, hasAtLeast, map, mapValues, pipe, values } from 'remeda';
import { CONTINUOUS_OFFSET, } from './const';
import { SequenceViewLayouter } from './layouter';
import { buildCompounds } from './utils';
export function calcSequenceLayout(view) {
    const actorNodes = new Set();
    const getNode = (id) => nonNullable(view.nodes.find(n => n.id === id));
    // Step 1 - prepare steps and actors
    const preparedSteps = [];
    for (const edge of view.edges.filter(e => isStepEdgeId(e.id))) {
        const source = getNode(edge.source);
        const target = getNode(edge.target);
        if (source.children.length || target.children.length) {
            console.error('Sequence view does not support nested actors');
            continue;
        }
        actorNodes.add(source);
        actorNodes.add(target);
        preparedSteps.push({ edge, source, target });
    }
    // Keep initial order of actors
    const actors = view.nodes.filter(n => actorNodes.has(n));
    invariant(hasAtLeast(actors, 1), 'actors array must not be empty');
    const actorPorts = new DefaultMap(() => []);
    const steps = [];
    let row = 0;
    for (const { edge, source, target } of preparedSteps) {
        const prevStep = steps.at(-1);
        let sourceColumn = actors.indexOf(source);
        let targetColumn = actors.indexOf(target);
        const isSelfLoop = source === target;
        const isBack = sourceColumn > targetColumn;
        const parallelPrefix = getParallelStepsPrefix(edge.id);
        let isContinuing = false;
        if (prevStep && prevStep.target == source && prevStep.parallelPrefix === parallelPrefix) {
            isContinuing = prevStep.isSelfLoop !== isSelfLoop || prevStep.isBack === isBack;
        }
        if (!isContinuing) {
            row++;
        }
        const step = {
            id: edge.id,
            from: {
                column: sourceColumn,
                row,
            },
            to: {
                column: targetColumn,
                row: isSelfLoop ? ++row : row,
            },
            edge,
            isSelfLoop,
            isBack,
            parallelPrefix,
            offset: isContinuing ? (prevStep?.offset ?? 0) + CONTINUOUS_OFFSET : 0,
            source,
            target,
            label: edge.labelBBox
                ? {
                    height: edge.labelBBox.height + 8 + (edge.navigateTo ? 20 : 0),
                    width: edge.labelBBox.width + 16,
                    text: edge.label,
                }
                : null,
        };
        steps.push(step);
        actorPorts.get(source).push({ step, row, type: 'source', position: isBack && !isSelfLoop ? 'left' : 'right' });
        actorPorts.get(target).push({ step, row, type: 'target', position: isBack || isSelfLoop ? 'right' : 'left' });
    }
    const layout = new SequenceViewLayouter({
        actors,
        steps,
        compounds: buildCompounds(actors, view.nodes),
    });
    const bounds = layout.getViewBounds();
    const compounds = pipe(layout.getCompoundBoxes(), map(({ node, ...box }) => ({ ...box, id: node.id, origin: node.id })), groupByProp('id'), mapValues((boxes, id) => {
        if (hasAtLeast(boxes, 2)) {
            return map(boxes, (box, i) => ({ ...box, id: `${id}-${i + 1}` }));
        }
        return boxes;
    }), values(), flat());
    return {
        actors: actors.map(actor => toSeqActor({ actor, ports: actorPorts.get(actor), layout })),
        compounds,
        steps: map(steps, s => ({
            id: s.id,
            sourceHandle: s.id + '_source',
            targetHandle: s.id + '_target',
            ...s.label && ({
                labelBBox: {
                    width: s.label.width,
                    height: s.label.height,
                },
            }),
        })),
        parallelAreas: layout.getParallelBoxes(),
        bounds,
    };
}
function toSeqActor({ actor, ports, layout }) {
    const { x, y, width, height } = layout.getActorBox(actor);
    return {
        id: actor.id,
        x,
        y,
        width,
        height,
        ports: ports.map((p) => {
            const bbox = layout.getPortCenter(p.step, p.type);
            return ({
                id: `${p.step.id}_${p.type}`,
                cx: bbox.cx - x,
                cy: bbox.cy - y,
                height: bbox.height,
                type: p.type,
                position: p.position,
            });
        }),
    };
}
