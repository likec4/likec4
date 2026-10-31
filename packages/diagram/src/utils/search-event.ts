/**
 * Checks if the event comes from inside the search overlay (marked with `data-likec4-search`).
 *
 * Search can be opened on top of overlays and the diagram (e.g. by clicking a tag or metadata
 * in element details). Global hotkey handlers must leave such events to the search:
 * Escape closes the search, arrows move the caret in the search input.
 *
 * Uses `composedPath`, as the diagram may be rendered in a shadow root.
 */
export function isEventFromSearch(event: Pick<Event, 'composedPath'>): boolean {
  return event.composedPath().some(target =>
    'dataset' in target && (target as HTMLElement).dataset['likec4Search'] === 'true'
  )
}
