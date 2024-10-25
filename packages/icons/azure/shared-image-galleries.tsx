// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgSharedImageGalleries = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={17.44} y2={11.44} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.82} stopColor="#5ea0ef" />
      </linearGradient>
    </defs>
    <rect width={9.97} height={12.48} x={5.62} y={0.56} fill="#005ba1" rx={0.42} />
    <rect width={9.97} height={12.48} x={4.11} y={1.91} fill="#0078d4" rx={0.42} />
    <rect width={9.97} height={12.48} x={2.58} y={3.27} fill="#32bedd" rx={0.42} />
    <path fill="#50e6ff" d="M10.48 6.99v3.39l-2.91 1.7V8.69z" />
    <path fill="#c3f1ff" d="M10.48 6.99 7.57 8.7 4.66 6.99l2.91-1.7z" />
    <path fill="#9cebff" d="M7.57 8.7v3.38l-2.91-1.7V6.99z" />
    <path fill="#c3f1ff" d="m4.66 10.38 2.91-1.69v3.39z" />
    <path fill="#9cebff" d="M10.48 10.38 7.57 8.69v3.39z" />
    <rect width={16.87} height={5.99} x={0.56} y={11.44} fill={`url(#a-${suffix})`} rx={0.56} />
    <rect width={4.81} height={0.87} x={6.6} y={12.92} fill="#f2f2f2" rx={0.43} />
  </svg>
)}
export default SvgSharedImageGalleries
