// SPDX-License-Identifier: MIT

/**
 * Thrown when PNG export cannot locate the `likec4` CLI.
 * Carries the install commands for the detected package manager so the UI can offer to run them.
 */
export class Likec4CliNotFoundError extends Error {
  override readonly name = 'Likec4CliNotFoundError'

  constructor(
    /** Folder the CLI was searched from (project folder, or workspace folder as fallback). */
    readonly cwd: string,
    /** Shell commands that install the CLI and Playwright Chromium, in order. */
    readonly installCommands: readonly string[],
  ) {
    super(
      'LikeC4 CLI not found. Install the `likec4` package in your project, or set `likec4.cli.path`.',
    )
  }
}
