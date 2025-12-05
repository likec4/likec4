// @ts-nocheck

import type { SVGProps } from 'react'
const SvgDiscover = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    preserveAspectRatio="xMidYMid"
    viewBox="0 0 512 86"
    {...props}
  >
    <defs>
      <linearGradient id="discover_svg__a" x1="19.414%" x2="88.601%" y1="9.063%" y2="80.499%">
        <stop offset="0%" stopColor="#F34F26" />
        <stop offset="100%" stopColor="#F69E35" />
      </linearGradient>
      <filter id="discover_svg__c" width="200%" height="200%" x="-50%" y="-50%" filterUnits="objectBoundingBox">
        <feMorphology in="SourceAlpha" radius={1} result="shadowSpreadInner1" />
        <feGaussianBlur in="shadowSpreadInner1" result="shadowBlurInner1" stdDeviation={4} />
        <feOffset dx={3} dy={3} in="shadowBlurInner1" result="shadowOffsetInner1" />
        <feComposite
          in="shadowOffsetInner1"
          in2="SourceAlpha"
          k2={-1}
          k3={1}
          operator="arithmetic"
          result="shadowInnerInner1"
        />
        <feColorMatrix in="shadowInnerInner1" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0" />
      </filter>
      <path
        id="discover_svg__b"
        d="M270.356.365c-23.982 0-43.44 18.735-43.44 41.857 0 24.584 18.613 42.96 43.44 42.96 24.208 0 43.322-18.62 43.322-42.477 0-23.716-18.986-42.34-43.322-42.34"
      />
    </defs>
    <use xlinkHref="#discover_svg__b" fill="url(#discover_svg__a)" fillRule="evenodd" />
    <use xlinkHref="#discover_svg__b" filter="url(#discover_svg__c)" />
    <path
      fill="#0B1015"
      d="M23.746 1.891H.393v81.454h23.231c12.326 0 21.24-2.92 29.06-9.398 9.278-7.695 14.78-19.298 14.78-31.29 0-24.048-17.965-40.766-43.718-40.766m18.572 61.177c-5.021 4.53-11.486 6.488-21.76 6.488H16.29V15.684h4.268c10.274 0 16.491 1.834 21.76 6.592 5.495 4.886 8.772 12.452 8.772 20.265 0 7.83-3.277 15.66-8.772 20.527m32.48 20.277H90.67V1.891H74.8zm54.728-50.209c-9.539-3.534-12.346-5.865-12.346-10.246 0-5.134 4.998-9.039 11.849-9.039 4.763 0 8.671 1.953 12.836 6.58l8.295-10.853C143.32 3.581 135.139.532 126.214.532c-14.398 0-25.399 10.02-25.399 23.32 0 11.246 5.126 16.981 20.032 22.369 6.232 2.187 9.4 3.646 10.992 4.643 3.175 2.077 4.77 4.998 4.77 8.415 0 6.606-5.257 11.484-12.351 11.484-7.574 0-13.674-3.782-17.34-10.865L96.67 69.802c7.314 10.733 16.11 15.512 28.214 15.512 16.488 0 28.084-11.007 28.084-26.758 0-12.949-5.36-18.816-23.442-25.42m28.448 9.522c0 23.965 18.816 42.525 43.006 42.525 6.839 0 12.701-1.352 19.915-4.759V61.727c-6.36 6.358-11.98 8.916-19.19 8.916-15.996 0-27.363-11.606-27.363-28.102 0-15.626 11.722-27.964 26.638-27.964 7.561 0 13.311 2.685 19.915 9.158V5.04C213.933 1.51 208.183.054 201.343.054c-24.067 0-43.369 18.935-43.369 42.604m191.652 13.948L327.883 1.891h-17.346l34.58 83.535h8.543L388.843 1.89h-17.217zm46.44 26.74h45.065v-13.79h-29.189V47.555h28.072V33.763h-28.072v-18.08h29.189V1.892h-45.066zM504.02 25.93c0-15.259-10.49-24.039-28.823-24.039H451.62v81.454h15.895V50.608h2.08l21.975 32.737h19.544l-25.667-34.31c11.988-2.452 18.573-10.639 18.573-23.105m-31.882 13.452h-4.623V14.7h4.877c9.915 0 15.287 4.165 15.287 12.092 0 8.177-5.372 12.59-15.541 12.59"
    />
  </svg>
)
export default SvgDiscover
