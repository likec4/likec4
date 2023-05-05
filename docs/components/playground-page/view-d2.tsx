import { cn } from '$/lib'
import type { DiagramView } from '@likec4/diagrams'
import { generateD2 } from '@likec4/generators'
import { CodeWindow } from '../CodeWindow'
import { ScrollArea } from '../ui/scroll-area'


type PlaygroundViewD2Props = {
  diagram: DiagramView
}

export default function PlaygroundViewD2({ diagram }: PlaygroundViewD2Props) {
  return <div className={cn('flex-1', 'flex', 'p-5')}>
    <CodeWindow className={cn('flex-1')}>
      <ScrollArea>
        <pre className={cn(
          'py-2 px-4',
          'text-xs font-medium leading-normal',
          'text-slate-900 dark:text-slate-300'
        )}>{generateD2(diagram)}</pre>
      </ScrollArea>
    </CodeWindow>
  </div>
}
