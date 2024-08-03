// @ts-nocheck

import type { SVGProps } from 'react'
const SvgWorkMail = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id="a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#BD0816" />
        <stop offset="100%" stopColor="#FF5252" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M14 66V15.414l25.293 25.293a.997.997 0 0 0 1.414 0L66 15.414V66zm50.586-52L40 38.586 15.414 14zM67 12H13a1 1 0 0 0-1 1v54a1 1 0 0 0 1 1h54a1 1 0 0 0 1-1V13a1 1 0 0 0-1-1"
      />
    </g>
  </svg>
)
export default SvgWorkMail
