# @likec4/diagram

## 1.48.0

### Minor Changes

- [`68c6bf2`](https://github.com/likec4/likec4/commit/68c6bf286536e39ec316db906a425e2bfc852a83) Thanks [@davydkov](https://github.com/davydkov)! - Add icon customization options

  - Add iconColor, iconSize, and iconPosition properties to element styles
  - Support icon positioning (left, right, top, bottom) in diagrams and layouts
  - Enable custom icon colors and sizes in element specifications

- [`cd71c00`](https://github.com/likec4/likec4/commit/cd71c00a36cfe3a065a578befe87f6b1d2d26a6d) Thanks [@ckeller42](https://github.com/ckeller42)! - Direct links to Relationship Views, thanks to @ckeller42 in [#2547](https://github.com/ckeller/likec4/pull/2547)

### Patch Changes

- [`c333592`](https://github.com/likec4/likec4/commit/c333592b6342dc4a726864e970c8056bc65fafa8) Thanks [@davydkov](https://github.com/davydkov)! - Fix compound node colors (based on element color and depth)

- [`9aa59c8`](https://github.com/likec4/likec4/commit/9aa59c81f40ac948b32842a265bfdfe48d21bddf) Thanks [@davydkov](https://github.com/davydkov)! - Improved color contrast and visual appearance for compound nodes (nested elements)

- [`6ab5089`](https://github.com/likec4/likec4/commit/6ab5089fc2c1ce472fa5f5a471061056676e5546) Thanks [@davydkov](https://github.com/davydkov)! - Improved font loading performance by migrating to variable fonts and enhanced diagram bounds calculation with better edge handling

- [`e9d70f0`](https://github.com/likec4/likec4/commit/e9d70f0e70c0df8ffa92accea156ecc4c8c20f35) Thanks [@davydkov](https://github.com/davydkov)! - Fix regression with centering dynamic views on switching between `diagram`/`sequence`

- Updated dependencies [[`c333592`](https://github.com/likec4/likec4/commit/c333592b6342dc4a726864e970c8056bc65fafa8), [`68c6bf2`](https://github.com/likec4/likec4/commit/68c6bf286536e39ec316db906a425e2bfc852a83), [`9aa59c8`](https://github.com/likec4/likec4/commit/9aa59c81f40ac948b32842a265bfdfe48d21bddf), [`3049b78`](https://github.com/likec4/likec4/commit/3049b78701df485fff6fae2f0ac9ee08873872c2), [`c186a08`](https://github.com/likec4/likec4/commit/c186a082c6fbb26d2b5169a9c28ca51e540622f6), [`6677d12`](https://github.com/likec4/likec4/commit/6677d124aaf6c45fb1456ce66a5c538634fe5fa0), [`c12f7a1`](https://github.com/likec4/likec4/commit/c12f7a108c19418403f5afc0c06c1e25565f6bf2), [`6ab5089`](https://github.com/likec4/likec4/commit/6ab5089fc2c1ce472fa5f5a471061056676e5546)]:
  - @likec4/core@1.48.0
  - @likec4/styles@1.48.0

## 1.47.0

### Patch Changes

- [#2520](https://github.com/likec4/likec4/pull/2520) [`0112f3d`](https://github.com/likec4/likec4/commit/0112f3deb18d065ce1d97872095b8496cf2dfc97) Thanks [@davydkov](https://github.com/davydkov)! - - Change in LikeC4View React: callback `onBurgerMenuClick` renamed to `onLogoClick`

- [#2521](https://github.com/likec4/likec4/pull/2521) [`de2b294`](https://github.com/likec4/likec4/commit/de2b2942322f1a1b0ce4822e40c997ba3fff9e15) Thanks [@davydkov](https://github.com/davydkov)! - - Add two new shapes: `document` and `bucket`
  - Apply border style to element node (previously it was applied to compound nodes and groups), closes [#2502](https://github.com/likec4/likec4/issues/2502)
- Updated dependencies [[`dbaae67`](https://github.com/likec4/likec4/commit/dbaae67a2f00b6cacf1a0391cd8132b1d5f0e2ee), [`de2b294`](https://github.com/likec4/likec4/commit/de2b2942322f1a1b0ce4822e40c997ba3fff9e15), [`5e38c9b`](https://github.com/likec4/likec4/commit/5e38c9b2fced5fc43aee0326204a443d889a9d37)]:
  - @likec4/core@1.47.0
  - @likec4/styles@1.47.0

## 1.46.4

### Patch Changes

- Updated dependencies []:
  - @likec4/core@1.46.4
  - @likec4/styles@1.46.4

## 1.46.3

### Patch Changes

- Updated dependencies []:
  - @likec4/styles@1.46.3
  - @likec4/core@1.46.3

## 1.46.2

### Patch Changes

- Fixed transparent background of the properties window ([#2473](https://github.com/likec4/likec4/issues/2473))
- Updated dependencies [[`9c5779d`](https://github.com/likec4/likec4/commit/9c5779d872d8de353adf706d1a0edbbcd8bb9671)]:
  - @likec4/core@1.46.2
