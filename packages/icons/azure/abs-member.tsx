// @ts-nocheck

import type { SVGProps } from 'react'
const SvgAbsMember = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="a" x1={14.415} x2={11.867} y1={13.555} y2={9.096} gradientUnits="userSpaceOnUse">
        <stop offset={0.101} stopColor="#773adc" />
        <stop offset={1} stopColor="#403457" />
      </linearGradient>
    </defs>
    <path fill="#773adc" d="M16.299 4.726v8.548L9 17.5V9.048z" />
    <path
      fill="url(#a)"
      d="M13.074 9.1c1.057-.58 1.826-.1 1.826 1.053a4.19 4.19 0 0 1-1.825 3.169c-1.056.576-1.825.1-1.825-1.056A3.93 3.93 0 0 1 13.074 9.1"
    />
    <path fill="#b796f9" d="M16.299 4.726 9 9.048 1.701 4.726 9 .5z" />
    <path fill="#a67af4" d="M9 9.048V17.5l-7.299-4.226V4.726z" />
  </svg>
)
export default SvgAbsMember
