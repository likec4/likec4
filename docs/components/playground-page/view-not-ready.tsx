import { cn } from '$/lib'
import type { DiagramView } from '@likec4/diagrams'
import { Callout } from 'nextra-theme-docs'

type PlaygroundViewNotReadyProps = {
  diagram: DiagramView
}

export default function PlaygroundViewNotReady(_props: PlaygroundViewNotReadyProps) {
  return (
    <div className={cn('flex-1', 'p-5')}>
      <Callout emoji="🚧">
        In progress
      </Callout>
    </div>
  )
}
