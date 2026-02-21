# @likec4/config

## 1.49.0

### Patch Changes

- [`3f28e65`](https://github.com/likec4/likec4/commit/3f28e65162d895a5afd3b61e3dcf1c0c9d67c661) Thanks [@davydkov](https://github.com/davydkov)! - Allow JSON configs to extend other configs and merge styles from them. Closes [#2573](https://github.com/likec4/likec4/issues/2573)

  ```json
  {
    "name": "project-name",
    "extends": ["../shared/base-config.json", "../shared/theme-config.json"],
    "styles": {
      "defaults": {
        "relationship": {
          "arrow": "vee"
        }
      }
    }
  }
  ```

- [#2620](https://github.com/likec4/likec4/pull/2620) [`39447c5`](https://github.com/likec4/likec4/commit/39447c5f59ce2466cc7a01f7bc5aaef4cb6fcb45) Thanks [@davydkov](https://github.com/davydkov)! - Internal restructuring for better maintainability:
  - `@likec4/language-services` - for cross-platform language services initialization
  - `@likec4/react` - bundled version of `@likec4/diagram`
  - `@likec4/vite-plugin` - to separate concerns
- Updated dependencies [[`f42c046`](https://github.com/likec4/likec4/commit/f42c046cd4bf1a3f4037cb2020268e729f018300), [`507bab3`](https://github.com/likec4/likec4/commit/507bab30cf9e30450cedfc4b27f67718a387b2e7), [`e10ea04`](https://github.com/likec4/likec4/commit/e10ea04bd2119b83cbd4c625640e63cd6e3f2e96), [`731a6cb`](https://github.com/likec4/likec4/commit/731a6cb278ef6bc06280bf1ba3b2d8f79c7d7fe6)]:
  - @likec4/core@1.49.0
  - @likec4/log@1.49.0

## 1.48.0

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
