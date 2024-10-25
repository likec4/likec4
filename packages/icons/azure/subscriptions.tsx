// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgSubscriptions = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <radialGradient
        id={`a-${suffix}`}
        cx={-36.63}
        cy={17.12}
        r={11.18}
        gradientTransform="matrix(.94 0 0 .94 41.88 -7.4)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0.27} stopColor="#ffd70f" />
        <stop offset={0.49} stopColor="#ffcb12" />
        <stop offset={0.88} stopColor="#feac19" />
        <stop offset={1} stopColor="#fea11b" />
      </radialGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M13.56 7.19a2.07 2.07 0 0 0 0-2.93L10 .69a2.06 2.06 0 0 0-2.92 0L3.52 4.26a2.09 2.09 0 0 0 0 2.93l3 3a.6.6 0 0 1 .17.41v5.52a.7.7 0 0 0 .2.5l1.35 1.35a.45.45 0 0 0 .66 0l1.31-1.31.77-.77a.26.26 0 0 0 0-.38l-.55-.56a.29.29 0 0 1 0-.42l.55-.56a.26.26 0 0 0 0-.38L10.4 13a.28.28 0 0 1 0-.41L11 12a.26.26 0 0 0 0-.38l-.77-.78v-.28Zm-5-5.64a1.18 1.18 0 1 1-1.19 1.18 1.17 1.17 0 0 1 1.17-1.18Z"
    />
    <path
      fill="#ff9300"
      d="M7.62 16.21A.25.25 0 0 0 8 16v-4.45a.27.27 0 0 0-.11-.22.25.25 0 0 0-.39.22V16a.27.27 0 0 0 .12.21"
      opacity={0.75}
    />
    <rect width={5.86} height={0.69} x={5.69} y={5.45} fill="#ff9300" opacity={0.75} rx={0.32} />
    <rect width={5.86} height={0.69} x={5.69} y={6.57} fill="#ff9300" opacity={0.75} rx={0.32} />
  </svg>
)}
export default SvgSubscriptions
