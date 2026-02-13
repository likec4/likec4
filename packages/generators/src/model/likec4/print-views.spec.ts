import type { ParsedDeploymentView, ParsedDynamicView, ParsedElementView, ParsedView } from '@likec4/core/types'
import { CompositeGeneratorNode, toString as nodeToString } from 'langium/generate'
import { describe, expect, it } from 'vitest'
import { printViews } from './print-views'

function render(views: Record<string, ParsedView>): string {
  const out = new CompositeGeneratorNode()
  printViews(out, views)
  return nodeToString(out)
}

function makeElementView(overrides: Partial<ParsedElementView> & { id: string }): ParsedElementView {
  return {
    _type: 'element',
    title: undefined,
    description: undefined,
    tags: [],
    links: [],
    rules: [],
    ...overrides,
  } as unknown as ParsedElementView
}

function makeDynamicView(overrides: Partial<ParsedDynamicView> & { id: string }): ParsedDynamicView {
  return {
    _type: 'dynamic',
    title: undefined,
    description: undefined,
    tags: [],
    links: [],
    steps: [],
    rules: [],
    ...overrides,
  } as unknown as ParsedDynamicView
}

function makeDeploymentView(overrides: Partial<ParsedDeploymentView> & { id: string }): ParsedDeploymentView {
  return {
    _type: 'deployment',
    title: undefined,
    description: undefined,
    tags: [],
    links: [],
    rules: [],
    ...overrides,
  } as unknown as ParsedDeploymentView
}

