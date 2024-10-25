// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgKinesisDataStreams = (props: SVGProps<SVGSVGElement>) => {
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
        d="M49 51h6v-2h-6zm4 11h3v-3h-3zm5-4v5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1m-6-3h3v-2h-3zm7-2h3v-3h-3zm4 2h-5a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h2.975A9.94 9.94 0 0 0 55 46c-4.468 0-8.261 2.947-9.539 7H50v2h-4.949a10 10 0 0 0 0 2H49v2h-3.539a10 10 0 0 0 .893 2H49v2h-1.129A9.97 9.97 0 0 0 55 66a9.96 9.96 0 0 0 7.129-3H60v-2h3.647a10 10 0 0 0 .892-2H60v-2h4.95q.05-.494.05-1a9.9 9.9 0 0 0-1-4.33V54a1 1 0 0 1-1 1m4 1c0 6.617-5.382 12-12 12-6.617 0-12-5.383-12-12s5.383-12 12-12c6.618 0 12 5.383 12 12M48.127 43.817C33.434 45.238 19 48.72 19 62h2c0-6.367 3-13.122 24.034-15.815a14 14 0 0 1 3.093-2.368M25 68h2c0-5.815.012-12.932 14.801-16.623.281-.8.628-1.567 1.043-2.293C25.014 53.047 25 61.982 25 68M15 26h-2c0 7.396 10.039 12.08 29.893 14C23.039 41.92 13 46.604 13 54h2c0-4.855 6.756-13 52-13v-2c-45.244 0-52-8.145-52-13m6-8h-2c0 9.396 5.703 19 48 19v-2c-40.535 0-46-8.594-46-17m46 13v2c-18.337 0-30.272-2.359-36.49-7.212C25 21.488 25 16.004 25 12h2c0 7.566 0 19 40 19"
      />
    </g>
  </svg>
)}
export default SvgKinesisDataStreams
