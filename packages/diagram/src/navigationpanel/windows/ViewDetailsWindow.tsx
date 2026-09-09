import { type scalar } from '@likec4/core/types'
import { css, cx } from '@likec4/styles/css'
import { Box, HStack, styled, Txt, VStack } from '@likec4/styles/jsx'
import {
  Button,
  DataList,
  Divider,
  Pill,
  ScrollArea,
  TagsInput,
  Textarea,
} from '@mantine/core'
import { Loader, Menu, Tooltip } from '@mantine/core'
import { useToggle, useUncontrolled } from '@mantine/hooks'
import { useIsMounted } from '@react-hookz/web'
import {
  IconChevronDown,
  IconFileSymlink,
} from '@tabler/icons-react'
import { IconInfoCircle } from '@tabler/icons-react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { difference } from 'remeda'
import { Markdown } from '../../base-primitives'
import { EmptyBox } from '../../components/EmptyBox'
import { Link } from '../../components/Link'
import { ViewIcon } from '../../components/ViewIcon'
import { IfEnabled, useEnabledFeatures } from '../../context'
import { useCurrentViewModel, useMantinePortalProps, useUpdateEffect } from '../../hooks'
import { useCallbackRef } from '../../hooks/useCallbackRef'
import { useDiagram } from '../../hooks/useDiagram'
import { useDiagramCompareLayout } from '../../hooks/useDiagramCompareLayout'
import { stopPropagation } from '../../utils'
import { PanelActionIcon } from '../_common'

const SectionHeader = styled('div', {
  base: {
    fontSize: 'xs',
    color: 'text.non-essential',
    fontWeight: 'medium',
    userSelect: 'none',
    lineHeight: 'snug',
  },
})

export function ViewDetailsWindow() {
  const viewModel = useCurrentViewModel()
  const diagram = useDiagram()
  const { enableReadOnly } = useEnabledFeatures()
  const title = viewModel.titleOrUntitled
  const description = viewModel.description
  const tags = viewModel.tags as scalar.Tag[]
  const links = viewModel.links

  const changeTitle = (title: string) => {
    if (viewModel.folder && !viewModel.folder.isRoot) {
      title = viewModel.folder.path + ' / ' + title
    }
    diagram.triggerChange({
      op: 'change-property',
      title,
    })
  }

  const changeTags = (nextTags: scalar.Tag[]) => {
    if (nextTags.length === tags.length && nextTags.every(t => tags.includes(t))) {
      return
    }
    diagram.triggerChange({
      op: 'change-property',
      tag: {
        add: difference(nextTags, tags),
        remove: difference(tags, nextTags),
      },
    })
  }

  return (
    <>
      <VStack style={{ flex: '0' }} p="1" gap="sm" className="drag-handle">
        <HStack gap={'2'} alignItems={'baseline'}>
          <Box style={{ flex: '0', fontSize: 24, lineHeight: 1 }}>
            <ViewIcon type={viewModel._type} size={22} />
          </Box>
          <Box style={{ flex: '1' }}>
            <EditableTitle
              viewTitle={title}
              readOnly={enableReadOnly}
              onChange={changeTitle} />
          </Box>
          <HStack gap="1" flexWrap="nowrap" style={{ fontSize: 24, lineHeight: 1 }} alignItems={'baseline'}>
            <IfEnabled feature="Vscode">
              <PanelActionIcon
                variant="filled"
                size={'sm'}
                onClick={e => {
                  e.stopPropagation()
                  const viewId = diagram.currentView.id
                  diagram.openSource({ view: viewId })
                }}
                children={<IconFileSymlink style={{ width: '65%', height: '65%' }} />} />
            </IfEnabled>
          </HStack>
        </HStack>
        <DataList size="xs" gap={'sm'} orientation="horizontal" labelWidth={80}>
          {viewModel.hasManualLayout && (
            <DataList.Item>
              <DataList.ItemLabel>Manual layout</DataList.ItemLabel>
              <DataList.ItemValue>
                <ManualLayoutState />
              </DataList.ItemValue>
            </DataList.Item>
          )}
          {viewModel.$model.tags.length > 0 && (
            <DataList.Item>
              <DataList.ItemLabel>View tags</DataList.ItemLabel>
              <DataList.ItemValue>
                {(tags.length > 0 || !enableReadOnly) && (
                  <EditableTags
                    alltags={viewModel.$model.tags}
                    tags={tags}
                    readOnly={enableReadOnly}
                    onChange={changeTags} />
                )}
                {(tags.length === 0 && enableReadOnly) && (
                  <Txt size="xs" color={'text.non-essential'}>
                    No tags
                  </Txt>
                )}
              </DataList.ItemValue>
            </DataList.Item>
          )}
          <DataList.Item>
            <DataList.ItemLabel>Links</DataList.ItemLabel>
            <DataList.ItemValue className="nodrag">
              <HStack gap="xxs" flexWrap="wrap">
                {links.map((link, i) => <Link key={`${i}-${link.url}`} value={link} />)}
                {links.length === 0 && (
                  <Txt size="xs" color={'text.non-essential'}>
                    No links
                  </Txt>
                )}
              </HStack>
            </DataList.ItemValue>
          </DataList.Item>
        </DataList>
        <Divider
          label={<SectionHeader>Description</SectionHeader>}
          labelPosition="left"
          mt="xxs"
          mb={'xs'} />
      </VStack>
      {description.isEmpty && (
        <EmptyBox flex="1" m="1">
          No description
        </EmptyBox>
      )}
      {description.nonEmpty && (
        <ScrollArea style={{ flex: 1 }} scrollbars="y" overscrollBehavior="contain">
          <Box px="1">
            <Markdown value={description} />
          </Box>
        </ScrollArea>
      )}
    </>
  )
}

