import spawn from 'nano-spawn';
import { defineBuildConfig } from 'obuild/config';
export default defineBuildConfig({
    entries: [
        './src/index.ts',
        './src/node/index.ts',
    ],
    hooks: {
        'end': async () => {
            await spawn('pnpm', ['run', 'generate'], {
                preferLocal: true,
                stdio: 'inherit',
            });
        },
    },
});
