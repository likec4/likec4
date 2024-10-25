// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgResourceGraphExplorer = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={2.63} x2={2.63} y1={5.99} y2={1.75} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#773adc" />
        <stop offset={1} stopColor="#b77af4" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={14.76} x2={14.76} y1={6.31} y2={0.85} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#773adc" />
        <stop offset={1} stopColor="#b77af4" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={11.92} x2={11.92} y1={17.27} y2={7.71} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#773adc" />
        <stop offset={1} stopColor="#b77af4" />
      </linearGradient>
    </defs>
    <path fill="#b796f9" d="M11.56 14.24 1.79 4.35A.77.77 0 0 1 2.34 3h12.42v1.58H4.19l8.47 8.58Z" />
    <ellipse cx={2.63} cy={3.87} fill={`url(#a-${suffix})`} rx={2.13} ry={2.12} />
    <ellipse cx={14.76} cy={3.58} fill={`url(#b-${suffix})`} rx={2.74} ry={2.73} />
    <ellipse cx={11.92} cy={13.69} fill={`url(#c-${suffix})`} rx={3.47} ry={3.46} />
  </svg>
)}
export default SvgResourceGraphExplorer
