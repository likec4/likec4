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
  valid: boolean
  errors: DiagnosticItem[]
  stats: {
    totalFiles: number
    totalErrors: number
    filteredFiles: number
    filteredErrors: number
  }
}

export interface ValidateInput {
  /**
   * File system paths of the parsed documents in the workspace
   */
  documents: readonly string[]
  errors: readonly DiagnosticItem[]
  /**
   * Resolved paths given with `--file`, or `null` when the flag was not used
   */
  fileFilter: readonly string[] | null
}

/**
 * A document is selected by `--file` when its path is one of the given paths,
 * or ends with one of them.
 */
function matchesFilter(file: string, fileFilter: readonly string[]): boolean {
  return fileFilter.some(f => file === f || file.endsWith('/' + f) || file.endsWith('\\' + f))
}

export function buildValidateResult({ documents, errors, fileFilter }: ValidateInput): ValidateResult {
  const filteredErrors = fileFilter ? errors.filter(e => matchesFilter(e.file, fileFilter)) : [...errors]
  // Counted over the documents, so that a matched file with no diagnostics is still counted
  const filteredFiles = fileFilter ? documents.filter(doc => matchesFilter(doc, fileFilter)).length : documents.length

  return {
    valid: filteredErrors.length === 0,
    errors: [...filteredErrors],
    stats: {
      totalFiles: documents.length,
      totalErrors: errors.length,
      filteredFiles,
      filteredErrors: filteredErrors.length,
    },
  }
}
