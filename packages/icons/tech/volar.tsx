// @ts-nocheck

import type { SVGProps } from 'react'
const SvgVolar = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    preserveAspectRatio="xMidYMid"
    viewBox="0 0 256 224"
    {...props}
  >
    <defs>
      <linearGradient id="volar_svg__a" x1="105.885%" x2="-.485%" y1="16.567%" y2="62.101%">
        <stop offset="0%" stopColor="#7A85EC" />
        <stop offset="100%" stopColor="#3DDCFF" />
      </linearGradient>
      <path
        id="volar_svg__b"
        d="M110.204 12.886C71.297-14.28 21.28 8.106 0 20.072l99.384 168.085 92.185-157.935c-15.254 4.202-45.89 7.433-81.365-17.336"
      />
    </defs>
    <path
      fill="url(#volar_svg__a)"
      d="M134.247 220.01c-2.777 4.809-9.718 4.809-12.494 0L.977 10.82C-1.799 6.011 1.671 0 7.224 0h241.552c5.553 0 9.023 6.011 6.247 10.82z"
    />
    <g transform="translate(28.616 45.423)">
      <mask id="volar_svg__c" fill="#fff">
        <use xlinkHref="#volar_svg__b" />
      </mask>
      <path
        fill="#001AFF"
        d="M105.63 174.587c-2.776 4.81-9.717 4.81-12.493 0L-27.64-34.603c-2.777-4.808.694-10.82 6.247-10.82H220.16c5.553 0 9.023 6.012 6.246 10.82z"
        mask="url(#volar_svg__c)"
      />
    </g>
  </svg>
)
export default SvgVolar
