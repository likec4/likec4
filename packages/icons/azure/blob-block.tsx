// @ts-nocheck

import type { SVGProps } from 'react'
const SvgBlobBlock = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="a" x1={9} x2={9} y1={15.834} y2={5.788} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#32bedd" />
        <stop offset={0.775} stopColor="#32d4f5" />
      </linearGradient>
    </defs>
    <path fill="url(#a)" d="M.5 5.788h17v9.478a.57.57 0 0 1-.568.568H1.068a.57.57 0 0 1-.568-.568z" />
    <path fill="#0078d4" d="M1.071 2.166h15.858a.57.57 0 0 1 .568.568v3.054H.5V2.734a.57.57 0 0 1 .571-.568" />
    <rect width={6.281} height={3.408} x={2.328} y={7.049} fill="#0078d4" rx={0.283} />
    <rect width={6.281} height={3.408} x={9.336} y={7.049} fill="#fff" rx={0.283} />
    <rect width={6.281} height={3.408} x={2.296} y={11.128} fill="#0078d4" rx={0.283} />
    <rect width={6.281} height={3.408} x={9.304} y={11.128} fill="#0078d4" rx={0.283} />
  </svg>
)
export default SvgBlobBlock
