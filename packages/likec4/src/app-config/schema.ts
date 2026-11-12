import { LikeC4AppOptionsSchema } from '@likec4/vite-plugin'
import z from 'zod/v4'

const Port = z.number().int().min(1).max(65535)

/**
 * Schema of the LikeC4 app config (`likec4.app.config.ts`).
 * Extends the application options of the Vite plugin with the options of the CLI.
 *
 * @experimental
 */
export const LikeC4AppConfigSchema = z.strictObject({
  ...LikeC4AppOptionsSchema.shape,
  /**
   * Directory with LikeC4 sources, relative to the config file.
   * Used when the path is not given to the CLI.
   */
  workspace: z.string().nonempty().optional(),
  /**
   * Layout engine: bundled WebAssembly or `dot` binary from PATH.
   * By default `binary` inside a container, `wasm` otherwise.
   */
  graphviz: z.enum(['wasm', 'binary']).optional(),
  /**
   * Base url the app is being served from, e.g. `/` or `/pages/`
   */
  base: z.string().nonempty().optional(),
  /**
   * Directory whose files are copied to the output as-is, relative to the config file
   */
  publicDir: z.string().nonempty().optional(),
  /**
   * Options of the production build (`likec4 build`)
   */
  build: z
    .strictObject({
      /**
       * Output directory, relative to the config file.
       * By default `dist` in the workspace.
       */
      outDir: z.string().nonempty().optional(),
      /**
       * Output a single self-contained HTML file
       * @default false
       */
      singleFile: z.boolean().default(false),
      /**
       * Build webcomponents
       * @default true
       */
      webcomponent: z.boolean().default(true),
    })
    .prefault({}),
  /**
   * Options of the dev server (`likec4 start`)
   */
  server: z
    .strictObject({
      /**
       * Address of the network interface to listen on
       */
      host: z.string().nonempty().optional(),
      /**
       * Port of the dev server
       */
      port: Port.optional(),
      /**
       * Port of the HMR WebSocket server
       */
      hmrPort: Port.optional(),
      /**
       * Hostnames allowed to access the dev server, all hosts are allowed if not set
       */
      allowedHosts: z.array(z.string().nonempty()).optional(),
    })
    .prefault({}),
})

/**
 * LikeC4 app config as written in `likec4.app.config.ts`
 *
 * @experimental
 */
export type LikeC4AppConfigInput = z.input<typeof LikeC4AppConfigSchema>

/**
 * LikeC4 app config with defaults applied
 */
export type ParsedLikeC4AppConfig = z.output<typeof LikeC4AppConfigSchema>
