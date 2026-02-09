import z from 'zod/v4'

export const FederationDependencySchema = z.strictObject({
  source: z.string().nonempty('Dependency source cannot be empty').meta({
    description: 'Path to manifest directory (local directory or git repo)',
  }),
  version: z.string().nonempty('Version range cannot be empty').optional().meta({
    description: 'Semver version range, e.g. "^1.0.0". Omit for federated (always latest)',
  }),
})

export type FederationDependency = z.infer<typeof FederationDependencySchema>

export const FederationPublishSchema = z.strictObject({
  outDir: z.string().default('.likec4/federation').meta({
    description: 'Output directory for published manifests, relative to project root',
  }),
  registryDir: z.string().optional().meta({
    description: 'Path to the federated registry directory containing registry.json',
  }),
})

export type FederationPublish = z.infer<typeof FederationPublishSchema>

export const FederationConfigSchema = z.object({
  exports: z.array(z.string().nonempty()).optional().meta({
    description: 'FQN patterns of elements to export, e.g. ["authService", "authService.api"]',
  }),
  exportViews: z.array(z.string().nonempty()).optional().meta({
    description: 'View IDs to export, e.g. ["authServiceOverview"]',
  }),
  dependencies: z.record(z.string(), FederationDependencySchema).optional().meta({
    description: 'Dependencies on other projects\' published manifests',
  }),
  publish: FederationPublishSchema.optional().meta({
    description: 'Configuration for publishing this project\'s manifest',
  }),
}).meta({
  id: 'FederationConfig',
  description: 'Federation configuration for cross-project model sharing',
})

export type FederationConfig = z.infer<typeof FederationConfigSchema>
