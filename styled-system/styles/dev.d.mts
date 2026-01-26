import { Config } from '@pandacss/dev'

export function defineConfig(config: Omit<Config, 'importMap' | 'presets' | 'plugins'>): Config
