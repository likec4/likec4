import type { Color } from '@likec4/core/types'
import { css } from '@likec4/styles/css'
import { useLikeC4Styles } from '../../hooks/useLikeC4Styles'

const hubCounts = css({
  position: 'absolute',
  top: '1',
  right: '2',
  fontSize: 'xs',
  fontWeight: 'semibold',
  pointerEvents: 'none',
  whiteSpace: 'nowrap',
})

/**
 * Incoming and outgoing edge counts of a project, among the visible edges.
 * Uses the text color of the project box.
 */
export function HubCounts({ color, fanIn = 0, fanOut = 0 }: {
  color: Color
  fanIn?: number | undefined
  fanOut?: number | undefined
}) {
  const styles = useLikeC4Styles()
  if (fanIn === 0 && fanOut === 0) {
    return null
  }
  return (
    <div
      className={hubCounts}
      style={{ color: styles.colors(color).elements.hiContrast }}
      title={`${fanIn} incoming, ${fanOut} outgoing`}
    >
      {`↓${fanIn} ↑${fanOut}`}
    </div>
  )
}
