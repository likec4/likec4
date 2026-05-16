// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it } from 'vitest'
import { LikeC4AIRequestBodyTooLargeError, readLikeC4AIRequestBody } from './server'

async function* bodyChunks(...chunks: Array<string | Uint8Array>): AsyncIterable<unknown> {
  for (const chunk of chunks) {
    yield chunk
  }
}

describe('readLikeC4AIRequestBody', () => {
  it('parses request chunks into a chat request body', async () => {
    await expect(
      readLikeC4AIRequestBody(bodyChunks('{"messages"', ':[]}'), {
        maxBytes: 32,
      }),
    ).resolves.toEqual({
      messages: [],
    })
  })

  it('rejects request bodies larger than the configured limit', async () => {
    await expect(
      readLikeC4AIRequestBody(bodyChunks('{"messages":[] }'), {
        maxBytes: 8,
      }),
    ).rejects.toThrow(LikeC4AIRequestBodyTooLargeError)
  })

  it('rejects invalid request body shapes', async () => {
    await expect(
      readLikeC4AIRequestBody(bodyChunks('{"data":{}}')),
    ).rejects.toThrow('AI request body messages must be an array')

    await expect(
      readLikeC4AIRequestBody(bodyChunks('{"messages":[],"data":[]}')),
    ).rejects.toThrow('AI request body data must be an object')
  })
})
