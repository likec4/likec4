import type { Fqn } from '@likec4/core'
import {
  LikeC4Diagram,
  useDiagram,
  useDiagramContext,
  useLikeC4Model,
  useOnDiagramEvent,
  useUpdateEffect,
} from '@likec4/diagram'
import { useCallbackRef, useDocumentTitle } from '@mantine/hooks'
import { useNavigate, useRouter, useSearch } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { NotFound } from '../components/NotFound'
import { pageTitle as defaultPageTitle } from '../const'
import { useCurrentView } from '../hooks'

export function ViewReact() {
  const navigate = useNavigate()
  const [view, setLayoutType] = useCurrentView()
  const model = useLikeC4Model()
  const { dynamic } = useSearch({
    from: '__root__',
  })

  const onNavigateTo = useCallbackRef((viewId: string) => {
    void navigate({
      to: './',
      viewTransition: false,
      params: (current) => ({
        ...current,
        viewId,
      }),
      search: true,
    })
  })

  const title = view ? (view.title ?? view.id) : `View not found`
  const pageTitle = model.project.title ?? defaultPageTitle
  useDocumentTitle(`${title} - ${pageTitle}`)

  if (!view) {
    return <NotFound />
  }

  const notations = view.notation?.nodes ?? []
  const hasNotations = notations.length > 0

  return (
    <LikeC4Diagram
      view={view}
      zoomable
      pannable
      controls
      fitViewPadding={{
        top: '70px',
        bottom: '32px',
        left: '32px',
        right: '32px',
      }}
      showNavigationButtons
      enableSearch
      enableFocusMode
      enableDynamicViewWalkthrough
      dynamicViewVariant={dynamic}
      enableElementDetails
      enableRelationshipDetails
      enableRelationshipBrowser
      enableElementTags
      enableCompareWithLatest
      enableNotations={hasNotations}
      nodesSelectable
      onNavigateTo={onNavigateTo}
      onLayoutTypeChange={setLayoutType}
      onLogoClick={() => {
        void navigate({
          to: '/',
        })
      }}
    >
      <ListenForDynamicVariantChange />
      <OpenRelationshipBrowserFromUrl />
    </LikeC4Diagram>
  )
}

/**
 * Opens Relationship Browser when `?relationships={elementFqn}` URL parameter is present.
 * Handles both initial load and parameter changes during navigation.
 * Clears the parameter after opening to prevent reopening on navigation.
 */
export function OpenRelationshipBrowserFromUrl() {
  const router = useRouter()
  const diagram = useDiagram()
  const { relationships } = useSearch({
    from: '__root__',
  })
  const processedRef = useRef<Fqn | null>(null)
  const isInitializedRef = useRef(false)
  const isProcessingRef = useRef(false)
  const isMountedRef = useRef(true)

  const openAndClear = async (fqn: Fqn) => {
    if (isProcessingRef.current || !isMountedRef.current) return
    isProcessingRef.current = true
    try {
      if (!isMountedRef.current) return
      processedRef.current = fqn
      diagram.openRelationshipsBrowser(fqn)
      if (!isMountedRef.current) return
      await router.buildAndCommitLocation({
        search: (current: Record<string, unknown>) => {
          const { relationships: _, ...rest } = current
          return rest
        },
        viewTransition: false,
      })
    } catch (error) {
      if (isMountedRef.current) {
        console.error('Failed to open relationship browser:', error)
        processedRef.current = null
      }
    } finally {
      isProcessingRef.current = false
    }
  }

  const process = () => {
    if (!isMountedRef.current || !isInitializedRef.current || isProcessingRef.current) return
    if (!relationships) {
      processedRef.current = null
      return
    }
    if (processedRef.current !== relationships) {
      void openAndClear(relationships)
    }
  }

  useOnDiagramEvent('initialized', () => {
    isInitializedRef.current = true
    process()
  })

  // Handle parameter changes after initialization
  useUpdateEffect(() => {
    process()
  }, [relationships])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      processedRef.current = null
      isInitializedRef.current = false
      isProcessingRef.current = false
    }
  }, [])

  return null
}

export function ListenForDynamicVariantChange() {
  const router = useRouter()
  const dynamicViewVariant = useDiagramContext(c => c.dynamicViewVariant)

  useUpdateEffect(() => {
    const search = router.latestLocation.search.dynamic ?? 'diagram'
    if (search !== dynamicViewVariant) {
      void router.buildAndCommitLocation({
        search: (current: Record<string, unknown>) => ({
          ...current,
          dynamic: dynamicViewVariant,
        }),
        viewTransition: false,
      })
    }
  }, [dynamicViewVariant])

  return null
}
