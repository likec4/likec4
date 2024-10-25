// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgSnowcone = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#1B660F" />
        <stop offset="100%" stopColor="#6CAE3E" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill={`url(#a-${suffix})`} d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M56 40v14a1 1 0 0 1-1 1H25a1 1 0 0 1-1-1V40a1 1 0 0 1 1-1h8v2h-7v12h28V41h-7v-2h8a1 1 0 0 1 1 1m10 19.696c0 .168-.126.304-.28.304H63V36.302C63 35.033 61.98 34 60.728 34H19.274C18.021 34 17 35.034 17 36.304V60h-2.722c-.153 0-.278-.135-.278-.302V33.913C14 32.307 15.274 31 16.842 31h46.324C64.729 31 66 32.303 66 33.905zM19 59V36.304c0-.168.123-.304.274-.304h41.454c.15 0 .272.135.272.302V59zm34.233-30H26.767l1.799-3h22.868zM24.58 20.986A2.8 2.8 0 0 1 26.702 20h27.167c.813 0 1.587.359 2.083.937L62 29h-6.434l-2.709-4.515A1 1 0 0 0 52 24H28a1 1 0 0 0-.857.485L24.434 29h-6.338zm40.13 8.294-7.198-9.593A4.8 4.8 0 0 0 53.869 18H26.702a4.8 4.8 0 0 0-3.659 1.708l-7.747 9.572A4.9 4.9 0 0 0 12 33.913v25.785C12 60.967 13.022 62 14.278 62H19a1 1 0 0 0 1-1h41a1 1 0 0 0 1 1h3.72c1.258 0 2.28-1.034 2.28-2.304V33.905a4.89 4.89 0 0 0-3.29-4.625M37 44h6v-3h-6zm-1 2h8a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1h-8a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1"
      />
    </g>
  </svg>
)}
export default SvgSnowcone
