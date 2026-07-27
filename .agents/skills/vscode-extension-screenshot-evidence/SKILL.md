---
name: vscode-extension-screenshot-evidence
description: Use when a LikeC4 PR or bug investigation needs real before/after screenshots from the actual VS Code extension or VS Code webview preview. Trigger for VS Code preview rendering bugs, extension-only visual regressions, PR descriptions that require screenshots from VS Code, or requests to prove a VS Code fix visually without substituting browser-only screenshots.
---

# VS Code Extension Screenshot Evidence

Capture visual evidence from a real VS Code Extension Development Host. Use browser or Playwright screenshots only when the user explicitly asks for browser evidence; VS Code extension bugs need VS Code screenshots.

## Ground rules

- Capture the real VS Code UI with the extension loaded through `--extensionDevelopmentPath`.
- Use isolated temp user-data and extensions directories so local VS Code state does not affect the screenshot.
- Use `origin/main` or the PR base for "before" and the PR branch for "after".
- Keep screenshots and temporary fixtures out of the fix branch unless the user explicitly wants image assets committed.
- Visually inspect the captured images before adding them to a PR.
- Do not publish screenshots until you have confirmed they contain no secrets, usernames, home-directory paths, private tabs, unrelated files, or unrelated windows.
- Mention any hosting fallback used for images. GitHub `user-attachments` uploads require a browser `user_session` cookie or `GH_SESSION_TOKEN`; the normal `gh` token is not enough.

## Prerequisites

Check the tools before spending time on builds:

```bash
command -v code
command -v Xvfb
command -v xdotool
command -v import
command -v python3
command -v file
```

`import` is from ImageMagick. Always run the capture command under an isolated Xvfb display, even when `DISPLAY` is already set. Use an explicit screen size so the default 1280x900 window is not cropped:

```bash
xvfb-run -a -s "-screen 0 1280x1024x24" ...
```

The helper script refuses common live-desktop displays such as `:0` and `:1` unless `--allow-live-display` is passed for manual debugging. Do not use live-desktop captures as PR evidence unless you have cropped or redacted them.

## Build the extension under test

For LikeC4 preview changes, build both the preview package and the VS Code extension package in each worktree you capture:

```bash
pnpm generate
pnpm --filter @likec4/vscode-preview build
pnpm --filter likec4-vscode build
```

If you create a clean before worktree from `origin/main`, install dependencies only when `node_modules` are missing or stale.

## Create a minimal fixture

Keep the fixture focused on the visual behavior. For an icon-color regression, a single `.c4` file is enough:

```likec4
specification {
  element component {
    style {
      shape component
      icon bootstrap:file-earmark-code
      iconColor amber
    }
  }
}

model {
  component test 'Test'
}

views {
  view index {
    include *
  }
}
```

Store fixtures under `/tmp` unless they are intended to become committed tests.

## Capture before and after

Use the helper script from this skill:

```bash
SKILL=.agents/skills/vscode-extension-screenshot-evidence
FIXTURE=/tmp/likec4-vscode-screenshot-fixture
OUT=/tmp/likec4-vscode-screens

mkdir -p "$OUT"

xvfb-run -a -s "-screen 0 1280x1024x24" "$SKILL/scripts/capture-likec4-vscode-preview.sh" \
  --label before \
  --fixture "$FIXTURE" \
  --extension-path /tmp/likec4-before/packages/vscode \
  --output "$OUT/before-vscode.png"

xvfb-run -a -s "-screen 0 1280x1024x24" "$SKILL/scripts/capture-likec4-vscode-preview.sh" \
  --label after \
  --fixture "$FIXTURE" \
  --extension-path /path/to/pr-worktree/packages/vscode \
  --output "$OUT/after-vscode.png"
```

The script opens the command palette, runs `LikeC4: Open Preview`, selects the default view, waits for the webview, and captures the VS Code window.

If the command palette flow changes, prefer adjusting the script inputs or timing over taking manual screenshots. Manual screenshots are acceptable only when automation is blocked and the PR explicitly says so.

## Inspect evidence

Check file metadata and visually inspect both images:

```bash
identify "$OUT/before-vscode.png" "$OUT/after-vscode.png"
```

Expected evidence should show:

- the same fixture and VS Code preview in both screenshots
- the reported broken state in the before image
- the fixed state in the after image
- enough surrounding VS Code UI to prove the capture is not a browser-only rendering
- no usernames, home-directory paths, tokens, private tabs, unrelated files, or unrelated windows

## Add screenshots to the PR

Prefer GitHub attachment URLs when the `gh image` extension and a session token are available:

```bash
gh extension list | grep -F "drogers0/gh-image" || gh extension install drogers0/gh-image
gh image --repo likec4/likec4 "$OUT/before-vscode.png" "$OUT/after-vscode.png"
```

`gh image` is not a built-in `gh` command. It uses GitHub's web upload flow and needs a browser `user_session` cookie or `GH_SESSION_TOKEN`; treat that session token like a password.

If `gh image` fails because browser cookies or `GH_SESSION_TOKEN` are unavailable, use a dedicated asset branch rather than committing images into the fix branch:

```bash
ASSET_BRANCH=cgk/pr-NNNN-vscode-screenshots
ASSET_WORKTREE=$(mktemp -d /tmp/likec4-pr-NNNN-assets.XXXXXX)
ASSET_REPO=OWNER/likec4

cd "$ASSET_WORKTREE"
git init
git remote add origin "https://github.com/${ASSET_REPO}.git"
git checkout --orphan "$ASSET_BRANCH"
mkdir -p pr-assets/prNNNN
cp "$OUT/before-vscode.png" pr-assets/prNNNN/before-vscode.png
cp "$OUT/after-vscode.png" pr-assets/prNNNN/after-vscode.png
git add pr-assets/prNNNN/before-vscode.png pr-assets/prNNNN/after-vscode.png
git commit -m "docs: add prNNNN vscode screenshots"
git push origin HEAD:refs/heads/"$ASSET_BRANCH"
```

Use a fork for `ASSET_REPO` unless you intentionally want a maintainer-owned upstream asset branch. If you use the upstream repository, delete the asset branch after the PR no longer needs it:

```bash
git push origin --delete "$ASSET_BRANCH"
```

Then embed raw URLs in the PR body:

```markdown
## VS Code screenshots

Captured from a real VS Code Extension Development Host under Xvfb against the issue fixture.
Screenshots were checked for sensitive or unrelated visible content before upload.

| Before (`origin/main`)                           | After (this PR)                               |
| ------------------------------------------------ | --------------------------------------------- |
| ![Before: describe broken state](RAW_BEFORE_URL) | ![After: describe fixed state](RAW_AFTER_URL) |
```

After editing, verify the PR body:

```bash
gh pr view PR --repo likec4/likec4 --json body,url
```
