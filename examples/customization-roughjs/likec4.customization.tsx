import { createCustomization, customizeComponents } from 'likec4/react'
import { RoughShape } from './RoughShape'

export default createCustomization({
  components: customizeComponents(({ wrap }) => ({
    // Show custom logo instead of LikeC4 logo
    Logo: () => <div style={{ fontSize: '12px' }}>Your Logo</div>,

    // Use rough.js for all elements except persons
    ElementShape: wrap(({ Original, ...props }) => {
      if (props.data.shape === 'person') {
        return <Original {...props} />
      }
      return <RoughShape {...props} />
    }),

    // Override defaults
    // - cross background
    // - sequence variant by default
    // - disable source opening
    LikeC4Diagram: wrap(({ Original, ...props }) => {
      return <Original {...props} background="cross" dynamicViewVariant="sequence" onOpenSource={undefined} />
    }),
  })),
})
