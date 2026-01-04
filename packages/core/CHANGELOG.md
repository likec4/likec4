# @likec4/core

## 1.47.0

### Patch Changes

- [#2520](https://github.com/likec4/likec4/pull/2520) [`dbaae67`](https://github.com/likec4/likec4/commit/dbaae67a2f00b6cacf1a0391cd8132b1d5f0e2ee) Thanks [@davydkov](https://github.com/davydkov)! - Add `computeProjectsView`, as an overview of projects and their relationships

- [#2521](https://github.com/likec4/likec4/pull/2521) [`de2b294`](https://github.com/likec4/likec4/commit/de2b2942322f1a1b0ce4822e40c997ba3fff9e15) Thanks [@davydkov](https://github.com/davydkov)! - - Add two new shapes: `document` and `bucket`

  - Apply border style to element node (previously it was applied to compound nodes and groups), closes [#2502](https://github.com/likec4/likec4/issues/2502)

- [#2520](https://github.com/likec4/likec4/pull/2520) [`5e38c9b`](https://github.com/likec4/likec4/commit/5e38c9b2fced5fc43aee0326204a443d889a9d37) Thanks [@davydkov](https://github.com/davydkov)! - Fixed issue with computation of views with groups, that led to missing relations.
  Exclude imported elements from views if have no relationships and not included explicitly

## 1.46.4

## 1.46.3

## 1.46.2

### Patch Changes

- [#2476](https://github.com/likec4/likec4/pull/2476) [`9c5779d`](https://github.com/likec4/likec4/commit/9c5779d872d8de353adf706d1a0edbbcd8bb9671) Thanks [@davydkov](https://github.com/davydkov)! - Deployment nodes name is wrong derived from instanceOf, fixes [#2387](https://github.com/likec4/likec4/issues/2387)
