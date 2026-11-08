import { scalar } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { detailsSubject } from './subject'

describe('details subject', () => {
  it('resolves deployment nodes without a logical reference', () => {
    expect(detailsSubject({ deploymentFqn: scalar.DeploymentFqn('prod') })).toEqual({
      type: 'deployment',
      deployment: 'prod',
    })
  })

  it('prefers deployment properties for instances and collapsed deployment nodes', () => {
    expect(detailsSubject({
      deploymentFqn: scalar.DeploymentFqn('prod.api'),
      modelFqn: scalar.Fqn('api'),
    })).toEqual({ type: 'deployment', deployment: 'prod.api' })
  })

  it('preserves logical element details', () => {
    expect(detailsSubject({ modelFqn: scalar.Fqn('api') })).toEqual({ type: 'element', element: 'api' })
  })

  it('does not offer details for view groups', () => {
    expect(detailsSubject({})).toBeNull()
  })
})
