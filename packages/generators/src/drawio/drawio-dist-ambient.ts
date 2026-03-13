/**
 * Ambient declaration for the built package entry used by parse-drawio.spec.ts.
 * Lets typecheck pass without dist; tests load the real dist after build.
 * File is .ts (not .d.ts) so the repo .d.ts gitignore rule does not exclude it.
 */
declare module '../../dist/index.mjs' {
  export function getAllDiagrams(xml: string): Array<{ name: string; id: string; content: string }>
  export function parseDrawioRoundtripComments(xml: string): Record<string, unknown> | null
  export function parseDrawioToLikeC4(xml: string): string
  export function parseDrawioToLikeC4Multi(xml: string): string
}
