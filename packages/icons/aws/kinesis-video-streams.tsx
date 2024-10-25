// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgKinesisVideoStreams = (props: SVGProps<SVGSVGElement>) => {
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
        d="M37 45.553v2.049C22.938 50.908 21 56.719 21 62h-2c0-5.77 2.077-12.82 18-16.447m0 5.207v2.138C27.007 56.854 27 63.011 27 68h-2c0-5.121.009-12.809 12-17.24m28 10.815c0 .786-.639 1.425-1.425 1.425h-21.15A1.426 1.426 0 0 1 41 61.575V48.424c0-.785.639-1.424 1.425-1.424h21.15c.786 0 1.425.639 1.425 1.424zM63.575 45h-21.15A3.43 3.43 0 0 0 39 48.424v13.151A3.43 3.43 0 0 0 42.425 65h21.15A3.43 3.43 0 0 0 67 61.575V48.424A3.43 3.43 0 0 0 63.575 45M67 39v2c-45.244 0-52 8.145-52 13h-2c0-7.396 10.039-12.08 29.893-14C23.039 38.079 13 33.395 13 26h2c0 4.855 6.756 13 52 13m0-4v2c-42.297 0-48-9.605-48-19h2c0 8.406 5.465 17 46 17m0-4v2c-18.337 0-30.272-2.359-36.49-7.212C25 21.488 25 16.004 25 12h2c0 7.566 0 19 40 19M51 57.277v-4.554L54.984 55zm6.496-3.145-7-4A.998.998 0 0 0 49 51v8a1 1 0 0 0 1.496.868l7-4a.999.999 0 0 0 0-1.736"
      />
    </g>
  </svg>
)}
export default SvgKinesisVideoStreams
