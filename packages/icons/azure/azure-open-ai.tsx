// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAzureOpenAi = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <radialGradient
        id={`a-${suffix}`}
        cx={-67.981}
        cy={793.199}
        r={0.45}
        gradientTransform="rotate(45 -33555.9 -11470.31)scale(25.091 -34.149)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#83b9f9" />
        <stop offset={1} stopColor="#0078d4" />
      </radialGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M0 2.7v12.6A2.7 2.7 0 0 0 2.7 18h12.6a2.7 2.7 0 0 0 2.7-2.7V2.7A2.7 2.7 0 0 0 15.3 0H2.7A2.7 2.7 0 0 0 0 2.7M10.8 0v3.6a7.2 7.2 0 0 0 7.2 7.2h-3.6a7.2 7.2 0 0 0-7.2 7.198V14.4A7.2 7.2 0 0 0 0 7.2h3.6A7.2 7.2 0 0 0 10.8 0"
    />
  </svg>
)}
export default SvgAzureOpenAi
