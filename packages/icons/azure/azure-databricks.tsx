// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAzureDatabricks = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <path
      fill="#ff3621"
      d="M1.155 4.93v.512L9 9.868l7.006-3.957v1.6L9 11.491 1.55 7.258l-.395.22v3.062L9 14.955l7.006-3.942v1.586L9 16.581l-7.45-4.234-.395.22v.519L9 17.5l7.845-4.414v-3.065l-.4-.218L9 14.036l-7.008-3.982V8.476L9 12.414 16.845 8V4.978l-.4-.219L9 8.993 2.352 5.215 9 1.46l5.476 3.094.479-.269v-.422L9 .5Z"
    />
  </svg>
)}
export default SvgAzureDatabricks
