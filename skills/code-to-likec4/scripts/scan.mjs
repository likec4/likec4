#!/usr/bin/env node
// scan.mjs — node stdlib only. Walks TS/JS, extracts imports + titles, spawns scan.py once, merges to IR JSON.
// Usage: node scan.mjs --root <dir> --out <file|-> [--max-files N] [--include-tests] [--include G ...] [--exclude G ...]
import { spawnSync } from 'node:child_process'
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const DEFAULT_IGNORE_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.venv',
  '__pycache__',
  '.git',
  'coverage',
  '.next',
  'out',
])
const DEFAULT_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const TEST_RE =
  /(\.test\.|\.spec\.|__tests__|(^|\/)tests?\/|(^|\/)test_[^/]*\.(py|js|ts|mjs|cjs)$|_test\.(py|js|ts)$|_tests\.(py|js|ts)$)/

/** Print CLI usage information for the scanner. */
function help() {
  console.log(`scan.mjs — scan TS/JS (+ Python via scan.py) to IR JSON
Usage: node scan.mjs --root <dir> --out <file|-> [options]
Options:
  --root <dir>        repo root to scan (default .)
  --out <file|->      output file or - for stdout (default -)
  --max-files <n>     max source files (default 2000)
  --include <glob>    repeatable; if given, replaces default extensions
  --exclude <glob>    repeatable; merged with default ignores (glob match)
  --include-tests     include test files (default false)
  --no-symbols        file-level only: skip class/function symbols (routes kept
                      only with --symbol-kinds route; use for large repos where
                      per-function nodes flood the diagram)
  --symbol-kinds <csv> keep only these symbol kinds (subset of
                      class,function,variable,route; default all)
  -h, --help          show this help`)
}

/** Parse CLI arguments for the scanner. */
function parseArgs(argv) {
  const o = {
    root: '.',
    out: '-',
    maxFiles: 2000,
    include: [],
    exclude: [],
    includeTests: false,
    noSymbols: false,
    symbolKinds: null,
    help: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--root') o.root = argv[++i]
    else if (a === '--out') o.out = argv[++i]
    else if (a === '--max-files') o.maxFiles = Number(argv[++i])
    else if (a === '--include') o.include.push(argv[++i])
    else if (a === '--exclude') o.exclude.push(argv[++i])
    else if (a === '--include-tests') o.includeTests = true
    else if (a === '--no-symbols') o.noSymbols = true
    else if (a === '--symbol-kinds') o.symbolKinds = String(argv[++i]).split(',').map((s) => s.trim()).filter(Boolean)
    else if (a === '-h' || a === '--help') o.help = true
  }
  return o
}

