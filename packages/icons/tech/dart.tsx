// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgDart = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
    <path fill="#00c4b3" d="m35.2 34.9-8.3-8.3v59.7l.1 2.8c0 1.3.2 2.8.7 4.3l65.6 23.1 16.3-7.2z" />
    <path fill="#22d3c5" d="m109.6 109.3-16.3 7.2-65.4-23.1c1.3 4.8 4 10.1 7 13.2l21.3 21.2 47.6.1z" />
    <path
      fill="#0075c9"
      d="M1.7 65.1C-.4 67.3.7 72 4 75.5l14.7 14.8 9.2 3.3c-.3-1.5-.7-3-.7-4.3l-.1-2.8-.2-59.8m82.7 82.6 7.2-16.4-23-65.6c-1.5-.3-3-.6-4.3-.7l-2.9-.1-59.6.1"
    />
    <path
      fill="#00a8e1"
      d="M93.6 27.3q.3 0 0 0 .3 0 0 0m16 82 17.7-5.8V54.8l-20.4-20.5c-3-3-8.3-5.8-13.2-7l23.1 65.6"
    />
    <path fill="#00c4b3" d="M90.5 18.2 75.7 3.5c-3.4-3.4-8-4.4-10.4-2.3L26.9 26.6h59.5l2.9.1c1.3 0 2.8.2 4.3.7z" />
  </svg>
)}
export default SvgDart
