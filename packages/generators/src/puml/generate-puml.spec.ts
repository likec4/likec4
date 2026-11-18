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
        technology: 'Rest API',
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

test('generate puml - AllShapes', ({ expect }) => {
  expect(generatePuml(mockViewModel(fakeComputedViewWithAllShapes))).toMatchSnapshot()
})

test('generate puml - ids with the same PascalCase name get unique names', () => {
  const view: ProcessedView = {
    edges: [
      {
        id: 'shop:payment.gateway',
        label: 'charges via',
        source: 'shop',
        target: 'payment.gateway',
      },
      {
        id: 'payment.gateway:payment-gateway',
        label: 'forwards to',
        source: 'payment.gateway',
        target: 'payment-gateway',
      },
    ],
    nodes: [
      {
        children: [],
        color: 'primary',
        id: 'shop',
        parent: null,
        shape: 'rectangle',
        title: 'Shop',
      },
      {
        children: ['payment.gateway'],
        color: 'primary',
        id: 'payment',
        parent: null,
        shape: 'rectangle',
        title: 'Payments',
      },
      {
        children: [],
        color: 'primary',
        id: 'payment.gateway',
        parent: 'payment',
        shape: 'rectangle',
        title: 'Internal gateway',
      },
      {
        children: [],
        color: 'secondary',
        id: 'payment-gateway',
        parent: null,
        shape: 'rectangle',
        title: 'External payment gateway',
      },
    ],
    autoLayout: { direction: 'TB' },
    id: 'sameNames',
    title: 'Same names',
  } as any

  const result = generatePuml(mockViewModel(view))

  expect(result).toContain('rectangle "==Internal gateway" <<PaymentGateway>> as PaymentGateway\n')
  expect(result).toContain('rectangle "==External payment gateway" <<PaymentGateway2>> as PaymentGateway2\n')
  expect(result).toContain('Shop .[#777777,thickness=2].> PaymentGateway : ')
  expect(result).toContain('PaymentGateway .[#777777,thickness=2].> PaymentGateway2 : ')
  expect(result).toContain('skinparam rectangle<<PaymentGateway2>>{')
})