/** Read root-level .gitignore patterns as relative ignore rules. */
function loadGitignore(root) {
  const p = join(root, '.gitignore')
  if (!existsSync(p)) return []
  // Root-anchored entries lose their leading `/`; keep the trailing `/` so
  // excluded() can still treat directory-only patterns correctly.
  return readFileSync(p, 'utf8').split('\n').map((l) => l.trim()).filter((l) =>
    l && !l.startsWith('#') && !l.startsWith('!')
  ).map((l) => l.replace(/^\//, ''))
}

/** Convert a glob pattern (supporting `*` and `**`) into a RegExp. */
function globToRegExp(pat) {
  const esc = (s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
  const seg = (s) => s.split('*').map(esc).join('[^/]*')
  // `**/` means zero or more directories; a bare `**` may cross separators.
  const body = pat.split('**/').map((part) => part.split('**').map(seg).join('.*')).join('(?:.*/)?')
  return new RegExp(`^${body}$`)
}

/** Check whether a relative path is ignored by directory defaults, gitignore, or extra excludes. */
function excluded(rel, ignoreDirs, gitignore, extra, isDir = false) {
  // rel uses forward slashes (normalized by callers). Segment semantics
  // (gitignore-like): `data/` matches only a directory segment, never
  // `database.py`; `--exclude` entries are globs, merged with defaults.
  const parts = rel.split('/').filter((p) => p && p !== '.')
  if (parts.some((p) => ignoreDirs.has(p))) return true
  if (parts.some((p) => p.startsWith('.')) && parts[0] !== '.') return true
  for (const raw of [...gitignore, ...extra]) {
    if (!raw) continue
    const dirOnly = raw.endsWith('/')
    const pat = dirOnly ? raw.slice(0, -1) : raw
    if (!pat.includes('/')) {
      const rx = globToRegExp(pat)
      const scope = dirOnly && !isDir ? parts.slice(0, -1) : parts
      if (scope.some((s) => rx.test(s))) return true
    } else {
      const rx = globToRegExp(pat)
      if (rx.test(rel) || (isDir && rx.test(`${rel}/`))) return true
      if (dirOnly && (rel === pat || rel.startsWith(`${pat}/`))) return true
    }
  }
  return false
}

/** Recursively collect matching source files up to the file budget limit. */
function walk(root, o, gitignore) {
  const files = []
  const stack = [root]
  while (stack.length) {
    const dir = stack.pop()
    let entries
    try {
      entries = readdirSync(dir)
    } catch {
      continue
    }
    for (const e of entries) {
      const full = join(dir, e)
      const rel = relative(root, full).replace(/\\/g, '/')
      let st
      try {
        st = lstatSync(full)
      } catch {
        continue
      }
      if (st.isSymbolicLink()) continue
      if (st.isDirectory()) {
        if (!excluded(rel, DEFAULT_IGNORE_DIRS, gitignore, o.exclude, true)) stack.push(full)
      } else if (st.isFile()) {
        if (excluded(rel, DEFAULT_IGNORE_DIRS, gitignore, o.exclude)) continue
        if (!o.includeTests && TEST_RE.test(rel)) continue
        const ext = extname(e)
        if (ext === '.py') continue // handled by scan.py
        if (o.include.length) {
          // Explicit includes replace the default extension list; match both the
          // relative path and the basename so `*.vue` and `src/**/*.vue` work.
          const matched = o.include.some((g) => {
            const rx = globToRegExp(g)
            return rx.test(rel) || rx.test(e)
          })
          if (!matched) continue
        } else if (!DEFAULT_EXTS.has(ext)) continue
        files.push(full)
      }
    }
  }
  return files.slice(0, o.maxFiles + 1)
}

/** Convert a full file path to a root-relative extensionless module identifier. */
function toModuleName(root, full) {
  return relative(root, full).replace(/\\/g, '/').replace(/\.(tsx?|jsx?|mjs|cjs)$/, '')
}

/** Compute character offsets for the start of each line in a source string. */
function lineOffsets(src) {
  const offs = [0]
  for (let i = src.indexOf('\n'); i !== -1; i = src.indexOf('\n', i + 1)) offs.push(i + 1)
  return offs
}
/** Map a character offset index to a 0-indexed line number via binary search. */
function lineOf(offs, index) {
  let lo = 0
  let hi = offs.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (offs[mid] <= index) {
      lo = mid + 1
    } else {
      hi = mid
    }
  }
  return Math.max(0, lo - 1)
}

/** Derive an HTTP route path from a file path convention (e.g. Next.js/Vercel). */
function fileRoute(file) {
  const p = String(file || '').replace(/\.(tsx?|jsx?|mjs|cjs)$/, '').replace(/(^|\/)index$/, '')
  return `/${p.replace(/^\/+/, '')}` || '/'
}

/** Extract imports and symbol declarations (classes, functions, routes) from TS/JS source. */
function extractTs(src, file = '') {
  const offs = lineOffsets(src)
  const at = (index) => lineOf(offs, index)
  const imports = []
  const re =
    /(?:import\s+(?:[^'"]*?\sfrom\s+)?['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)|import\(\s*['"]([^'"]+)['"]\s*\)|export\s+(?!type\b)(?:\*(?:\s+as\s+[\w$]+)?|\{([^}]*)\})\s*from\s+['"]([^'"]+)['"])/g
  let m
  while ((m = re.exec(src))) {
    if (m[1]) imports.push(m[1])
    else if (m[2]) imports.push(m[2])
    else if (m[3]) imports.push(m[3])
    else if (m[5]) {
      const braceContent = m[4]
      if (braceContent) {
        const items = braceContent.split(',').map((s) => s.trim()).filter(Boolean)
        if (items.length > 0 && items.every((s) => s.startsWith('type ') || s.startsWith('type\t'))) continue
      }
      imports.push(m[5])
    }
  }
  const symbols = []
  const patterns = [
    [/export\s+(?:default\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/g, 'class'],
    [/export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g, 'function'],
    [/export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g, 'variable'],
    [/(?:^|[;}\n])\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g, 'function'],
  ]
  for (const [rx, kind] of patterns) {
    let x
    while ((x = rx.exec(src))) symbols.push({ name: x[1], kind, line: at(x.index) })
  }
  // Vercel/Next.js file-convention handlers: `export async function POST(...)`
  // in api/chat.js serves POST /api/chat. Symbol keeps the code identifier;
  // the route path goes in `route` (rendered as description).
  const verbRe = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s*\(/g
  while ((m = verbRe.exec(src))) {
    const route = `${m[1]} ${fileRoute(file)}`
    // Upgrade the matching exported-function symbol instead of duplicating it
    // (merge dedupes by name, so a second entry would be dropped anyway).
    const existing = symbols.find((s) => s.name === m[1] && s.kind === 'function')
    if (existing) {
      existing.kind = 'route'
      existing.route = route
    }
    else symbols.push({ name: m[1], kind: 'route', line: at(m.index), route })
  }
  // Express/Fastify-style route registrations: app.get('/path', ...) / router.post("...").
  // Path must start with '/' — this excludes lookalikes like headers.get('origin').
  // Root path '/' alone is valid (second char class is *-quantified).
  const routeRe =
    /([A-Za-z_$][\w$]*)\s*\.\s*(get|post|put|delete|patch|head|options|use|all)\s*\(\s*['"`](\/[^'"` ]*)['"`]/g
  while ((m = routeRe.exec(src))) {
    symbols.push({
      name: `${m[2].toUpperCase()} ${m[3]}`,
      kind: 'route',
      line: at(m.index),
      route: `${m[2].toUpperCase()} ${m[3]}`,
    })
  }
  // Chained style: router.route('/path').get(h).post(h) — path lives on .route().
  // Tail runs to `;` so handler args with parens (e.g. auth('x')) don't cut it off.
  const chainRe = /\.route\(\s*['"`](\/[^'"` ]*)['"`]\s*\)([^;]*);/g
  while ((m = chainRe.exec(src))) {
    for (const h of m[2].matchAll(/\.\s*(get|post|put|delete|patch|head|options)\s*\(/g)) {
      const route = `${h[1].toUpperCase()} ${m[1]}`
      symbols.push({ name: route, kind: 'route', line: at(m.index), route })
    }
  }
  // Arrow/wrapped handlers: const createUser = catchAsync(async (req, res) => ...).
  // Only when the initializer contains `=>` (skips plain values like `const x = (1+2)`).
  const arrowRe = /(?:^|[;}\n])\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=(?=[^;]{0,300}=>)/g
  while ((m = arrowRe.exec(src))) {
    if (!symbols.some((s) => s.name === m[1])) symbols.push({ name: m[1], kind: 'function', line: at(m.index) })
  }
  // NestJS-style decorators: @Controller('prefix') class + @Get('path') handler.
  const ctrl = /@Controller\(\s*['"`]([^'"`]*?)['"`]\s*\)/.exec(src)
  const prefix = (ctrl?.[1] || '').replace(/^\/|\/$/g, '')
  // Additional stacked decorators between route and method (e.g. @HttpCode)
  // are skipped; the gap must not cross `;`/`{` (stays within the decorator run).
  const nestRe =
    /@(Get|Post|Put|Delete|Patch|Head|Options)\(\s*(?:['"`]([^'"`]*?)['"`]\s*)?\)((?:[^\n;{}]*\n)*?)\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\(/g
  while ((m = nestRe.exec(src))) {
    const path = [prefix, (m[2] || '').replace(/^\/|\/$/g, '')].filter(Boolean).join('/')
    const route = `${m[1].toUpperCase()} /${path}`
    symbols.push({ name: m[4], kind: 'route', line: at(m.index), route })
  }
  return { imports, symbols }
}

/**
 * Strip single-line and multi-line comments from JSONC text without treating
 * block comment delimiters (`/*` and `*\/`) inside string literals as comment markers.
 */
function stripJsonComments(text) {
  let out = ''
  let inStr = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    const n = text[i + 1]
    if (inStr) {
      out += c
      if (c === '\\') out += text[++i] ?? ''
      else if (c === '"') inStr = false
    } else if (c === '"') {
      inStr = true
      out += c
    } else if (c === '/' && n === '/') {
      while (i < text.length && text[i] !== '\n') i++
      out += '\n'
    } else if (c === '/' && n === '*') {
      i += 2
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++
      i++
    } else out += c
  }
  return out
}

/** Strip trailing commas from object and array literals in JSONC text. */
function stripTrailingCommas(text) {
  let out = ''
  let inStr = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inStr) {
      out += c
      if (c === '\\') out += text[++i] ?? ''
      else if (c === '"') inStr = false
      continue
    }
    if (c === '"') {
      inStr = true
      out += c
      continue
    }
    if (c === ',') {
      let j = i + 1
      while (j < text.length && /\s/.test(text[j])) j++
      if (text[j] === '}' || text[j] === ']') continue
    }
    out += c
  }
  return out
}

/**
 * Load baseUrl and path alias mappings from tsconfig.json.
 * Supports JSONC comments and trailing commas. Returns empty config on parse error.
 */
function loadTsconfig(root) {
  const p = join(root, 'tsconfig.json')
  if (!existsSync(p)) return { baseUrl: '', paths: [] }
  try {
    const source = readFileSync(p, 'utf8').replace(/^\uFEFF/, '')
    const raw = stripTrailingCommas(stripJsonComments(source))
    const cfg = JSON.parse(raw).compilerOptions || {}
    const paths = Object.entries(cfg.paths || {}).map(([k, v]) => ({
      prefix: k.replace(/\/\*$/, '/').replace(/\*$/, ''),
      target: String((Array.isArray(v) ? v[0] : v) || '').replace(/\/\*$/, '/').replace(/\*$/, ''),
    })).filter((e) => e.prefix)
    paths.sort((a, b) => b.prefix.length - a.prefix.length)
    return { baseUrl: (cfg.baseUrl || '').replace(/\/$/, ''), paths }
  } catch {
    return { baseUrl: '', paths: [] }
  }
}

/**
 * Map a tsconfig `paths` alias to a root-relative, extensionless module path.
 * `paths` targets are relative to `baseUrl` (or the tsconfig location when unset).
 */
function resolveAlias(spec, tsconfig, root) {
  for (const { prefix, target } of tsconfig.paths) {
    if (spec.startsWith(prefix)) {
      const rest = spec.slice(prefix.length).replace(/\.(tsx?|jsx?|mjs|cjs)$/, '')
      const prefixed = `${tsconfig.baseUrl ? `${tsconfig.baseUrl}/` : ''}${target}${rest}`
      return relative(root, resolve(root, prefixed)).replace(/\\/g, '/').replace(/\/index$/, '')
    }
  }
  return null
}

/**
 * Resolve a bare import specifier against tsconfig baseUrl when the target exists on disk.
 */
function resolveBaseUrl(spec, root, baseUrl) {
  if (!baseUrl || spec.startsWith('.') || spec.startsWith('/')) return null
  const mod = spec.replace(/\.(tsx?|jsx?|mjs|cjs)$/, '')
  for (const cand of [`${baseUrl}/${mod}`, `${baseUrl}/${mod}/index`]) {
    for (const ext of ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']) {
      const rel = `${cand}${ext}`.replace(/^\.\//, '')
      if (existsSync(join(root, rel))) {
        return rel.replace(/\/index\.(tsx?|jsx?|mjs|cjs)$/, '').replace(/\.(tsx?|jsx?|mjs|cjs)$/, '')
      }
    }
  }
  return null
}

/** Extract the extensionless file base name. */
function baseName(p) {
  const b = p.split('/').pop()
  return b.replace(/\.(tsx?|jsx?|mjs|cjs)$/, '')
}

const args = parseArgs(process.argv.slice(2))
if (args.help) {
  help()
  process.exit(0)
}
if (!existsSync(args.root)) {
  console.error(`root not found: ${args.root}`)
  process.exit(2)
}

const gitignore = loadGitignore(args.root)
const tsconfig = loadTsconfig(args.root)
if (tsconfig.paths.length) console.error(`scan.mjs: tsconfig paths: ${tsconfig.paths.map((p) => p.prefix).join(', ')}`)
const files = walk(args.root, args, gitignore)
if (files.length > args.maxFiles) {
  console.error(`over budget: ${files.length} files > --max-files ${args.maxFiles}; narrow --include/--exclude`)
  process.exit(3)
}

const elements = []
for (const full of files) {
  const rel = relative(args.root, full).replace(/\\/g, '/')
  let symbols = [], imports = [], srcText = ''
  try {
    srcText = readFileSync(full, 'utf8')
    ;({ imports, symbols } = extractTs(srcText, rel))
  } catch { /* unreadable -> bare record */ }
  const mod = toModuleName(args.root, full)
  const aliasImports = []
  for (const spec of imports) {
    if (spec.startsWith('.')) continue
    const resolved = resolveAlias(spec, tsconfig, args.root) || resolveBaseUrl(spec, args.root, tsconfig.baseUrl)
    if (resolved) aliasImports.push({ from: spec, to: resolved })
  }
  // Barrel files re-export other modules (e.g. `export * from`, `export { ... } from`, `export * as ... from`).
  // Flag them so labeling can drop the shim and wire imports straight to the implementation.
  const strippedCode = srcText.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '').trim()
  const barrelRe = /export\s+(?:type\s+)?(?:\*(?:\s+as\s+[\w$]+)?|\{([^}]*)\})\s*from\s+['"]([^'"]+)['"];?/g
  const targets = []
  const remaining = strippedCode.replace(barrelRe, (match, braceContent, spec) => {
    if (match.startsWith('export type')) return ''
    if (braceContent) {
      const items = braceContent.split(',').map((s) => s.trim()).filter(Boolean)
      if (items.length > 0 && items.every((s) => s.startsWith('type ') || s.startsWith('type\t'))) return ''
    }
    targets.push(spec)
    return ''
  }).trim()
  const barrelTargets = targets.length > 0 && remaining === '' ? targets : null
  elements.push({
    file: rel,
    lang: 'ts',
    module: mod,
    title: baseName(rel),
    symbol: null,
    line: 1,
    parent: null,
    rawImports: imports.filter((s) => s.startsWith('.')),
    rawDepCount: imports.length,
    rawAllImports: imports,
    aliasImports,
    barrelTargets: barrelTargets || undefined,
  })
  const seen = new Set()
  const keepKind = (kind) => !args.noSymbols && (!args.symbolKinds || args.symbolKinds.includes(kind))
  for (const s of symbols) {
    if (seen.has(s.name)) continue
    seen.add(s.name)
    if (!keepKind(s.kind)) continue
    elements.push({
      file: rel,
      lang: 'ts',
      module: `${mod}.${s.name}`,
      title: s.name,
      symbol: s.name,
      symbolKind: s.kind,
      line: s.line,
      parent: rel,
      rawImports: [],
      rawDepCount: 0,
      rawAllImports: [],
      route: s.route ?? null,
      extends: [],
      calls: [],
    })
  }
}

/** Quickly check whether the repository contains any non-ignored Python files. */
function hasPyFiles(root, o, gitignore) {
  const stack = [root]
  while (stack.length) {
    const dir = stack.pop()
    let entries
    try {
      entries = readdirSync(dir)
    } catch {
      continue
    }
    for (const e of entries) {
      const full = join(dir, e)
      const rel = relative(root, full).replace(/\\/g, '/')
      let st
      try {
        st = lstatSync(full)
      } catch {
        continue
      }
      if (st.isSymbolicLink()) continue
      if (st.isDirectory()) {
        if (!excluded(rel, DEFAULT_IGNORE_DIRS, gitignore, o.exclude, true)) stack.push(full)
      } else if (e.endsWith('.py') && !excluded(rel, DEFAULT_IGNORE_DIRS, gitignore, o.exclude)) {
        if (o.include.length) {
          const matched = o.include.some((g) => {
            const rx = globToRegExp(g)
            return rx.test(rel) || rx.test(e)
          })
          if (!matched) continue
        }
        if (o.includeTests || !TEST_RE.test(rel)) return true
      }
    }
  }
  return false
}

// Single spawn of scan.py for Python (skipped for TS/JS-only repos).
const pyElements = []
const scanPy = join(HERE, 'scan.py')
let pyBudgetExceeded = false
if (!hasPyFiles(args.root, args, gitignore)) {
  console.error('scan.mjs: no Python files, skipping scan.py')
} else {try {
    const remainingBudget = Math.max(0, args.maxFiles - files.length)
    const r = spawnSync('python3', [
      scanPy,
      '--root',
      args.root,
      '--max-files',
      String(remainingBudget),
      ...args.include.flatMap((g) => ['--include', g]),
      ...(args.includeTests ? ['--include-tests'] : []),
      ...(args.noSymbols ? ['--no-symbols'] : []),
      ...(args.symbolKinds ? ['--symbol-kinds', args.symbolKinds.join(',')] : []),
      ...args.exclude.flatMap((e) => ['--exclude', e]),
    ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    if (r.status !== 0) {
      if (r.status === 3) pyBudgetExceeded = true
      console.error(`scan.py failed (continuing with TS/JS only): ${(r.stderr || '').slice(0, 500)}`)
    } else if (r.stdout.trim()) {
      const parsed = JSON.parse(r.stdout)
      const list = Array.isArray(parsed) ? parsed : parsed.elements ?? []
      for (const e of list) {
        if (excluded(e.file || '', DEFAULT_IGNORE_DIRS, gitignore, args.exclude)) continue
        if (args.include.length) {
          const rel = e.file || ''
          const base = rel.split('/').pop()
          const matched = args.include.some((g) => {
            const rx = globToRegExp(g)
            return rx.test(rel) || rx.test(base)
          })
          if (!matched) continue
        }
        if (!args.includeTests && TEST_RE.test(e.file || '')) continue
        pyElements.push(e)
      }
    }
  } catch (e) {
    console.error(`scan.py spawn failed (continuing with TS/JS only): ${String(e).slice(0, 200)}`)
  }}

// P2b: infra + actor proposals (stdlib only, YAML via line-regex — no pyyaml dep).
// Never auto-added to the model; the labeling step promotes/drops each.
const LIB_SIGNALS = [
  ['aiokafka', 'container', 'Kafka Message Broker', 'Apache Kafka'],
  ['mlflow', 'container', 'MLflow Tracking Server', 'MLflow'],
  ['prometheus_client', 'container', 'Prometheus', 'Prometheus TSDB'],
  ['boto3', 'database', 'S3 Artifact Store', 'S3'],
  ['psycopg2', 'database', 'Postgres Database', 'PostgreSQL'],
  ['sqlalchemy', 'database', 'Relational Database', 'SQL'],
  ['redis', 'database', 'Redis Cache', 'Redis'],
  ['celery', 'container', 'Task Queue Workers', 'Celery'],
  ['mongoose', 'database', 'MongoDB', 'MongoDB'],
  ['typeorm', 'database', 'SQL Database', 'TypeORM'],
  ['prisma', 'database', 'SQL Database', 'Prisma'],
]
/** Detect infrastructure containers, external actors, and client-lib proposals from repo manifests. */
function scanInfra(root, o, gitignore, allImports, routes) {
  const proposals = []
  const seenTitles = new Set()
  const push = (p) => {
    if (!seenTitles.has(p.title)) {
      seenTitles.add(p.title)
      proposals.push(p)
    }
  }
  // 1. k8s manifests + compose + prometheus configs via line-regex.
  // Start at the repo root only: seeded subdirectories bypass --exclude and
  // .gitignore and would count each file twice.
  const stack = [root]
  const yamlFiles = []
  while (stack.length) {
    const dir = stack.pop()
    let entries
    try {
      entries = readdirSync(dir)
    } catch {
      continue
    }
    for (const e of entries) {
      const full = join(dir, e)
      const rel = relative(root, full).replace(/\\/g, '/')
      let st
      try {
        st = lstatSync(full)
      } catch {
        continue
      }
      if (st.isSymbolicLink()) continue
      if (st.isDirectory()) { if (!excluded(rel, DEFAULT_IGNORE_DIRS, gitignore, o.exclude, true)) stack.push(full) }
      else if (/\.(ya?ml)$/.test(e) && !excluded(rel, DEFAULT_IGNORE_DIRS, gitignore, o.exclude)) {
        yamlFiles.push({ full, rel })
      }
    }
  }
  for (const { full, rel } of yamlFiles.slice(0, 200)) {
    let src
    try {
      src = readFileSync(full, 'utf8')
    } catch {
      continue
    }
    const kind = (/^kind:\s*(\S+)/m.exec(src) || [])[1]
    const name = (/^metadata:\s*\n(?:.*\n)*?^\s*name:\s*(\S+)/m.exec(src) || [])[1]
    const image = (/image:\s*(\S+)/m.exec(src) || [])[1]
    if (/prometheus\.ya?ml$/.test(rel)) {
      const jobs = [...src.matchAll(/job_name:\s*['"]?([\w-]+)['"]?/g)].map((m) => m[1])
      for (const j of jobs) {
        push({
          kind: 'container',
          title: `Prometheus job ${j}`,
          technology: 'Prometheus',
          source: rel,
          reason: `prometheus scrape job ${j}`,
        })
      }
      push({
        kind: 'container',
        title: 'Prometheus',
        technology: 'Prometheus TSDB',
        source: rel,
        reason: 'prometheus scrape config',
      })
    } else if (kind && name && /Deployment|StatefulSet|DaemonSet|Service/.test(kind)) {
      push({
        kind: kind === 'Service' ? 'container' : 'container',
        title: name,
        technology: image || kind,
        source: rel,
        reason: `k8s ${kind} ${name}`,
      })
    } else if (/docker-compose|compose\.ya?ml/.test(rel) && /(^|\n)services:/.test(src)) {
      // Only the top-level `services:` block: volumes/networks sections list
      // similarly-indented names that are not runnable services.
      const names = []
      const lines = src.split('\n')
      let inServices = false
      for (const line of lines) {
        if (/^services:\s*$/.test(line)) {
          inServices = true
          continue
        }
        if (inServices && /^[^ \t#]/.test(line)) break // next top-level key
        const s = inServices && /^ {2}([\w][\w-]*):\s*(#.*)?$/.exec(line)
        if (s) names.push(s[1])
      }
      for (const name of names) {
        if (/[-_]data$/.test(name)) continue // named volumes, not services
        push({
          kind: 'container',
          title: name,
          technology: 'Docker Compose service',
          source: rel,
          reason: `compose service ${name}`,
        })
      }
    }
  }
  // 2. Client-library signals from collected imports.
  const libs = new Set(allImports.map((s) => s.split('.')[0].split('/').pop()))
  for (const [lib, kind, title, tech] of LIB_SIGNALS) {
    if (libs.has(lib)) {
      push({ kind, title, technology: tech, source: `client-lib:${lib}`, reason: `code imports ${lib}` })
    }
  }
  // 3. HTTP routes imply an external client actor (promote/drop at labeling).
  if (routes.length) {
    push({
      kind: 'person',
      title: 'Client',
      technology: '',
      source: routes[0].file,
      reason: `HTTP routes detected (${routes.length}, e.g. ${routes[0].route})`,
    })
  }
  return { proposals, yamlFiles: yamlFiles.length }
}

// Merge: file parents + symbol children; emit.mjs assigns final FQNs.
const tsAllImports = elements.flatMap((e) => e.rawAllImports ?? [])
const routes = [
  ...elements.filter((e) => e.route).map((e) => ({ route: e.route, file: e.file })),
  ...pyElements.filter((e) => e.route).map((e) => ({ route: e.route, file: e.file })),
]
const { proposals, yamlFiles } = scanInfra(args.root, args, gitignore, [
  ...tsAllImports,
  ...pyElements.flatMap((e) => e.rawImports ?? []),
], routes)
const out = {
  elements: [
    ...elements.map((e) => ({
      fqn: '',
      kind: 'component',
      title: e.title,
      file: e.file,
      lang: 'ts',
      symbol: e.symbol ?? null,
      symbolKind: e.symbolKind ?? null,
      line: e.line ?? 1,
      parent: e.parent ?? null,
      route: e.route ?? null,
      imports: [],
      calls: e.calls ?? [],
      extends: e.extends ?? [],
      technology: '',
      tags: ['autogenerated'],
      _module: e.module,
      _rawImports: e.rawImports,
      aliasImports: e.aliasImports ?? [],
      ...(e.barrelTargets ? { barrelTargets: e.barrelTargets } : {}),
    })),
    ...pyElements.map((e) => ({
      fqn: '',
      kind: 'component',
      title: e.title,
      file: e.file,
      lang: 'py',
      symbol: e.symbol ?? null,
      symbolKind: e.symbolKind ?? null,
      line: e.line ?? 1,
      parent: e.parent ?? null,
      route: e.route ?? null,
      imports: [],
      calls: e.calls ?? [],
      extends: e.extends ?? [],
      technology: '',
      tags: ['autogenerated'],
      _module: e.module ?? e.file,
      _rawImports: e.rawImports ?? [],
    })),
  ],
  proposals,
}

const json = JSON.stringify(out, null, 2)
if (args.out === '-' || !args.out) process.stdout.write(json + '\n')
else (await import('node:fs')).writeFileSync(args.out, json)
if (pyBudgetExceeded) process.exitCode = 3
console.error(
  `scan.mjs: ${files.length} ts/js files + ${yamlFiles} yaml -> ${args.out}; proposals: ${proposals.length}`,
)
