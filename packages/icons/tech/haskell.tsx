// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgHaskell = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
    <path fill="#463B63" d="M0 110.2 30.1 65 0 19.9h22.6L52.7 65l-30.1 45.1H0z" />
    <path fill="#5E5187" d="M30.1 110.2 60.2 65 30.1 19.9h22.6l60.2 90.3H90.4L71.5 81.9l-18.8 28.2H30.1z" />
    <path fill="#904F8C" d="m102.9 83.8-10-15.1H128v15.1zM87.8 61.3l-10-15.1H128v15.1z" />
  </svg>
)}
export default SvgHaskell
