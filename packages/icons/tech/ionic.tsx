// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgIonic = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
    <g fill="#4e8ef7">
      <circle cx={64} cy={64} r={24.08} />
      <path d="M113.14 23.14a8.27 8.27 0 0 0-13.7-6.25 59 59 0 1 0 11.67 11.67 8.24 8.24 0 0 0 2.03-5.42M64 121A57 57 0 1 1 98.1 18.36a8.27 8.27 0 0 0 11.53 11.53A57 57 0 0 1 64 121" />
    </g>
  </svg>
)}
export default SvgIonic
