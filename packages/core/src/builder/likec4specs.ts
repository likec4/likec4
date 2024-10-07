import type { AnyTypes, Specification, Types } from './_types'
import { type Builder, type ElementKindBuilder } from './Builder'

type KindBuilders<T> = T extends Types<infer Kinds extends string, any, any, any, any, any> ? {
    [Kind in Kinds]: ElementKindBuilder<T['ElementProps']>
  }
  : never

type likec4specs<T extends AnyTypes> = {
  kinds(): KindBuilders<T>
  create(): Builder<T>
}

export function likec4specs<const Spec extends Specification>(spec: Spec): likec4specs<Types.FromSpecification<Spec>> {
  return {} as any
}

const t = likec4specs({
  elements: {
    actor: {
      style: {
        shape: 'person'
      }
    },
    system: {},
    component: {}
  },
  relationships: {
    like: {},
    dislike: {}
  },
  tags: ['tag1', 'tag2', 'tag1'],
  metadataKeys: ['key1']
}).create()

const {
  actor: $actor,
  system: $system,
  component: $component,
  rel
} = t.builders()

t.model(
  $actor('a1', {
    tags: ['tag1']
  }).with(
    $component('2', 'This is a component'),
    $component('3', 'This is a component'),
    $component('4', 'This is a component')
  ),
  $system('s1')
    .with(
      $component('c1', 'This is a component')
        .with(
          $component('2', 'This is a component'),
          $component('3', 'This is a component'),
          $component('4', 'This is a component'),
          $component('5', 'This is a component'),
          $component('6', 'This is a component'),
          $component('7', 'This is a component'),
          $component('8', 'This is a component'),
          $component('9', 'This is a component'),
          $component('10', 'This is a component'),
          $component('11', 'This is a component')
        )
    ),
  rel('a1.2 -> s1.2'),
  // rel('a1 -> s1'),
  $component('c2', 'This is a component')
  // element('a2', {}).nested(
  //   element('1'),
  //   element2('a1', {
  //     tags: ['tag1']
  //   }),
  //   element('2').nested(
  //     element('3').nested(
  //       element2('5', {
  //         tags: ['tag1']
  //       }),
  //       element('4').nested(
  //         element2('5', {
  //           tags: ['tag1']
  //         })
  //       )
  //     )
  //   )
  // )
  // ).model(
  //   element('23').nested(
  //     element('1'),
  //     element('2')
  //   ),
  //   element('4'),
  // element('2').nested(
  //   element('3')
  // ),
  // element('4').nested(
  //   element('5').nested(
  //   element('6')
  // )
  // )
).ids()
