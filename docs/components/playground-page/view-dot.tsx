import { cn } from '$/lib'
import type { DiagramView } from '@likec4/diagrams'
import { useState } from 'react'
import useSWR from 'swr'
import { CodePanel } from '../CodePanel'
import styles from './view-dot.module.css'

const fetchFromKroki = async (dot: string) => {
  const res = await fetch('https://kroki.io/graphviz', {
    method: 'POST',
    body: JSON.stringify({
      diagram_source: dot,
      diagram_type: 'graphviz',
      output_format: 'svg'
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return await res.text()
}

type PlaygroundViewDotProps = {
  diagram: DiagramView
  dot: string
}

const tabClassName = (isActive = false) =>
  cn(
    'text-sm font-medium leading-loose px-3',
    'text-slate-400',
    'cursor-pointer rounded-xl',
    'hover:text-slate-300',
    isActive && 'bg-neutral-600 text-slate-300'
  )

export default function PlaygroundViewDot({ dot }: PlaygroundViewDotProps) {
  const [tab, setTab] = useState<'source' | 'render'>('source')

  const { data } = useSWR(tab == 'render' ? dot : null, fetchFromKroki, {
    revalidateIfStale: false,
    keepPreviousData: true
  })

  return (
    <div className={cn('flex-auto flex m-4 relative overflow-hidden')}>
      <CodePanel
        className={cn('flex-auto flex flex-col')}
        style={{
          padding: 0
        }}
      >
        <div className='pl-24 py-2'>
          <div className='inline-flex space-x-1 px-1 py-1 bg-neutral-700 bg-opacity-50 rounded-xl'>
            <div
              className={tabClassName(tab === 'source')}
              //  className={cn(
              //   'text-sm font-medium leading-loose px-3',
              //   'text-slate-400',
              //   'cursor-pointer rounded-xl',
              //   'hover:text-slate-300',
              //   tab === 'source' && 'bg-neutral-600 text-slate-300'
              // )}
              onClick={() => setTab('source')}
            >
              source
            </div>
            <div
              className={tabClassName(tab === 'render')}
              // className={cn(
              //   'text-sm font-medium leading-loose px-3',
              //   'text-slate-400',
              //   'cursor-pointer rounded-xl',
              //   'hover:text-slate-300',
              //   tab === 'render' && 'bg-neutral-600 text-slate-300'
              // )}
              onClick={() => setTab('render')}
            >
              rendered with kroki
            </div>
          </div>
        </div>
        <div className={'overflow-auto'}>
          {tab === 'source' && <code className='whitespace-pre px-5'>{dot}</code>}
          {tab === 'render' && (
            <>
              {!data && <>loading...</>}
              {data && (
                <div
                  className={styles.renderContainer}
                  dangerouslySetInnerHTML={{ __html: data }}
                />
              )}
            </>
          )}
        </div>
      </CodePanel>
    </div>
  )
}
