/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgOrganizations = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id="a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#B0084D" />
        <stop offset="100%" stopColor="#FF4F8B" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M55 63h8v-8h-8zm-19 0h8v-8h-8zm-19 0h8v-8h-8zm47-10h-4v-5a1 1 0 0 0-1-1H41v-3h-2v3H21a1 1 0 0 0-1 1v5h-4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V54a1 1 0 0 0-1-1h-4v-4h17v4h-4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V54a1 1 0 0 0-1-1h-4v-4h17v4h-4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V54a1 1 0 0 0-1-1M40 17.155l9 5.196-9 5.196-9-5.196zm1 22.516V29.28l9-5.196v10.393zM30 24.083l9 5.196v10.392l-9-5.195zM28.5 35.92l11 6.351a1 1 0 0 0 1 0l11-6.35c.309-.18.5-.51.5-.867V22.351c0-.357-.191-.687-.5-.866l-11-6.35a1 1 0 0 0-1 0l-11 6.35a1 1 0 0 0-.5.866v12.702a1 1 0 0 0 .5.866"
      />
    </g>
  </svg>
)
export default SvgOrganizations
