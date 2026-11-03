#!/usr/bin/env python3
"""scan.py — python3 stdlib only. Walks .py files, uses ast, resolves relative imports, prints JSON."""
import argparse
import ast
import fnmatch
import json
import os
import re
import sys

IGNORE_DIRS = {"node_modules", "dist", "build", ".venv", "__pycache__", ".git", "coverage"}
TEST_PATH_PARTS = (".test.", ".spec.", "__tests__")
TEST_PATH_RES = (r"(^|/)tests?/",)


def is_test(path: str) -> bool:
    p = path.replace(os.sep, "/")
    if any(t in p for t in TEST_PATH_PARTS):
        return True
    if any(re.search(rx, p) for rx in TEST_PATH_RES):
        return True
    base = os.path.basename(p)
    return base.startswith("test_") or base.endswith(("_test.py", "_tests.py"))


def load_gitignore(root: str):
    p = os.path.join(root, ".gitignore")
    if not os.path.exists(p):
        return []
    out = []
    with open(p, encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and not line.startswith("!"):
                out.append(line)
    return out


def ignore_match(rel: str, is_dir: bool, patterns) -> bool:
    """Approximate gitignore matching (root .gitignore only, no negation).
    Segment rules instead of substring: `data/` matches only a directory
    segment named `data` (never `database.py`); bare `dist` matches any
    segment; patterns with `/` match against the whole relative path.
    """
    rel = rel.replace(os.sep, "/").strip("/")
    if not rel or rel == ".":
        return False
    segs = rel.split("/")
    for pat in patterns:
        if not pat:
            continue
        if "/" not in pat.strip("/"):
            # Bare name (optional trailing `/` = dir-only): match path segments,
            # never substrings. A dir-only pattern ignores a file only via a
            # PARENT segment (`data/` must not kill `database.py`).
            name = pat.strip("/")
            scope = segs if (is_dir or not pat.endswith("/")) else segs[:-1]
            if any(fnmatch.fnmatchcase(s, name) for s in scope):
                return True
        else:
            p = pat.rstrip("/")
            if fnmatch.fnmatchcase(rel, p):
                return True
            if pat.endswith("/") and (rel == p or rel.startswith(p + "/")):
                return True
            if pat.endswith("/") and any(fnmatch.fnmatchcase(s, p) for s in segs):
                return True
    return False


def iter_py(root: str, gitignore, include_tests: bool, max_files: int):
    files = []
    for dirpath, dirnames, filenames in os.walk(root, followlinks=False):
        dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRS and not ignore_match(
            os.path.relpath(os.path.join(dirpath, d), root), True, gitignore)]
        for fn in filenames:
            if not fn.endswith(".py"):
                continue
            full = os.path.join(dirpath, fn)
            rel = os.path.relpath(full, root)
            if ignore_match(rel, False, gitignore):
                continue
            if not include_tests and is_test(rel):
                continue
            files.append(full)
            if len(files) > max_files:
                return files
    return files


def module_of(root: str, full: str) -> str:
    rel = os.path.relpath(full, root).replace(os.sep, "/")
    if rel.endswith("__init__.py"):
        rel = os.path.dirname(rel)
    else:
        rel = rel[: -len(".py")]
    return rel.replace("/", ".")


def resolve_relative(current_module: str, is_pkg: bool, level: int, name: str | None) -> str:
    """Resolve `from .x import` to dotted module path (best-effort, deterministic)."""
    if level == 0:
        return name or ""
    parts = current_module.split(".")
    base = parts if is_pkg else parts[:-1]
    if level - 1 <= len(base):
        base = base[: len(base) - (level - 1)]
    else:
        base = []
    if name:
        base = base + [name]
    return ".".join(base)


ROUTE_METHODS = {"get", "post", "put", "delete", "patch", "head", "options"}


def route_of(node) -> str | None:
    """Return the route path if a function is a FastAPI/Flask-style route handler."""
    for dec in getattr(node, "decorator_list", []):
        if isinstance(dec, ast.Call) and isinstance(dec.func, ast.Attribute):
            if dec.func.attr in ROUTE_METHODS and dec.args:
                first = dec.args[0]
                if isinstance(first, ast.Constant) and isinstance(first.value, str):
                    return f"{dec.func.attr.upper()} {first.value}"
    return None


def _direct_calls(node) -> list:
    """Names called in a function body, pruning nested scopes (single pass)."""
    names = []
    stack = list(ast.iter_child_nodes(node))
    while stack:
        child = stack.pop()
        if isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef, ast.Lambda)):
            continue  # nested scopes belong to their own symbol, not this one
        if isinstance(child, ast.Call):
            f = child.func
            if isinstance(f, ast.Name):
                names.append(f.id)
            elif isinstance(f, ast.Attribute):
                names.append(f.attr)
        stack.extend(ast.iter_child_nodes(child))
    return sorted(set(names))


