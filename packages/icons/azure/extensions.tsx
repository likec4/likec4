// @ts-nocheck

import type { SVGProps } from 'react'
const SvgExtensions = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="a" x1={8.144} x2={8.144} y1={13.837} y2={6.11} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#32bedd" />
        <stop offset={0.175} stopColor="#32caea" />
        <stop offset={0.41} stopColor="#32d2f2" />
        <stop offset={0.775} stopColor="#32d4f5" />
      </linearGradient>
    </defs>
    <rect width={7.726} height={7.726} x={4.281} y={6.11} fill="url(#a)" rx={0.303} />
    <path
      fill="#773adc"
      d="M16.894.66h-7.3a.3.3 0 0 0-.3.3v1.327a.3.3 0 0 0 .3.3h5.371a.605.605 0 0 1 .605.606v5.458a.3.3 0 0 0 .3.3h1.33a.3.3 0 0 0 .3-.3V1.266a.606.606 0 0 0-.606-.606"
    />
    <path
      fill="#b3b3b3"
      d="M14.333 10.223v4.806a.55.55 0 0 1-.552.552H2.81a.55.55 0 0 1-.552-.552V4.672a.55.55 0 0 1 .552-.552h5.5a.3.3 0 0 0 .3-.3V2.665a.3.3 0 0 0-.3-.3H1.052a.55.55 0 0 0-.552.549v13.874a.55.55 0 0 0 .552.552h14.487a.553.553 0 0 0 .553-.552v-6.565a.3.3 0 0 0-.3-.3h-1.156a.3.3 0 0 0-.303.3"
    />
  </svg>
)
export default SvgExtensions
