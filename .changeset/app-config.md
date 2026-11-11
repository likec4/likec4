---
'likec4': patch
---

Experimental app config: keep the options of the CLI in `likec4.app.config.ts` (with `defineAppConfig` from `likec4/config`) instead of repeating flags. `likec4 start`, `build`, `preview`, `export png/jpg`, `gen react` and `gen webcomponent` read it; flags still win over the file.

New flags: `--app-config <file>` and `--no-app-config`, `--customization <file>` for UI customization, and `--theme` for `likec4 start`.

In the Vite plugin, `title`, `theme`, `useHashHistory` and `webcomponentPrefix` are now top-level options; `appConfig` is deprecated.
