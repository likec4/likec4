// @ts-nocheck

import type { SVGProps } from 'react'
const SvgKinesis = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id="Kinesis_svg__a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#4D27A8" />
        <stop offset="100%" stopColor="#A166FF" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#Kinesis_svg__a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M19 62h2c0-8.406 5.465-17 46-17v-2c-42.297 0-48 9.604-48 19m6 6h2c0-7.566 0-19 40-19v-2c-18.337 0-30.272 2.359-36.49 7.212C25 58.512 25 63.996 25 68M15 26h-2c0 7.396 10.039 12.08 29.893 14C23.039 41.92 13 46.604 13 54h2c0-4.855 6.756-13 52-13v-2c-45.244 0-52-8.145-52-13m6-8h-2c0 9.396 5.703 19 48 19v-2c-40.535 0-46-8.594-46-17m46 13v2c-18.337 0-30.272-2.359-36.49-7.212C25 21.488 25 16.004 25 12h2c0 7.566 0 19 40 19"
      />
    </g>
  </svg>
)
export default SvgKinesis
