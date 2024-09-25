// @ts-nocheck

import type { SVGProps } from 'react'
const SvgLocation = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="a" x1={7.863} x2={7.863} y2={12.81} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#b77af4" />
        <stop offset={0.621} stopColor="#8c4fe4" />
        <stop offset={0.997} stopColor="#773adc" />
      </linearGradient>
    </defs>
    <circle cx={7.83} cy={12.908} r={2.228} fill="#32bedd" />
    <path
      fill="#50e6ff"
      d="M7.83 16.491a3.584 3.584 0 1 1 3.583-3.583 3.587 3.587 0 0 1-3.583 3.583m0-6.558a2.975 2.975 0 1 0 2.97 2.975 2.98 2.98 0 0 0-2.97-2.975"
    />
    <path
      fill="#9cebff"
      d="M7.83 18a5.093 5.093 0 1 1 5.092-5.092A5.1 5.1 0 0 1 7.83 18m0-9.576a4.484 4.484 0 1 0 4.483 4.484A4.49 4.49 0 0 0 7.83 8.424"
    />
    <path
      fill="url(#a)"
      d="M7.863 0a3.894 3.894 0 0 0-3.771 4.063c0 1.772 2.249 5.922 3.274 8.413a.535.535 0 0 0 .992 0c1.023-2.507 3.277-6.7 3.277-8.412A3.94 3.94 0 0 0 7.863 0m0 5.5A1.677 1.677 0 1 1 9.54 3.826 1.676 1.676 0 0 1 7.863 5.5"
    />
  </svg>
)
export default SvgLocation
