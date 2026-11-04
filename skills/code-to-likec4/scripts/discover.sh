#!/usr/bin/env bash
# discover.sh — one entry point for code-to-likec4.
#   discover.sh scan --root <repo> --out /tmp/ir.json [--exclude docs ...]
#     scan flags: --no-symbols | --symbol-kinds <csv> for file-level granularity
#   discover.sh emit --in /tmp/ir.labeled.json --out ./generated --system <name>
#     emit flags: --drop-symbols (file-level + routes safety net)
#   discover.sh quick --root <repo> --out ./generated --system <name> [--exclude ...]
#     [--granularity file|full] (default full)
#     one-liner: scan -> best-effort auto-label -> emit -> validate.
#     --granularity file keeps file-level elements + route handlers only;
#     use it when the model has too many elements (helpers like pad2/sleep
#     flood the diagram). Titles are raw and all proposals are promoted;
#     for curated diagrams, run scan/emit separately with manual labeling
#     in between.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
SKILL="$(cd "$HERE/.." && pwd)"

cmd="${1:-}"; shift || true
case "$cmd" in
  scan)
    node "$SKILL/scripts/scan.mjs" "$@"
    ;;
  emit)
    IN=""; OUT=""; SYSTEM="cloud"; REST=()
    while [ $# -gt 0 ]; do
      case "$1" in
        --in) IN="$2"; shift 2;;
        --out) OUT="$2"; shift 2;;
        --system) SYSTEM="$2"; shift 2;;
        *) REST+=("$1"); shift;;
      esac
    done
    node "$SKILL/scripts/emit.mjs" --in "$IN" --out "$OUT" --system "$SYSTEM" --check ${REST[@]+"${REST[@]}"}
    if command -v likec4 >/dev/null 2>&1; then
      LIKEC4=(likec4)
    elif command -v npx >/dev/null 2>&1; then
      LIKEC4=(npx -y likec4@1)
    else
      echo "discover.sh: likec4 CLI not found, skipping validate (emit self-check only)" >&2
      exit 0
    fi
    "${LIKEC4[@]}" validate --no-layout --json "$OUT" | tee "$OUT/.validate.json" | \
      node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const r=JSON.parse(s);if(!r.valid||r.stats.filteredErrors!==0){console.error('VALIDATION FAILED');process.exit(1)}console.log('validate: OK (filteredErrors=0)')})"
    ;;
  -h|--help|help|"")
    sed -n '2,14p' "$0"
    ;;
  quick)
    ROOT=""; OUT=""; SYSTEM="cloud"; GRANULARITY="full"; REST=()
    while [ $# -gt 0 ]; do
      case "$1" in
        --root) ROOT="$2"; shift 2;;
        --out) OUT="$2"; shift 2;;
        --system) SYSTEM="$2"; shift 2;;
        --granularity) GRANULARITY="$2"; shift 2;;
        *) REST+=("$1"); shift;;
      esac
    done
    if [ -z "$ROOT" ] || [ -z "$OUT" ]; then echo "quick: --root and --out required" >&2; exit 2; fi
    case "$GRANULARITY" in
      full) SCAN_GRAN=(); LABEL_GRAN=(); EMIT_GRAN=();;
      file) SCAN_GRAN=(--symbol-kinds route); LABEL_GRAN=(--keep-symbols route); EMIT_GRAN=(--drop-symbols);;
      *) echo "quick: --granularity must be file|full (got $GRANULARITY)" >&2; exit 2;;
    esac
    TMP_IR="$(mktemp "${TMPDIR:-/tmp}/discover-ir.XXXXXX")"
    TMP_LABELED="$(mktemp "${TMPDIR:-/tmp}/discover-labeled.XXXXXX")"
    trap 'rm -f "$TMP_IR" "$TMP_LABELED"' EXIT
    node "$SKILL/scripts/scan.mjs" --root "$ROOT" --out "$TMP_IR" ${SCAN_GRAN[@]+"${SCAN_GRAN[@]}"} ${REST[@]+"${REST[@]}"}
    node "$SKILL/scripts/auto-label.mjs" --in "$TMP_IR" --out "$TMP_LABELED" --system "$SYSTEM" ${LABEL_GRAN[@]+"${LABEL_GRAN[@]}"}
    "$0" emit --in "$TMP_LABELED" --out "$OUT" --system "$SYSTEM" ${EMIT_GRAN[@]+"${EMIT_GRAN[@]}"}
    ;;
  *)
    echo "unknown command: $cmd (try: scan, emit, quick)" >&2; exit 2;;
esac
