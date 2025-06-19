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

## Testing Cursor Language Server Integration

11. **Install LikeC4 extension in Cursor**
    ```bash
    # From project root
    cursor --install-extension packages/vscode/likec4-vscode-1.32.1.vsix --force
    ```

12. **Restart Cursor**
    - Completely restart Cursor application, or
    - Use `Cmd+Shift+P` → `Developer: Reload Window`

13. **Open Cursor with correctness examples**
    ```bash
    cursor correctness-examples/
    ```

14. **Expected behavior in Cursor**
    - Same as VS Code: squiggly lines appear under disconnected elements
    - Syntax highlighting for `.c4` files
    - Code completion and IntelliSense
    - All language server features work identically to VS Code

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

### Cursor Language Server
- Identical behavior to VS Code
- Uses the same VSCode extension package (.vsix)
- Full language server integration with diagnostics, syntax highlighting, and IntelliSense

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

### VS Code Issues
- If VS Code doesn't show diagnostics, restart the language server: `Ctrl+Shift+P` → "Developer: Reload Window"
- Ensure both language server and VS Code extension are built after changes
- Check VS Code output panel for language server logs if needed

### Cursor Issues
- If Cursor doesn't show diagnostics after installing extension, restart Cursor completely
- Use `Cmd+Shift+P` → "Developer: Reload Window" to restart language server
- Check extension is installed: `Cmd+Shift+P` → "Extensions: Show Installed Extensions" → search "likec4"
- Verify file is recognized as LikeC4 language (bottom right of editor should show "LikeC4")

### General Issues
- If `pnpm start` doesn't work, ensure you're in the `packages/likec4` directory  
- Verify dependencies are installed with `pnpm install` from project root
- Make sure VS Code extension is built with `pnpm run build` in `packages/vscode/`
