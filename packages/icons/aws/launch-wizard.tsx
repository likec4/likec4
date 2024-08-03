// @ts-nocheck

import type { SVGProps } from 'react'
const SvgLaunchWizard = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id="a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#B0084D" />
        <stop offset="100%" stopColor="#FF4F8B" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M49.202 44h-2v3h-3v2h3v3h2v-3h3v-2h-3zm-9 19h10v-2h-10zm16-40h8v-8h-8zm10-9v10a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1V14a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1M48.621 32.58l-2.02-2.02-3.443 3.442 2.021 2.02zm-4.856 4.856-2.021-2.019-26.33 26.329 2.02 2.02zm6.977-4.149-32.601 32.6a.996.996 0 0 1-1.414 0l-3.434-3.434a.997.997 0 0 1 0-1.414l32.601-32.601a1 1 0 0 1 1.414 0l3.434 3.435a1 1 0 0 1 0 1.414M56.202 39h8v-8h-8zm10-9v10a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1V30a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1m-5 27h-2v4h-4v2h4v4h2v-4h4v-2h-4zm-48-37h7v-2h-7zm27 3h8v-8h-8zm-2 1V14a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1m-10 13v-3h3v-2h-3v-3h-2v3h-3v2h3v3zm-6-17h6v-2h-6z"
      />
    </g>
  </svg>
)
export default SvgLaunchWizard
