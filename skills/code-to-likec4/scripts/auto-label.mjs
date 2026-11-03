#!/usr/bin/env node
// auto-label.mjs — best-effort deterministic labeling for `discover.sh quick`.
// Fills titles (prettified), wires imports (relative + alias + through barrels),
// promotes all proposals. Titles are raw, nothing is pruned: for curated
// diagrams, label manually instead (see references/ir-schema.md).
// Stdlib only. Usage: node auto-label.mjs --in <ir.json> --out <labeled.json> --system <name>
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'
import { sanitize } from './emit.mjs'

function parseArgs(argv) {
  const o = { in: '', out: '', system: 'cloud', keepSymbols: null }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--in') o.in = argv[++i]
    else if (argv[i] === '--out') o.out = argv[++i]
    else if (argv[i] === '--system') o.system = argv[++i]
    else if (argv[i] === '--drop-symbols') o.keepSymbols = ['route']
    else if (argv[i] === '--keep-symbols') {
      o.keepSymbols = String(argv[++i]).split(',').map((s) => s.trim()).filter(Boolean)
    }
    else if (argv[i] === '-h' || argv[i] === '--help') {
      console.log(
        'Usage: node auto-label.mjs --in <ir.json> --out <labeled.json> --system <name> [--drop-symbols | --keep-symbols <csv>]',
      )
      console.log('  --drop-symbols: file-level + routes only (shorthand for --keep-symbols route).')
      console.log('  --keep-symbols <csv>: keep only these symbolKinds (e.g. route,class).')
      process.exit(0)
    }
  }
  if (!o.in || !o.out) {
    console.error('auto-label.mjs: --in and --out required')
    process.exit(2)
  }
  return o
}

const pretty = (s) =>
  String(s || '').replace(/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS) /, '')
    .replace(/[-_]/g, ' ').split(' ').filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ') || 'Unnamed'
const areaOf = (f) => {
  const p = String(f || '').split('/')
  return p.length > 1 ? sanitize(p[0]) : 'app'
}
const fileLeaf = (f) => sanitize(String(f || '').split('/').pop().split('.')[0])
const autoFqn = (sys, f, symbol) =>
  `${sanitize(sys)}.${areaOf(f)}.${fileLeaf(f)}${symbol ? `.${sanitize(symbol)}` : ''}`

// NOTE: mirrors emit.mjs default FQN assignment (structural leaves) so wired
// targets resolve to what emit declares. If emit defaults change, update here.
function resolveRel(fromFile, spec, exists) {
  if (!spec.startsWith('.')) return null
  const base = normalize(join(dirname(fromFile), spec)).replace(/\\/g, '/')
  for (
    const cand of [
      base,
      `${base}.py`,
      `${base}.js`,
      `${base}.ts`,
      `${base}/index.py`,
      `${base}/index.js`,
      `${base}/index.ts`,
    ]
  ) {
    if (exists(cand)) return cand
  }
  return null
}

const args = parseArgs(process.argv.slice(2))
const ir = JSON.parse(readFileSync(args.in, 'utf8'))
let elements = ir.elements ?? []
if (args.keepSymbols) {
  const keep = new Set(args.keepSymbols)
  const kindOf = (e) => e.symbolKind || (e.route ? 'route' : '')
  const before = elements.length
  elements = elements.filter((e) => !e.symbol || keep.has(kindOf(e)))
  console.error(
    `auto-label.mjs: dropped ${before - elements.length} symbol elements (keep: ${
      args.keepSymbols.join(',') || 'none'
    })`,
  )
}
const byFile = new Map()
for (const e of elements) if (!e.symbol && !byFile.has(e.file)) byFile.set(e.file, e)

const realCache = new Map()
function realTargets(file, seen = new Set()) {
  if (realCache.has(file)) return realCache.get(file)
  const rec = byFile.get(file)
  const out = []
  if (rec?.barrelTargets && !seen.has(file)) {
    seen.add(file)
    for (const spec of rec.barrelTargets) {
      const r = resolveRel(file, spec, (c) => byFile.has(c))
      if (r) out.push(...realTargets(r, seen))
    }
  }
  const res = out.length ? out : [file]
  realCache.set(file, res)
  return res
}

const fq = new Map()
for (const e of elements) fq.set(e, e.fqn || autoFqn(args.system, e.file, e.symbol))
const fileFqn = new Map()
for (const e of elements) if (!e.symbol && !fileFqn.has(e.file)) fileFqn.set(e.file, fq.get(e))

for (const e of elements) {
  if (!e.title) e.title = pretty(e.symbol || fileLeaf(e.file))
  const seen = new Set((e.imports || []).map((r) => (typeof r === 'string' ? r : r.to)))
  const wire = (file) => {
    for (const real of realTargets(file)) {
      const to = fileFqn.get(real)
      if (to && to !== fq.get(e) && !seen.has(to)) {
        seen.add(to)
        e.imports.push(to)
      }
    }
  }
  for (const spec of e._rawImports || []) {
    const hit = resolveRel(e.file, spec, (c) => fileFqn.has(c))
    if (hit) wire(hit)
  }
  for (const a of e.aliasImports || []) {
    const mod = a.to
    for (
      const cand of [`${mod}.py`, `${mod}.js`, `${mod}.ts`, `${mod}/index.py`, `${mod}/index.js`, `${mod}/index.ts`]
    ) {
      if (fileFqn.has(cand)) {
        wire(cand)
        break
      }
    }
  }
  delete e._module
  delete e._rawImports
  delete e.barrelTargets
}

// Promote every proposal as-is (best-effort: no LLM triage in quick mode).
for (const p of ir.proposals || []) {
  elements.push({
    fqn: p.kind === 'person' ? sanitize(p.title || 'actor') : '',
    kind: p.kind,
    title: p.title,
    file: p.source || '',
    lang: '',
    technology: p.technology || '',
    tags: ['autogenerated'],
    imports: [],
    calls: [],
    extends: [],
  })
}

if (elements.length > 200) {
  console.error(`auto-label.mjs: warning: ${elements.length} elements > 200 default cap (nothing pruned in quick mode)`)
}
writeFileSync(args.out, JSON.stringify({ elements }, null, 2))
console.error(`auto-label.mjs: ${elements.length} elements -> ${args.out}`)
