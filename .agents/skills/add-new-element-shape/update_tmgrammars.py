#!/usr/bin/env python3
"""
Update all three LikeC4 TextMate grammar files to include a new element shape.

Usage:
    python3 update_tmgrammars.py <shape_name>

Example:
    python3 update_tmgrammars.py hexagon

This script finds the shapes regex pattern in each tmLanguage.json file and
adds the new shape to the alternation. It inserts after 'rectangle' by default,
keeping the pattern organized.
"""

import json
import re
import sys
from pathlib import Path

TMGRAMMAR_FILES = [
    "packages/vscode/likec4.tmLanguage.json",
    "apps/playground/likec4.tmLanguage.json",
    "apps/docs/likec4.tmLanguage.json",
]

# The regex pattern that matches shape keywords in tmLanguage files.
# It looks like: \b(rectangle|person|browser|...)\\b
SHAPES_PATTERN = re.compile(
    r"\\\\b\(([^)]+)\)\\\\b"
)


def find_repo_root() -> Path:
    """Walk up from cwd to find the repo root (has package.json with 'likec4')."""
    current = Path.cwd()
    for parent in [current, *current.parents]:
        pkg = parent / "package.json"
        if pkg.exists() and "likec4" in pkg.read_text().lower():
            return parent
    # Fallback: try common locations
    for candidate in [Path("/home/claude/likec4"), Path("/repo"), Path.cwd()]:
        if (candidate / "package.json").exists():
            return candidate
    print("ERROR: Could not find LikeC4 repo root. Run from within the repo.", file=sys.stderr)
    sys.exit(1)


def update_tmgrammar(filepath: Path, shape: str) -> bool:
    """
    Update a single tmLanguage.json file to include the new shape.
    Returns True if the file was modified, False if shape already exists.
    """
    text = filepath.read_text(encoding="utf-8")

    # Check if shape already present
    if re.search(rf"\b{re.escape(shape)}\b", text):
        print(f"  SKIP {filepath.name} — '{shape}' already present")
        return False

    # Find and update the shapes pattern
    # We look for the pattern that matches shape keywords
    # The pattern in JSON looks like: "\\b(rectangle|person|...)\\b"
    # We insert the new shape after 'rectangle'
    def add_shape(match):
        full_match = match.group(0)
        shapes_str = match.group(1)
        shapes = [s.strip() for s in shapes_str.split("|")]

        # Only modify if this looks like the shapes pattern (has known shape keywords)
        known_shapes = {"rectangle", "person", "browser", "mobile", "cylinder", "storage", "queue"}
        if len(known_shapes & set(shapes)) < 3:
            return full_match

        if shape in shapes:
            return full_match

        # Insert after 'rectangle'
        idx = shapes.index("rectangle") if "rectangle" in shapes else 0
        shapes.insert(idx + 1, shape)

        return full_match.replace(match.group(1), "|".join(shapes))

    new_text = SHAPES_PATTERN.sub(add_shape, text)

    if new_text == text:
        # Try a more lenient pattern for JSON-escaped regex
        # Some files may use single backslash escaping
        alt_pattern = re.compile(r"\\b\(([^)]+)\)\\b")
        new_text = alt_pattern.sub(add_shape, text)

    if new_text == text:
        print(f"  WARN {filepath.name} — could not find shapes pattern to update", file=sys.stderr)
        return False

    filepath.write_text(new_text, encoding="utf-8")
    print(f"  OK   {filepath.name} — added '{shape}'")
    return True


def main():
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <shape_name>", file=sys.stderr)
        sys.exit(1)

    shape = sys.argv[1].lower().strip()

    # Validate shape name
    if not shape.isalpha():
        print(f"ERROR: Shape name must be a single lowercase word (got '{shape}')", file=sys.stderr)
        sys.exit(1)

    root = find_repo_root()
    print(f"Repo root: {root}")
    print(f"Adding shape: '{shape}' to tmLanguage files\n")

    modified = 0
    errors = 0

    for relpath in TMGRAMMAR_FILES:
        filepath = root / relpath
        if not filepath.exists():
            print(f"  MISS {relpath} — file not found", file=sys.stderr)
            errors += 1
            continue
        try:
            if update_tmgrammar(filepath, shape):
                modified += 1
        except Exception as e:
            print(f"  ERR  {relpath} — {e}", file=sys.stderr)
            errors += 1

    print(f"\nDone: {modified} files updated, {errors} errors")
    if errors > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
