/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgWorkLink = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id="a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#055F4E" />
        <stop offset="100%" stopColor="#56C0A7" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M30 50h20V30H30zm20.852 2H29.149A1.15 1.15 0 0 1 28 50.852V29.148A1.15 1.15 0 0 1 29.149 28h21.703A1.15 1.15 0 0 1 52 29.148v21.704A1.15 1.15 0 0 1 50.852 52m16.02-22H55v2h11v34H32V55h-2v11.873c0 .621.506 1.127 1.127 1.127h35.745c.622 0 1.128-.506 1.128-1.127V31.127c0-.621-.506-1.127-1.128-1.127M14 48h11v2H13.137C12.51 50 12 49.49 12 48.863V13.137c0-.627.51-1.137 1.137-1.137h35.726c.627 0 1.137.51 1.137 1.137V25h-2V14H14z"
      />
    </g>
  </svg>
)
export default SvgWorkLink
