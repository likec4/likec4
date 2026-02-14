import { resolve } from 'node:path';
import { defineProject } from 'vitest/config';
export default defineProject({
    resolve: {
        conditions: ['sources'],
        // Seems vitest doesn't resolve conditions
        alias: {
            '@likec4/core': resolve(__dirname, '../core/src'),
            '@likec4/log': resolve(__dirname, '../log/src'),
            '@likec4/style-preset/defaults': resolve(__dirname, '../../styled-system/preset/src/defaults/index.ts'),
        },
    },
    test: {
        name: 'config',
    },
});
