import spawn from 'nano-spawn'
import { defineBuildConfig } from 'obuild/config'

export default defineBuildConfig({
  entries: [{
    type: 'bundle',
    input: [
      './src/index.ts',
      './src/defaults/index.ts',
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
      await spawn('tsx', ['generate.ts'], {
        preferLocal: true,
        stdio: 'inherit',
      })
    },
    end: async () => {
      await spawn('tsc', ['--build', '--verbose'], {
        preferLocal: true,
        stdio: 'inherit',
      })
    },
  },
}) as unknown
