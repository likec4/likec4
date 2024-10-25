// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgCognitiveSearch = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={0.36} y2={18.31} gradientUnits="userSpaceOnUse">
        <stop offset={0.18} stopColor="#5ea0ef" />
        <stop offset={1} stopColor="#0078d4" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M18 11.32a4.12 4.12 0 0 0-3.51-4 5.15 5.15 0 0 0-5.25-5 5.25 5.25 0 0 0-5 3.49A4.86 4.86 0 0 0 0 10.59a5 5 0 0 0 5.07 4.82h8.65a.8.8 0 0 0 .22 0A4.13 4.13 0 0 0 18 11.32"
    />
    <path
      fill="#f2f2f2"
      d="M12.33 6.59a3.07 3.07 0 0 0-5.61.85 3.16 3.16 0 0 0 .33 2.27l-2.34 2.37a.79.79 0 0 0 0 1.12.78.78 0 0 0 .56.23.76.76 0 0 0 .56-.23l2.33-2.36a3.1 3.1 0 0 0 .81.33 3.08 3.08 0 0 0 3.36-4.58m-.54 2.1a2.16 2.16 0 0 1-2.09 1.65 1.8 1.8 0 0 1-.51-.07 1.9 1.9 0 0 1-.7-.32 2.1 2.1 0 0 1-.56-.56 2.17 2.17 0 0 1-.31-1.73A2.14 2.14 0 0 1 9.7 6a2.3 2.3 0 0 1 .52.06 2.18 2.18 0 0 1 1.32 1 2.13 2.13 0 0 1 .25 1.63"
    />
    <ellipse cx={9.69} cy={8.18} fill="#83b9f9" rx={2.15} ry={2.16} />
  </svg>
)}
export default SvgCognitiveSearch
