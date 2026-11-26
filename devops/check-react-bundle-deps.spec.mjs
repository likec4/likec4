import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { checkReactBundleDeps } from './check-react-bundle-deps.mjs'

describe('checkReactBundleDeps', () => {
  it('passes for the repository package.json files', () => {
    const { shared } = checkReactBundleDeps()
    assert.ok(shared.includes('react'))
    assert.ok(shared.includes('react-dom'))
    assert.ok(shared.includes('@mantine/core'))
  })

  it('fails when spa and react diverge', () => {
    assert.throws(
      () =>
        checkReactBundleDeps({
          readPackage: (relativePath) => {
            if (relativePath.endsWith('likec4-spa/package.json')) {
              return {
                dependencies: {
                  react: 'catalog:react',
                  'react-dom': 'catalog:react',
                },
              }
            }
            if (relativePath.endsWith('react/package.json')) {
              return {
                dependencies: {
                  react: 'catalog:react',
                  'react-dom': 'catalog:react',
                  motion: 'catalog:react',
                },
              }
            }
            return {
              dependencies: {
                react: 'catalog:react',
                'react-dom': 'catalog:react',
                motion: 'catalog:react',
              },
            }
          },
        }),
      /must declare the same dependency keys/,
    )
  })

  it('fails when likec4 is missing a shared dep', () => {
    assert.throws(
      () =>
        checkReactBundleDeps({
          readPackage: (relativePath) => {
            if (relativePath.endsWith('likec4/package.json')) {
              return {
                dependencies: {
                  react: 'catalog:react',
                  'react-dom': 'catalog:react',
                },
              }
            }
            return {
              dependencies: {
                react: 'catalog:react',
                'react-dom': 'catalog:react',
                motion: 'catalog:react',
              },
            }
          },
        }),
      /missing shared React-bundle dep "motion"/,
    )
  })

  it('fails when likec4 uses a different version spec', () => {
    assert.throws(
      () =>
        checkReactBundleDeps({
          readPackage: (relativePath) => {
            if (relativePath.endsWith('likec4/package.json')) {
              return {
                dependencies: {
                  react: '^19.0.0',
                  'react-dom': 'catalog:react',
                  motion: 'catalog:react',
                },
              }
            }
            return {
              dependencies: {
                react: 'catalog:react',
                'react-dom': 'catalog:react',
                motion: 'catalog:react',
              },
            }
          },
        }),
      /disagree on "react"/,
    )
  })
})
