// @ts-nocheck

import type { SVGProps } from 'react'
const SvgVirtualMachine = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id="Virtual-Machine_svg__a"
        x1={8.88}
        x2={8.88}
        y1={12.21}
        y2={0.21}
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.82} stopColor="#5ea0ef" />
      </linearGradient>
      <linearGradient
        id="Virtual-Machine_svg__b"
        x1={8.88}
        x2={8.88}
        y1={16.84}
        y2={12.21}
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0.15} stopColor="#ccc" />
        <stop offset={1} stopColor="#707070" />
      </linearGradient>
    </defs>
    <rect width={18} height={12} x={-0.12} y={0.21} fill="url(#Virtual-Machine_svg__a)" rx={0.6} />
    <path fill="#50e6ff" d="M11.88 4.46v3.49l-3 1.76v-3.5z" />
    <path fill="#c3f1ff" d="m11.88 4.46-3 1.76-3-1.76 3-1.75z" />
    <path fill="#9cebff" d="M8.88 6.22v3.49l-3-1.76V4.46z" />
    <path fill="#c3f1ff" d="m5.88 7.95 3-1.74v3.5z" />
    <path fill="#9cebff" d="m11.88 7.95-3-1.74v3.5z" />
    <path
      fill="url(#Virtual-Machine_svg__b)"
      d="M12.49 15.84c-1.78-.28-1.85-1.56-1.85-3.63H7.11c0 2.07-.06 3.35-1.84 3.63a1 1 0 0 0-.89 1h9a1 1 0 0 0-.89-1"
    />
  </svg>
)
export default SvgVirtualMachine
