// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { Relationship } from '@likec4/core'
import { FqnRef } from '@likec4/core/types'
import { stringHash } from '../utils/stringHash'

type FingerprintSource = {
  source: Relationship['source']
  target: Relationship['target']
  kind?: Relationship['kind'] | undefined
  title?: Relationship['title'] | undefined
  isBidirectional?: Relationship['isBidirectional'] | undefined
}

export function relationFingerprint({
  source,
  target,
  kind,
  title,
  isBidirectional,
}: FingerprintSource): Relationship['id'] {
  let sourceKey = FqnRef.flatten(source)
  let targetKey = FqnRef.flatten(target)
  if (isBidirectional && targetKey < sourceKey) {
    const normalizedSource = targetKey
    targetKey = sourceKey
    sourceKey = normalizedSource
  }
  return stringHash(
    'extend-relation',
    sourceKey,
    targetKey,
    kind ?? 'default',
    title ?? '',
    isBidirectional ? 'bidirectional' : 'directed',
  ) as Relationship['id']
}
