// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgEducation = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={9}
        x2={9}
        y1={-7205.66}
        y2={-7219.44}
        gradientTransform="matrix(1 0 0 -1 0 -7206.55)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0.13} stopColor="#773adc" />
        <stop offset={0.23} stopColor="#8249e2" />
        <stop offset={0.43} stopColor="#9664ec" />
        <stop offset={0.6} stopColor="#a274f2" />
        <stop offset={0.74} stopColor="#a67af4" />
      </linearGradient>
    </defs>
    <path fill="#773adc" d="M14.45 8.8H3.68v4.85c0 1.26 2.41 2.29 5.44 2.29s5.44-1 5.44-2.29Z" />
    <path
      fill={`url(#a-${suffix})`}
      d="m8.39 2.16-8 4.09a.71.71 0 0 0-.25.94.62.62 0 0 0 .25.28l8 3.48a.93.93 0 0 0 .73 0l8.48-3.5a.72.72 0 0 0 .28-.94.63.63 0 0 0-.28-.3L9.14 2.14a.86.86 0 0 0-.75.02"
    />
    <path
      fill="#50e6ff"
      d="M15.84 10.2a1.26 1.26 0 0 0-.23-.52 5.2 5.2 0 0 0-2.52-2.23L9.61 6l-1.11.79L12 8.28a5.05 5.05 0 0 1 2.72 2.66 8 8 0 0 1 .28 1.68m.16 0 .42-.83.53.68h.1a5 5 0 0 0-.38-2.27Z"
    />
    <ellipse cx={8.94} cy={6.46} fill="#552f99" rx={1.34} ry={0.68} />
  </svg>
)}
export default SvgEducation
