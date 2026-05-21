// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it } from 'vitest'
import { scopeStylesToShadowRoot } from './styles.css'

describe('scopeStylesToShadowRoot', () => {
  it('moves root-level variables into the shadow root without rewriting overlay body selectors', () => {
    const scoped = scopeStylesToShadowRoot(`
:where(:root,:host){--colors-likec4-overlay-body:var(--mantine-color-body)}
:where(:root, :host){--colors-likec4-app-background:var(--mantine-color-body)}
:root{--colors-likec4-overlay-border:transparent}
body { margin: 0 }
.likec4-overlay .likec4-overlay-body{background:var(--colors-likec4-overlay-body)}
:host{display:block}
`)

    expect(scoped).toContain(
      ':where(.likec4-shadow-root){--colors-likec4-overlay-body:var(--mantine-color-body)}',
    )
    expect(scoped).toContain(
      ':where(.likec4-shadow-root){--colors-likec4-app-background:var(--mantine-color-body)}',
    )
    expect(scoped).toContain('.likec4-shadow-root{--colors-likec4-overlay-border:transparent}')
    expect(scoped).toContain('.likec4-shadow-root { margin: 0 }')
    expect(scoped).toContain(
      '.likec4-overlay .likec4-overlay-body{background:var(--colors-likec4-overlay-body)}',
    )
    expect(scoped).toContain(':host{display:block}')
    expect(scoped).not.toContain('.likec4-overlay .likec4-overlay-.likec4-shadow-root')
  })

  it('does not rewrite descendant body selectors', () => {
    const scoped = scopeStylesToShadowRoot(`
html body { color: red }
html, body { min-height: 100% }
body, html { background: white }
@media (prefers-color-scheme: dark) { body { color: white } }
@charset "UTF-8"; body { color: black }
/* reset */ body{line-height:1}
.foo{}body{padding:0}
html,body{width:100%}
`)

    expect(scoped).toContain('html body { color: red }')
    expect(scoped).toContain('html, .likec4-shadow-root { min-height: 100% }')
    expect(scoped).toContain('.likec4-shadow-root, html { background: white }')
    expect(scoped).toContain('@media (prefers-color-scheme: dark) { .likec4-shadow-root { color: white } }')
    expect(scoped).toContain('@charset "UTF-8"; .likec4-shadow-root { color: black }')
    expect(scoped).toContain('/* reset */ .likec4-shadow-root{line-height:1}')
    expect(scoped).toContain('.foo{}.likec4-shadow-root{padding:0}')
    expect(scoped).toContain('html,.likec4-shadow-root{width:100%}')
  })
})
