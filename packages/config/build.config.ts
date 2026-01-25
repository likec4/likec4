import spawn from 'nano-spawn'
import { defineBuildConfig } from 'obuild/config'

export default defineBuildConfig({
  entries: [
    './src/index.ts',
    './src/node/index.ts',
  ],
  hooks: {
    'end': async () => {
      await spawn('tsx', ['scripts/generate.mts'], {
        preferLocal: true,
        stdio: 'inherit',
      })
    },
  },
}) as unknown
