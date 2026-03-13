/**
 * Type for the built package API used by parse-drawio.spec.ts.
 * Spec loads the real dist at runtime via dynamic import (beforeAll); no static import from dist so CI typecheck passes without dist.
 */
export type DrawioDistApi = {
  getAllDiagrams: (xml: string) => Array<{ name: string; id: string; content: string }>
  parseDrawioRoundtripComments: (xml: string) => Record<string, unknown> | null
  parseDrawioToLikeC4: (xml: string) => string
  parseDrawioToLikeC4Multi: (xml: string) => string
}
