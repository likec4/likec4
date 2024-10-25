// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgJekyll = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 128 128" {...props}>
    <defs>
      <clipPath id={`b-${suffix}`}>
        <path d="M0 0h128v180H0z" />
      </clipPath>
      <clipPath id={`c-${suffix}`}>
        <path d="M0 0h128v180H0z" />
      </clipPath>
      <clipPath id={`d-${suffix}`}>
        <path d="M0 0h128v180H0z" />
      </clipPath>
      <clipPath id={`e-${suffix}`}>
        <path d="M0 0h128v180H0z" />
      </clipPath>
      <clipPath id={`f-${suffix}`}>
        <path d="M0 0h128v180H0z" />
      </clipPath>
      <clipPath id={`g-${suffix}`}>
        <path d="M0 0h128v180H0z" />
      </clipPath>
      <clipPath id={`h-${suffix}`}>
        <path d="M0 0h128v180H0z" />
      </clipPath>
      <mask id={`j-${suffix}`}>
        <g filter={`url(#a-${suffix})`}>
          <path d="M0 0h128v180H0z" fill="#000" fillOpacity={0.101961} stroke="none" />
        </g>
      </mask>
      <mask id={`n-${suffix}`}>
        <g filter={`url(#a-${suffix})`}>
          <path d="M0 0h128v180H0z" fill="#000" fillOpacity={0.301961} stroke="none" />
        </g>
      </mask>
      <mask id={`p-${suffix}`}>
        <g filter={`url(#a-${suffix})`}>
          <path d="M0 0h128v180H0z" fill="#000" fillOpacity={0.501961} stroke="none" />
        </g>
      </mask>
      <mask id={`r-${suffix}`}>
        <g filter={`url(#a-${suffix})`}>
          <path d="M0 0h128v180H0z" fill="#000" fillOpacity={0.501961} stroke="none" />
        </g>
      </mask>
      <mask id={`t-${suffix}`}>
        <g filter={`url(#a-${suffix})`}>
          <path d="M0 0h128v180H0z" fill="#000" fillOpacity={0.501961} stroke="none" />
        </g>
      </mask>
      <mask id={`v-${suffix}`}>
        <g filter={`url(#a-${suffix})`}>
          <path d="M0 0h128v180H0z" fill="#000" fillOpacity={0.501961} stroke="none" />
        </g>
      </mask>
      <mask id={`x-${suffix}`}>
        <g filter={`url(#a-${suffix})`}>
          <path d="M0 0h128v180H0z" fill="#000" fillOpacity={0.501961} stroke="none" />
        </g>
      </mask>
      <g id={`i-${suffix}`} clipPath={`url(#b-${suffix})`}>
        <path
          d="M69.578 9.598a2.2 2.2 0 0 0-.012.953s1.016 6.722-.14 9.715l-49.14 127.078h.003c-3.508 9.336 1.195 19.754 10.566 23.34s19.88-1.02 23.567-10.286l.004.004 49.14-127.078c.961-2.488 6.442-7.304 6.442-7.304.273-.207.488-.446.633-.715l.023-.051c.027-.055.059-.106.078-.16 1.27-3.278-6.906-9.453-18.254-13.793C81.137 6.96 70.91 6.098 69.645 9.375c-.024.055-.036.113-.051.168Zm0 0"
          stroke="none"
          fillRule="nonzero"
          fill="#000"
          fillOpacity={1}
        />
      </g>
      <g id={`m-${suffix}`} clipPath={`url(#c-${suffix})`}>
        <path
          d="M68.145 9.473s1.003 6.757-.137 9.71L18.863 146.263l.008.004c-3.508 9.332 1.192 19.754 10.563 23.34 1.628.62 3.285.988 4.941 1.136-6.316-4.726-9.027-13.18-6.129-20.89l-.008-.004L76.406 25.293s-6.554-6.125-8.261-15.82m0 0"
          stroke="none"
          fillRule="nonzero"
          fill="#fff"
          fillOpacity={1}
        />
      </g>
      <g id={`o-${suffix}`} clipPath={`url(#d-${suffix})`}>
        <path
          d="M53.746 91.45c0 .78-.637 1.413-1.422 1.413-.789 0-1.426-.633-1.426-1.414a1.42 1.42 0 0 1 1.426-1.418c.785 0 1.422.633 1.422 1.418m0 0"
          stroke="none"
          fillRule="nonzero"
          fill="#fff"
          fillOpacity={1}
        />
      </g>
      <g id={`q-${suffix}`} clipPath={`url(#e-${suffix})`}>
        <path
          d="M63.805 101.715c0 1.18-.961 2.137-2.149 2.137a2.14 2.14 0 0 1-2.144-2.137c0-1.18.96-2.133 2.144-2.133 1.188 0 2.149.953 2.149 2.133m0 0"
          stroke="none"
          fillRule="nonzero"
          fill="#fff"
          fillOpacity={1}
        />
      </g>
      <g id={`s-${suffix}`} clipPath={`url(#f-${suffix})`}>
        <path
          d="M51.434 113.926c0 2.21-1.801 4.004-4.024 4.004-2.226 0-4.027-1.793-4.027-4.004s1.8-4.004 4.027-4.004c2.223 0 4.024 1.793 4.024 4.004m0 0"
          stroke="none"
          fillRule="nonzero"
          fill="#fff"
          fillOpacity={1}
        />
      </g>
      <g id={`u-${suffix}`} clipPath={`url(#g-${suffix})`}>
        <path
          d="M43.035 121.332c0 1.18-.96 2.133-2.144 2.133a2.14 2.14 0 0 1-2.149-2.133c0-1.18.961-2.137 2.149-2.137 1.183 0 2.144.957 2.144 2.137m0 0"
          stroke="none"
          fillRule="nonzero"
          fill="#fff"
          fillOpacity={1}
        />
      </g>
      <g id={`w-${suffix}`} clipPath={`url(#h-${suffix})`}>
        <path
          d="M50.863 137.168c0 .785-.636 1.418-1.422 1.418a1.42 1.42 0 0 1-1.425-1.418c0-.781.636-1.414 1.425-1.414.786 0 1.422.633 1.422 1.414m0 0"
          stroke="none"
          fillRule="nonzero"
          fill="#fff"
          fillOpacity={1}
        />
      </g>
      <linearGradient
        id={`k-${suffix}`}
        x1={206.458}
        x2={283.129}
        y1={215.263}
        y2={291.934}
        gradientTransform="matrix(.26902 -.11893 .11958 .26755 -35.038 25.835)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#919191" stopOpacity={1} />
        <stop offset={1} stopColor="#fff" stopOpacity={1} />
      </linearGradient>
      <linearGradient
        id={`l-${suffix}`}
        x1={177.629}
        x2={224.046}
        y1={273.752}
        y2={320.169}
        gradientTransform="matrix(.26902 -.11893 .11958 .26755 -35.038 25.835)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#900" stopOpacity={1} />
        <stop offset={1} stopColor="#e80000" stopOpacity={1} />
      </linearGradient>
      <filter id={`a-${suffix}`} width={1} height={1} x={0} y={0} filterUnits="objectBoundingBox">
        <feColorMatrix in="SourceGraphic" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0" />
      </filter>
    </defs>
    <use
      xlinkHref={`#i-${suffix}`}
      width="100%"
      height="100%"
      mask={`url(#j-${suffix})`}
      transform="translate(17.464 -.608)scale(.72491)"
      display="inline"
    />
    <path
      d="M66.874 5.565a1.6 1.6 0 0 0-.011.694s.739 4.874-.1 7.04l-35.625 92.12.006.003c-2.543 6.765.863 14.32 7.657 16.92 6.793 2.596 14.413-.74 17.083-7.456h.003l35.626-92.12c.693-1.802 4.666-5.293 4.666-5.293q.3-.227.462-.521l.017-.037c.017-.037.04-.074.056-.113.918-2.376-5.006-6.853-13.235-10.002-8.226-3.146-15.642-3.772-16.56-1.396q-.02.06-.037.125zm0 0"
      display="inline"
      fill={`url(#k-${suffix})`}
      fillRule="nonzero"
      stroke="none"
      strokeWidth={0.724912}
    />
    <path
      d="m78.048 47.24-25.69 66.434.018.006c-1.897 4.76-7.41 7.237-12.301 5.366-4.893-1.87-7.54-7.467-5.737-12.267L50.753 64.33s2.05-3.29 6.074-5.629c4.027-2.339 7.346-1.846 11.814-3.823 4.471-1.973 9.407-7.64 9.407-7.64m0 0"
      display="inline"
      fill={`url(#l-${suffix})`}
      fillRule="nonzero"
      stroke="none"
      strokeWidth={0.724912}
    />
    <path
      d="M90.975 14.882c.515-1.334-3.206-4.001-8.311-5.955S72.999 6.474 72.48 7.808c-.516 1.337 3.205 4.004 8.31 5.955 5.11 1.954 9.665 2.455 10.184 1.119m0 0"
      display="inline"
      fill="#333"
      fillOpacity={1}
      fillRule="nonzero"
      stroke="none"
      strokeWidth={0.724912}
    />
    <use
      xlinkHref={`#m-${suffix}`}
      width="100%"
      height="100%"
      mask={`url(#n-${suffix})`}
      transform="translate(17.464 -.608)scale(.72491)"
      display="inline"
    />
    <use xlinkHref={`#o-${suffix}`} width="100%" height="100%" mask={`url(#p-${suffix})`} transform="translate(17.464 -.608)scale(.72491)" />
    <use xlinkHref={`#q-${suffix}`} width="100%" height="100%" mask={`url(#r-${suffix})`} transform="translate(17.464 -.608)scale(.72491)" />
    <use xlinkHref={`#s-${suffix}`} width="100%" height="100%" mask={`url(#t-${suffix})`} transform="translate(17.464 -.608)scale(.72491)" />
    <use xlinkHref={`#u-${suffix}`} width="100%" height="100%" mask={`url(#v-${suffix})`} transform="translate(17.464 -.608)scale(.72491)" />
    <use xlinkHref={`#w-${suffix}`} width="100%" height="100%" mask={`url(#x-${suffix})`} transform="translate(17.464 -.608)scale(.72491)" />
  </svg>
)}
export default SvgJekyll
