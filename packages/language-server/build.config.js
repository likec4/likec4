import { defineBuildConfig } from 'obuild/config';
export default defineBuildConfig({
    entries: [
        {
            type: 'bundle',
            input: [
                './src/filesystem/index.ts',
                './src/browser/index.ts',
                './src/browser/worker.ts',
                './src/mcp/index.ts',
                './src/module.ts',
                './src/bundled.ts',
                './src/protocol.ts',
                './src/likec4lib.ts',
                './src/index.ts',
            ],
            minify: {
                mangle: {
                    keepNames: {
                        class: true,
                        function: true,
                    },
                },
            },
            rolldown: {
                platform: 'neutral',
                resolve: {
                    mainFields: ['module', 'main'],
                    conditionNames: ['sources', 'import', 'default'],
                },
            },
        },
    ],
});
