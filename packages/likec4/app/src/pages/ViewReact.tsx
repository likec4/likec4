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
import { useIsMounted } from '@react-hookz/web'
import { useNavigate, useRouter, useSearch } from '@tanstack/react-router'
import { useRef } from 'react'
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
  const isProcessingRef = useRef(Promise.resolve())
  const isMounted = useIsMounted()

  const openAndClear = (fqn: Fqn) => {
    isProcessingRef.current = isProcessingRef.current.then(async () => {
      if (!isMounted() || processedRef.current === fqn) return
      try {
        processedRef.current = fqn
        diagram.openRelationshipsBrowser(fqn)
        await router.buildAndCommitLocation({
          search: (s: Record<string, unknown>) => {
            const { relationships: _, ...rest } = s
            return rest
          },
          replace: true,
          viewTransition: false,
        })
      } catch (error) {
        console.error('Failed to open relationship browser:', error)
      }
    })
  }

  const process = () => {
    if (!relationships) {
      processedRef.current = null
      return
    }
    if (relationships && processedRef.current !== relationships) {
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
