// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { RelationshipBrowserScope } from '@likec4/config'
import type { Project } from 'likec4:projects'
import { useCallback, useEffect, useState } from 'react'

type RelationshipBrowserScopeStorage = Pick<Storage, 'getItem' | 'setItem'>

export function isRelationshipBrowserScope(value: unknown): value is RelationshipBrowserScope {
  return value === 'global' || value === 'view'
}

export function relationshipBrowserScopeStorageKey(projectId: string) {
  return `likec4.relationshipsBrowser.scope:${projectId}`
}

export function resolveRelationshipBrowserScope(input: {
  urlScope?: RelationshipBrowserScope
  savedScope?: RelationshipBrowserScope
  configuredScope?: RelationshipBrowserScope
}): RelationshipBrowserScope {
  return input.urlScope ?? input.savedScope ?? input.configuredScope ?? 'view'
}

/**
 * Reads the relationship browser scope saved for one project.
 *
 * Storage is optional to keep server rendering and unavailable browser storage safe.
 */
export function readRelationshipBrowserScope(
  projectId: string,
  storage: RelationshipBrowserScopeStorage | undefined = browserLocalStorage(),
): RelationshipBrowserScope | undefined {
  if (!storage) return undefined

  try {
    const value = storage.getItem(relationshipBrowserScopeStorageKey(projectId))
    return isRelationshipBrowserScope(value) ? value : undefined
  } catch {
    return undefined
  }
}

/**
 * Saves a user-selected relationship browser scope for one project.
 */
export function saveRelationshipBrowserScope(
  projectId: string,
  scope: RelationshipBrowserScope,
  storage: RelationshipBrowserScopeStorage | undefined = browserLocalStorage(),
): boolean {
  if (!storage || !isRelationshipBrowserScope(scope)) return false

  try {
    storage.setItem(relationshipBrowserScopeStorageKey(projectId), scope)
    return true
  } catch {
    return false
  }
}

/**
 * Returns the saved project scope, or its configured default when no preference exists.
 *
 * Only calls to `setScope` save a value. Initial values and configuration updates do not.
 */
export function useRelationshipBrowserScope(
  project: Project,
): readonly [RelationshipBrowserScope, (scope: RelationshipBrowserScope) => void] {
  const configuredScope = project.relationshipBrowserDefaultScope
  const [scope, setScope] = useState(() => resolveProjectRelationshipBrowserScope(project))

  useEffect(() => {
    setScope(resolveProjectRelationshipBrowserScope(project))
  }, [project.id, configuredScope])

  const setUserScope = useCallback((nextScope: RelationshipBrowserScope) => {
    if (!isRelationshipBrowserScope(nextScope)) return
    setScope(nextScope)
    saveRelationshipBrowserScope(project.id, nextScope)
  }, [project.id])

  return [scope, setUserScope] as const
}

function resolveProjectRelationshipBrowserScope(project: Project): RelationshipBrowserScope {
  const savedScope = readRelationshipBrowserScope(project.id)
  return resolveRelationshipBrowserScope({
    ...(savedScope ? { savedScope } : {}),
    configuredScope: project.relationshipBrowserDefaultScope,
  })
}

function browserLocalStorage(): RelationshipBrowserScopeStorage | undefined {
  if (typeof window === 'undefined') return undefined

  try {
    return window.localStorage
  } catch {
    return undefined
  }
}
