import type { SVGProps } from 'react'
const SvgToolsAndSdKs = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id="a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#2E27AD" />
        <stop offset="100%" stopColor="#527FFF" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="m62 53.417-21 11.87V57h-2v8.287l-21-11.87V27.805l6.47 4.044 1.06-1.697-6.559-4.1L40.479 14.15l20.493 11.835-7.457 4.142.97 1.749L62 27.7zm1.5-28.283-22.511-13a1 1 0 0 0-.984-.01l-23.489 13A1 1 0 0 0 16 26v28a1 1 0 0 0 .508.87l23 13A1 1 0 0 0 40 68c.17 0 .34-.042.492-.13l23-13A1 1 0 0 0 64 54V26a1 1 0 0 0-.5-.866M51 46.64l-10 5.774V40.619l10-5zm-10.705-7.905-9.711-5.612 9.393-4.978 9.922 5.788zM39 52.414 29 46.64V34.517l10 5.779zm13.504-19.277-12-7a1 1 0 0 0-.973-.02l-12 6.36a1 1 0 0 0-.531.884v13.856a1 1 0 0 0 .5.867l12 6.928a1 1 0 0 0 1 0l12-6.928a1 1 0 0 0 .5-.867V34a1 1 0 0 0-.496-.863"
      />
    </g>
  </svg>
)
export default SvgToolsAndSdKs
