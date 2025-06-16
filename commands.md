# LikeC4 Correctness Check Setup and Testing

## Prerequisites
- Node.js 20.19.1+ (tested with v22.12.0)
- pnpm 10.11.1+

## Setup Steps

1. **Install dependencies**
   ```bash
   pnpm install
   ```
   ✅ This installs all packages (1681+ dependencies) and sets up the workspace

2. **Build the project**
   ```bash
   pnpm turbo run build
   ```
   Alternative: `pnpm build` or `pnpm generate`

## Testing Correctness Command (CLI)

3. **Navigate to CLI package**
   ```bash
   cd packages/likec4
   ```

4. **Test basic correctness check using pnpm start**
   ```bash
   pnpm start correctness ../../correctness-examples
   ```
   This is the recommended approach as found in the project's own examples.

5. **Alternative: Direct node execution**
   ```bash
   node bin/likec4.mjs correctness ../../correctness-examples
   ```

6. **Test with strict mode**
   ```bash
   pnpm start correctness ../../correctness-examples --strict
   ```
   or
   ```bash
   node bin/likec4.mjs correctness ../../correctness-examples --strict
   ```

7. **View help**
   ```bash
   pnpm start correctness --help
   ```

## Testing VS Code Language Server Integration

8. **Build VS Code extension**
   ```bash
   cd ../vscode
   pnpm run build
   ```

9. **Open VS Code with correctness examples**
   ```bash
   cd ../../
   code correctness-examples/
   ```

10. **Expected behavior in VS Code**
    - Open `disconnected_architecture.c4`
    - Should see squiggly lines (warnings) under disconnected elements:
      - `disconnected_db` (line 18)
      - `disconnected_restapi` (line 13)
    - Hover over elements to see warning messages about connectivity

## Expected Results

### CLI Output
- Command detects 2 disconnected elements:
  - `disconnected_db`
  - `disconnected_backend.disconnected_restapi`
- Provides suggestions for fixing connectivity issues
- Exit code 1 on errors (both normal and strict mode)

### VS Code Language Server
- Warning squiggly lines appear under disconnected elements
- Hover shows: "Element 'X' is not connected to any other elements"
- Diagnostic code: `disconnected-element`
- Severity: Warning (not error)

## Project Structure Notes

- **CLI Package**: `packages/likec4/` - Contains the main CLI tool
- **Language Server**: `packages/language-server/` - VS Code integration
- **Test Examples**: `correctness-examples/` - Sample C4 files for testing
- **Commands Reference**: `correctness-examples/commands.txt` - Working command examples

## Implementation Details

### Fixed Issues
1. **Syntax errors** in `packages/likec4/src/cli/correctness/correctness.ts`
2. **Import paths** corrected to use relative imports
3. **Correctness validation** added to language server validation registry
4. **Element connectivity check** implemented using ModelParser for proper FqnRef resolution

### Files Modified
- `packages/likec4/src/cli/correctness/correctness.ts` - Fixed syntax and imports
- `packages/language-server/src/validation/element.ts` - Added correctness validation
- `packages/language-server/src/validation/index.ts` - Registered correctness validation

## Command Help

```bash
pnpm start correctness --help
```

Shows available options including `--strict` mode for treating warnings as errors.

## Troubleshooting

- If VS Code doesn't show diagnostics, restart the language server: `Ctrl+Shift+P` → "Developer: Reload Window"
- Ensure both language server and VS Code extension are built after changes
- Check VS Code output panel for language server logs if needed  
- If `pnpm start` doesn't work, ensure you're in the `packages/likec4` directory
- Verify dependencies are installed with `pnpm install` from project root
