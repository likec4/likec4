// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgDevicon = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
    <path fill="#558d6c" d="m4.92 8 10.17 87.05L64 119.95V8z" />
    <path fill="#5aa579" d="M64 8v111.95l.05.05 48.93-24.91L123.08 8z" />
    <path fill="#60be86" d="m18.84 22.11 6.49 65.18L64 105.97V22.11z" />
    <path fill="#65d693" d="M64 22.11v83.86l.05.05 38.69-18.76 6.42-65.15z" />
    <path
      fill="#5aa579"
      d="M105.72 54.9 73.14 39.42l-1.83-.9-1.12 2.28L64 53.41V68.3l9.15-18.08 21.5 9.57-23.09 10.37-.87.47v10.88L73 80.38l32.78-15.69a2 2 0 0 0 .92-2v-5.78a2 2 0 0 0-.98-2.01"
    />
    <path
      fill="#558d6c"
      d="m56 69.39-21.79-9.6 23.3-10.37 1.76-.7V37.76l-3.4 1.44-33.93 15.69a2.26 2.26 0 0 0-1.28 2v5.77a2.22 2.22 0 0 0 1.24 2l33.44 15.52 2 .9 1.21-2.26L64 68.3V53.41z"
    />
  </svg>
)}
export default SvgDevicon
