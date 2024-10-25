// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgManagedServiceForPrometheus = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#B0084D" />
        <stop offset="100%" stopColor="#FF4F8B" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill={`url(#a-${suffix})`} d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M53 30c-1.654 0-3-1.346-3-3s1.346-3 3-3 3 1.346 3 3-1.346 3-3 3M43 20c-1.654 0-3-1.346-3-3s1.346-3 3-3 3 1.346 3 3-1.346 3-3 3m-8 18c-1.654 0-3-1.346-3-3s1.346-3 3-3 3 1.346 3 3-1.346 3-3 3m-10-9c-1.654 0-3-1.346-3-3s1.346-3 3-3 3 1.346 3 3-1.346 3-3 3m28-7a4.96 4.96 0 0 0-2.753.833l-3.08-3.08A4.97 4.97 0 0 0 48 17c0-2.757-2.243-5-5-5s-5 2.243-5 5c0 1.592.762 2.997 1.926 3.913l-4.563 9.124C35.241 30.028 35.125 30 35 30a4.96 4.96 0 0 0-3.307 1.279l-2.526-2.526A4.97 4.97 0 0 0 30 26c0-2.757-2.243-5-5-5s-5 2.243-5 5 2.243 5 5 5a4.96 4.96 0 0 0 2.753-.833l2.727 2.728A5 5 0 0 0 30 35c0 2.757 2.243 5 5 5s5-2.243 5-5c0-1.916-1.095-3.563-2.681-4.402l4.394-8.787c.413.111.84.189 1.287.189a4.96 4.96 0 0 0 2.753-.833l3.08 3.08A4.97 4.97 0 0 0 48 27c0 2.757 2.243 5 5 5s5-2.243 5-5-2.243-5-5-5m-6.497 29H32.5L28 45h23.048zm-4.272 15h-5.462l-3.468-13h12.398zM53.06 43H26a1.001 1.001 0 0 0-.8 1.6l5.884 7.845 3.95 14.813A1 1 0 0 0 36 68h7a1 1 0 0 0 .966-.742l3.95-14.811 5.94-7.843A.999.999 0 0 0 53.06 43"
      />
    </g>
  </svg>
)}
export default SvgManagedServiceForPrometheus
