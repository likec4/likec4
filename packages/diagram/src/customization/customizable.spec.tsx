// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { FC, ReactNode } from 'react'
import type { Wrapper } from './customization-types'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { type CustomizationProvider, createCustomization, customizeComponents } from './createCustomization'
import { customizable } from './customizable'

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
type SpecWrap = (wrapper: Wrapper<SpecSlotProps>) => FC<SpecSlotProps>

/**
 * {@link createCustomization} for spec slots: they are not registered in `Customizables`
 */
function specCustomization(value: SpecSlots | ((ctx: { wrap: SpecWrap }) => SpecSlots)): CustomizationProvider {
  return createCustomization({
    components: customizeComponents(value as never),
  })
}

function render(ui: ReactNode) {
  return renderToStaticMarkup(ui)
}

describe('customizable / CustomizationProvider', () => {
  it('renders the original when no provider is present', () => {
    const html = render(<SpecSlot label="hello" />)
    expect(html).toContain('data-testid="original"')
    expect(html).toContain('hello')
  })

  it('falls through to the original when the provider has no override', () => {
    const Customization = specCustomization({})
    const html = render(
      <Customization>
        <SpecSlot label="fallback" />
      </Customization>,
    )
    expect(html).toContain('data-testid="original"')
    expect(html).toContain('fallback')
  })

  it('replaces the registered component', () => {
    const Customization = specCustomization({
      SpecSlot: ({ label }) => <span data-testid="replaced">{label.toUpperCase()}</span>,
    })

    const html = render(
      <Customization>
        <SpecSlot label="hello" />
      </Customization>,
    )
    expect(html).toContain('data-testid="replaced"')
    expect(html).toContain('HELLO')
    expect(html).not.toContain('data-testid="original"')
  })

  it('wraps the original via customizeComponents({ wrap })', () => {
    const Customization = specCustomization(({ wrap }) => ({
      SpecSlot: wrap(({ Original, label }) => (
        <div data-testid="wrapped">
          <Original label={`*${label}*`} />
        </div>
      )),
    }))

    const html = render(
      <Customization>
        <SpecSlot label="hi" />
      </Customization>,
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
