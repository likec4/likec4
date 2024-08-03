// @ts-nocheck

import type { SVGProps } from 'react'
const SvgLambda = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id="a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#C8511B" />
        <stop offset="100%" stopColor="#F90" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M28.008 66H15.59l13.733-28.704 6.222 12.81zm2.212-31.447a1 1 0 0 0-.902-.564h-.003a1 1 0 0 0-.903.569L13.098 66.569A1 1 0 0 0 14.002 68h14.64c.388 0 .74-.223.906-.572l8.016-16.9a1 1 0 0 0-.005-.863zM64.995 66H52.66L32.867 24.57a1 1 0 0 0-.905-.57H23.89l.009-10h15.82L59.42 55.429c.166.348.519.571.906.571h4.67zm1.003-12H60.96l-19.7-41.429a1 1 0 0 0-.907-.571H22.898c-.553 0-1.002.447-1.003.999l-.01 12A1 1 0 0 0 22.886 26h8.442l19.793 41.43c.167.348.517.57.904.57h13.972A1 1 0 0 0 67 67V55a1 1 0 0 0-1.002-1"
      />
    </g>
  </svg>
)
export default SvgLambda
