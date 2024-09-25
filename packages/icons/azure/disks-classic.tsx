// @ts-nocheck

import type { SVGProps } from 'react'
const SvgDisksClassic = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="a" x1={15.35} x2={15.37} y1={13.41} y2={13.41} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.14} stopColor="#1782da" />
        <stop offset={0.37} stopColor="#368fe3" />
        <stop offset={0.59} stopColor="#4c98ea" />
        <stop offset={0.8} stopColor="#599eee" />
        <stop offset={0.99} stopColor="#5ea0ef" />
      </linearGradient>
      <linearGradient
        id="b"
        x1={5.51}
        x2={12.94}
        y1={802.5}
        y2={810.58}
        gradientTransform="matrix(1 0 0 1.59 0 -1278.76)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.02} stopColor="#0d7ed8" />
        <stop offset={0.08} stopColor="#2b8ae0" />
        <stop offset={0.15} stopColor="#4194e7" />
        <stop offset={0.22} stopColor="#519beb" />
        <stop offset={0.29} stopColor="#5b9fee" />
        <stop offset={0.4} stopColor="#5ea0ef" />
        <stop offset={0.55} stopColor="#5b9fee" />
        <stop offset={0.68} stopColor="#509aeb" />
        <stop offset={0.8} stopColor="#3f92e6" />
        <stop offset={0.91} stopColor="#2688df" />
        <stop offset={0.99} stopColor="#127fd9" />
      </linearGradient>
    </defs>
    <ellipse cx={8.96} cy={11.82} fill="#76bc2d" rx={7.5} ry={3.08} />
    <ellipse cx={9.15} cy={11.79} fill="#5e9624" rx={2.49} ry={0.68} />
    <path fill="url(#a)" d="M15.35 13.4" />
    <ellipse cx={8.96} cy={4.99} fill="url(#b)" rx={7.5} ry={3.08} />
    <ellipse cx={9.15} cy={4.95} fill="#005ba1" rx={2.49} ry={0.68} />
    <path
      fill="#5e9624"
      d="M9 14.84c4.15 0 7.5-1.38 7.5-3.08v1.82c-.14 1.65-3.44 3-7.5 3S1.5 15.2 1.5 13.5v-1.74c-.04 1.7 3.32 3.08 7.5 3.08"
    />
    <path fill="url(#a)" d="M15.35 13.4" />
    <path
      fill="#0078d4"
      d="M9 8c4.15 0 7.5-1.38 7.5-3.08v1.82c-.14 1.65-3.44 3-7.5 3S1.5 8.36 1.5 6.66V4.92C1.46 6.62 4.82 8 9 8"
    />
  </svg>
)
export default SvgDisksClassic
