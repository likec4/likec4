import { scalar } from '@likec4/core'
import { Builder } from '@likec4/core/builder'
import { MantineProvider } from '@mantine/core'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { ElementDetailsCard } from './ElementDetailsCard'
import type { DetailsSubject } from './subject'

const model = Builder.specification({
  elements: ['app'],
  deployments: ['environment', 'server'],
  tags: ['production'],
  metadataKeys: ['owner'],
})
  .model((m, _) =>
    _(m.app('api', {
      title: 'Logical API',
      description: 'Logical description',
      metadata: { owner: 'Logical owner' },
    }))
  )
  .deployment((d, _) =>
    _(
      d.environment('prod', {
        title: 'Production environment',
        summary: 'Production summary',
        description: { md: '**Production** description' },
        technology: 'OpenTofu',
        tags: ['production'],
        links: [{ url: 'https://example.com/production', title: 'Production docs' }],
        metadata: { owner: 'Platform team' },
      }).with(
        d.server('server', { description: 'Server description' }).with(
          d.instanceOf('api', 'api', {
            title: 'Production API',
            description: 'Instance description',
            metadata: { owner: 'Instance owner' },
          }),
          d.instanceOf('apiInherited', 'api', {
            title: 'Inherited API',
          }),
        ),
      ),
    )
  )
  .views((v, _) => _(v.deploymentView('production').with(v.$include('prod.**'))))
  .toLikeC4Model()

vi.mock('../../hooks/useCurrentViewModel', () => ({
  useCurrentViewModel: () => model.view('production'),
}))
vi.mock('../../hooks/useDiagram', async importOriginal => ({
  ...await importOriginal<typeof import('../../hooks/useDiagram')>(),
  useDiagram: () => ({}),
}))
vi.mock('@mantine/hooks', async importOriginal => ({
  ...await importOriginal<typeof import('@mantine/hooks')>(),
  useViewportSize: () => ({ width: 1200, height: 800 }),
}))

function render(subject: DetailsSubject) {
  return renderToStaticMarkup(
    <MantineProvider>
      <ElementDetailsCard
        subject={subject}
        viewId={scalar.ViewId('production')}
        fromNode={null}
        rectFromNode={null}
        onClose={() => {}} />
    </MantineProvider>,
  )
}

describe('deployment details card', () => {
  it('shows deployment properties without a logical model reference', () => {
    const html = render({ type: 'deployment', deployment: scalar.DeploymentFqn('prod') })

    expect(html).toContain('Production environment')
    // summary differs from description, so it is collapsed behind a toggle
    expect(html).toContain('aria-expanded="false"><div>Summary</div>')
    expect(html).not.toContain('Production summary')
    expect(html).toContain('<strong>Production</strong> description')
    expect(html).toContain('OpenTofu')
    expect(html).toContain('Production docs')
    expect(html).toContain('Platform team')
    expect(html).toContain('production')
    expect(html).toContain('Structure')
    expect(html).toContain('Views')
    expect(html).not.toContain('Relationships')
    expect(html).not.toContain('Deployments')
  })

  it('shows instance overrides rather than logical element properties', () => {
    const html = render({ type: 'deployment', deployment: scalar.DeploymentFqn('prod.server.api') })

    expect(html).toContain('Production API')
    expect(html).toContain('Instance description')
    expect(html).toContain('Instance owner')
    expect(html).toContain('Logical API')
    expect(html).not.toContain('Logical description')
    expect(html).not.toContain('Logical owner')
  })

  it('shows logical metadata when the instance has no metadata override', () => {
    const html = render({ type: 'deployment', deployment: scalar.DeploymentFqn('prod.server.apiInherited') })

    expect(html).toContain('Inherited API')
    expect(html).toContain('Logical owner')
  })

  it('preserves logical element properties and tabs', () => {
    const html = render({ type: 'element', element: scalar.Fqn('api') })

    expect(html).toContain('Logical description')
    expect(html).toContain('Logical owner')
    expect(html).toContain('Relationships')
    expect(html).toContain('Deployments')
  })
})
