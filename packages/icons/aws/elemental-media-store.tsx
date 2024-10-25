// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgElementalMediaStore = (props: SVGProps<SVGSVGElement>) => {
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
        d="m29 52.381-5 2.5-5-2.5v-5.764l5-2.5 5 2.5zM31 53v-7a1 1 0 0 0-.553-.894l-6-3a1 1 0 0 0-.894 0l-6 3a1 1 0 0 0-.553.894v7c0 .38.214.725.553.895l6 3a1 1 0 0 0 .894 0l6-3c.339-.17.553-.516.553-.895m21 5.07V47.574l10-5.833v10.68zm-11 6.22v-9.47l7.88 5.02zM30 33.2V21.747l9 5.32-.003 5.93 2 .001.002-4.75H41l9 5.32v11.483l-3.084-2.211-1.166 1.626L50 47.513V58.18l-9-5.73V39.998a.99.99 0 0 0-.51-.87zm-2-11.271v10.14l-8.97-5.07zm12-6.78 8.875 5.017-8.488 5.402-9.198-5.44zm12 18.468 10-5v10.808l-10 5.834zm-1.149-12.338 10.021 5.666-9.83 4.915h-.002l-8.72-5.15h-.001zm12.639 4.85-23-13a1 1 0 0 0-.98 0l-23 13a.99.99 0 0 0-.51.87v12h2v-10.29l21 11.87V64.24l-8.488-5.054-1.024 1.718 10.001 5.956.001-.001v.001h.01c.15.09.33.14.5.14s.34-.04.49-.13l10.4-5.88 1-.57 11.6-6.55A.99.99 0 0 0 64 53V26.997a.99.99 0 0 0-.51-.87"
      />
    </g>
  </svg>
)}
export default SvgElementalMediaStore
