# LikeC4 Repository - Copilot Instructions

## Repository Overview

LikeC4 is an architecture-as-code tool for visualizing software architecture. It provides a DSL for describing architecture, a language server, CLI, VSCode extension, and web-based diagram visualization.

**Tech Stack**: TypeScript monorepo using pnpm workspaces, Turbo for build orchestration, React for UI, Langium for language parsing, Vite for bundling.
**Size**: ~20 packages across 1,686 dependencies. Main packages: `likec4` (CLI/Vite plugin), `@likec4/core` (model builder), `@likec4/language-server` (Langium-based parser), `@likec4/diagram` (React/ReactFlow renderer), `@likec4/vscode` (VSCode extension).
**Node Requirements**: Node.js ^20.19.0 or >=22.18.0, pnpm 10.19.0 (.tool-versions specifies 22.19.0)

## Build & Validation Commands

### Environment Setup (CRITICAL - DO THIS FIRST)
```bash
# Install correct pnpm version BEFORE running any other commands
npm install -g pnpm@10.19.0

# Install dependencies with specific environment variables to avoid husky issues
HUSKY=0 NODE_ENV=development pnpm install --prefer-offline
```

**IMPORTANT**: Always set `HUSKY=0` and `NODE_ENV=development` when installing dependencies to prevent husky pre-commit hook setup issues.

### Build Workflow (ALWAYS follow this order)

1. **Generate sources first** (before any other build command):
   ```bash
   pnpm generate
   ```
   This generates TypeScript types, Langium parser, and other code-generated files. Takes ~30 seconds.

2. **Build packages**:
   ```bash
   pnpm ci:build  # Production build, excludes docs (~3-4 minutes)
   pnpm build     # Same as ci:build (common alias)
   ```

3. **Type checking**:
   ```bash
   pnpm ci:typecheck  # Type check all except docs (~1.5 minutes)
   ```

4. **Run tests**:
   ```bash
   NODE_ENV=test pnpm ci:test  # Run all unit tests (~1 minute)
   ```

5. **Linting**:
   ```bash
   pnpm ci:lint     # Uses oxlint with type-aware rules
   pnpm lint:fix    # Auto-fix lint issues
   pnpm fmt         # Format code with dprint
   ```

### Clean & Rebuild (When Things Go Wrong)

If you encounter TypeScript project reference errors or stale cache issues:

```bash
# Level 1: Clean build artifacts and caches
pnpm clean

# Level 2: Clean TypeScript build info
pnpm clean:lib

# Level 3: Nuclear option - clean and reinstall
pnpm clean
rm -rf node_modules
pnpm store prune
HUSKY=0 NODE_ENV=development pnpm install --prefer-offline

# After cleaning, ALWAYS run generate before building
pnpm generate
pnpm build
```

**Common Issue**: After `git checkout`, `git merge`, or deleting/renaming files, TypeScript project references may become stale. Solution: Run `pnpm generate` then `pnpm typecheck`.

### E2E Tests

```bash
# From root - builds tarballs, installs in isolated workspace, runs Playwright tests (~10 minutes)
pnpm pretest:e2e  # Packs likec4 and core packages
pnpm test:e2e     # Runs e2e tests in isolated environment
```

## Project Structure & Key Locations

### Repository Layout
```
/
├── packages/
│   ├── likec4/              # CLI, Vite plugin, static site generator (main entry point)
│   ├── core/                # Core types, model builder, compute-view logic
│   ├── language-server/     # Langium-based DSL parser and language services
│   ├── diagram/             # React/ReactFlow diagram renderer
│   ├── layouts/             # Graphviz-based layout algorithms
│   ├── generators/          # Export to Mermaid, PlantUML, D2, etc.
│   ├── vscode/              # VSCode extension
│   ├── vscode-preview/      # Preview panel component for VSCode
│   ├── config/              # Configuration schema and validation
│   └── [icons, log, mcp, tsconfig, create-likec4]
├── apps/
│   ├── playground/          # Online playground (playground.likec4.dev)
│   └── docs/                # Documentation site (likec4.dev) - Astro-based
├── styled-system/           # Panda CSS theme and styles
├── e2e/                     # E2E tests using Playwright
└── examples/                # Example projects
```

### Configuration Files (Root)
- `turbo.json` - Turbo build orchestration, defines task dependencies
- `pnpm-workspace.yaml` - Workspace packages and dependency catalog
- `tsconfig.json` - TypeScript project references (for IDE/task runner)
- `.oxlintrc.json` - Linting rules (uses oxlint, not eslint)
- `dprint.json` - Code formatting rules
- `vitest.config.ts` - Test configuration (references package-level configs)
- `.tool-versions` - Required versions for Node, pnpm, dprint

