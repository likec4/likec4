// @ts-nocheck

import type { SVGProps } from 'react'
const SvgSupport = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    baseProfile="tiny"
    overflow="visible"
    viewBox="0 0 24 24"
    {...props}
  >
    <path fill="none" d="M0 0h24v24H0z" />
    <g fillRule="evenodd">
      <path
        fill="#5C85DE"
        d="M12 .8c1.7 0 3 1.4 3 3s-1.3 3-3 3-3-1.3-3-3 1.4-3 3-3m3.8 9.7v12h-3v-6h-1.6v6h-3v-12H1.4v-3h21v3z"
      />
      <path fill="#3367D6" d="M15.8 10.5v12h-3v-6H12v-9h10.5v3zM12 6.8v-6c1.7 0 3 1.4 3 3s-1.3 3-3 3" />
    </g>
  </svg>
)
export default SvgSupport
