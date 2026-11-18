import { type ElementShapeProps, defineCustomComponents } from 'likec4/react'

function CustomShape({ data, width, height }: ElementShapeProps) {
  const w = width ?? data.width
  const h = height ?? data.height
  return (
    <svg
      data-testid="custom-shape"
      data-shape={data.shape}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <rect width={w} height={h} rx={24} fill="var(--likec4-palette-fill)" stroke="var(--likec4-palette-stroke)" />
    </svg>
  )
}

export default defineCustomComponents(({ wrap }) => ({
  // Replace
  ElementShape: CustomShape,
  // Wrap
  LikeC4Diagram: wrap(({ Original, ...props }) => (
    <>
      <Original {...props} />
      <div data-testid="custom-wrap" style={{ position: 'fixed', top: 8, right: 8, zIndex: 1000 }}>
        customized
      </div>
    </>
  )),
}))
