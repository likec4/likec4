import { isDeploymentView, isDynamicView, isElementView, } from '@likec4/core';
import { nonexhaustive } from '@likec4/core/utils';
import { loggable, rootLogger } from '@likec4/log';
import { applyManualLayout } from '../manual/applyManualLayout';
import { calcSequenceLayout } from '../sequence';
import { DeploymentViewPrinter } from './DeploymentViewPrinter';
import { GraphClusterSpace } from './DotPrinter';
import { DynamicViewPrinter } from './DynamicViewPrinter';
import { ElementViewPrinter } from './ElementViewPrinter';
import { parseGraphvizJson, parseGraphvizJsonOfProjectsView } from './GraphvizParser';
import { ProjectsViewPrinter } from './ProjectsViewPrinter';
import { GraphvizWasmAdapter } from './wasm/GraphvizWasmAdapter';
const getPrinter = ({ view, styles }) => {
    switch (true) {
        case isDynamicView(view):
            return new DynamicViewPrinter(view, styles);
        case isDeploymentView(view):
            return new DeploymentViewPrinter(view, styles);
        case isElementView(view):
            return new ElementViewPrinter(view, styles);
        default:
            nonexhaustive(view);
    }
};
const logger = rootLogger.getChild(['layouter']);
export class GraphvizLayouter {
    graphviz;
    constructor(graphviz) {
        this.graphviz = graphviz ?? new GraphvizWasmAdapter();
    }
    dispose() {
        this.graphviz.dispose();
    }
    [Symbol.dispose]() {
        this.dispose();
    }
    get graphvizPort() {
        return this.graphviz;
    }
    changePort(graphviz) {
        this.graphviz.dispose();
        this.graphviz = graphviz;
    }
    async dotToJson(dot) {
        let json;
        try {
            json = await this.graphviz.layoutJson(dot);
        }
        catch (error) {
            logger.error(loggable(error));
            logger.error `Failed to convert DOT to JSON:\n${dot}`;
            throw error;
        }
        try {
            return JSON.parse(json);
        }
        catch (error) {
            logger.error(loggable(error));
            logger.error `Failed to parse JSON:\n${json}\n. Generated from DOT:\n${dot}`;
            throw error;
        }
    }
    async layout(params) {
        try {
            logger.debug `layouting view ${params.view.id}...`;
            let dot = await this.dot(params);
            const { view } = params;
            const json = await this.dotToJson(dot);
            let diagram = parseGraphvizJson(json, view);
            if (view.manualLayout) {
                diagram = applyManualLayout(diagram, view.manualLayout);
            }
            if (isDynamicView(diagram)) {
                Object.assign(diagram, {
                    sequenceLayout: calcSequenceLayout(diagram),
                });
            }
            dot = dot
                .split('\n')
                .filter((l) => !(l.includes('margin') && l.includes(`${GraphClusterSpace}`))) // see DotPrinter.ts#L175
                .join('\n');
            logger.debug `layouting view ${params.view.id} done`;
            return { dot, diagram };
        }
        catch (e) {
            throw new Error(`Error during layout: ${params.view.id}`, { cause: e });
        }
    }
    async svg(params) {
        let dot = await this.dot(params);
        dot = dot
            .split('\n')
            .filter((l) => !(l.includes('margin') && l.includes(`${GraphClusterSpace}`))) // see DotPrinter.ts#L175
            .join('\n');
        const svg = await this.graphviz.svg(dot);
        return {
            svg,
            dot,
        };
    }
    async dot(params) {
        const printer = getPrinter(params);
        let dot = printer.print();
        if (!isElementView(params.view)) {
            return dot;
        }
        try {
            return await this.graphviz.unflatten(dot);
        }
        catch (error) {
            logger.warn(`Error during unflatten: ${params.view.id}`, { error });
            return dot;
        }
    }
    async layoutProjectsView(view) {
        logger.debug `layouting projects overview...`;
        const printer = new ProjectsViewPrinter(view);
        let dot = printer.print();
        try {
            dot = await this.graphviz.unflatten(dot);
        }
        catch (error) {
            logger.warn(`Error during unflatten of projects view`, { error });
        }
        const json = await this.dotToJson(dot);
        logger.debug `layouting projects overview done`;
        return parseGraphvizJsonOfProjectsView(json, view);
    }
}
