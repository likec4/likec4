// @ts-nocheck

import type { SVGProps } from 'react'
const SvgTenantStatus = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="Tenant-Status_svg__a" x1={8.14} x2={8.14} y1={6.52} y2={18.39} gradientUnits="userSpaceOnUse">
        <stop offset={0.22} stopColor="#32d4f5" />
        <stop offset={1} stopColor="#198ab3" />
      </linearGradient>
      <linearGradient id="Tenant-Status_svg__b" x1={7.8} x2={8.67} y1={0.15} y2={10.93} gradientUnits="userSpaceOnUse">
        <stop offset={0.22} stopColor="#32d4f5" />
        <stop offset={1} stopColor="#198ab3" />
      </linearGradient>
    </defs>
    <path
      fill="url(#Tenant-Status_svg__a)"
      d="M14 16.25A1.27 1.27 0 0 0 15.29 15a1 1 0 0 0 0-.15c-.5-4-2.78-7.25-7.13-7.25S1.44 10.33 1 14.84a1.28 1.28 0 0 0 1.14 1.4H14Z"
    />
    <path fill="#fff" d="M8.15 8.52A3.9 3.9 0 0 1 6 7.88l2.13 5.62 2.13-5.58a4 4 0 0 1-2.11.6" opacity={0.8} />
    <circle cx={8.15} cy={4.51} r={4.01} fill="url(#Tenant-Status_svg__b)" />
    <path
      fill="#b31b1b"
      d="M15.31 10.82A1.77 1.77 0 0 0 13.5 12a1.76 1.76 0 0 0-1.81-1.18C10.05 11 10 12.57 10 13.19c0 .44.1 1.84 3.48 4.27C16.91 15 17 13.63 17 13.19c0-.62 0-2.19-1.69-2.37"
    />
    <path
      fill="#f2f2f2"
      d="M17 13h-1.6a.11.11 0 0 0-.11.06l-.5.83a.07.07 0 0 1-.11 0L14 12.48a.13.13 0 0 0-.24 0l-.68 2a.06.06 0 0 1-.12 0l-.59-1.36a.13.13 0 0 0-.23 0l-.78 1.42a.11.11 0 0 1-.11.06h-.72a5 5 0 0 0 .37.51h.65a.11.11 0 0 0 .11-.07l.55-1 .74 1.71a.13.13 0 0 0 .24 0l.77-2.28.67 1.28a.14.14 0 0 0 .23 0l.74-1.26a.15.15 0 0 1 .11-.07H17"
    />
  </svg>
)
export default SvgTenantStatus
