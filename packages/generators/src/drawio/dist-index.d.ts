/**
 * Type declaration for built package entry used in parse-drawio.spec.ts.
 * Allows typecheck to pass without requiring dist to exist; tests load the real dist after build.
 */
declare module '../../dist/index.mjs' {
  import type { DiagramInfo, DrawioRoundtripData } from './parse-drawio'
  export function getAllDiagrams(xml: string): DiagramInfo[]
  export function parseDrawioRoundtripComments(xml: string): DrawioRoundtripData | null
  export function parseDrawioToLikeC4(xml: string): string
  export function parseDrawioToLikeC4Multi(xml: string): string
}
