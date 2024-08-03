// @ts-nocheck

import type { SVGProps } from 'react'
const SvgElementalLink = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id="a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#C8511B" />
        <stop offset="100%" stopColor="#F90" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="m34.397 17.39-1-1.732 6.104-3.524a1 1 0 0 1 1 0l6.102 3.524-1 1.732-5.602-3.235zM46 56.751l-6 3.464-6-3.464v-6.928l6-3.464 6 3.464zm2-7.505a1 1 0 0 0-.5-.866l-7-4.042a1 1 0 0 0-1 0l-7 4.042a1 1 0 0 0-.5.866V52.5H16v2h16v2.828a1 1 0 0 0 .5.867l6.5 3.753V67.5h2v-5.552l6.5-3.753c.309-.179.5-.509.5-.867V54.5h16v-2H48zM53 36.5h6v-2h-6zm0-5h6v-2h-6zm0-5h6v-2h-6zm-31 0h16v-2H22zm-5 12h46v-17H17zm47-19H16a1 1 0 0 0-1 1v19a1 1 0 0 0 1 1h48a1 1 0 0 0 1-1v-19a1 1 0 0 0-1-1"
      />
    </g>
  </svg>
)
export default SvgElementalLink
