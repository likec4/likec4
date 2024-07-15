import type { SVGProps } from 'react'
const SvgServerMigrationService = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={80} height={80} {...props}>
    <defs>
      <linearGradient id="Server-Migration-Service_svg__a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#055F4E" />
        <stop offset="100%" stopColor="#56C0A7" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#Server-Migration-Service_svg__a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M16.972 31h13.904v-2H16.972zm29.793 35h1.986v-9h-1.986zm-6.951 2H41.8V57h-1.986zm-6.952-2h1.986v-9h-1.986zm-15.89-40h13.904v-2H16.972zm0-5h13.904v-2H16.972zm-1.986 31h17.876V14H14.986zm19.862-39v40c0 .552-.444 1-.993 1H13.993A.996.996 0 0 1 13 53V13c0-.552.444-1 .993-1h19.862c.55 0 .993.448.993 1m33.15 30.567c.056 3.031-1.52 5.908-4.438 8.082-2.915 2.191-6.512 2.345-6.663 2.351H46.765v-2h10.096c-.007 0 3.104-.145 5.516-1.956 1.384-1.032 3.694-3.241 3.635-6.458 0-4.101-3.038-7.459-7.067-7.831a1 1 0 0 1-.9-1.079q.016-.172.046-.358c.065-.41.13-.835-.325-1.932-.802-1.93-3.059-3.123-5.24-2.774a4.75 4.75 0 0 0-2.55 1.282.99.99 0 0 1-.908.252 1 1 0 0 1-.709-.624C46.686 26.023 42.363 23 37.605 23H37.6a1 1 0 0 1-.991-1c0-.552.443-1 .99-1l.228.002c5.052.087 9.65 3.067 11.865 7.59a6.7 6.7 0 0 1 2.521-.955c3.12-.498 6.222 1.175 7.386 3.977.424 1.021.532 1.724.522 2.292 4.556.891 7.878 4.881 7.878 9.661"
      />
    </g>
  </svg>
)
export default SvgServerMigrationService
