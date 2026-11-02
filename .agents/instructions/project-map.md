# Project map

Canonical task guidance referenced by root AGENTS.md. Read the sections that apply to the task.

## Project Structure & Module Organization

- Monorepo managed by `pnpm` workspaces and `turbo`.
- `apps/` contains user-facing apps, notably `apps/docs` and `apps/playground`.
- `packages/likec4/` is the CLI and static site generator main entry point.
- `packages/likec4-spa/` is the single-page application for rendering architecture diagrams.
- `packages/vite-plugin/` is the LikeC4 Vite plugin (`@likec4/vite-plugin`).
- `packages/lsp/` is the standalone LikeC4 Language Server for editor integrations (`@likec4/lsp`).
- `packages/react/` is the LikeC4 React bundle (`@likec4/react`).
- `packages/core/` contains core and model types, model builder, compute-view, and layout drift detection logic.
- `packages/language-server/` contains the Langium-based DSL parser and LSP implementation.
- `packages/language-services/` contains language service initialization for browser and Node.js consumers.
- `packages/diagram/` contains the React/ReactFlow diagram renderer.
- `packages/layouts/` contains Graphviz-based layout algorithms.
- `packages/generators/` contains exports to Mermaid, PlantUML, D2, and LikeC4 DSL.
- `packages/vscode/` contains the VSCode extension.
- `packages/vscode-preview/` contains the preview panel component for VSCode.
- `packages/config/` contains configuration schema and validation.
- `packages/icons/` is script-generated; never change it unless explicitly asked.
- `packages/log/` contains shared logging utilities.
- `packages/mcp/` contains the MCP server package; see `packages/mcp/README.md`.
- `packages/tsconfig/` contains shared TypeScript configuration.
- `packages/create-likec4/` is not used for now.
- `e2e/` is an isolated workspace for Playwright end-to-end tests.
- `styled-system/preset` holds the PandaCSS preset.
- `styled-system/styles` holds `pandacss codegen` results shared across packages.
- `examples/` provides sample LikeC4 projects.
- `devops/` contains CI/CD and repository utility scripts.
- `skills/` contains agent skills for AI assistants, including `skills/likec4-dsl/`.
- LeanIX / Draw.io bridge details live in `packages/leanix-bridge/README.md` and `skills/likec4-dsl/references/bridge-leanix-drawio.md`.
