// SPDX-License-Identifier: MIT

import { execFile, spawn } from 'node:child_process'
import { unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
const execFileAsync = promisify(execFile)

/**
 * Copy a PNG buffer to the system clipboard as an image.
 *
 * `vscode.env.clipboard` only supports text, so we use the platform clipboard
 * tools already available on the host (no extra npm dependencies).
 */
export async function copyPngToClipboard(png: Buffer): Promise<void> {
  const file = join(tmpdir(), `likec4-clipboard-${Date.now()}-${process.pid}.png`)
  await writeFile(file, png)
  try {
    switch (true) {
      case process.platform === 'darwin': {
        await execFileAsync('osascript', [
          '-e',
          `set the clipboard to (read (POSIX file ${osascriptString(file)}) as «class PNGf»)`,
        ])
        return
      }
      case process.platform === 'win32': {
        await execFileAsync('powershell.exe', [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          [
            `$path = ${powershellString(file)}`,
            'Add-Type -AssemblyName System.Windows.Forms',
            'Add-Type -AssemblyName System.Drawing',
            '$img = [System.Drawing.Image]::FromFile($path)',
            'try { [System.Windows.Forms.Clipboard]::SetImage($img) } finally { $img.Dispose() }',
          ].join('; '),
        ])
        return
      }
      default: {
        // Linux: prefer wl-copy (Wayland), then xclip, then xsel.
        if (await trySpawnWithStdin('wl-copy', ['--type', 'image/png'], png)) {
          return
        }
        if (await tryExecFile('xclip', ['-selection', 'clipboard', '-t', 'image/png', '-i', file])) {
          return
        }
        if (await trySpawnWithStdin('xsel', ['--clipboard', '--input'], png)) {
          return
        }
        throw new Error(
          'Could not copy image to the clipboard. Install wl-copy, xclip, or xsel.',
        )
      }
    }
  } finally {
    await unlink(file).catch(() => {})
  }
}

async function tryExecFile(command: string, args: string[]): Promise<boolean> {
  try {
    await execFileAsync(command, args, { maxBuffer: 16 * 1024 * 1024 })
    return true
  } catch {
    return false
  }
}

function trySpawnWithStdin(command: string, args: string[], stdin: Buffer): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ['pipe', 'ignore', 'ignore'] })
    child.on('error', () => resolve(false))
    child.on('close', (code) => resolve(code === 0))
    child.stdin.on('error', () => {
      // Ignore EPIPE when the process exits early (missing binary, etc.).
    })
    child.stdin.end(stdin)
  })
}

function osascriptString(value: string): string {
  return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`
}

function powershellString(value: string): string {
  return `'${value.replaceAll('\'', '\'\'')}'`
}
