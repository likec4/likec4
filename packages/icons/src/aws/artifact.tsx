import type { SVGProps } from 'react'
const SvgArtifact = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id="a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#BD0816" />
        <stop offset="100%" stopColor="#FF5252" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M40 12c-15.439 0-28 12.561-28 28 0 12.375 9.147 23.717 21.75 26.968l.5-1.936C22.517 62.004 14 51.477 14 40c0-14.336 11.663-26 26-26s26 11.664 26 26c0 12.346-7.163 22.171-18.25 25.032l.5 1.936C60.248 63.873 68 53.287 68 40c0-15.439-12.561-28-28-28m-8 18h9v-2h-9zm0 15h11v-2H32zm0-5h6v-2h-6zm0-5h18v-2H32zm14-5a1 1 0 0 1-1-1v-7H30v29h23V30zm1-2h4.586L47 23.414zm-1-8a1 1 0 0 1 .707.293l8 8a1 1 0 0 1 .254.457H55V52a1 1 0 0 1-1 1H29a1 1 0 0 1-1-1V21a1 1 0 0 1 1-1zm2.707 40.707-7 7a.997.997 0 0 1-1.414 0l-7-7A1 1 0 0 1 34 59h3v-4h2v5a1 1 0 0 1-1 1h-1.586L41 65.586 45.586 61H44a1 1 0 0 1-1-1v-5h2v4h3a1 1 0 0 1 .707 1.707"
      />
    </g>
  </svg>
)
export default SvgArtifact