function EditableTitle({
  viewTitle,
  readOnly,
  onChange,
}: {
  viewTitle: string
  readOnly: boolean
  onChange: (value: string) => void
}) {
  const [isEditing, toggle] = useToggle()

  const initialValue = useRef(viewTitle)

  const [_value, handleChange] = useUncontrolled({
    defaultValue: viewTitle,
  })

  useEffect(() => {
    initialValue.current = viewTitle
    handleChange(viewTitle)
  }, [viewTitle])

  return (
    <Textarea
      size="xs"
      radius="xs"
      autosize
      minRows={1}
      wrap="soft"
      maxRows={5}
      variant="unstyled"
      value={_value}
      onChange={(e) => handleChange(e.target.value)}
      readOnly={readOnly}
      tabIndex={readOnly ? -1 : undefined}
      onFocus={(e) => {
        toggle(true)
        const length = _value.length
        e.currentTarget.setSelectionRange(length, length)
      }}
      onBlur={(e) => {
        toggle(false)
        // Revert to initial value on blur
        handleChange(initialValue.current)
      }}
      onKeyDownCapture={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          e.currentTarget.blur()
          return
        }

        if (
          e.key === 'Enter' &&
          !(e.getModifierState('Shift') || e.getModifierState('Meta') || e.getModifierState('Control'))
        ) {
          e.preventDefault()
          // Update initial value to prevent revert on blur
          initialValue.current = _value
          onChange(_value)
          e.currentTarget.blur()
          return
        }
      }}
      className={!readOnly ? 'nodrag' : undefined}
      classNames={{
        input: cx(
          css({
            textStyle: 'h5',
            color: 'text.bright',
            padding: '1',
            border: 'default',
            borderColor: 'transparent',
          }),
          readOnly && css({
            cursor: 'inherit',
          }),
          !readOnly && !isEditing && css({
            cursor: 'pointer',
          }),
          !readOnly && css({
            _hover: {
              backgroundColor: 'surface.field.hover',
            },
            _focus: {
              outline: 'outline',
              backgroundColor: 'surface.field',
            },
          }),
        ),
      }} />
  )
}