def called_names(node) -> list:
    """Names called inside a function body (for same-file inproc edges)."""
    return _direct_calls(node)


def call_map(tree) -> dict:
    """One pass per file: top-level function name -> called names."""
    return {n.name: _direct_calls(n) for n in tree.body
            if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))}


def scan_file(root: str, full: str, no_symbols: bool = False, symbol_kinds=None):
    """Return a list: one file-parent record plus one record per symbol (class/function/route).

    no_symbols / symbol_kinds filter symbol children (file parent always kept):
    file-level granularity for large repos where per-function nodes flood the
    diagram. symbol_kinds is a subset of {"class", "function", "route"}.
    """
    keep = None if symbol_kinds is None else set(symbol_kinds)
    if no_symbols and keep is None:
        keep = set()
    rel = os.path.relpath(full, root).replace(os.sep, "/")
    try:
        with open(full, encoding="utf-8", errors="replace") as f:
            src = f.read()
        tree = ast.parse(src, filename=rel)
    except SyntaxError as e:
        print(f"scan.py: syntax error in {rel}: {e}", file=sys.stderr)
        return None
    mod = module_of(root, full)
    is_pkg = os.path.basename(full) == "__init__.py"
    base = os.path.splitext(os.path.basename(full))[0]
    raw_imports = []
    calls_by_func = call_map(tree)
    symbols = []  # (name, kind, lineno, extends, calls, route)
    for node in tree.body:
        if isinstance(node, ast.ClassDef):
            ext = []
            for b in node.bases:
                if isinstance(b, ast.Name):
                    ext.append(b.id)
                elif isinstance(b, ast.Attribute):
                    ext.append(b.attr)
            symbols.append((node.name, "class", node.lineno, ext, [], None))
        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            symbols.append((node.name, "route" if route_of(node) else "function",
                            node.lineno, [], calls_by_func.get(node.name, []), route_of(node)))
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for a in node.names:
                raw_imports.append(a.name)
        elif isinstance(node, ast.ImportFrom):
            if node.level and node.level > 0:
                raw_imports.append(resolve_relative(mod, is_pkg, node.level, node.module))
            elif node.module:
                raw_imports.append(node.module)
    records = [{
        "file": rel, "lang": "py", "module": mod,
        "title": base, "symbol": None, "line": 1, "parent": None,
        "rawImports": sorted(set(r for r in raw_imports if r)),
        "extends": [], "calls": [], "route": None,
    }]
    for name, kind, lineno, ext, calls, route in symbols:
        if keep is not None and kind not in keep:
            continue
        records.append({
            "file": rel, "lang": "py", "module": f"{mod}.{name}",
            "title": name, "symbol": name, "symbolKind": kind,
            "line": lineno, "parent": rel,
            "rawImports": [], "extends": ext, "calls": calls, "route": route,
        })
    return records


def main() -> int:
    ap = argparse.ArgumentParser(description="scan.py — Python AST scanner to JSON")
    ap.add_argument("--root", default=".")
    ap.add_argument("--out", default="-")
    ap.add_argument("--max-files", type=int, default=2000)
    ap.add_argument("--include-tests", action="store_true")
    ap.add_argument("--exclude", action="append", default=[],
                    help="repeatable glob patterns merged with default ignores")
    ap.add_argument("--no-symbols", action="store_true",
                    help="file-level only: skip class/function symbols")
    ap.add_argument("--symbol-kinds", default=None,
                    help="comma list of symbol kinds to keep (subset of class,function,route)")
    args = ap.parse_args()
    kinds = None
    if args.symbol_kinds is not None:
        kinds = {k.strip() for k in args.symbol_kinds.split(",") if k.strip()}
    elif args.no_symbols:
        kinds = set()
    gitignore = load_gitignore(args.root)
    gitignore = gitignore + list(args.exclude)  # glob-capable, merged with defaults
    files = iter_py(args.root, gitignore, args.include_tests, args.max_files)
    if len(files) > args.max_files:
        print(f"over budget: {len(files)} files > --max-files {args.max_files}", file=sys.stderr)
        return 3
    elements = []
    for full in files:
        recs = scan_file(args.root, full, symbol_kinds=kinds)
        if recs is not None:
            elements.extend(recs)
    payload = json.dumps({"elements": elements}, indent=2)
    if args.out == "-":
        print(payload)
    else:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(payload)
    print(f"scan.py: {len(files)} files, {len(elements)} records -> {args.out}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
