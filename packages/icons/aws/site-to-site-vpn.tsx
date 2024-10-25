// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgSiteToSiteVpn = (props: SVGProps<SVGSVGElement>) => {
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
        d="M37.271 48.01a2.85 2.85 0 0 0 2.85 2.85 2.85 2.85 0 0 0 2.848-2.85 2.85 2.85 0 0 0-2.848-2.849 2.85 2.85 0 0 0-2.85 2.85m-2 0a4.855 4.855 0 0 1 4.85-4.849 4.854 4.854 0 0 1 4.848 4.85c0 2.386-1.737 4.364-4.011 4.764v6.541h-2v-6.614c-2.112-.524-3.687-2.42-3.687-4.692M23.086 66.26h33.745v-26.2H23.086zm29.39-28.2h6.355v30.2H21.085v-30.2h6.752v-5.752h2v5.752h20.639v-5.752h2zm6.206-15.56-1.39 1.44 3.926 3.794h-43.26l3.805-3.807-1.414-1.415L14 28.862l6.504 6.286 1.391-1.439-4.113-3.975H61.41l-3.987 3.987 1.414 1.414 6.349-6.349zm-28.845 3.056h-2V24.47c0-6.148 4.301-11.32 10.226-12.3 3.625-.597 7.294.403 10.06 2.75a12.3 12.3 0 0 1 4.353 9.397v1.24h-2v-1.24c0-3.037-1.329-5.907-3.647-7.873-2.316-1.964-5.392-2.803-8.44-2.3-4.875.804-8.552 5.244-8.552 10.326z"
      />
    </g>
  </svg>
)}
export default SvgSiteToSiteVpn
