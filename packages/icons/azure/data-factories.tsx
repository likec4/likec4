// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgDataFactories = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={0.5} x2={9} y1={9.77} y2={9.77} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#005ba1" />
        <stop offset={0.07} stopColor="#0060a9" />
        <stop offset={0.36} stopColor="#0071c8" />
        <stop offset={0.52} stopColor="#0078d4" />
        <stop offset={0.64} stopColor="#0074cd" />
        <stop offset={0.81} stopColor="#006abb" />
        <stop offset={0.99} stopColor="#005ba1" />
      </linearGradient>
    </defs>
    <path
      fill="#005ba1"
      d="M13.25 10.48V6.57a.14.14 0 0 0-.24-.1l-4 4-4.16 4.16v2.87h12.08a.56.56 0 0 0 .57-.57V6.57a.14.14 0 0 0-.24-.1Z"
    />
    <path fill={`url(#a-${suffix})`} d="M4.75 3.58C2.4 3.58.5 2.89.5 2v14.93a.56.56 0 0 0 .57.57H9V2c0 .89-1.9 1.58-4.25 1.58" />
    <rect width={2.27} height={2.27} x={12.91} y={12.97} fill="#fff" rx={0.28} />
    <rect width={2.27} height={2.27} x={8.97} y={12.97} fill="#fff" rx={0.28} />
    <rect width={2.27} height={2.27} x={5.03} y={12.97} fill="#fff" rx={0.28} />
    <path fill="#eaeaea" d="M9 2c0 .85-1.9 1.54-4.25 1.54S.5 2.89.5 2 2.4.5 4.75.5 9 1.19 9 2" />
    <path fill="#50e6ff" d="M8 1.91c0 .55-1.46 1-3.26 1s-3.26-.43-3.26-1S3 .94 4.75.94 8 1.37 8 1.91" />
    <path
      fill="#198ab3"
      d="M4.75 2.14a8 8 0 0 0-2.58.37 7.6 7.6 0 0 0 2.58.38 7.6 7.6 0 0 0 2.58-.38 8 8 0 0 0-2.58-.37"
    />
  </svg>
)}
export default SvgDataFactories
