/* eslint-disable @typescript-eslint/no-explicit-any */
import { lazy } from 'react'
export * from './ViewAsReact'

export const ViewAs = lazy(async () => await import('./other-formats'))

// export const ViewAs = {
//   Dot: ViewAsDot,
//   D2: ViewAsD2,
//   Mmd: ViewAsMmd,
// } satisfies Record<Capitalize<Exclude<ViewMode, 'react'>>, React.FunctionComponent<any>>

// export const ViewAsReact = lazy(() => import('./ViewAsReact'))
// export const ViewAsReact = lazy(() => import('./ViewAsReact'))
