// @ts-nocheck

import type { SVGProps } from 'react'
const SvgImage = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="Image_svg__a" x1={9} x2={9} y1={3.12} y2={14.88} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#32d4f5" />
        <stop offset={0.228} stopColor="#31d0f1" />
        <stop offset={0.463} stopColor="#2cc3e6" />
        <stop offset={0.703} stopColor="#25afd4" />
        <stop offset={0.944} stopColor="#1c92ba" />
        <stop offset={1} stopColor="#198ab3" />
      </linearGradient>
    </defs>
    <rect width={17} height={11.76} x={0.5} y={3.12} fill="url(#Image_svg__a)" rx={0.572} />
    <path
      fill="#86d633"
      d="M17.463 9.912 16.235 8.8a1.374 1.374 0 0 0-1.785 0l-6.622 6.08h9.1a.57.57 0 0 0 .572-.572v-4.4Z"
    />
    <path fill="#b4ec36" d="m15.69 14.88-5.208-4.731a1.06 1.06 0 0 0-1.376 0L3.9 14.88Z" />
    <path
      fill="#fff"
      d="M9 7.852a1.555 1.555 0 0 0-1.351-1.5 1.96 1.96 0 0 0-2.021-1.873A2.03 2.03 0 0 0 3.7 5.792a1.85 1.85 0 0 0-1.628 1.786A1.885 1.885 0 0 0 4.023 9.39q.087.002.172-.008h3.159a.3.3 0 0 0 .083-.012A1.575 1.575 0 0 0 9 7.852"
    />
  </svg>
)
export default SvgImage
