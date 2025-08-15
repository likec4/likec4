# `@likec4/core`

<a href="https://www.npmjs.com/package/%40likec4%2Fcore" target="_blank">![NPM Version](https://img.shields.io/npm/v/%40likec4%2Fcore)</a>
<a href="https://www.npmjs.com/package/%40likec4%2Fcore" target="_blank">![NPM Downloads](https://img.shields.io/npm/dm/%40likec4%2Fcore)</a>

A core package for LikeC4, containing types, api, utilities and guards.

> [!NOTE]
> This package is a low level API for working with LikeC4.\
> It is exposed mostly through [`likec4`](../likec4/README.md), that generates models from DSL.

## Types

Includes a set of types that are used across the project

```ts
import type {
  DiagramView,
  Element,
  ElementViewPredicate,
  Fqn,
  // ....
} from '@likec4/core/types'
```

There is some concept that allows to build models in a type-safe way.\
Consider the following example:

```ts
import type { aux } from '@likec4/core/types'

interface Element<A extends aux.Any = aux.Any> {
  id: aux.Fqn<A>
  kind: aux.ElementKind<A>
  title: string
  tags: aux.Tags<A>
}
```

`Aux` is a registry that keeps track of the specification (kinds, tags), all the elements and views.
Thus, it is used to generate types for the identifiers (FQNs, view predicates, etc.).

When you generate the model from DSL or use builder, `Aux` is generated automatically.

You can use `aux.Any` as the default type, that infers to string.

## Model API

This is the main API to work with LikeC4 model.\
It provides methods to query and traverse the model (get element, children, incoming relationships, etc.)\
Model is built from `ModelData`, and has three stages:

- `parsed`\
  Sourced from `ParsedLikeC4ModelData` - represents model parsed from DSL or generated using builder.\
  All the elements and relations are available, but views are not processed yet, and have `rules[]` property (that are predicates to compute)\
  These views are available as `ParsedView`, or `ParsedDynamicView` as a type for specific view.

- `computed`\
  Model is computed from parsed model (source type `ComputedLikeC4ModelData`)\
  Now views are available as `ComputedView` (or `ComputedDynamicView`), and have nodes and edges.\
  Also, elements have additional traversal methods, like `views()` - to get views where element is included.

- `layouted`\
  Model is layouted from computed model.\
  Now every view (and its nodes and edges) has layout data (dimensions, positions).\
  Source type is `LayoutedLikeC4ModelData`.
  Views are available as `LayoutedView` (or `DiagramView`)

Example:

```ts
const parsedData: ParsedLikeC4ModelData<Aux1> = {}
const computedData: ComputedLikeC4ModelData<Aux2> = {}
const layoutedData: LayoutedLikeC4ModelData<Aux3> = {}

const m1 = LikeC4Model.create(parsedData)
// m1 is LikeC4Model.Parsed<Aux1>
// m1.stage === 'parsed'

const m2 = LikeC4Model.create(computedData)
// m2 is LikeC4Model.Computed<Aux2>
// m2.stage === 'computed'

const m3 = LikeC4Model.create(layoutedData)
// m3 is LikeC4Model.Layouted<Aux3>
// m3.stage === 'layouted'
```

`LikeC4Model.create` expects `Aux` to be provided, or fallback to `aux.Any`.

There is also `LikeC4Model.fromDump` method, that infers `Aux` from the code (if constant is given).

> [!TIP]
> Try `npx likec4 codegen model` to play with your model.

### Usage

If Model has `Aux` with literals, every method is type-safe:

```ts
// Compiler error here, if there is no element with such FQN
model.element('non.existing.element')

// Workaround:
model.findElement('non.existing.element') // returns ElementModel | null
```

Other examples:

```ts
// Get model source
const source = model.$data

// Get elements of some kind
const elements = model.elementsOfKind('kind1')

// Use where operator to filter elements:
//  kind is 'kind1' and (tag is 'tag2' or tag is not 'tag3')
const elements = model.elementsWhere({
  and: [
    { kind: 'kind1' },
    {
      or: [
        { tag: 'tag2' },
        {
          tag: {
            neq: 'tag3',
          },
        },
      ],
    },
  ],
})

// Find all views, tagged with "tag1" and scoped for elements nested in "parent"
const parent = model.element('some.parent')
for (const v of model.findByTag('tag1', 'views')) {
  if (v.isScopedElementView() && v.viewOf.isDescendantOf(parent)) {
    //
  }
}

// Deployment model
for (const node of model.deployment.nodes()) {
  if (node.isDeployedInstance()) {
    // node is DeploymentNodeModel
  }
}
```

> [!NOTE]
> Most methods return lazy evaluated iterators, use `for...of` or spread operator to retrieve all values (or methods like [`toArray()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator/toArray))

Models have guards to check their type, like in example above we check if view is a scoped element view.

Generic guards are also available in `@likec4/core/model`:

```ts
import {
  isDeployedInstanceModel,
  isElementModel,
  isLikeC4ViewModel,
  // ... other guards
} from '@likec4/core/model'
```

### Connections

Connections can be used to find all relationships between elements (direct or derived).

```ts
import { modelConnection } from '@likec4/core/model'

const source = model.element('some.source')
const target = model.element('some.target')

const connection = modelConnection.findConnection(source, target)
```

Check [sources](./src/model/index.ts) for available methods.

### Compute Model

You rarely need to compute model yourself, but in case you need to:

```ts
import { computeLikeC4Model } from '@likec4/core/compute-view'

const parsedData: ParsedLikeC4ModelData<Aux1> = {}
const model = computeLikeC4Model(parsedData)
```

## Model Builder

We use it internally a lot for testing, but it is also available for you to build models in a type-safe way.

Two styles are available. You can mix both styles, depending on your preference and use cases.

### via chain

```ts
import { Builder } from '@likec4/core/builder'

const m = Builder
  .specification({
    elements: {
      actor: {
        style: {
          shape: 'person',
        },
      },
      system: {},
      component: {},
    },
    relationships: {
      likes: {},
    },
    tags: ['tag1', 'tag2', 'tag1'],
  })
  .model(({ actor, system, component, relTo, rel }, _) =>
    _(
      actor('alice'),
      actor('bob'),
      rel('alice', 'bob', {
        tags: ['tag1'], // you get code completion for tags
        kind: 'likes', // code completion for kind
      }),
      system('cloud', { tags: ['tag1', 'tag2'] }).with(
        component('backend').with(
          component('api'),
          component('db'),
          // code completion for relationships
          rel('cloud.backend.api', 'cloud.backend.db'),
        ),
        component('frontend').with(
          relTo('cloud.backend.api'),
        ),
      ),
    )
  )
  .views(({ view, viewOf, $include, $style }, _) =>
    _(
      view('index', 'Index').with(
        // code completion for predicates
        $include('cloud.*'),
      ),
      viewOf('ui', 'cloud.ui').with(
        $include('* -> cloud.**'),
        $style('cloud.ui', { color: 'red' }),
      ),
    )
  )
  .toLikeC4Model()
```

Builder has two methods:

- `build()`: returns `ParsedLikeC4ModelData`
- `toLikeC4Model()`: returns already computed `LikeC4Model`

### via composition

```ts
import { Builder } from '@likec4/core/builder'

// Get composition functions for given specification
const {
  model: {
    model,
    actor,
    system,
    component,
    rel,
    relTo,
  },
  views: {
    view,
    viewOf,
    views,
    $include,
    $style,
  },
  builder,
} = Builder.forSpecification({
  elements: {
    actor: {
      style: {
        shape: 'person',
      },
    },
    system: {},
    component: {},
  },
  relationships: {
    likes: {},
  },
  tags: ['tag1', 'tag2', 'tag1'],
})

const b1 = builder.with(
  model(
    actor('alice'),
    actor('bob'),
    rel('alice', 'bob', {
      tags: ['tag1'],
      kind: 'likes',
    }),
    system('cloud', { tags: ['tag1', 'tag2'] }).with(
      component('backend').with(
        component('api'),
        component('db'),
        rel('cloud.backend.api', 'cloud.backend.db'),
      ),
      component('frontend').with(
        relTo('cloud.backend.api'),
      ),
    ),
  ),
)

const b2 = b1.with(
  views(
    view('index', 'Index').with(
      $include('cloud.*'),
    ),
    viewOf('ui', 'cloud.ui').with(
      $include('* -> cloud.**'),
      $style('cloud.ui', { color: 'red' }),
    ),
  ),
)
  .toLikeC4Model()
```

> [!TIP]
> You can also use specification from existing model:
>
> ```ts
> const b = Builder.specification(existingModel.specification)
> ```

## Utils

Project uses [remeda](https://remedajs.com/) internally, and exports some model-related utilities.\
Check sources for available functions.

### Full Qualified Name (FQN) utils

There are various functions to work with Full Qualified Name (FQN) of elements, like `isAncestor`, `commonAncestor`, `compareFqnHierarchically`, etc.

```ts
import { isAncestor, isDescendantOf, sortNaturalByFqn } from '@likec4/core/utils'

if (isAncestor('parent', 'child')) {
  // do something
}

// filter elements that are descendants of parent
elements.filter(isDescendantOf(parent))

// Sort elements by FQN, like
//  a
//  a.b2
//  a.b10
//  a.b.c
sortNaturalByFqn(elements)
```

### Iterables

Functions like `filter`, `find`, `flat`, `map`, `reduce`, `some`, `unique`, but for iterables, are available as `i*` functions, and can be used in pipelines.

```ts
import { isElementModel } from '@likec4/core/model'
import { ifilter, imap } from '@likec4/core/utils'
import { isTruthy, pipe, prop } from 'remeda'

pipe(
  model.findByTag('tag1'),
  ifilter(isElementModel),
  imap(prop('defaultView')),
  ifilter(isTruthy),
)
```

This composes to single iterator, avoiding intermediate arrays.

## Getting help

We are always happy to help you get started:

- [Join Discord community](https://discord.gg/86ZSpjKAdA) – it is the easiest way to get help
- [GitHub Discussions](https://github.com/likec4/likec4/discussions) – ask anything about the project or give feedback

## Contributors

<a href="https://github.com/likec4/likec4/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=likec4/likec4" />
</a>

[Become a contributor](../../CONTRIBUTING.md)

## Support development

LikeC4 is a MIT-licensed open source project with its ongoing development made possible entirely by your support.\
If you like the project, please consider contributing financially to help grow and improve it.\
You can support us via [OpenCollective](https://opencollective.com/likec4) or [GitHub Sponsors](https://github.com/sponsors/likec4).

## License

This project is released under the [MIT License](LICENSE)
