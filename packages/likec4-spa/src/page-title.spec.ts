import { describe, expect, it } from 'vitest'

/**
 * Bug fix: single-index page ignored project.title from likec4.config.json
 *
 * Before fix (single-index.tsx):
 *   useDocumentTitle(pageTitle)                          // always showed CLI --title, e.g. "LikeC4"
 *
 * After fix (single-index.tsx):
 *   const { landingPage, title: projectTitle } = useCurrentProject()
 *   useDocumentTitle(projectTitle ?? pageTitle)          // shows config title, falls back to CLI --title
 *
 * Example: likec4.config.json { "title": "AspireC4 Test App" }
 *   Before: document.title === "LikeC4"
 *   After:  document.title === "AspireC4 Test App"
 */

/**
 * Title resolution rules (most-specific to least-specific):
 *
 *  single-index page  : project.title (from LikeC4 Config) ?? CLI --title
 *  per-view page      : (view.title ?? view.id) + " - " + (project.title ?? CLI --title)
 *  multi-project dash : CLI --title only
 *
 * These tests document the logic that should be applied in each location.
 *
 * Note: the CLI --title default is "LikeC4", but users can set a custom title via the CLI
 * flag, so tests should not assume the CLI title value.
 */

// The resolve helper mirrors the expression used in single-index.tsx and ViewReact.tsx:
//   `projectTitle ?? cliTitle`
const resolveTitle = (projectTitle: string | undefined, cliTitle: string): string => projectTitle ?? cliTitle

describe('page title resolution (single-project mode)', () => {
  it('uses project title from likec4.config.json when available', () => {
    expect(resolveTitle('AspireC4 Test App', 'LikeC4')).toBe('AspireC4 Test App')
  })

  it('falls back to CLI --title when project has no title', () => {
    expect(resolveTitle(undefined, 'LikeC4')).toBe('LikeC4')
  })

  it('falls back to a custom CLI --title when project has no title', () => {
    expect(resolveTitle(undefined, 'My Suite')).toBe('My Suite')
  })

  it('project title takes precedence over CLI --title', () => {
    expect(resolveTitle('Config Title', 'CLI Title')).toBe('Config Title')
  })
})

describe('per-view page title format', () => {
  // ViewReact.tsx produces: `${view.title ?? view.id} - ${project.title ?? defaultPageTitle}`
  const resolveViewTitle = (
    viewTitle: string | undefined,
    viewId: string,
    projectTitle: string | undefined,
    cliTitle: string,
  ): string => `${viewTitle ?? viewId} - ${resolveTitle(projectTitle, cliTitle)}`

  it('uses view title and project config title', () => {
    expect(resolveViewTitle('System Context', 'ctx', 'AspireC4', 'LikeC4')).toBe('System Context - AspireC4')
  })

  it('falls back to view id when view has no title', () => {
    expect(resolveViewTitle(undefined, 'ctx', 'AspireC4', 'LikeC4')).toBe('ctx - AspireC4')
  })

  it('falls back to CLI --title when project has no config title', () => {
    expect(resolveViewTitle('System Context', 'ctx', undefined, 'LikeC4')).toBe('System Context - LikeC4')
  })

  it('falls back to view id and CLI --title when neither view nor project title is set', () => {
    expect(resolveViewTitle(undefined, 'ctx', undefined, 'LikeC4')).toBe('ctx - LikeC4')
  })
})

describe('multi-project dashboard title format', () => {
  // projects.tsx produces: `Projects - ${pageTitle}` where pageTitle comes from CLI --title only.
  // Project config titles are intentionally ignored here — the dashboard spans all projects.
  const resolveDashboardTitle = (cliTitle: string): string => `Projects - ${cliTitle}`

  it('uses CLI --title for the dashboard', () => {
    expect(resolveDashboardTitle('LikeC4')).toBe('Projects - LikeC4')
  })

  it('uses a custom CLI --title for the dashboard', () => {
    expect(resolveDashboardTitle('My Suite')).toBe('Projects - My Suite')
  })
})
