/**
 * Event names and app constants for DrawIO so Monaco editor and context menu
 * use a single source of truth (no magic strings).
 */

export const DRAWIO_IMPORT_EVENT = 'likec4-drawio-import'
export const DRAWIO_EXPORT_EVENT = 'likec4-drawio-export'

/** MIME type for .drawio blob download */
export const DRAWIO_MIME_TYPE = 'application/x-drawio'

/** Default filename when exporting all views as one file */
export const DEFAULT_DRAWIO_ALL_FILENAME = 'diagrams.drawio'
