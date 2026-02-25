// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { createContext, useContext } from 'react'
import type { AIChatActorRef } from './actor'

export const AIChatActorContext = createContext<AIChatActorRef | null>(null)
AIChatActorContext.displayName = 'AIChatActorContext'

export const useAIChatActorRef = (): AIChatActorRef => {
  const ctx = useContext(AIChatActorContext)
  if (ctx === null) {
    throw new Error('AIChatActorRef is not provided')
  }
  return ctx
}
