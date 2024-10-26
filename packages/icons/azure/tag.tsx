// @ts-nocheck

import type { SVGProps } from 'react'
const SvgTag = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="Tag_svg__a" x1={9} x2={9} y1={0.31} y2={17.69} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#c69aeb" />
        <stop offset={0.09} stopColor="#bb90e4" />
        <stop offset={0.49} stopColor="#926bc9" />
        <stop offset={0.81} stopColor="#7854b8" />
        <stop offset={1} stopColor="#6f4bb2" />
      </linearGradient>
    </defs>
    <path
      fill="url(#Tag_svg__a)"
      d="M17.66 2.86 15.27.49a.58.58 0 0 0-.43-.18l-4.43.17a.52.52 0 0 0-.41.17L.34 10.27a.59.59 0 0 0 0 .83l6.44 6.41a.6.6 0 0 0 .84 0l9.69-9.63a.58.58 0 0 0 .17-.37l.35-4.19a.57.57 0 0 0-.17-.46m-2.88 1.57a1.08 1.08 0 1 1 1.08-1.07 1.07 1.07 0 0 1-1.08 1.07"
    />
    <path
      fill="#552f99"
      d="M14.78 1.44a1.92 1.92 0 1 0 1.93 1.92 1.93 1.93 0 0 0-1.93-1.92m1.06 2.13a1.08 1.08 0 1 1-1.27-1.27 1.08 1.08 0 0 1 1.27 1.27"
    />
  </svg>
)
export default SvgTag
