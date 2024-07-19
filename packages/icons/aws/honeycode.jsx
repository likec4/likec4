/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgHoneycode = (props) => (
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
        d="M16 25.916V53.74l24 13.915L64 53.74V25.916L40 12zm2 18.837V27.068l22-12.756 22 12.756v25.52l-5 2.898v-25.73l-17-9.705-17 9.705V47.58zm32-10.719L34.909 25.26 40 22.354l15 8.563v9.692l-5 2.835zM25 48.71V30.917l7.9-4.51 5.119 2.976L30 34.033v17.503zm7-4.24v-9.284l8.012-4.646L48 35.184v9.394l-7.994 4.534zm23-1.562v5.844l-14.999 8.437L32 52.667v-5.884l7.994 4.635zm-37 9.68v-5.537l21.999 12.434L55 51.047v5.599l-15 8.698z"
      />
    </g>
  </svg>
)
export default SvgHoneycode