function EditableTags({
  alltags,
  tags,
  readOnly,
  onChange,
}: {
  alltags: ReadonlyArray<string>
  tags: ReadonlyArray<string>
  readOnly: boolean
  onChange: (tags: scalar.Tag[]) => void
}) {
  const [isApplying, toggleApplying] = useToggle()
  const portalProps = useMantinePortalProps()

  const [value, handleChange] = useUncontrolled<string[]>({
    defaultValue: [...tags],
  })

  const revert = useEffectEvent(() => {
    handleChange([...tags])
    toggleApplying(false)
  })

  useUpdateEffect(() => {
    revert()
  }, [tags])

  useEffect(() => {
    if (readOnly) {
      revert()
    }
  }, [readOnly])

  const commitChanges = useEffectEvent(() => {
    toggleApplying(true)
    onChange(value as scalar.Tag[])
  })

  const canAdd = !readOnly && value.length < alltags.length

  const notCommitted = !readOnly && (value.length !== tags.length || value.some((v) => !tags.includes(v)))

  return (
    <HStack alignItems={'baseline'} flexWrap={'nowrap'} gap={'1'}>
      <TagsInput
        variant="unstyled"
        size="xs"
        acceptValueOnBlur={false}
        readOnly={readOnly}
        data={alltags}
        value={value}
        onChange={(value) => {
          handleChange(value.filter((v) => alltags.includes(v)))
        }}
        classNames={{
          wrapper: 'nodrag',
          input: cx(
            !readOnly && css({
              py: '1',
              _hover: {
                backgroundColor: 'surface.field.hover',
              },
              _focus: {
                outline: 'outline',
                backgroundColor: 'surface.field',
              },
            }),
          ),
          inputField: css({
            minWidth: '[40px]',
          }),
        }}
        comboboxProps={{
          withinPortal: false,
          offset: 2,
        }}
        placeholder={canAdd ? 'Add tag...' : ''}
        renderPill={({ value, onRemove }) => (
          <Pill
            size="xs"
            withRemoveButton={!readOnly}
            onRemove={onRemove!}
            radius={'xs'}
            data-likec4-tag={value}
            classNames={{
              root: css({
                layerStyle: 'likec4.tag',
              }),
              label: css({
                fontWeight: 'semibold',
              }),
            }}>
            {value}
          </Pill>
        )}
      />
      {notCommitted && (
        <>
          <Button
            loading={isApplying}
            miw="min-content"
            variant="default"
            size="compact-xs"
            onClick={commitChanges}
          >
            Apply
          </Button>
          <Button
            disabled={isApplying}
            miw="min-content"
            variant="default"
            size="compact-xs"
            onClick={revert}
          >
            Revert
          </Button>
        </>
      )}
    </HStack>
  )
}

function ManualLayoutState() {
  const isMounted = useIsMounted()
  const { enableEditor } = useEnabledFeatures()
  const [ctx, ops] = useDiagramCompareLayout()

  const [isProcessing, setIsProcessing] = useToggle()

  const resetProcessing = () => {
    // Defer setting setIsProcessing to false to allow for animation to play out
    // before the panel potentially unmounts due to no more drifts being present
    setTimeout(() => {
      if (isMounted()) {
        setIsProcessing(false)
      }
    }, 500)
  }

  const onResetManualLayout = useCallbackRef((e: React.MouseEvent) => {
    e.stopPropagation()
    if (isProcessing) {
      return
    }
    setIsProcessing(true)
    setTimeout(() => {
      ops.resetManualLayout()
      resetProcessing()
    }, 100)
  })

  return (
    <Menu
      withinPortal={false} // if we render menu in portal, NavigationPanelDropdown receives onMouseLeave event
      floatingStrategy="absolute"
      position="bottom-start"
      classNames={{
        item: css({
          fontSize: 'sm',
          py: '1',
        }),
      }}
      closeOnItemClick={false}
      disabled={!enableEditor}
      offset={{ mainAxis: 4 }}
    >
      <Menu.Target>
        <Button
          size="compact-xs"
          className={css({
            layerStyle: ctx.isEnabled ? 'surface.warning' : 'likec4.panel.action.filled',
            fontSize: 'xxs',
            gap: '4',
          })}
          styles={{
            section: {
              marginInlineStart: 4,
            },
          }}
          disabled={!enableEditor}
          rightSection={enableEditor ? <IconChevronDown size={12} stroke={3} opacity={0.7} /> : undefined}
        >
          {ctx.isEnabled ? 'out of sync' : 'up to date'}
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item
          leftSection={isProcessing ? <Loader size={14} /> : undefined}
          disabled={isProcessing}
          onClick={onResetManualLayout}
          rightSection={!isProcessing && (
            <Tooltip
              onClick={stopPropagation}
              position="right-start"
              label={
                <>
                  Resets all manual adjustments and deletes snapshot.<br />
                  <br />
                  You can undo this action.
                </>
              }
            >
              <IconInfoCircle size={14} stroke={1.7} opacity={0.5} />
            </Tooltip>
          )}
        >
          Reset layout
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
