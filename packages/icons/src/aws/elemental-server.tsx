import type { SVGProps } from 'react'
const SvgElementalServer = (props: SVGProps<SVGSVGElement>) => (
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
        d="M45.99 51.42 40 54.848l-5.99-3.428v-6.84L40 41.152l5.99 3.428zm2-7.42c0-.358-.192-.69-.503-.868l-6.99-4a1 1 0 0 0-.994 0l-6.991 4c-.31.178-.502.51-.502.868v3H14v2h18.01v3c0 .358.192.69.502.868L39 56.581V64h2v-7.419l6.487-3.713c.311-.178.503-.51.503-.868v-3H66v-2H47.99zM18 27h6v-2h-6zm29 0h15v-2H47zm-33 7h52V18H14zm53-18H13a1 1 0 0 0-1 1v18a1 1 0 0 0 1 1h54a1 1 0 0 0 1-1V17a1 1 0 0 0-1-1"
      />
    </g>
  </svg>
)
export default SvgElementalServer
