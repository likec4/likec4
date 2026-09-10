import { nonexhaustive } from '@likec4/core'
import { css, cx } from '@likec4/styles/css'
import { type IconProps, IconDirectionSignFilled, IconStack2, IconStarFilled, IconZoomScan } from '@tabler/icons-react'
import type { JSX } from 'react/jsx-runtime'

const viewTypeIconCss = css({
  verticalAlign: 'middle',
  opacity: {
    base: '0.4',
    _dark: '0.5',
    _groupHover: '0.8',
    _groupActive: '0.8',
    _groupFocus: '0.8',
  },
})
const viewIcons = {
  index: <IconStarFilled size={16} className={viewTypeIconCss} />,
  element: (
    <IconZoomScan
      size={18}
      stroke={2}
      className={viewTypeIconCss} />
  ),
  deployment: <IconStack2 size={16} stroke={1.5} className={viewTypeIconCss} />,
  dynamic: <IconDirectionSignFilled size={18} className={viewTypeIconCss} />,
}

/**
 * Returns the appropriate icon component for a given view type.
 * @param viewType - The type of view ('index', 'element', 'deployment', or 'dynamic')
 * @returns The corresponding icon component
 */
export function viewIcon(viewType: 'index' | 'element' | 'deployment' | 'dynamic'): JSX.Element {
  return viewIcons[viewType]
}

export function ViewIcon(
  { type, className, ...props }: IconProps & { type: 'index' | 'element' | 'deployment' | 'dynamic' },
) {
  if (type === 'index') {
    return <IconStarFilled size={16} className={cx(viewTypeIconCss, className)} {...props} />
  }
  if (type === 'element') {
    return <IconZoomScan size={18} stroke={2} className={cx(viewTypeIconCss, className)} {...props} />
  }
  if (type === 'deployment') {
    return <IconStack2 size={16} stroke={1.5} className={cx(viewTypeIconCss, className)} {...props} />
  }
  if (type === 'dynamic') {
    return <IconDirectionSignFilled size={18} className={cx(viewTypeIconCss, className)} {...props} />
  }
  nonexhaustive(type)
}
