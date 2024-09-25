// @ts-nocheck

import type { SVGProps } from 'react'
const SvgVirtualMachinesClassic = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="a" x1={8.86} x2={8.86} y1={13.02} y2={1.02} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.82} stopColor="#5ea0ef" />
      </linearGradient>
      <linearGradient id="b" x1={8.86} x2={8.86} y1={17.65} y2={13.02} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#1490df" />
        <stop offset={0.98} stopColor="#1f56a3" />
      </linearGradient>
    </defs>
    <rect width={18} height={12} x={-0.14} y={1.02} fill="url(#a)" rx={0.6} />
    <rect width={16} height={10} x={0.86} y={2.02} fill="#fff" rx={0.33} />
    <path fill="#0078d4" d="M11.86 5.27v3.49l-3 1.76v-3.5z" />
    <path fill="#83b9f9" d="m11.86 5.27-3 1.76-3-1.76 3-1.75z" />
    <path fill="#5ea0ef" d="M8.86 7.03v3.49l-3-1.76V5.27z" />
    <path fill="#83b9f9" d="m5.86 8.76 3-1.74v3.5z" opacity={0.2} />
    <path fill="#5ea0ef" d="m11.86 8.76-3-1.74v3.5z" opacity={0.2} />
    <path
      fill="url(#b)"
      d="M12.46 16.65c-1.77-.28-1.84-1.57-1.84-3.63H7.09c0 2.06-.07 3.35-1.84 3.63a1 1 0 0 0-.89 1h9a1 1 0 0 0-.9-1"
    />
  </svg>
)
export default SvgVirtualMachinesClassic
