import { Graphviz } from '@hpcc-js/wasm-graphviz';
import { delay } from '@likec4/core/utils';
import { rootLogger } from '@likec4/log';
import pLimit from 'p-limit';
// limit to 1 concurrency to avoid wasm loading issues
const limit = pLimit(1);
const logger = rootLogger.getChild('graphviz-wasm');
export class GraphvizWasmAdapter {
    static _graphviz = null;
    /**
     * Workaround for graphviz wasm memory issues
     * After each N operations unload the wasm and reload it
     */
    static opsCount = 0;
    get concurrency() {
        return 1;
    }
    dispose() {
        Graphviz.unload();
        GraphvizWasmAdapter._graphviz = null;
    }
    [Symbol.dispose]() {
        this.dispose();
    }
    graphviz() {
        return Promise.resolve().then(async () => {
            if (!GraphvizWasmAdapter._graphviz) {
                logger.debug `loading wasm`;
                GraphvizWasmAdapter.opsCount = 0;
                GraphvizWasmAdapter._graphviz = Graphviz.load();
            }
            return await GraphvizWasmAdapter._graphviz;
        });
    }
    async attempt(logMessage, dot, fn) {
        return await limit(async () => {
            try {
                const result = await fn();
                if (++GraphvizWasmAdapter.opsCount >= 10) {
                    logger.debug `unloading wasm`;
                    Graphviz.unload();
                    GraphvizWasmAdapter._graphviz = null;
                }
                return result;
            }
            catch (error) {
                logger.error(`FAILED GraphvizWasm. ${logMessage}`, { error });
                logger.error('FAILED DOT:\n' + dot);
                Graphviz.unload();
                GraphvizWasmAdapter._graphviz = null;
            }
            logger.warn('Retrying...');
            await delay(10, 500);
            try {
                return await fn();
            }
            finally {
                Graphviz.unload();
                GraphvizWasmAdapter._graphviz = null;
            }
        });
    }
    async unflatten(dot) {
        return await this.attempt(`unflatten`, dot, async () => {
            const graphviz = await this.graphviz();
            const unflattened = graphviz.unflatten(dot, 1, false, 3);
            return unflattened.replaceAll(/\t\[/g, ' [').replaceAll(/\t/g, '    ');
        });
    }
    async acyclic(dot) {
        return await this.attempt(`acyclic`, dot, async () => {
            const graphviz = await this.graphviz();
            const res = graphviz.acyclic(dot, true);
            return res.acyclic ? (res.outFile || dot) : dot;
        });
    }
    async layoutJson(dot) {
        return await this.attempt(`layout`, dot, async () => {
            const graphviz = await this.graphviz();
            return graphviz.layout(dot, 'json', undefined, {
                yInvert: true,
            });
        });
    }
    async svg(dot) {
        return await this.attempt(`svg`, dot, async () => {
            const graphviz = await this.graphviz();
            return graphviz.layout(dot, 'svg');
        });
    }
}
