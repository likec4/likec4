// SPDX-License-Identifier: MIT

import { describe, it } from 'vitest'
import { rewriteSingleProjectInput, rewriteSingleProjectOutput } from './rewrite-single-project'

const opts = { enabled: true, firstProjectId: 'cloud' } as const
const disabled = { enabled: false, firstProjectId: 'cloud' } as const

function url(pathname: string, search = '', hash = ''): URL {
  return new URL(`https://example.test${pathname}${search}${hash}`)
}

describe('rewriteSingleProjectInput', () => {
  it('returns undefined when disabled', ({ expect }) => {
    expect(rewriteSingleProjectInput(url('/view/index/'), disabled)).toBeUndefined()
  })

  it('rewrites /view, /embed, /export and their children onto /project/<id>', ({ expect }) => {
    expect(rewriteSingleProjectInput(url('/view'), opts)?.pathname).toBe('/project/cloud/view')
    expect(rewriteSingleProjectInput(url('/view/'), opts)?.pathname).toBe('/project/cloud/view/')
    expect(rewriteSingleProjectInput(url('/view/index/'), opts)?.pathname).toBe(
      '/project/cloud/view/index/',
    )
    expect(rewriteSingleProjectInput(url('/embed/index'), opts)?.pathname).toBe(
      '/project/cloud/embed/index',
    )
    expect(rewriteSingleProjectInput(url('/export/index/'), opts)?.pathname).toBe(
      '/project/cloud/export/index/',
    )
  })

  it('preserves search and hash on rewrite', ({ expect }) => {
    const next = rewriteSingleProjectInput(url('/view/index/', '?theme=dark', '#section'), opts)
    expect(next?.pathname).toBe('/project/cloud/view/index/')
    expect(next?.search).toBe('?theme=dark')
    expect(next?.hash).toBe('#section')
  })

  it('leaves root, projects, project-prefixed, single-index, and webcomponent alone', ({ expect }) => {
    expect(rewriteSingleProjectInput(url('/'), opts)).toBeUndefined()
    expect(rewriteSingleProjectInput(url('/projects/'), opts)).toBeUndefined()
    expect(rewriteSingleProjectInput(url('/project/cloud/view/index/'), opts)).toBeUndefined()
    expect(rewriteSingleProjectInput(url('/single-index/'), opts)).toBeUndefined()
    expect(rewriteSingleProjectInput(url('/webcomponent/index'), opts)).toBeUndefined()
    expect(rewriteSingleProjectInput(url('/webcomponent/'), opts)).toBeUndefined()
  })

  it('does not rewrite unrelated paths that only share a prefix string', ({ expect }) => {
    expect(rewriteSingleProjectInput(url('/viewport'), opts)).toBeUndefined()
    expect(rewriteSingleProjectInput(url('/views'), opts)).toBeUndefined()
    expect(rewriteSingleProjectInput(url('/exported'), opts)).toBeUndefined()
  })
})

describe('rewriteSingleProjectOutput', () => {
  it('returns undefined when disabled', ({ expect }) => {
    expect(rewriteSingleProjectOutput(url('/project/cloud/view/index/'), disabled)).toBeUndefined()
  })

  it('maps bare project prefix to /', ({ expect }) => {
    expect(rewriteSingleProjectOutput(url('/project/cloud'), opts)?.pathname).toBe('/')
    expect(rewriteSingleProjectOutput(url('/project/cloud/'), opts)?.pathname).toBe('/')
  })

  it('strips project prefix keeping the remainder slash', ({ expect }) => {
    expect(rewriteSingleProjectOutput(url('/project/cloud/view/index/'), opts)?.pathname).toBe(
      '/view/index/',
    )
    expect(rewriteSingleProjectOutput(url('/project/cloud/embed/x'), opts)?.pathname).toBe(
      '/embed/x',
    )
    expect(rewriteSingleProjectOutput(url('/project/cloud/export/x/'), opts)?.pathname).toBe(
      '/export/x/',
    )
  })

  it('preserves search and hash when stripping', ({ expect }) => {
    const next = rewriteSingleProjectOutput(
      url('/project/cloud/view/index/', '?padding=20', '#top'),
      opts,
    )
    expect(next?.pathname).toBe('/view/index/')
    expect(next?.search).toBe('?padding=20')
    expect(next?.hash).toBe('#top')
  })

  it('leaves non-matching paths alone', ({ expect }) => {
    expect(rewriteSingleProjectOutput(url('/'), opts)).toBeUndefined()
    expect(rewriteSingleProjectOutput(url('/view/index/'), opts)).toBeUndefined()
    expect(rewriteSingleProjectOutput(url('/project/other/view/'), opts)).toBeUndefined()
    expect(rewriteSingleProjectOutput(url('/single-index/'), opts)).toBeUndefined()
    expect(rewriteSingleProjectOutput(url('/projects/'), opts)).toBeUndefined()
  })
})
