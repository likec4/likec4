/** @type import('dts-bundle-generator/config-schema').OutputOptions */
const commonOutputParams = {
  inlineDeclareGlobals: false,
  sortNodes: true
}

/** @type import('dts-bundle-generator/config-schema').BundlerConfig */
const config = {
  compilationOptions: {
    preferredConfigPath: './tsconfig.dts-bundle.json'
  },

  entries: [
    {
      filePath: './components/index.ts',
      outFile: '../../react/index.d.ts',
      failOnClass: false,
      noCheck: true,
      libraries: {
        inlinedLibraries: [
          '@mantine/core',
          '@mantine/hooks',
          '@xyflow/react',
          '@xyflow/system',
          'type-fest',
          '@likec4/core',
          '@likec4/diagram',
          'nanostores',
          '@nanostores/react'
        ]
      },
      output: {
        exportReferencedTypes: false,
        inlineDeclareGlobals: false,
        sortNodes: true
      }
    }
  ]
}

module.exports = config
