// @ts-nocheck

import type { SVGProps } from 'react'
const SvgManagedDesktop = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="a" x1={9} x2={9} y1={12.68} y2={0.68} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.82} stopColor="#5ea0ef" />
      </linearGradient>
      <linearGradient id="b" x1={9} x2={9} y1={17.32} y2={12.68} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#1490df" />
        <stop offset={0.98} stopColor="#1f56a3" />
      </linearGradient>
    </defs>
    <rect width={18} height={12} y={0.68} fill="url(#a)" rx={0.6} />
    <rect width={16} height={10} x={1} y={1.68} fill="#fff" rx={0.33} />
    <path
      fill="url(#b)"
      d="M12.61 16.31c-1.78-.28-1.85-1.56-1.84-3.63H7.23c0 2.07-.06 3.35-1.84 3.63a1.05 1.05 0 0 0-.89 1h9a1.05 1.05 0 0 0-.89-1"
    />
    <path
      fill="#86d633"
      d="m8.583 9.068-.672.672a.29.29 0 0 1-.41 0L4.843 7.082a.29.29 0 0 1 0-.41l.466-.467a.29.29 0 0 1 .41 0l2.829 2.828Z"
    />
    <path
      fill="#5e9624"
      d="M7.51 9.732 6.84 9.06l6.102-6.102a.29.29 0 0 1 .41 0l.46.46a.29.29 0 0 1 0 .41L7.914 9.724a.29.29 0 0 1-.41 0Z"
    />
  </svg>
)
export default SvgManagedDesktop
