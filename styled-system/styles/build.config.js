import spawn from 'nano-spawn';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { defineBuildConfig } from 'obuild/config';
export default defineBuildConfig({
    entries: [{
            type: 'bundle',
            outDir: 'preset',
            input: [
                './preset.ts',
            ],
            rolldown: {
                platform: 'browser',
            },
        }, {
            type: 'bundle',
            outDir: 'vars',
            input: [
                './vars.ts',
            ],
            rolldown: {
                platform: 'browser',
                treeshake: {
                    moduleSideEffects: false,
                },
            },
        }],
    hooks: {
        start: async () => {
            await spawn('panda', ['codegen', '--clean'], {
                stdio: 'inherit',
                preferLocal: true,
            });
        },
        end: async () => {
            // mock entry file for module resolution
            if (!existsSync('dist/types/index.mjs')) {
                try {
                    await writeFile('dist/types/index.mjs', 'export {}');
                }
                catch (e) {
                    console.error('Failed to create dist/types/index.mjs', e);
                }
            }
            await spawn('tsc', ['--build', '--verbose'], {
                stdio: 'inherit',
                preferLocal: true,
            });
        },
    },
});
