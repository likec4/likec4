import { type DeploymentElementModel, type ElementModel, isElementModel } from '@likec4/core/model'
import { type Any, type LayoutedView, type scalar, isNonEmptyArray } from '@likec4/core/types'
import { Box } from '@likec4/styles/jsx'
import {
  Divider as MantineDivider,
  ScrollArea,
  Stack,
  UnstyledButton,
} from '@mantine/core'
import { hasAtLeast, map, partition, pipe } from 'remeda'
import { ViewIcon } from '../../components/ViewIcon'
import * as styles from './ElementDetailsCard.css'
import { ViewButtonTitle } from './ElementDetailsCard.css'

const Divider = MantineDivider.withProps({
  mb: 8,
  labelPosition: 'left',
  variant: 'dashed',
})

type TabPanelViewsProps = {
  elementModel: ElementModel | DeploymentElementModel
  onNavigateTo: (viewId: scalar.ViewId) => void
}

export function TabPanelViews({
  elementModel,
  onNavigateTo,
}: TabPanelViewsProps) {
  const [viewsOf, otherViews] = pipe(
    [...elementModel.views()],
    map(v => v.$view as LayoutedView),
    partition(v => v._type === 'element' && v.viewOf === elementModel.id),
  )

  return (
    <ScrollArea scrollbars="y" type="auto">
      <Stack gap={'lg'}>
        {isNonEmptyArray(viewsOf) && (
          <Box>
            <Divider label="views of the element (scoped)" />
            <Stack gap={'sm'}>
              {viewsOf.map((view) => (
                <ViewButton
                  key={view.id}
                  view={view}
                  onNavigateTo={onNavigateTo} />
              ))}
            </Stack>
          </Box>
        )}
        {isNonEmptyArray(otherViews) && (
          <Box>
            <Divider
              label={isElementModel(elementModel)
                ? 'views including this element'
                : 'views including this deployment'} />
            <Stack gap={'sm'}>
              {otherViews.map((view) => (
                <ViewButton
                  key={view.id}
                  view={view}
                  onNavigateTo={onNavigateTo} />
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    </ScrollArea>
  )
}

const ViewButton = ({
  view,
  onNavigateTo,
}: {
  view: LayoutedView
  onNavigateTo: (viewId: scalar.ViewId) => void
}) => {
  return (
    <UnstyledButton
      className={styles.viewButton}
      onClick={e => {
        e.stopPropagation()
        onNavigateTo(view.id)
      }}>
      <ViewIcon type={view._type} />
      <Box>
        <ViewButtonTitle>
          {view.title || 'untitled'}
        </ViewButtonTitle>
      </Box>
    </UnstyledButton>
  )
}
