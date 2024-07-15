import type { SVGProps } from 'react'
const SvgElasticFabricAdapter = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={80} height={80} {...props}>
    <defs>
      <linearGradient id="Elastic-Fabric-Adapter_svg__a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#C8511B" />
        <stop offset="100%" stopColor="#F90" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#Elastic-Fabric-Adapter_svg__a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="m20.401 32.362-1.865-.725C21.937 22.882 30.563 17 40 17s18.062 5.882 21.464 14.637l-1.866.725C56.494 24.369 48.618 19 40 19c-8.619 0-16.495 5.369-19.599 13.362m39.197 15.275 1.866.725C58.062 57.117 49.436 63 40 63c-9.437 0-18.063-5.883-21.464-14.638l1.865-.725C23.505 55.63 31.381 61 40 61s16.494-5.37 19.598-13.363M66 43.552a.454.454 0 0 1-.449.448h-7.103a.454.454 0 0 1-.448-.448v-7.105c0-.242.205-.447.448-.447h7.103c.244 0 .449.205.449.447zM65.551 34h-7.103A2.45 2.45 0 0 0 56 36.447v7.105A2.45 2.45 0 0 0 58.448 46h7.103A2.45 2.45 0 0 0 68 43.552v-7.105A2.45 2.45 0 0 0 65.551 34M14 43.552v-7.105c0-.242.205-.447.448-.447h7.103c.244 0 .449.205.449.447v7.105a.454.454 0 0 1-.449.448h-7.103a.454.454 0 0 1-.448-.448m10 0v-7.105A2.45 2.45 0 0 0 21.551 34h-7.103A2.45 2.45 0 0 0 12 36.447v7.105A2.45 2.45 0 0 0 14.448 46h7.103A2.45 2.45 0 0 0 24 43.552M41 41h5v-4h-5zm-7 0h5v-4h-5zm-2 2h16v-8H32zm7 2v3h-9v-3h-2V33h24v12h-4v3h-3v-3zm11 5v-3h4V31H26v16h2v3h13v-3h2v3z"
      />
    </g>
  </svg>
)
export default SvgElasticFabricAdapter
