import type { LikeC4ViewModel } from '@likec4/core/model'
import { LikeC4Styles } from '@likec4/core/styles'
import type { aux, ProcessedView } from '@likec4/core/types'
import { expect, test, vi } from 'vitest'
import { fakeComputedView3Levels, fakeComputedViewWithAllShapes, fakeDiagram, fakeDiagram2 } from '../__mocks__/data'
import { generatePuml } from './generate-puml'

const mockViewModel = vi.fn(function($view: ProcessedView) {
  return {
    titleOrId: $view.title || $view.id,
    $view,
    $model: {
      specification: {},
      $styles: LikeC4Styles.DEFAULT,
    },
  } as unknown as LikeC4ViewModel<aux.Unknown>
})

test('generate puml - fakeDiagram', () => {
  expect(generatePuml(mockViewModel(fakeDiagram))).toMatchSnapshot()
})

test('generate puml - fakeDiagram2', () => {
  expect(generatePuml(mockViewModel(fakeDiagram2))).toMatchSnapshot()
})

test('generate puml - fakeComputedView 3 Levels', () => {
  expect(generatePuml(mockViewModel(fakeComputedView3Levels))).toMatchSnapshot()
})

test('generate puml - with dashed identifiers', () => {
  const viewWithDashes: ProcessedView = {
    edges: [
      {
        id: 'payment-gateway:email-provider',
        label: 'sends notifications',
        source: 'payment-gateway',
        target: 'email-provider',
      },
      {
        id: 'customer:payment-gateway',
        label: 'makes payment',
        source: 'customer',
        target: 'payment-gateway',
      },
    ],
    nodes: [
      {
        children: [],
        color: 'primary',
        id: 'payment-gateway',
        parent: null,
        shape: 'rectangle',
        title: 'Payment Gateway',
      },
      {
        children: [],
        color: 'secondary',
        id: 'email-provider',
        parent: null,
        shape: 'rectangle',
        title: 'Email Provider',
      },
      {
        children: [],
        color: 'primary',
        id: 'customer',
        parent: null,
        shape: 'person',
        title: 'Customer',
      },
    ],
    autoLayout: { direction: 'TB' },
    id: 'dashedView',
    title: 'Test Dashed Identifiers',
  } as any

  const result = generatePuml(mockViewModel(viewWithDashes))

  // Verify no dashes in identifiers
  expect(result).not.toContain('payment-gateway')
  expect(result).not.toContain('email-provider')

  // Verify PascalCase transformation
  expect(result).toContain('PaymentGateway')
  expect(result).toContain('EmailProvider')

  expect(result).toMatchSnapshot()
})

test('generate puml - AllShapes', async ({ expect }) => {
  await expect(
    generatePuml(mockViewModel(fakeComputedViewWithAllShapes)),
  ).toMatchFileSnapshot('__snapshots__/fakeComputedViewWithAllShapes.puml')
})
