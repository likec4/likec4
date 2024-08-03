// @ts-nocheck

import type { SVGProps } from 'react'
const SvgForecast = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id="a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#055F4E" />
        <stop offset="100%" stopColor="#56C0A7" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M50 59h6V29h-6zm-2 2h10V27H48zm-13-2h6V37h-6zm-2 2h10V35H33zm-13-2h6V46h-6zm-2 2h10V44H18zm44-46v2h2.281l-5.99 5H47.458c-.362 0-.696.196-.873.512L42.395 30H31.689a1 1 0 0 0-.934.645L27.582 39H18v2h10.272a1 1 0 0 0 .935-.645L32.38 32h10.6c.363 0 .697-.196.874-.512L48.044 24h10.609a1 1 0 0 0 .641-.232L66 18.17V21h2v-6zm1 11h2v40H12V16h43v2H14v46h49z"
      />
    </g>
  </svg>
)
export default SvgForecast