### Build Outputs (Gitignored)
- `packages/*/lib/` - TypeScript build outputs
- `packages/*/dist/` - Bundled outputs
- `packages/language-server/src/generated/` - Langium-generated parser
- `styled-system/*/lib/` - Panda CSS outputs
- `**/.turbo/` - Turbo cache
- `**/.tsbuildinfo` - TypeScript incremental build cache

### Test File Locations
- Unit tests: `packages/*/src/**/*.spec.ts`, `packages/*/src/**/__test__/*.spec.ts`
- E2E tests: `e2e/tests/*.spec.ts`, `e2e/src/*.spec.ts`

## CI/CD & GitHub Workflows

### Main Workflows (`.github/workflows/`)

**checks.yaml** (runs on PRs):
1. `check-types`: TypeScript type checking (`pnpm ci:typecheck`)
2. `check-lint`: Linting (`pnpm ci:lint`)
3. `check-build`: Build all packages, pack tarballs, run `pnpm lint:package`
4. `check-tests`: Run unit tests (`pnpm ci:test`)
5. `check-on-windows`: Windows compatibility build and test
6. `check-e2e-tests`: E2E tests using built tarballs
7. `check-e2e-types`: Type check E2E generated types
8. `check-docs-astro`: Build documentation site

**Bootstrap Action** (`.github/actions/bootstrap/action.yml`):
```yaml
- Setup pnpm with NODE_ENV=development
- Setup Node from .tool-versions
- Cache turbo builds
- Run: pnpm install --prefer-offline with HUSKY=0
```

### Replicating CI Checks Locally

```bash
# Run all checks that CI runs
pnpm ci:typecheck  # ~1.5 min
pnpm ci:lint       # ~30 sec
pnpm ci:build      # ~3-4 min
NODE_ENV=test pnpm ci:test  # ~1 min

# For E2E (takes longer)
pnpm pretest:e2e   # Packs tarballs
pnpm test:e2e      # Runs E2E tests
```

## Common Gotchas & Workarounds

### TypeScript Project References
The repo uses TypeScript project references for faster incremental builds. If you see errors like "Output file 'X' has not been built from source file 'Y'":
1. Run `pnpm generate` to regenerate all source files
2. If that doesn't work, run `pnpm clean:lib` then `pnpm generate && pnpm typecheck`

### Turbo Cache Issues
Turbo caches build outputs. If you suspect stale cache:
```bash
pnpm clean  # Cleans turbo caches and build outputs
```

### Generated Files
Several packages have auto-generated files that MUST be generated before building:
- `packages/language-server/src/generated/` - Langium parser (from grammar)
- `packages/vscode/src/meta.ts` - VSCode extension metadata
- `packages/likec4/app/src/routeTree.gen.ts` - TanStack Router routes
- `styled-system/preset/src/generated.ts` - Panda CSS preset

Always run `pnpm generate` after checkout or when these files are missing.

### Formatting
Use `pnpm fmt` to format code with dprint. The project does NOT use Prettier or eslint for formatting.

### Icons Package
The `packages/icons/` package generates icon bundles. During `pnpm clean`, icon files are deleted and regenerated from source. This is expected behavior.

### Husky Hooks
Pre-commit hooks run `nano-staged` to format staged files. If you need to bypass:
```bash
git commit --no-verify
```

## Development Workflows

### Working on VSCode Extension
```bash
cd packages/vscode
pnpm dev  # Watches for changes in dependencies
# Then launch "Run Extension" in VSCode (F5)
```

### Working on Playground
```bash
cd apps/playground
pnpm dev  # Starts dev server with hot reload
```

### Working on Core/Language Server
```bash
# Make changes, then run tests
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm vitest:ui         # Visual test UI (from root)
```

### Adding New Dependencies
When adding dependencies to any package, check if a catalog version exists in `pnpm-workspace.yaml`. Use catalog versions when available for consistency.

## Final Notes

- **Trust these instructions**: Only search for additional information if these instructions are incomplete or found to be incorrect.
- **Always run `pnpm generate` first** when starting work or after cleaning.
- **Use `NODE_ENV=development`** for install and dev, `NODE_ENV=production` or `NODE_ENV=test` for CI commands.
- **Turbo handles task orchestration**: Commands like `pnpm build` run tasks across packages in dependency order.
- **Check `.gitignore`** before committing to avoid committing build artifacts, especially `lib/`, `dist/`, `.turbo/`, and generated files.
