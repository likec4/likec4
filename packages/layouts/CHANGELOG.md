# @likec4/layouts

## 1.59.2

### Patch Changes

- Updated dependencies []:
  - @likec4/core@1.59.2
  - @likec4/log@1.59.2

## 1.59.1

### Patch Changes

- Updated dependencies []:
  - @likec4/core@1.59.1
  - @likec4/log@1.59.1

## 1.59.0

### Patch Changes

- [#3084](https://github.com/likec4/likec4/pull/3084) [`76ef007`](https://github.com/likec4/likec4/commit/76ef007fd2fb0c6d52cedcdb3ef048a9f2a624c4) Thanks [@davydkov](https://github.com/davydkov)! - Flow control in dynamic views. Besides `parallel`, steps can now be grouped into flow blocks (each with an optional title):

  - `opt`, `loop` and `break` blocks
  - `alt` with `when` / `else` branches
  - `try` / `catch` / `finally` blocks

  ```likec4
  dynamic view example {
    customer -> app 'opens app'
    alt {
      when 'authorized' {
        app -> api 'requests data'
      }
      else 'not authorized' {
        app -> customer 'shows login'
      }
    }
  }
  ```

  Sequence diagrams render these blocks as nested frames, and actors stay visible when zoomed in (fixes [#3074](https://github.com/likec4/likec4/issues/3074)). During a walkthrough, a docked Sequence Outline panel shows the flow as a collapsible tree that mirrors the block nesting — each step is numbered and every operator carries a colored type tag and step count, so you can jump to any step and keep your place.

  > [!NOTE]
  > Flow control blocks are experimental — syntax and rendering may change. We are looking for your feedback in [discussions](https://github.com/likec4/likec4/discussions)!

  Resolved issues:

  - [#2745](https://github.com/likec4/likec4/issues/2745)
  - [#2993](https://github.com/likec4/likec4/issues/2993)
  - [#3074](https://github.com/likec4/likec4/issues/3074)

- Updated dependencies [[`76ef007`](https://github.com/likec4/likec4/commit/76ef007fd2fb0c6d52cedcdb3ef048a9f2a624c4), [`0994577`](https://github.com/likec4/likec4/commit/09945775fb0c4c64b79eae6f17ee0abce92ef8f1), [`9b9727f`](https://github.com/likec4/likec4/commit/9b9727fcd1201296c4d7e09f7446edd38669328a), [`d0a05fe`](https://github.com/likec4/likec4/commit/d0a05fe8e29105444762542c78c9861a13bfaff0), [`1814846`](https://github.com/likec4/likec4/commit/1814846f629971cec2a392222ab00c42abea47ed), [`061e687`](https://github.com/likec4/likec4/commit/061e6872ee80b1381d3ec047663a22d1ebe6bab5)]:
  - @likec4/core@1.59.0
  - @likec4/log@1.59.0

## 1.57.1

### Patch Changes

- Updated dependencies [[`f2c0b57`](https://github.com/likec4/likec4/commit/f2c0b57485e912e85a986d5f89408a6039538ecc), [`8ad28c7`](https://github.com/likec4/likec4/commit/8ad28c777c76f294483c352180c7e3ea037eddfd), [`75e1510`](https://github.com/likec4/likec4/commit/75e1510def804bf9931bf222b03d1034e1181d04)]:
  - @likec4/core@1.57.1
  - @likec4/log@1.57.1

## 1.57.0

### Minor Changes

- [#2878](https://github.com/likec4/likec4/pull/2878) [`b7ff481`](https://github.com/likec4/likec4/commit/b7ff48171a0812978857af3f9edbffc6bdfeac9f) Thanks [@davydkov](https://github.com/davydkov)! - Experimental: AI-assisted semantic layout for diagrams

  Add AI layout advisor that analyzes diagram semantics and suggests graphviz layout hints (rank constraints, edge weights, invisible edges) for more readable and visually balanced diagrams. Includes a VSCode chat participant and command for triggering AI layout enhancement.

  This feature is experimental and may change in future releases.

### Patch Changes

- Updated dependencies [[`311b93d`](https://github.com/likec4/likec4/commit/311b93de360556b9583b901c5ad3d6692b9c9f03), [`35ba3f6`](https://github.com/likec4/likec4/commit/35ba3f637e45fc1072646f646b3442b3235cc29d)]:
  - @likec4/core@1.57.0
  - @likec4/log@1.57.0

## 1.56.0

### Patch Changes

- Updated dependencies [[`af34764`](https://github.com/likec4/likec4/commit/af3476421fd8938a897240ad6fd1c70068d1e070), [`ace5b2e`](https://github.com/likec4/likec4/commit/ace5b2e5cd261f47bd2e93b6f495e2122ceef16d), [`5f46082`](https://github.com/likec4/likec4/commit/5f460821526d851ef3bbf8be5a2bd749c2df6a8a)]:
  - @likec4/log@1.56.0
  - @likec4/core@1.56.0

## 1.55.1

### Patch Changes

- Updated dependencies []:
  - @likec4/core@1.55.1
  - @likec4/log@1.55.1

## 1.55.0

### Patch Changes

- Updated dependencies [[`6b87578`](https://github.com/likec4/likec4/commit/6b87578486c821fdc1060d69867a10f3c7e6ca9b), [`f684e2f`](https://github.com/likec4/likec4/commit/f684e2fb59745fe62ac2b43c68f1e453ab884cc8), [`347b48f`](https://github.com/likec4/likec4/commit/347b48f7bb67e0a480e231d57c4feeca09b32383), [`9834ebb`](https://github.com/likec4/likec4/commit/9834ebbfa32bdcb40710aac9038839e9da70031e), [`c0048b6`](https://github.com/likec4/likec4/commit/c0048b6ca156508c893e072dfbf9d75bbe4dd8ad)]:
  - @likec4/core@1.55.0
  - @likec4/log@1.55.0

## 1.54.0

### Patch Changes

- Updated dependencies []:
  - @likec4/core@1.54.0
  - @likec4/log@1.54.0

## 1.53.0

### Patch Changes

- Updated dependencies [[`39df42e`](https://github.com/likec4/likec4/commit/39df42e69d11a74cfbda94258321860d9437a3f7)]:
  - @likec4/core@1.53.0
  - @likec4/log@1.53.0

## 1.52.0

### Patch Changes

- [#2713](https://github.com/likec4/likec4/pull/2713) [`bc47423`](https://github.com/likec4/likec4/commit/bc474235cf31a7d42e8c4f25328a698bb7edefe3) Thanks [@davydkov](https://github.com/davydkov)! - Remove deprecated ManualLayoutV1 and related migration command

- Updated dependencies [[`bc47423`](https://github.com/likec4/likec4/commit/bc474235cf31a7d42e8c4f25328a698bb7edefe3)]:
  - @likec4/core@1.52.0
  - @likec4/log@1.52.0

## 1.51.0

### Patch Changes

- Updated dependencies []:
  - @likec4/core@1.51.0
  - @likec4/log@1.51.0

## 1.50.0

### Patch Changes

- Updated dependencies [[`fe468d8`](https://github.com/likec4/likec4/commit/fe468d830544e6f0051ea2203ab137d46932d11e)]:
  - @likec4/core@1.50.0
  - @likec4/log@1.50.0

## 1.49.0

### Patch Changes

- Updated dependencies [[`f42c046`](https://github.com/likec4/likec4/commit/f42c046cd4bf1a3f4037cb2020268e729f018300), [`507bab3`](https://github.com/likec4/likec4/commit/507bab30cf9e30450cedfc4b27f67718a387b2e7), [`e10ea04`](https://github.com/likec4/likec4/commit/e10ea04bd2119b83cbd4c625640e63cd6e3f2e96), [`731a6cb`](https://github.com/likec4/likec4/commit/731a6cb278ef6bc06280bf1ba3b2d8f79c7d7fe6)]:
  - @likec4/core@1.49.0
  - @likec4/log@1.49.0

## 1.48.0

### Minor Changes

- [`68c6bf2`](https://github.com/likec4/likec4/commit/68c6bf286536e39ec316db906a425e2bfc852a83) Thanks [@davydkov](https://github.com/davydkov)! - Add icon customization options

  - Add iconColor, iconSize, and iconPosition properties to element styles
  - Support icon positioning (left, right, top, bottom) in diagrams and layouts
  - Enable custom icon colors and sizes in element specifications

### Patch Changes

- Updated dependencies [[`c333592`](https://github.com/likec4/likec4/commit/c333592b6342dc4a726864e970c8056bc65fafa8), [`68c6bf2`](https://github.com/likec4/likec4/commit/68c6bf286536e39ec316db906a425e2bfc852a83), [`9aa59c8`](https://github.com/likec4/likec4/commit/9aa59c81f40ac948b32842a265bfdfe48d21bddf), [`c186a08`](https://github.com/likec4/likec4/commit/c186a082c6fbb26d2b5169a9c28ca51e540622f6), [`6677d12`](https://github.com/likec4/likec4/commit/6677d124aaf6c45fb1456ce66a5c538634fe5fa0), [`c12f7a1`](https://github.com/likec4/likec4/commit/c12f7a108c19418403f5afc0c06c1e25565f6bf2), [`6ab5089`](https://github.com/likec4/likec4/commit/6ab5089fc2c1ce472fa5f5a471061056676e5546)]:
  - @likec4/core@1.48.0
  - @likec4/log@1.48.0

## 1.47.0

### Patch Changes

- Updated dependencies [[`dbaae67`](https://github.com/likec4/likec4/commit/dbaae67a2f00b6cacf1a0391cd8132b1d5f0e2ee), [`de2b294`](https://github.com/likec4/likec4/commit/de2b2942322f1a1b0ce4822e40c997ba3fff9e15), [`5e38c9b`](https://github.com/likec4/likec4/commit/5e38c9b2fced5fc43aee0326204a443d889a9d37)]:
  - @likec4/core@1.47.0

## 1.46.4

### Patch Changes

- Updated dependencies []:
  - @likec4/core@1.46.4

## 1.46.3

### Patch Changes

- Updated dependencies []:
  - @likec4/core@1.46.3

## 1.46.2

### Patch Changes

- Updated dependencies [[`9c5779d`](https://github.com/likec4/likec4/commit/9c5779d872d8de353adf706d1a0edbbcd8bb9671)]:
  - @likec4/core@1.46.2
