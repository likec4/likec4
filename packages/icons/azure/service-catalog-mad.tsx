// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgServiceCatalogMad = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={8.15} x2={8.15} y1={17.5} y2={2.1} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#773adc" />
        <stop offset={0.25} stopColor="#9255e6" />
        <stop offset={0.5} stopColor="#a669ee" />
        <stop offset={0.76} stopColor="#b376f2" />
        <stop offset={1} stopColor="#b77af4" />
      </linearGradient>
    </defs>
    <path
      fill="#773adc"
      d="M1.93 2.1 3.15.7a.58.58 0 0 1 .44-.2h11.6a.81.81 0 0 1 .88.83v14.5a.6.6 0 0 1-.19.44l-1.3 1.2H2.72l-.8-.34z"
    />
    <path
      fill="#fff"
      d="m2.9 2.1.74-.85A.53.53 0 0 1 4 1.08h10.88a.52.52 0 0 1 .52.52v13.78a.52.52 0 0 1-.17.39l-1.15 1.05z"
    />
    <path fill={`url(#a-${suffix})`} d="M14 2.1H1.95v15a.39.39 0 0 0 .38.39H14a.39.39 0 0 0 .38-.39V2.48A.38.38 0 0 0 14 2.1" />
    <g fill="#fff">
      <path d="m8.35 11.18-1.6-.88V8.5l1.57.87v1.75M6.3 10l-1.6-.85v-1.8l1.57.87V10" />
      <path
        d="m7 8 1.57-.85 1.6.85-1.56.85zM5 6.87 6.52 6h.05l1.53.84a.05.05 0 0 1 0 .08l-1.55.85L5 6.93m4.08-.03 1.56-.9 1.53.84-1.55.85h-.05L9.1 7M7 5.8l1.56-.84h.05l1.55.83-1.57.84L7 5.86"
        opacity={0.8}
      />
      <path
        d="m8.82 11.18 1.57-.87V8.5l-1.58.87v1.75zm3.63-3.86-1.58.87V10h.05l1.57-.87V7.36s-.02-.04-.04-.04M9 12.2c.32 0 .65.1.67.5a.6.6 0 0 1 0 .23l.8-.33v-1.8l-1.58.87v.53zm3.4-2.58-1.58.87v1.75h.05l1.57-.87v-1.7z"
        opacity={0.6}
      />
      <path d="M7.32 11.9c.1.15.2.3.3.32h.78v-.54l-1.6-.9v.5a2.1 2.1 0 0 1 .52.63zm-1.17-.76a1.3 1.3 0 0 1 .21 0v-.65l-1.6-.87v1.68a2.6 2.6 0 0 0 .5-.08 4.4 4.4 0 0 1 .89-.08" />
      <path d="m11.88 13-1 .6-1.1.65a1.56 1.56 0 0 1-.86.11h-.33l-1 .05h-.53c-.43 0-1.06-.45-1.4-.76l-.17-.16A2 2 0 0 0 4.1 13h-.58v-1.47H4.7a2.2 2.2 0 0 0 .54-.08 4.3 4.3 0 0 1 .92-.11 1.24 1.24 0 0 1 1 .67c.14.2.26.37.43.4s.58 0 .95 0H9c.4 0 .48.12.5.3a.43.43 0 0 1-.11.33 2.4 2.4 0 0 1-.69.11c-.33 0-1.2.1-1.42-.1l-.6-.53-.12.15.6.52a1.2 1.2 0 0 0 .81.19c.16 0 .54 0 .75-.05a3.2 3.2 0 0 0 .67-.09.12.12 0 0 0 .08 0c.06 0 1.4-.6 1.77-.77s1-.22 1.05 0-.1.36-.4.52z" />
    </g>
  </svg>
)}
export default SvgServiceCatalogMad
