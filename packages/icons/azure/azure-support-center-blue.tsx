// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAzureSupportCenterBlue = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={3.474} y2={18.601} gradientUnits="userSpaceOnUse">
        <stop offset={0.215} stopColor="#5ea0ef" />
        <stop offset={1} stopColor="#0078d4" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={8.974} x2={8.974} y1={-0.698} y2={9.083} gradientUnits="userSpaceOnUse">
        <stop offset={0.225} stopColor="#a67af4" />
        <stop offset={0.999} stopColor="#773adc" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M9.851 12.53a.88.88 0 0 0-.627.261l-.007.007a.36.36 0 0 1-.505-.006.35.35 0 0 1-.1-.262L8.6 9.546a.28.28 0 0 0-.14-.246L6.428 8.122a1.6 1.6 0 0 1-.186.5 1.6 1.6 0 0 1-2.19.586 1.61 1.61 0 0 1-.588-2.194A1.6 1.6 0 0 1 3.8 6.6L1.433 5.227a.285.285 0 0 0-.427.247l.008 5.089v2.87a.57.57 0 0 0 .284.492l6.885 3.989a.285.285 0 0 0 .428-.247v-3.371a.361.361 0 0 1 .617-.26.881.881 0 0 0 1.51-.618.89.89 0 0 0-.887-.888m3.708-5.594a.359.359 0 0 1-.527-.405.88.88 0 0 0-.087-.678.882.882 0 1 0-.984 1.3.36.36 0 0 1 .268.335.37.37 0 0 1-.2.334L9.466 9.3a.28.28 0 0 0-.143.247v2.35a1.6 1.6 0 0 1 .525-.087 1.61 1.61 0 0 1 1.605 1.607 1.6 1.6 0 0 1-1.6 1.6 1.6 1.6 0 0 1-.525-.087v2.781a.285.285 0 0 0 .427.246l6.947-4.01a.57.57 0 0 0 .285-.5v-2.452l-.009-5.551a.285.285 0 0 0-.427-.246Z"
    />
    <path
      fill={`url(#b-${suffix})`}
      d="M13.755 5.992a1.7 1.7 0 0 0-.187-.5 1.6 1.6 0 1 0-2.435 2.014l-2.027 1.17a.28.28 0 0 1-.285 0L6.242 7.181a.37.37 0 0 0-.289-.042.36.36 0 0 0-.249.444.882.882 0 1 1-1.077-.625.34.34 0 0 0 .248-.215.37.37 0 0 0-.173-.45L1.753 4.579a.285.285 0 0 1 0-.493L8.7.076a.57.57 0 0 1 .57 0l6.93 4.015a.285.285 0 0 1 0 .493Z"
    />
  </svg>
)}
export default SvgAzureSupportCenterBlue
