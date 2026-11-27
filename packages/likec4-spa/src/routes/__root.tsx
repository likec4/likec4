// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { ProjectId } from '@likec4/core/types'
import { FramerMotionConfig, LikeC4MantineProvider } from '@likec4/diagram'
import { createRootRouteWithContext, Outlet, stripSearchParams } from '@tanstack/react-router'
import { defaultTheme } from 'likec4:app-config'
import { CustomizationProvider } from 'likec4:customization'
import { ErrorBoundary, ErrorComponent } from '../components/ErrorComponent'
import { resolveForceColorScheme, searchParamsSchema } from '../searchParams'
import { LikeC4ProjectsContext } from '../context/LikeC4ProjectsContext'

export type Context = {
  /**
   * Default (current) project
   */
  projectId: ProjectId

  /**
   * All projects
   */
  projects: readonly [ProjectId, ...ProjectId[]]
}

export const Route = createRootRouteWithContext<Context>()({
  validateSearch: searchParamsSchema,
  search: {
    middlewares: [
      stripSearchParams({
        padding: 20,
        theme: undefined,
        dynamic: undefined,
        diff: undefined,
        relationships: undefined,
        focusOnElement: undefined,
      }),
    ],
  },
  // component: RootComponent,
  errorComponent: ErrorComponent,
  shellComponent: RootShellComponent
})


function RootShellComponent({ children }: { children: React.ReactNode }) {
  const theme = Route.useSearch({
    select: (search) => search.theme,
  })
  // When ?theme= is explicitly set in URL, force that color scheme without
  // writing to localStorage. This preserves the user's manual preference
  // while allowing embeds to override the appearance via URL.
  const forceColorScheme = resolveForceColorScheme(theme)
  // When ?theme=auto is explicitly set, restore system preference even if
  // the build default is light or dark.
  const defaultColorScheme = theme === 'auto' ? 'auto' : defaultTheme
  return (
    
    <LikeC4MantineProvider
      defaultColorScheme={defaultColorScheme}
      {...(forceColorScheme && { forceColorScheme })}
    >
      <FramerMotionConfig>
        <CustomizationProvider>
          <LikeC4ProjectsContext>
            {children}
          </LikeC4ProjectsContext>
        </CustomizationProvider>
      </FramerMotionConfig>
    </LikeC4MantineProvider>
  )
}

// function RootComponent() {
//   // const theme = Route.useSearch({
//   //   select: (search) => search.theme,
//   //   structuralSharing: true,    
//   // })
//   // // When ?theme= is explicitly set in URL, force that color scheme without
//   // // writing to localStorage. This preserves the user's manual preference
//   // // while allowing embeds to override the appearance via URL.
//   // const forceColorScheme = resolveForceColorScheme(theme)
//   // // When ?theme=auto is explicitly set, restore system preference even if
//   // // the build default is light or dark.
//   // const defaultColorScheme = theme === 'auto' ? 'auto' : defaultTheme
//   return (
//     // <LikeC4MantineProvider
//     //   defaultColorScheme={defaultColorScheme}
//     //   {...(forceColorScheme && { forceColorScheme })}
//     // >
//     //   <FramerMotionConfig>
//         <ErrorBoundary>
//           <LikeC4ProjectsContext>
            
//               <Outlet />
//             {/* </CustomizationProvider> */}
//           </LikeC4ProjectsContext>
//         </ErrorBoundary>
//     //   </FramerMotionConfig>
//     // </LikeC4MantineProvider>
//   )
// }
