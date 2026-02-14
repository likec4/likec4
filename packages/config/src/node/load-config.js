import { invariant } from '@likec4/core';
import { logger, wrapError } from '@likec4/log';
import { bundleRequire } from 'bundle-require';
import { defu } from 'defu';
import { formatMessagesSync } from 'esbuild';
import JSON5 from 'json5';
import * as fs from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { hasAtLeast, isNonNullish, last, omit } from 'remeda';
import z from 'zod/v4';
import { isLikeC4JsonConfig, isLikeC4NonJsonConfig } from '../filenames';
import { LikeC4ProjectJsonConfigSchema, validateProjectConfig } from '../schema';
const JsonConfigInputSchema = LikeC4ProjectJsonConfigSchema.pick({
    extends: true,
    styles: true,
}).loose();
const normalizeExtends = (value) => {
    if (!value) {
        return [];
    }
    return Array.isArray(value) ? value : [value];
};
const parseJsonConfig = async (filepath) => {
    const content = await fs.readFile(filepath, 'utf-8');
    let parsed;
    try {
        parsed = JSON5.parse(content.trim() || '{}');
    }
    catch (e) {
        throw wrapError(e, `${filepath}:`);
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error(`${filepath}: Config must be a JSON object`);
    }
    const result = JsonConfigInputSchema.safeParse(parsed);
    if (!result.success) {
        throw new Error(`${filepath}: Invalid config\n` + z.prettifyError(result.error));
    }
    return result.data;
};
const loadJsonConfigs = async (filepath, stack) => {
    if (stack.includes(filepath)) {
        const cycleStart = stack.indexOf(filepath);
        const cycle = [...stack.slice(cycleStart), filepath].join(' -> ');
        throw new Error(`Config extends cycle detected: ${cycle}`);
    }
    const parsed = await parseJsonConfig(filepath);
    const extendsPaths = normalizeExtends(parsed.extends);
    const nextStack = [...stack, filepath];
    const configs = [];
    for (const extendPath of extendsPaths) {
        const resolvedPath = resolve(dirname(filepath), extendPath);
        configs.push(...await loadJsonConfigs(resolvedPath, nextStack));
    }
    return [...configs, parsed];
};
/**
 * Load LikeC4 Project config file.
 * If filepath is a non-JSON file, it will be bundled and required
 */
export async function loadConfig(filepath) {
    filepath = typeof filepath === 'string' ? filepath : filepath.fsPath;
    logger.getChild('config').debug `Loading config: ${filepath}`;
    const folder = dirname(filepath);
    const filename = basename(filepath);
    const implicitcfg = { name: basename(folder) };
    if (isLikeC4JsonConfig(filename)) {
        const configs = await loadJsonConfigs(resolve(filepath), []);
        invariant(hasAtLeast(configs, 1), 'Expect at least one config');
        const rootConfig = omit(last(configs), ['extends', 'styles']);
        const stylesChain = configs
            .map(config => config.styles)
            .filter(isNonNullish);
        const mergedStyles = stylesChain.length > 0
            ? defu({}, ...stylesChain.reverse())
            : undefined;
        return validateProjectConfig({
            ...implicitcfg,
            ...rootConfig,
            ...(mergedStyles ? { styles: mergedStyles } : {}),
        });
    }
    invariant(isLikeC4NonJsonConfig(filename), `Invalid name for config file: ${filepath}`);
    const { mod } = await bundleRequire({
        filepath,
        cwd: folder,
        esbuildOptions: {
            resolveExtensions: ['.ts', '.mts', '.cts', '.mjs', '.js', '.cjs'],
            plugins: [{
                    name: 'likec4-config',
                    setup(build) {
                        /**
                         * Intercept @likec4/config and likec4/config imports
                         */
                        build.onResolve({ filter: /^@?likec4\/config$/ }, (args) => ({
                            path: args.path,
                            namespace: 'likec4-config',
                        }));
                        build.onEnd((result) => {
                            const messages = formatMessagesSync(result.errors, { kind: 'error' });
                            for (const message of messages) {
                                logger.error(message);
                            }
                        });
                        /**
                         * Mock implementation, this allows to skip redundant bundling @likec4/config
                         */
                        build.onLoad({ filter: /.*/, namespace: 'likec4-config' }, (_args) => {
                            return {
                                contents: `
// Mock implementation to allow loading config files without bundling @likec4/config
function mock(x) { return x }
export {
  mock as defineConfig,
  mock as defineGenerators,
  mock as defineStyle,
  mock as defineTheme,
  mock as defineThemeColor,
}`,
                                loader: 'js',
                            };
                        });
                    },
                }],
        },
    });
    return validateProjectConfig(Object.assign(implicitcfg, mod?.default ?? mod));
}
