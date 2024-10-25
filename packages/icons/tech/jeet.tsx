// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgJeet = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 128 128" {...props}>
    <defs>
      <path
        id={`a-${suffix}`}
        d="M81.048 60.31a23.3 23.3 0 0 1-.744 3.75c-.15 8.476-6.817 15.36-15.206 15.85a23.3 23.3 0 0 1-4.68 1.03l-9.274 9.273 27.25 27.252 8.642-8.64c.667-11.898 10.196-21.428 22.093-22.094l7.25-7.25-27.25-27.25-8.082 8.08z"
      />
    </defs>
    <clipPath id={`b-${suffix}`}>
      <use xlinkHref={`#a-${suffix}`} overflow="visible" />
    </clipPath>
    <linearGradient
      id={`c-${suffix}`}
      x1={-286.663}
      x2={-285.993}
      y1={7.854}
      y2={7.854}
      gradientTransform="rotate(130.9 -6240.933 3133.735)scale(44.3)"
      gradientUnits="userSpaceOnUse"
    >
      <stop offset={0} stopColor="#09e09c" />
      <stop offset={1} stopColor="#00bfff" />
    </linearGradient>
    <path fill={`url(#c-${suffix})`} d="m148.662 80.175-60.226 69.57L18.864 89.52 79.09 19.948z" clipPath={`url(#b-${suffix})`} />
    <defs>
      <path
        id={`d-${suffix}`}
        d="m12.338 78.658 8.08 8.08c10.818 1.232 19.4 9.814 20.63 20.63l9.275 9.274L77.575 89.39l-8.64-8.642a23.4 23.4 0 0 1-4.932-.815c-8.537-.072-15.494-6.76-15.996-15.19a23.4 23.4 0 0 1-1.166-6.088l-7.25-7.25L12.34 78.658z"
      />
    </defs>
    <clipPath id={`e-${suffix}`}>
      <use xlinkHref={`#d-${suffix}`} overflow="visible" />
    </clipPath>
    <linearGradient
      id={`f-${suffix}`}
      x1={-281.399}
      x2={-280.73}
      y1={14.666}
      y2={14.666}
      gradientTransform="rotate(46.4 -5355.355 14435.11)scale(42.8)"
      gradientUnits="userSpaceOnUse"
    >
      <stop offset={0} stopColor="#ffc800" />
      <stop offset={1} stopColor="#00bfff" />
    </linearGradient>
    <path fill={`url(#f-${suffix})`} d="m46.572 18.83 63.58 66.812-66.812 63.58-63.58-66.813z" clipPath={`url(#e-${suffix})`} />
    <defs>
      <path
        id={`g-${suffix}`}
        d="M41.26 19.207C40.595 31.104 31.066 40.633 19.17 41.3l-7.252 7.25L39.17 75.802l8.082-8.082c.144-1.267.393-2.503.73-3.7 0-.084-.006-.166-.006-.25 0-8.93 7.24-16.168 16.17-16.168q.391 0 .782.02a23 23 0 0 1 2.954-.53l9.274-9.275L49.9 10.567z"
      />
    </defs>
    <clipPath id={`h-${suffix}`}>
      <use xlinkHref={`#g-${suffix}`} overflow="visible" />
    </clipPath>
    <linearGradient
      id={`i-${suffix}`}
      x1={-289.46}
      x2={-288.79}
      y1={21.371}
      y2={21.371}
      gradientTransform="matrix(29 -29.5 29.5 29 7798.318 -9105.38)"
      gradientUnits="userSpaceOnUse"
    >
      <stop offset={0} stopColor="#ffc800" />
      <stop offset={1} stopColor="#ff664a" />
    </linearGradient>
    <path fill={`url(#i-${suffix})`} d="m-20.698 43.742 64.675-65.79 65.79 64.675-64.674 65.79z" clipPath={`url(#h-${suffix})`} />
    <defs>
      <path
        id={`j-${suffix}`}
        d="m50.257 38.646 8.642 8.64a23.5 23.5 0 0 1 3.343.43 16 16 0 0 1 1.9-.114c8.93 0 16.17 7.24 16.17 16.168q-.001.524-.036 1.04c.38 1.47.628 3 .716 4.57l7.25 7.25 27.252-27.252-8.082-8.082c-10.817-1.23-19.398-9.813-20.63-20.63l-9.274-9.274-27.253 27.254z"
      />
    </defs>
    <clipPath id={`k-${suffix}`}>
      <use xlinkHref={`#j-${suffix}`} overflow="visible" />
    </clipPath>
    <linearGradient
      id={`l-${suffix}`}
      x1={-294.236}
      x2={-293.566}
      y1={12.616}
      y2={12.616}
      gradientTransform="rotate(-135.8 -7139.432 -2558.264)scale(48.1)"
      gradientUnits="userSpaceOnUse"
    >
      <stop offset={0} stopColor="#09e09c" />
      <stop offset={1} stopColor="#ff664a" />
    </linearGradient>
    <path fill={`url(#l-${suffix})`} d="M83.834 109.235 17.652 44.972 81.916-21.21l66.182 64.264z" clipPath={`url(#k-${suffix})`} />
    <path
      fill="#FFC800"
      d="M23.948 87.24C10.988 87.24.48 76.732.48 63.77c0-12.96 10.507-23.468 23.468-23.468s23.468 10.507 23.468 23.47c0 12.96-10.507 23.468-23.468 23.468"
    />
    <path
      fill="#FF664A"
      d="M63.528 47.66c-12.96 0-23.468-10.507-23.468-23.468S50.566.722 63.528.722c12.96 0 23.468 10.508 23.468 23.47 0 12.96-10.508 23.468-23.468 23.468"
    />
    <path
      fill="#00BFFF"
      d="M64.143 127.277c-12.96 0-23.468-10.507-23.468-23.468 0-12.963 10.507-23.47 23.468-23.47S87.61 90.847 87.61 103.81c0 12.96-10.506 23.467-23.467 23.467"
    />
    <path
      fill="#09E09C"
      d="M104.052 88.027c-12.96 0-23.468-10.507-23.468-23.468 0-12.963 10.507-23.47 23.468-23.47s23.468 10.507 23.468 23.47c0 12.96-10.507 23.467-23.468 23.467"
    />
  </svg>
)}
export default SvgJeet
