// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { type scalar, RichText } from '@likec4/core'
import { css, cx } from '@likec4/styles/css'
import type { CSSProperties, Ref } from 'react'
import { Markdown } from '../../base-primitives'

const paper = css({
  position: 'absolute',
  boxSizing: 'border-box',
  width: '[240px]',
  minHeight: '[56px]',
  padding: '[16px]',
  paddingRight: '[22px]',
  borderWidth: '[1px]',
  borderStyle: 'solid',
  borderColor: '[#dfc879]',
  borderRadius: '[3px]',
  backgroundColor: '[#fff3bc]',
  color: '[#42391e]',
  boxShadow: '[2px 4px 12px rgba(56, 46, 19, 0.18)]',
  zIndex: '[300]',
  pointerEvents: 'all',
  overflowWrap: 'anywhere',
  _dark: {
    borderColor: '[#8c7444]',
    backgroundColor: '[#51472f]',
    color: '[#fff1c7]',
    boxShadow: '[2px 4px 12px rgba(0, 0, 0, 0.4)]',
  },
})

const fold = css({
  position: 'absolute',
  top: '[-1px]',
  right: '[-1px]',
  width: '[15px]',
  height: '[15px]',
  clipPath: '[polygon(0 0, 100% 100%, 0 100%)]',
  backgroundColor: '[#e5cf86]',
  borderBottomLeftRadius: '[2px]',
  pointerEvents: 'none',
  _dark: { backgroundColor: '[#8c7444]' },
})

const content = css({
  fontSize: 'sm',
  lineHeight: '[1.45]',
  '& img': { maxWidth: '100%', height: 'auto' },
  '& pre': { whiteSpace: 'pre-wrap', overflowX: 'visible', overflowWrap: 'anywhere' },
  '& table': { maxWidth: '100%', tableLayout: 'fixed', overflowWrap: 'anywhere' },
  '& a': { textDecoration: 'underline', color: 'inherit' },
})

export function NoteCard({
  id,
  label,
  notes,
  style,
  measureRef,
  onContentSettled,
}: {
  id: string
  label: string
  notes: scalar.MarkdownOrString
  style: CSSProperties
  measureRef: Ref<HTMLDivElement>
  onContentSettled: () => void
}) {
  return (
    <div
      ref={measureRef}
      className={cx('nopan nodrag nowheel', paper)}
      data-likec4-note-card={id}
      role="note"
      aria-label={`Note for ${label}`}
      style={style}
      onPointerDown={event => event.stopPropagation()}
      onClick={event => event.stopPropagation()}
      onDoubleClick={event => event.stopPropagation()}
      onLoadCapture={onContentSettled}
      onErrorCapture={onContentSettled}
    >
      <span className={fold} aria-hidden="true" />
      <Markdown value={RichText.from(notes)} className={content} />
    </div>
  )
}
