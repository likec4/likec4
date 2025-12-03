// @ts-nocheck

import type { SVGProps } from 'react'
const SvgVlang = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    preserveAspectRatio="xMidYMid"
    viewBox="0 0 256 253"
    {...props}
  >
    <defs>
      <path
        id="vlang_svg__a"
        d="m5.614.039 68.178 6.568c4.325.417 9.001 4.084 10.437 8.185l43.851 125.291 43.638-125.287c1.397-4.014 5.899-7.613 10.142-8.158l.283-.031L250.32.039c4.326-.417 6.643 2.564 5.173 6.653l-86.696 241.083-.413 1.147c-.47 1.308-1.605 2.458-2.93 3.117-.483.372-1.136.587-1.919.587h-66.78q-.124 0-.246-.003l.246.003a9 9 0 0 1-.493-.014c-4.203-.237-8.629-3.459-10.043-7.394L.442 6.692c-1.47-4.089.847-7.07 5.172-6.653"
      />
      <path id="vlang_svg__d" d="m158.907 248.922-36.096-104.274 5.156-3.223 36.741 106.35z" />
      <filter id="vlang_svg__c" width="181.4%" height="132.2%" x="-40.2%" y="-14.9%" filterUnits="objectBoundingBox">
        <feMorphology in="SourceAlpha" operator="dilate" radius={2} result="shadowSpreadOuter1" />
        <feOffset dy={2} in="shadowSpreadOuter1" result="shadowOffsetOuter1" />
        <feGaussianBlur in="shadowOffsetOuter1" result="shadowBlurOuter1" stdDeviation={3} />
        <feColorMatrix in="shadowBlurOuter1" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0" />
      </filter>
    </defs>
    <mask id="vlang_svg__b" fill="#fff">
      <use xlinkHref="#vlang_svg__a" />
    </mask>
    <path
      fill="#536B8A"
      d="M168.797 247.775 255.493 6.692c1.47-4.089-.847-7.07-5.173-6.653l-68.177 6.568c-4.325.417-8.997 4.086-10.425 8.189L91.473 245.193c-1.43 4.102.937 7.433 5.282 7.433h66.36c2.173 0 4.534-1.659 5.269-3.704z"
      mask="url(#vlang_svg__b)"
    />
    <g mask="url(#vlang_svg__b)">
      <use xlinkHref="#vlang_svg__d" filter="url(#vlang_svg__c)" />
    </g>
    <path
      fill="#5D87BF"
      d="m5.614.039 68.178 6.568c4.325.417 9.001 4.084 10.437 8.185l81.943 234.12c.717 2.05-.464 3.714-2.637 3.714h-66.78c-4.345 0-9.066-3.319-10.536-7.408L.442 6.692c-1.47-4.089.847-7.07 5.172-6.653"
      mask="url(#vlang_svg__b)"
    />
  </svg>
)
export default SvgVlang
