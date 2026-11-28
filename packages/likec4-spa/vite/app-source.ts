import type { PluginOption, UserConfig } from 'vite'

/**
 * Where the LikeC4 app comes from, and how Vite resolves it.
 *
 * The app is the same, but it is run either from the sources of `@likec4/spa` (development),
 * or from its build inside the installed `likec4` package (CLI).
 * Functions of `@likec4/spa/vite` do not know where the app is, the caller provides it.
 *
 * @see appFromSources in `@likec4/spa/vite/sources`
 */
export interface AppSource {
  /**
   * Vite root of the app, the folder with `index.html` and the `codegen` entries
   */
  root: string

  /**
   * Folder with static files of the app (favicon, robots.txt), copied to the output of the build
   */
  assetsDir: string

  /**
   * Entries of the app, relative to {@link root}
   */
  entries: {
    /**
     * Entries of the app build (`likec4 build`), the first one is `index.html`
     */
    app: [string, ...string[]]
    /**
     * Entry of the React components (`likec4 gen react`)
     */
    react: string
    /**
     * Entry of the web components (`likec4 gen webcomponent`)
     */
    webcomponent: string
  }

  /**
   * Vite config shared by all builds of the app: `resolve`, `css`.
   * Merged with the config of each build.
   */
  config: UserConfig

  /**
   * Plugins of the app (dev server, preview and the app build), e.g. `@vitejs/plugin-react`.
   * Not used for the React and web components.
   */
  plugins: PluginOption[]
}
