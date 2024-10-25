// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgParallelCluster = (props: SVGProps<SVGSVGElement>) => {
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
        d="M48.77 62h8v-8h-8zm10-9v10a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1V53a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1m5-7h-10a1 1 0 0 0-1 1v3a1 1 0 1 0 2 0v-2h8v8h-1a1 1 0 1 0 0 2h2a1 1 0 0 0 1-1V47a1 1 0 0 0-1-1m-41-20h8v-8h-8zm-2 1V17a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1m-6 7h10a1 1 0 0 0 1-1v-2a1 1 0 0 0-2 0v1h-8v-8h2a1 1 0 0 0 0-2h-3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1m52.31 10.135a1 1 0 0 1-1.924-.546c.816-2.877.287-6.035-1.38-8.241-1.56-2.063-3.945-3.154-6.898-3.154-7.615 0-11.773 4.246-15.89 9.02 2.583 2.952 5.306 5.854 8.709 7.488a1 1 0 0 1-.865 1.803c-3.668-1.761-6.498-4.727-9.16-7.757-4.013 4.688-8.251 9.377-15.597 9.377-4.071 0-7.547-1.653-9.787-4.654-2.138-2.865-2.831-6.544-1.852-9.843a1 1 0 0 1 1.918.568c-.788 2.657-.2 5.753 1.537 8.078 1.853 2.483 4.76 3.851 8.184 3.851 6.553 0 10.328-4.292 14.269-8.9-2.975-3.425-5.817-6.625-9.57-8.135a1 1 0 1 1 .747-1.856c4.099 1.65 7.188 5.064 10.14 8.458 4.216-4.868 8.854-9.498 17.217-9.498 3.553 0 6.569 1.402 8.493 3.948 2.038 2.695 2.693 6.525 1.709 9.993"
      />
    </g>
  </svg>
)}
export default SvgParallelCluster
