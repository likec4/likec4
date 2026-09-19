import { css } from '@likec4/styles/css'

/**
 * The outline reads as a stack of planes: the nesting level the walkthrough is standing on
 * renders at full strength, and every level *above* it steps back in contrast, saturation
 * and surface tone. `--seq-r` is that distance (0 = you are here, capped at {@link MAX_RECESSION}).
 *
 * The recession is relative, not absolute — it is recomputed as the walkthrough enters and
 * leaves a fragment, so stepping back out to the root flattens the panel again.
 */
const MAX_RECESSION = 3

/** Distance, in nesting levels, between a level and the one the walkthrough stands on. */
export const recessionOf = (depth: number, activeDepth: number) =>
  Math.min(MAX_RECESSION, Math.max(0, activeDepth - depth))

/** Per-level falloff, applied once per step of `--seq-r`. */
const OPACITY_STEP = 0.26
const SATURATION_STEP = 0.286

/**
 * Depth is mixed toward black rather than toward the canvas token: in dark mode canvas is
 * darker than the panel, but in light mode the two are both white, so only a neutral shade
 * recedes in both schemes.
 */
const SHADE_STEP = '4.55%'

/** Panel surface, shaded by the current `--seq-r`. */
export const shadedPanelBg = css.raw({
  background: `[color-mix(in srgb, {colors.likec4.panel.bg}, #000 calc(var(--seq-r, 0) * ${SHADE_STEP}))]`,
})

/** A row that has stepped back: lower contrast and saturation, restored on hover. */
export const recessed = css.raw({
  opacity: `[calc(1 - var(--seq-r, 0) * ${OPACITY_STEP})]`,
  filter: `[saturate(calc(1 - var(--seq-r, 0) * ${SATURATION_STEP}))]`,
  // transitionProperty: '[opacity, filter]',
  // transition: 'slow',
  // Nothing that has receded should be unreadable when you reach for it.
  _hover: {
    opacity: '1',
    filter: '[none]',
  },
})

/** A nesting level, as a full-bleed tonal band. Tone only — no border, no radius, no card. */
export const levelBand = css.raw(shadedPanelBg, {
  position: 'relative',
  marginInline: '-2',
  paddingInline: '2',
  marginBlock: '0.5',
  transitionProperty: 'background',
  transition: 'slow',
})

/**
 * A fragment nested *below* the level you are standing on: structure, not colour.
 *
 * Fills do not survive nesting — five levels of translucent fragment tint compound into mud,
 * and a fragment you are not inside has no claim on the eye. Depth is carried by an indent and
 * a hairline in the fragment's own colour; the tag pill and icon already say which kind it is.
 */
export const nestedBand = css.raw({
  background: 'transparent',
  marginInline: '0',
  marginBlock: '0.5',
  // paddingBottom: '1',
  paddingInline: '0',
  paddingLeft: '2',
  borderLeft: 'default',
  borderLeftColor: 'colorPalette.border',
  rounded: '0',
})

/** The fragment you are standing inside, framed the way the canvas frames it. */
export const activeFrame = css.raw({
  background: '[linear-gradient(var(--seq-frame-bg), var(--seq-frame-bg)), {colors.likec4.panel.bg}]',
  // Clear of the frame line on every side, so the step does not sit on the border.
  paddingInline: '3',
  paddingBlock: '1.5',
  marginBlock: '0',
})

/** Hairline drawn around the fragment you are standing inside. */
export const activeFrameBorder = css({
  position: 'absolute',
  inset: '[0 10px 0 4px]',
  border: '[1px solid {colors.colorPalette.border}]',
  rounded: 'md',
  pointerEvents: 'none',
})
