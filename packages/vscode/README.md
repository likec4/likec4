# LikeC4 Correctness Validation

Enhanced LikeC4 with correctness validation capabilities for detecting architectural issues.

## How to Clone

```bash
git clone https://github.com/Nikhil-CMU/likec4
cd likec4
pnpm install
```

## What Files Were Changed

### CLI Implementation
- `packages/likec4/src/cli/correctness/` - New correctness command and validation logic
- `packages/likec4/src/cli/index.ts` - Registered correctness command

### Language Server Integration  
- `packages/language-server/src/validation/correctness/` - Real-time validation in editors
- `packages/language-server/src/validation/index.ts` - Registered validation checks

### Test Examples
- `correctness-example/` - Test files with validation tags

## How to Rebuild

```bash
pnpm turbo run build
```

## How to Test the Changes

### CLI Testing
```bash
cd packages/likec4
pnpm start correctness ../../correctness-example
```

```bash
./reinstall-local-language-server
code correctness-example/
```