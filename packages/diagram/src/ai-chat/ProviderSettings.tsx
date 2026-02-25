// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import {
  Button,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useCallback, useState } from 'react'
import * as styles from './AIChatCard.css'
import { useAIChatConfig } from './AIChatConfigContext'
import { loadProviderConfig, saveProviderConfig } from './config'
import type { LLMProviderConfig } from './providers/types'

export function ProviderSettings({ onConfigured }: { onConfigured?: () => void }) {
  const projectConfig = useAIChatConfig()

  const [config, setConfig] = useState<LLMProviderConfig>(() => {
    const saved = loadProviderConfig()
    return {
      providerId: 'openai',
      apiKey: '', // Never pre-fill API key for security
      model: projectConfig?.model ?? saved?.model ?? '',
      baseUrl: projectConfig?.baseUrl ?? saved?.baseUrl ?? '',
    }
  })

  const hasProjectBaseUrl = !!projectConfig?.baseUrl
  const hasProjectModel = !!projectConfig?.model
  const hasProjectApiKey = !!projectConfig?.apiKey
  const hasSavedApiKey = !!loadProviderConfig()?.apiKey

  const handleSave = useCallback(() => {
    // If the user didn't enter a new API key, preserve the existing one from localStorage
    const existing = loadProviderConfig()
    const configToSave = {
      ...config,
      apiKey: config.apiKey || existing?.apiKey || '',
    }
    saveProviderConfig(configToSave)
    onConfigured?.()
  }, [config, onConfigured])

  return (
    <div className={styles.settingsPanel}>
      <Stack gap="xs">
        <TextInput
          label="Base URL"
          size="xs"
          value={config.baseUrl ?? ''}
          onChange={(e) => {
            const value = e.currentTarget?.value ?? ''
            setConfig(prev => ({ ...prev, baseUrl: value }))
          }}
          placeholder="https://api.openai.com/v1"
          readOnly={hasProjectBaseUrl}
          variant={hasProjectBaseUrl ? 'filled' : 'default'}
          autoComplete="off"
        />
        <TextInput
          label="Model"
          size="xs"
          value={config.model}
          onChange={(e) => {
            const value = e.currentTarget?.value ?? ''
            setConfig(prev => ({ ...prev, model: value }))
          }}
          placeholder="gpt-4o"
          readOnly={hasProjectModel}
          variant={hasProjectModel ? 'filled' : 'default'}
          autoComplete="off"
        />
        {hasProjectApiKey
          ? (
            <TextInput
              label="API Key"
              size="xs"
              value="Configured in project"
              readOnly
              variant="filled"
            />
          )
          : (
            <PasswordInput
              label="API Key"
              size="xs"
              value={config.apiKey}
              onChange={(e) => {
                const value = e.currentTarget?.value ?? ''
                setConfig(prev => ({ ...prev, apiKey: value }))
              }}
              placeholder={hasSavedApiKey ? 'API key configured (leave blank to keep)' : 'Enter API key'}
              autoComplete="off"
            />
          )}
        {(hasProjectBaseUrl || hasProjectModel || hasProjectApiKey) && (
          <Text size="xs" c="dimmed">
            {hasProjectBaseUrl && hasProjectModel && hasProjectApiKey
              ? 'All settings are configured in the project config.'
              : 'Some settings are configured in the project config.'}
          </Text>
        )}
        {!(hasProjectBaseUrl && hasProjectModel && hasProjectApiKey) && (
          <Button size="xs" onClick={handleSave} fullWidth>
            Save Settings
          </Button>
        )}
      </Stack>
    </div>
  )
}
