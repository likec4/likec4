// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgNetworkWatcher = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <radialGradient
        id={`a-${suffix}`}
        cx={6.61}
        cy={45.13}
        r={6.4}
        gradientTransform="matrix(.94 0 0 .94 5.04 -35.89)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#5ea0ef" />
        <stop offset={0.28} stopColor="#5b9fee" />
        <stop offset={0.47} stopColor="#529bec" />
        <stop offset={0.64} stopColor="#4394e7" />
        <stop offset={0.79} stopColor="#2d8be1" />
        <stop offset={0.93} stopColor="#117fd9" />
        <stop offset={1} stopColor="#0078d4" />
      </radialGradient>
    </defs>
    <rect
      width={5.89}
      height={1.34}
      x={-0.15}
      y={14.53}
      fill="#198ab3"
      rx={0.63}
      transform="rotate(-45 2.797 15.202)"
    />
    <path
      fill={`url(#a-${suffix})`}
      d="M17 4.35A6.4 6.4 0 0 0 16.25 3a6.24 6.24 0 0 0-8.74-1.24l-.06.05a6.18 6.18 0 0 0-2.21 3.33c0 .22-.1.44-.13.66A6.25 6.25 0 0 0 7 11.26a2 2 0 0 0 .22.2l.22.18a5.8 5.8 0 0 0 .94.6l.1.06.17.07.14.07.15.06.16.06.14.05.2.06h.11l.29.08.32.07h.08a2 2 0 0 0 .25 0h1.52a5 5 0 0 0 .76-.15 6.2 6.2 0 0 0 2.21-1.1 6.4 6.4 0 0 0 1.13-1.13A6.28 6.28 0 0 0 17 4.35m-1.45-.93h-1.22a5.9 5.9 0 0 0-.88-1.66 5.34 5.34 0 0 1 2.13 1.66Zm-3.91-2a3.27 3.27 0 0 1 1.8 2h-1.8Zm0 2.84h2.07a9.2 9.2 0 0 1 .33 2.11h-2.4Zm0 2.91h2.4a9.2 9.2 0 0 1-.33 2.12h-2.04V7.13ZM8.52 5.74a8.7 8.7 0 0 1 .28-1.52h2.07v2.11H8.48c.01-.2.02-.4.04-.59m2.35-4.36v2H9.08a3.23 3.23 0 0 1 1.79-2M7.94 2.44a6 6 0 0 1 1.1-.64 6.1 6.1 0 0 0-.88 1.67H7a5.7 5.7 0 0 1 .94-1.03M6.45 4.22H8a9 9 0 0 0-.24 1.34c0 .25-.05.51-.05.77H5.85A7 7 0 0 1 6 5.58a6 6 0 0 1 .45-1.36m-.6 2.91h1.83A9.4 9.4 0 0 0 8 9.25H6.45a5.4 5.4 0 0 1-.6-2.12M7 10.07h1.21a5.9 5.9 0 0 0 .88 1.66A5.3 5.3 0 0 1 7 10.07m3.89 2a3.23 3.23 0 0 1-1.79-2h1.79Zm0-2.84H8.8a9.2 9.2 0 0 1-.32-2.12h2.39v2.14Zm1.53 2.42a2 2 0 0 1-.73.42v-2h1.8a4.4 4.4 0 0 1-1.09 1.6ZM14.6 11a5.2 5.2 0 0 1-1.15.68 5.9 5.9 0 0 0 .88-1.66h1.25a5.4 5.4 0 0 1-.98.98m1.48-1.78h-1.5a10.6 10.6 0 0 0 .29-2.12h1.81a5.3 5.3 0 0 1-.6 2.15Zm-1.21-2.89a10.6 10.6 0 0 0-.29-2.11h1.51a5.5 5.5 0 0 1 .6 2.11Z"
    />
    <circle cx={6.36} cy={10.94} r={4.04} fill="#50e6ff" />
    <circle cx={6.35} cy={10.87} r={3.17} fill="#fff" />
    <path
      fill="#76bc2d"
      d="m4.72 10.94.8 1.86.81-2.39.67 1.36.83-1.4h1.29A4 4 0 0 0 9 9.9H7.61l-.54.91-.83-1.58-.77 2.27-.7-1.61-.86 1.57h-.46a2.6 2.6 0 0 0 .15.47h.58Z"
    />
  </svg>
)}
export default SvgNetworkWatcher
