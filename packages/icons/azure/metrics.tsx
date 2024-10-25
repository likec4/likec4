// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgMetrics = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={6.57} x2={6.57} y1={7.06} y2={3.76} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#773adc" />
        <stop offset={1} stopColor="#b77af4" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={11.02} x2={11.02} y1={11.15} y2={7.86} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#773adc" />
        <stop offset={1} stopColor="#b77af4" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={15.15} x2={15.15} y1={3.79} y2={0.5} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#773adc" />
        <stop offset={1} stopColor="#b77af4" />
      </linearGradient>
      <linearGradient id={`d-${suffix}`} x1={2.85} x2={2.85} y1={11.86} y2={8.57} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#773adc" />
        <stop offset={1} stopColor="#b77af4" />
      </linearGradient>
    </defs>
    <path fill="#b796f9" d="m14.73 1.62-3.99 7.1-4.22-4.3-4.35 5.64 1.02.8 3.45-4.45 4.38 4.47 4.84-8.61z" />
    <ellipse cx={6.57} cy={5.41} fill={`url(#a-${suffix})`} rx={1.64} ry={1.65} />
    <ellipse cx={11.02} cy={9.5} fill={`url(#b-${suffix})`} rx={1.64} ry={1.65} />
    <ellipse cx={15.15} cy={2.15} fill={`url(#c-${suffix})`} rx={1.64} ry={1.65} />
    <ellipse cx={2.85} cy={10.22} fill={`url(#d-${suffix})`} rx={1.64} ry={1.65} />
    <rect width={2.58} height={7.58} x={5.67} y={9.92} fill="#0078d4" rx={0.28} />
    <rect width={2.58} height={4.96} x={9.78} y={12.54} fill="#005ba1" rx={0.28} />
    <rect width={2.58} height={10.12} x={13.89} y={7.38} fill="#005ba1" rx={0.28} />
    <rect width={2.58} height={4.96} x={1.56} y={12.54} fill="#5ea0ef" rx={0.28} />
  </svg>
)}
export default SvgMetrics
