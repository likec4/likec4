// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { FC, ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { customizable, defineCustomComponents } from './customizable'
import {
  type CustomComponent,
  type CustomComponents,
  type Wrapper,
  WrappedMarker,
} from './customization-types'
import { CustomizationProvider } from './CustomizationContext'
import { applyStableCustomComponents } from './stableComponents'

const SpecSlot = customizable('SpecSlot')(
  ({ label }: { label: string }) => <span data-testid="original">{label}</span>,
)

const SpecHmrSlot = customizable('SpecHmrSlot')(
  ({ label }: { label: string }) => <span data-testid="hmr-original">{label}</span>,
)

type SpecSlotProps = { label: string }

// Same shapes as `Partial<Customizables>` and `CustomComponents`, for the spec slot
type SpecSlots = {
  SpecSlot?: FC<SpecSlotProps>
}
type SpecComponents = CustomComponents & {
  SpecSlot?: CustomComponent<FC<SpecSlotProps>>
}

type SpecWrap = (wrapper: Wrapper<SpecSlotProps>) => FC<SpecSlotProps>

/**
 * {@link defineCustomComponents} for spec slots: they are not registered in `Customizables`
 */
function defineSpecComponents(value: SpecSlots | ((ctx: { wrap: SpecWrap }) => SpecSlots)): SpecComponents {
  return defineCustomComponents(value as never) as SpecComponents
}

function render(ui: ReactNode) {
  return renderToStaticMarkup(ui)
}

describe('defineCustomComponents', () => {
  it('returns the map as-is', () => {
    const replace = ({ label }: SpecSlotProps) => <span>{label}</span>
    const components = defineSpecComponents({ SpecSlot: replace })
    expect(components.SpecSlot).toBe(replace)
  })

  it('marks wrap overrides with WrappedMarker', () => {
    const components = defineSpecComponents(({ wrap }) => ({
      SpecSlot: wrap(({ Original, label }) => <Original label={label} />),
    }))
    expect(components.SpecSlot?.[WrappedMarker]).toBe(true)
  })
})

describe('customizable / CustomizationProvider', () => {
  it('renders the original when no provider is present', () => {
    const html = render(<SpecSlot label="hello" />)
    expect(html).toContain('data-testid="original"')
    expect(html).toContain('hello')
  })

  it('falls through to the original when the provider has no override', () => {
    const html = render(
      <CustomizationProvider components={{}}>
        <SpecSlot label="fallback" />
      </CustomizationProvider>,
    )
    expect(html).toContain('data-testid="original"')
    expect(html).toContain('fallback')
  })

  it('replaces the registered component', () => {
    const components = defineSpecComponents({
      SpecSlot: ({ label }) => <span data-testid="replaced">{label.toUpperCase()}</span>,
    })

    const html = render(
      <CustomizationProvider components={components}>
        <SpecSlot label="hello" />
      </CustomizationProvider>,
    )
    expect(html).toContain('data-testid="replaced"')
    expect(html).toContain('HELLO')
    expect(html).not.toContain('data-testid="original"')
  })

  it('wraps the original via defineCustomComponents({ wrap })', () => {
    const components = defineSpecComponents(({ wrap }) => ({
      SpecSlot: wrap(({ Original, label }) => (
        <div data-testid="wrapped">
          <Original label={`*${label}*`} />
        </div>
      )),
    }))

    const html = render(
      <CustomizationProvider components={components}>
        <SpecSlot label="hi" />
      </CustomizationProvider>,
    )
    expect(html).toContain('data-testid="wrapped"')
    expect(html).toContain('data-testid="original"')
    expect(html).toContain('*hi*')
  })

  it('re-registration keeps the same Registered shell (module HMR stand-in)', () => {
    const first = SpecHmrSlot
    const second = customizable('SpecHmrSlot')(
      ({ label }: { label: string }) => <em data-testid="hmr">{label}</em>,
    )
    expect(second).toBe(first)

    const html = render(<SpecHmrSlot label="after-hmr" />)
    expect(html).toContain('data-testid="hmr"')
    expect(html).toContain('after-hmr')
  })
})

describe('applyStableCustomComponents', () => {
  it('keeps the same instance identity when the override body is replaced', () => {
    const instances = {}
    const v1 = defineSpecComponents({
      SpecSlot: ({ label }) => <span data-v="1">{label}</span>,
    })
    const v2 = defineSpecComponents({
      SpecSlot: ({ label }) => <span data-v="2">{label}</span>,
    })

    const first = applyStableCustomComponents(instances, v1)
    const second = applyStableCustomComponents(instances, v2)

    expect(first?.SpecSlot).toBeDefined()
    expect(second?.SpecSlot).toBe(first?.SpecSlot)
    expect(first?.SpecSlot).not.toBe(v1.SpecSlot)
    expect(v1.SpecSlot).not.toBe(v2.SpecSlot)
  })

  it('propagates and clears the wrap marker on the stable instance', () => {
    const instances = {}
    const wrapped = defineSpecComponents(({ wrap }) => ({
      SpecSlot: wrap(({ Original, label }) => <Original label={label} />),
    }))
    const replaced = defineSpecComponents({
      SpecSlot: ({ label }) => <span>{label}</span>,
    })

    const asWrap = applyStableCustomComponents(instances, wrapped)
    expect(asWrap?.SpecSlot?.[WrappedMarker]).toBe(true)

    const asReplace = applyStableCustomComponents(instances, replaced)
    expect(asReplace?.SpecSlot).toBe(asWrap?.SpecSlot)
    expect(asReplace?.SpecSlot?.[WrappedMarker]).toBeUndefined()
  })

  it('returns undefined for empty overrides', () => {
    expect(applyStableCustomComponents({}, undefined)).toBeUndefined()
    expect(applyStableCustomComponents({}, {})).toBeUndefined()
  })
})
