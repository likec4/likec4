// @ts-nocheck

import type { SVGProps } from 'react'
const SvgAnalysisServices = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="a" x1={3.96} x2={3.96} y1={2.52} y2={7.82} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#32d4f5" />
        <stop offset={1} stopColor="#198ab3" />
      </linearGradient>
      <linearGradient id="b" x1={14.04} x2={14.04} y1={5.58} y2={10.89} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#32d4f5" />
        <stop offset={1} stopColor="#198ab3" />
      </linearGradient>
      <linearGradient id="c" x1={5.29} x2={5.29} y1={10.18} y2={15.48} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#32d4f5" />
        <stop offset={1} stopColor="#198ab3" />
      </linearGradient>
    </defs>
    <rect width={6.92} height={5.31} x={0.5} y={2.52} fill="url(#a)" rx={0.28} />
    <rect width={6.92} height={5.31} x={10.58} y={5.58} fill="url(#b)" rx={0.28} />
    <rect width={6.92} height={5.31} x={1.82} y={10.18} fill="url(#c)" rx={0.42} />
    <path
      fill="#773adc"
      d="m13.15 8.92.23-.64-8.56-3.15-.23.63Zm.53-.09-.32-.6-8.07 4.25.31.6ZM5 13.37l.67-.12-1.36-7.71-.67.12Z"
    />
    <circle cx={14.04} cy={8.23} r={1.08} fill="#fff" transform="rotate(-32.41 14.042 8.242)" />
    <circle cx={3.96} cy={5.17} r={1.08} fill="#fff" transform="rotate(-32.41 3.966 5.164)" />
    <circle cx={5.29} cy={12.83} r={1.08} fill="#fff" transform="rotate(-32.41 5.285 12.824)" />
  </svg>
)
export default SvgAnalysisServices
