// SPDX-License-Identifier: MIT
//
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { searchBodyCss, SearchControl, searchDialogCss, SearchPanelContent } from '@likec4/diagram'
import { FramerMotionConfig, Overlay } from '@likec4/diagram/custom'
import { useHotkeys } from '@mantine/hooks'
import { AnimatePresence } from 'motion/react'
import { memo, useCallback, useState } from 'react'
import { OverviewSearchAdapter } from './OverviewSearchAdapter'

export const OverviewSearch = memo(() => {
  const [isOpened, setIsOpened] = useState(false)

  const open = useCallback(() => setIsOpened(true), [])
  const close = useCallback(() => setIsOpened(false), [])

  useHotkeys([
    ['mod+k', open, { preventDefault: true }],
  ])

  return (
    <>
      <SearchControl onClick={open} />
      <FramerMotionConfig>
        <AnimatePresence>
          {isOpened && (
            <Overlay
              fullscreen
              withBackdrop={false}
              backdrop={{
                opacity: 0.9,
              }}
              classes={{
                dialog: searchDialogCss,
                body: searchBodyCss,
              }}
              openDelay={0}
              onClose={close}
              data-likec4-search="true"
            >
              <OverviewSearchAdapter onClose={close}>
                <SearchPanelContent />
              </OverviewSearchAdapter>
            </Overlay>
          )}
        </AnimatePresence>
      </FramerMotionConfig>
    </>
  )
})
OverviewSearch.displayName = 'OverviewSearch'
