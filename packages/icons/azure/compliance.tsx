// @ts-nocheck

import type { SVGProps } from 'react'
const SvgCompliance = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="a" x1={9} x2={9} y1={17.5} y2={0.5} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.82} stopColor="#5ea0ef" />
      </linearGradient>
    </defs>
    <path
      fill="#fff"
      d="M10 .63H2.73a.57.57 0 0 0-.57.57v15.6a.57.57 0 0 0 .57.57h12.54a.57.57 0 0 0 .57-.57V6.48a.58.58 0 0 0-.57-.58h-4.16a.56.56 0 0 1-.57-.57V1.2A.57.57 0 0 0 10 .63"
    />
    <path
      fill="url(#a)"
      d="M9.7 1.36v3.92a1.44 1.44 0 0 0 1.44 1.43h3.95v9.93H2.91V1.36zM10 .5H2.64a.58.58 0 0 0-.58.58v15.84a.58.58 0 0 0 .58.58h12.72a.58.58 0 0 0 .58-.58V6.44a.58.58 0 0 0-.58-.58h-4.22a.58.58 0 0 1-.58-.58v-4.2A.58.58 0 0 0 10 .5"
    />
    <path fill="#0078d4" d="M15.72 6 10.36.63V5a1 1 0 0 0 1 1Z" />
    <path
      fill="#b31b1b"
      d="M10.41 11.18a2.21 2.21 0 0 1-2.93 0l-.18 3.63a.29.29 0 0 0 .5.22l1.12-1.15L10.06 15a.29.29 0 0 0 .49-.22Z"
    />
    <ellipse cx={8.98} cy={9.31} fill="#e62323" rx={2.61} ry={2.62} />
    <ellipse cx={8.98} cy={9.31} fill="#ffd400" rx={1.98} ry={1.99} />
  </svg>
)
export default SvgCompliance
