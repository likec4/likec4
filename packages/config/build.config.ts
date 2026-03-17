import spawn from 'nano-spawn'
import { defineBuildConfig } from 'obuild/config'

export default defineBuildConfig({
  entries: [
    './src/index.ts',
    './src/node/index.ts',
  ],
  hooks: {
    rolldownConfig: (config) => {
      config.external = [...(config.external as string[]), '@likec4/config']
    },
    'end': async () => {
      await spawn('pnpm', ['run', 'generate'], {
        preferLocal: true,
        stdio: 'inherit',
      })
    },
  },
}) as unknown
