# LikeC4 Correctness Validation - Local Development Setup

This repository contains an enhanced version of LikeC4 with **correctness validation capabilities** that can detect architectural issues like disconnected elements, cyclic dependencies, mislayering, and performance metadata problems.

## Prerequisites

- **Node.js** 20.19.1+ (tested with v22.12.0)
- **pnpm** 10.11.1+
- **VSCode** editor

## Quick Setup

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/Nikhil-CMU/likec4
   cd likec4
   pnpm install
   ```

2. **Build the project**
   ```bash
   pnpm turbo run build
   ```

3. **Test the correctness validation**
   ```bash
   cd packages/likec4
   pnpm start correctness ../../acme-examples
   ```

## What We Added

This implementation extends LikeC4 with tag-based correctness validation. The system supports four types of architectural checks:

### Validation Types
- **`check-orphan`** - Detects disconnected/orphaned elements
- **`check-cycle`** - Identifies cyclic dependencies  
- **`check-mislayering`** - Finds layer violation issues
- **`analyze-max-throughput`** - Validates performance metadata requirements

### Key Files Modified

#### CLI Implementation
- `packages/likec4/src/cli/correctness/` - New correctness command and validation logic
- `packages/likec4/src/cli/index.ts` - Registered correctness command

#### Language Server Integration  
- `packages/language-server/src/validation/correctness/` - Real-time validation in editors
- `packages/language-server/src/validation/index.ts` - Registered validation checks

#### Test Examples
- `acme-examples/` - Contains architecture files with validation tags

## Running Correctness Validation

### CLI Usage

Navigate to the CLI package:
```bash
cd packages/likec4
```

**Basic validation:**
```bash
pnpm start correctness ../../acme-examples
```

**Strict mode (warnings as errors):**
```bash
pnpm start correctness ../../acme-examples --strict
```

**View available options:**
```bash
pnpm start correctness --help
```

### Expected CLI Output
The tool will:
- Detect validation tags in your `.c4` files
- Run corresponding checks (orphan, cycle, mislayering, performance)  
- Report issues with suggestions for fixes
- Exit with code 1 if issues found

## Language Server Integration

### Setup VSCode Extension

Use the automated setup script (recommended):
```bash
./reinstall-local-language-server
```

This script will:
- Clean all caches and build artifacts
- Rebuild the language server and VSCode extension
- Package and install the extension
- Restart language server processes

Then open test files:
```bash
code acme-examples/
```

### Expected VSCode Behavior
- **Squiggly lines** appear under problematic elements
- **Hover tooltips** show detailed error messages
- **Real-time validation** as you type
- **Diagnostic codes** like `disconnected-element`

## Development Scripts

### Language Server Restart (For Active Development)
```bash
# Cleanup and rebuild (recommended for development)
./reinstall-local-language-server

# Or restart just the language server
# In VSCode: Cmd+Shift+P → "Developer: Reload Window"
```

### Build Commands
```bash
# Build everything
pnpm turbo run build

# Build only language server  
pnpm build --filter=@likec4/language-server

# Build only VSCode extension
cd packages/vscode && pnpm run build
```

### Testing Commands
```bash
# Run all tests
pnpm test

# Test specific correctness validation
cd packages/likec4
pnpm start correctness ../../acme-examples

# Test with different architecture files
pnpm start correctness ../../examples/cloud-system
```

## Project Structure

```
likec4/
├── packages/
│   ├── likec4/                    # CLI tool with correctness command
│   ├── language-server/           # VSCode integration
│   └── vscode/                    # Editor extension
├── acme-examples/                 # Test files with validation tags
├── reinstall-local-language-server # Development script
└── commands.md                    # Detailed setup guide
```

## Troubleshooting

### Language Server Issues
```bash
# Complete rebuild
./reinstall-local-language-server

# Manual restart in editor
# VSCode: Cmd+Shift+P → "Developer: Reload Window"
```

### Build Issues
```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm turbo run build
```

### Extension Not Working
```bash
# Check installation
code --list-extensions | grep likec4

# Reinstall extension (use the automated script)
./reinstall-local-language-server
```

## Branch Information

Current branch: `feature/correctness-validation`

This implementation adds comprehensive correctness validation to LikeC4, enabling both CLI-based checks and real-time VSCode validation for architectural correctness.