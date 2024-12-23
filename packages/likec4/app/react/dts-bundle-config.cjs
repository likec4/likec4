/** @type import('dts-bundle-generator/config-schema').OutputOptions */
const commonOutputParams = {
  inlineDeclareGlobals: false,
  sortNodes: true,
}

/** @type import('dts-bundle-generator/config-schema').BundlerConfig */
const config = {
  compilationOptions: {
    preferredConfigPath: './tsconfig.dts-bundle.json',
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
          '@xyflow/react',
          '@xyflow/system',
          '@likec4/core/types',
          '@likec4/diagram',
          'nanostores',
          '@nanostores/react',
        ],
      },
      output: {
        exportReferencedTypes: false,
        inlineDeclareGlobals: false,
        sortNodes: false,
      },
    },
  ],
}

module.exports = config
