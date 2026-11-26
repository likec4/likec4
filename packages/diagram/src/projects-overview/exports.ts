/**
 * Formats the overview can be exported to. Same set as the export menu of other views.
 */
export type ProjectsOverviewExportFormat = 'png' | 'jpg' | 'dot' | 'd2' | 'mmd' | 'puml' | 'drawio'

/**
 * Export capabilities of the overview, provided by the host app.
 * A text source is required for its format to be offered.
 */
export interface ProjectsOverviewExports {
  readonly formats: readonly ProjectsOverviewExportFormat[]
  readonly dot?: string | undefined
  readonly d2?: string | undefined
  readonly mmd?: string | undefined
  readonly puml?: string | undefined
  /** Draw.io URL that opens the overview in the editor */
  readonly drawioEditUrl?: string | undefined
}

/**
 * Image export works in the browser, so it is available when the host app gives no exports.
 */
export const defaultOverviewExports: ProjectsOverviewExports = {
  formats: ['png', 'jpg'],
}

const textFormats = ['dot', 'd2', 'mmd', 'puml'] as const

/**
 * Formats that can be offered: images always, text formats only with a source.
 */
export function availableExportFormats(exports: ProjectsOverviewExports): ProjectsOverviewExportFormat[] {
  return exports.formats.filter(format => {
    switch (true) {
      case format === 'drawio':
        return !!exports.drawioEditUrl
      case (textFormats as readonly string[]).includes(format):
        return !!exports[format as typeof textFormats[number]]
      default:
        return true
    }
  })
}
