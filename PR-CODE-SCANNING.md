# fix: CodeQL / Code scanning remediation (drawio + icons)

## Summary

This PR addresses CodeQL security alerts on branch `main`:

1. **js/polynomial-redos** (parse-drawio)
2. **js/bad-code-sanitization** (vite-plugin icons)

## Changes

### 1. `packages/generators/src/drawio/parse-drawio.ts` (ReDoS)

- **Issue:** Polynomial regular expressions on uncontrolled data (`fullTag.match(/<data\s+key="likec4Description".../i)` and similar) could cause ReDoS.
- **Fix:** Extract `<data key="...">` content using **indexOf-based** parsing only:
  - `parseAllUserData(fullTag)` uses `indexOfTagStart`, `findOpenTagEnd`, `indexOfClosingTag` (no regex on user input).
  - `parseUserData(fullTag)` uses `parseAllUserData` and reads `likec4Description` / `likec4Technology` from the result.

### 2. `packages/vite-plugin/src/virtuals/icons.ts` (Code sanitization)

- **Issue:** Code construction from unsanitized values (`id`, `pkg`) in generated JS.
- **Fix:** 
  - Allowlist project ids with `SAFE_PROJECT_ID_REGEX = /^[a-zA-Z0-9_.-]+$/`.
  - `embedProjectIdAsJsString(projectId)` validates and returns `JSON.stringify(projectId)`.
  - `embedUrlAsJsString(url)` returns `JSON.stringify(url)`.
  - Generated registry uses `idLiteral` and `pkgLiteral` (safe literals) instead of raw `id`/`pkg`.

## Verification

- No regex on uncontrolled XML/cell data in parse-drawio for `<data key="...">` or `<mxGeometry>`.
- No unsanitized interpolation in generated code in icons virtual module.
