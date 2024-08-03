// @ts-nocheck

import type { SVGProps } from 'react'
const SvgSnowball = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id="a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#1B660F" />
        <stop offset="100%" stopColor="#6CAE3E" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M36 24h8v-2h-8zM26 47h29V35H26zm30-14H25a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h31a1 1 0 0 0 1-1V34a1 1 0 0 0-1-1m10 22.847C66 58.137 64.238 60 62.072 60H17.928C15.762 60 14 58.137 14 55.847V24.153C14 21.863 15.762 20 17.928 20h44.144C64.238 20 66 21.863 66 24.153zM62.072 18H17.928C14.659 18 12 20.76 12 24.153v31.694C12 59.24 14.659 62 17.928 62h44.144C65.341 62 68 59.24 68 55.847V24.153C68 20.76 65.341 18 62.072 18M62 53.52A1.49 1.49 0 0 1 60.505 55h-41.01A1.49 1.49 0 0 1 18 53.52V25.48c0-.816.671-1.48 1.495-1.48h10.724l.811 3.243c.112.444.511.757.97.757h16c.459 0 .858-.313.97-.757L49.781 24h10.724A1.49 1.49 0 0 1 62 25.48zM60.505 22H49a1 1 0 0 0-.97.757L47.219 26H32.781l-.811-3.243A1 1 0 0 0 31 22H19.495A3.49 3.49 0 0 0 16 25.48v28.04A3.49 3.49 0 0 0 19.495 57h41.01A3.49 3.49 0 0 0 64 53.52V25.48A3.49 3.49 0 0 0 60.505 22"
      />
    </g>
  </svg>
)
export default SvgSnowball
