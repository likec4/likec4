// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAppRunner = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#C8511B" />
        <stop offset="100%" stopColor="#F90" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill={`url(#a-${suffix})`} d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="m27.707 53.707-1.414-1.414L14 64.586V58h-2v9a1 1 0 0 0 1 1h9v-2h-6.586zM67 12h-9v2h6.586L52.293 26.293l1.414 1.414L66 15.414V22h2v-9a1 1 0 0 0-1-1M43 59h16V43H43zm18-17v18a1 1 0 0 1-1 1H42a1 1 0 0 1-1-1V42a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1m-40-5h16V21H21zm18-17v18a1 1 0 0 1-1 1H20a1 1 0 0 1-1-1V20a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1m-1 21H20a1 1 0 0 0-1 1v14.757l2-2V43h16v16H25.242l-2 2H38a1 1 0 0 0 1-1V42a1 1 0 0 0-1-1m21-15.758 2-2V38a1 1 0 0 1-1 1H42a1 1 0 0 1-1-1V20a1 1 0 0 1 1-1h14.758l-2 2H43v16h16z"
      />
    </g>
  </svg>
)}
export default SvgAppRunner
