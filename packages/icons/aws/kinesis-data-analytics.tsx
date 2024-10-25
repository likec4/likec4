// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgKinesisDataAnalytics = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#4D27A8" />
        <stop offset="100%" stopColor="#A166FF" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill={`url(#a-${suffix})`} d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M19 62h2c0-4.987 1.699-10.507 14.016-13.894v-2.067C20.849 49.788 19 56.521 19 62m6 6h2c0-4.601.016-10.267 8.016-14.219v-2.216C25.008 56.052 25 62.942 25 68m40-21H39v19h2v-9a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v9h2V54a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v12h2V51a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v15h2zm-6 19h2V52h-2zm-8 0h2V55h-2zm-8 0h2v-8h-2zm24-20v21a1 1 0 0 1-1 1H38a1 1 0 0 1-1-1V46a1 1 0 0 1 1-1h28a1 1 0 0 1 1 1M15 26h-2c0 7.396 10.039 12.08 29.893 14C23.039 41.92 13 46.604 13 54h2c0-4.855 6.756-13 52-13v-2c-45.244 0-52-8.145-52-13m6-8h-2c0 9.396 5.703 19 48 19v-2c-40.535 0-46-8.594-46-17m46 13v2c-18.337 0-30.272-2.359-36.49-7.212C25 21.488 25 16.004 25 12h2c0 7.566 0 19 40 19"
      />
    </g>
  </svg>
)}
export default SvgKinesisDataAnalytics
