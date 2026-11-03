export interface DiagnosticItem {
  message: string
  file: string
  line: number
  range: {
    start: { line: number; character: number }
    end: { line: number; character: number }
  } | null
}

export interface ValidateResult {
  /**
   * `false` when there are errors, or when `--max-warnings` is given and
   * there are more warnings than allowed
   */
  valid: boolean
  errors: DiagnosticItem[]
  warnings: DiagnosticItem[]
  /**
   * Value of `--max-warnings`, or `null` when warnings are not limited
   */
  maxWarnings: number | null
  stats: {
    totalFiles: number
    totalErrors: number
    totalWarnings: number
    filteredFiles: number
    filteredErrors: number
    filteredWarnings: number
  }
}

export interface ValidateInput {
  /**
   * File system paths of the parsed documents in the workspace
   */
  documents: readonly string[]
  errors: readonly DiagnosticItem[]
  warnings?: readonly DiagnosticItem[] | undefined
  /**
   * Resolved paths given with `--file`, or `null` when the flag was not used
   */
  fileFilter: readonly string[] | null
  /**
   * Number of warnings allowed before validation fails, or `null` when warnings are not limited
   */
  maxWarnings?: number | null | undefined
}

/**
 * A document is selected by `--file` when its path is one of the given paths,
 * or ends with one of them.
 */
function matchesFilter(file: string, fileFilter: readonly string[]): boolean {
  return fileFilter.some(f => file === f || file.endsWith('/' + f) || file.endsWith('\\' + f))
}

/**
 * Parses the `--max-warnings` option, which must be a non-negative integer
 */
export function parseMaxWarnings(value: number | undefined): number | undefined {
  if (value === undefined) {
    return undefined
  }
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`--max-warnings must be a non-negative integer, got ${value}`)
  }
  return value
}

export function buildValidateResult(
  { documents, errors, warnings = [], fileFilter, maxWarnings = null }: ValidateInput,
): ValidateResult {
  const filteredErrors = fileFilter ? errors.filter(e => matchesFilter(e.file, fileFilter)) : [...errors]
  const filteredWarnings = fileFilter ? warnings.filter(w => matchesFilter(w.file, fileFilter)) : [...warnings]
  // Counted over the documents, so that a matched file with no diagnostics is still counted
  const filteredFiles = fileFilter ? documents.filter(doc => matchesFilter(doc, fileFilter)).length : documents.length
  const tooManyWarnings = maxWarnings !== null && filteredWarnings.length > maxWarnings

  return {
    valid: filteredErrors.length === 0 && !tooManyWarnings,
    errors: filteredErrors,
    warnings: filteredWarnings,
    maxWarnings,
    stats: {
      totalFiles: documents.length,
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      filteredFiles,
      filteredErrors: filteredErrors.length,
      filteredWarnings: filteredWarnings.length,
    },
  }
}
