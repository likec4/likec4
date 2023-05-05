import { cn } from '$/lib'
import type { DiagramView } from '@likec4/diagrams'
import { Callout } from "nextra-theme-docs"

type PlaygroundViewDotProps = {
  diagram: DiagramView
}

export default function PlaygroundViewDot({ diagram }: PlaygroundViewDotProps) {
  return <div className={cn('flex-1', 'p-5')}>
    <Callout emoji="🚧">
      In progress
    </Callout>
  </div>
}
