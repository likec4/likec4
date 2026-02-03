import type { PropsWithChildren } from 'react'

export function ErrorMessage({ children }: PropsWithChildren) {
  return (
    <div
      style={{
        margin: '1em 0',
      }}>
      <div
        style={{
          margin: '0 auto',
          display: 'inline-block',
          padding: '2em',
          background: 'rgba(250,82,82,.15)',
          color: '#ffa8a8',
        }}>
        {children}
      </div>
    </div>
  )
}

export function ViewNotFound({ viewId }: { viewId: string }) {
  return (
    <ErrorMessage>
      View <code>{viewId}</code> not found
    </ErrorMessage>
  )
}
