/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgCodePipeline = (props) => (
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
        d="M30 31h5v-2h-5zm6.667 30.166-1.85-.759 7.592-18.522 1.85.759zm8.904-5.386 5.497-4.822-5.493-4.761 1.311-1.512 6.359 5.513a1.002 1.002 0 0 1 .004 1.508l-6.359 5.578zm-20.062-4.732a1 1 0 0 1 .338-.755l6.337-5.602 1.324 1.499-5.479 4.843 5.449 4.697-1.307 1.515-6.316-5.446a1 1 0 0 1-.346-.751M62.535 35h-44.07A3.47 3.47 0 0 1 15 31.536V31h12v-2H15V18.464A3.47 3.47 0 0 1 18.465 15h44.07A3.47 3.47 0 0 1 66 18.464V29H38v2h28v.536A3.47 3.47 0 0 1 62.535 35M22 66h36V37H22zm40.535-53h-44.07A5.47 5.47 0 0 0 13 18.464v13.072A5.47 5.47 0 0 0 18.465 37H20v30a1 1 0 0 0 1 1h38a1 1 0 0 0 1-1V37h2.535A5.47 5.47 0 0 0 68 31.536V18.464A5.47 5.47 0 0 0 62.535 13"
      />
    </g>
  </svg>
)
export default SvgCodePipeline