describe('printViews', () => {
  it('does nothing for empty views', () => {
    const output = render({})
    expect(output).toBe('')
  })

  it('prints views block wrapper', () => {
    const output = render({
      index: makeElementView({ id: 'index' }),
    })
    expect(output).toContain('views {')
    expect(output).toContain('}')
  })

  // ---- Element View ----

  it('prints basic element view', () => {
    const output = render({
      index: makeElementView({ id: 'index' }),
    })
    expect(output).toContain('view index {')
  })

  it('prints element view with viewOf', () => {
    const output = render({
      cloudView: makeElementView({ id: 'cloudView', viewOf: 'cloud' as any }),
    })
    expect(output).toContain('view cloudView of cloud {')
  })

  it('prints element view with extends', () => {
    const output = render({
      ext: makeElementView({ id: 'ext', extends: 'baseView' as any }),
    })
    expect(output).toContain('view ext extends baseView {')
  })

  it('prints view common props (title, description)', () => {
    const output = render({
      v: makeElementView({
        id: 'v',
        title: 'My View',
        description: { txt: 'A great view' },
      }),
    })
    expect(output).toContain('title \'My View\'')
    expect(output).toContain('description \'A great view\'')
  })

  it('prints view tags', () => {
    const output = render({
      v: makeElementView({ id: 'v', tags: ['overview', 'v2'] as any }),
    })
    expect(output).toContain('#overview #v2')
  })

  it('prints view links', () => {
    const output = render({
      v: makeElementView({
        id: 'v',
        links: [{ url: 'https://example.com', title: 'Link' }] as any,
      }),
    })
    expect(output).toContain('link https://example.com \'Link\'')
  })

  it('prints autoLayout rule', () => {
    const output = render({
      v: makeElementView({
        id: 'v',
        rules: [{ direction: 'TB', isViewRuleAutoLayout: true }] as any,
      }),
    })
    expect(output).toContain('autoLayout TopBottom')
  })

  it('prints autoLayout with rankSep and nodeSep', () => {
    const output = render({
      v: makeElementView({
        id: 'v',
        rules: [{ direction: 'LR', isViewRuleAutoLayout: true, rankSep: 100, nodeSep: 50 }] as any,
      }),
    })
    expect(output).toContain('autoLayout LeftRight 100 50')
  })

  it('prints include rule with wildcard', () => {
    const output = render({
      v: makeElementView({
        id: 'v',
        rules: [{ include: [{ wildcard: true }] }] as any,
      }),
    })
    expect(output).toContain('include')
    expect(output).toContain('*')
  })

  it('prints exclude rule', () => {
    const output = render({
      v: makeElementView({
        id: 'v',
        rules: [{ exclude: [{ ref: { model: 'cloud.backend' } }] }] as any,
      }),
    })
    expect(output).toContain('exclude')
    expect(output).toContain('cloud.backend')
  })

  it('prints style rule', () => {
    const output = render({
      v: makeElementView({
        id: 'v',
        rules: [{
          isViewRuleStyle: true,
          targets: [{ wildcard: true }],
          style: { color: 'red' },
        }] as any,
      }),
    })
    expect(output).toContain('style * {')
    expect(output).toContain('color red')
  })

  it('prints global predicate ref', () => {
    const output = render({
      v: makeElementView({
        id: 'v',
        rules: [{ isViewRuleGlobalPredicateRef: true, predicateId: 'myPred' }] as any,
      }),
    })
    expect(output).toContain('global predicate myPred')
  })

  it('prints global style ref', () => {
    const output = render({
      v: makeElementView({
        id: 'v',
        rules: [{ isViewRuleGlobalStyle: true, styleId: 'myStyle' }] as any,
      }),
    })
    expect(output).toContain('global style myStyle')
  })

  // ---- Dynamic View ----

  it('prints basic dynamic view', () => {
    const output = render({
      dyn: makeDynamicView({ id: 'dyn' }),
    })
    expect(output).toContain('dynamic view dyn {')
  })

  it('prints dynamic view with variant', () => {
    const output = render({
      dyn: makeDynamicView({ id: 'dyn', variant: 'sequence' }),
    })
    expect(output).toContain('dynamic view dyn sequence {')
  })

  it('omits variant when undefined', () => {
    const output = render({
      dyn: makeDynamicView({ id: 'dyn' }),
    })
    // Should not have double space between id and {
    expect(output).toContain('dynamic view dyn {')
    expect(output).not.toContain('dynamic view dyn  {')
  })

  it('prints dynamic view step (forward)', () => {
    const output = render({
      dyn: makeDynamicView({
        id: 'dyn',
        steps: [{
          source: 'a',
          target: 'b',
          title: 'call',
          isBackward: false,
        }] as any,
      }),
    })
    expect(output).toContain('a -> b \'call\'')
  })

  it('prints dynamic view step (backward)', () => {
    const output = render({
      dyn: makeDynamicView({
        id: 'dyn',
        steps: [{
          source: 'a',
          target: 'b',
          isBackward: true,
        }] as any,
      }),
    })
    expect(output).toContain('a <- b')
  })

  it('prints dynamic view step with body', () => {
    const output = render({
      dyn: makeDynamicView({
        id: 'dyn',
        steps: [{
          source: 'a',
          target: 'b',
          isBackward: false,
          technology: 'REST',
          color: 'blue',
        }] as any,
      }),
    })
    expect(output).toContain('a -> b {')
    expect(output).toContain('technology \'REST\'')
    expect(output).toContain('color blue')
  })

  it('prints parallel steps', () => {
    const output = render({
      dyn: makeDynamicView({
        id: 'dyn',
        steps: [{
          __parallel: [
            { source: 'a', target: 'b', isBackward: false },
            { source: 'c', target: 'd', isBackward: false },
          ],
        }] as any,
      }),
    })
    expect(output).toContain('parallel {')
    expect(output).toContain('a -> b')
    expect(output).toContain('c -> d')
  })

  // ---- Deployment View ----

  it('prints basic deployment view', () => {
    const output = render({
      dep: makeDeploymentView({ id: 'dep' }),
    })
    expect(output).toContain('deployment view dep {')
  })

  it('prints deployment view with include rule', () => {
    const output = render({
      dep: makeDeploymentView({
        id: 'dep',
        rules: [{
          include: [{ ref: { deployment: 'prod.eu' } }],
        }] as any,
      }),
    })
    expect(output).toContain('include')
    expect(output).toContain('prod.eu')
  })

  it('prints deployment view with exclude rule', () => {
    const output = render({
      dep: makeDeploymentView({
        id: 'dep',
        rules: [{
          exclude: [{ wildcard: true }],
        }] as any,
      }),
    })
    expect(output).toContain('exclude')
    expect(output).toContain('*')
  })
})
