/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgApi = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    baseProfile="tiny"
    overflow="visible"
    viewBox="0 0 24 24"
    {...props}
  >
    <path fill="none" d="M0 0h24v24H0z" />
    <g fillRule="evenodd">
      <path
        fill="#5C85DE"
        d="M3 6.1C1.9 6.1.7 7.2.7 8.3V18H3v-4.5h2.2V18h2.2V8.3c0-1.1-1.1-2.2-2.3-2.2zm0 5.1v-3h2.2v3zM11.3 6C10.1 6 9 7.1 9 8.2V18h2.2v-4.5h2.2c1.1 0 2.3-1.1 2.3-2.2v-3c0-1.1-1.1-2.2-2.3-2.2h-2.1zm-.1 5.2v-3h2.2v3zM19.5 8.3v7.5h-2.3V18H24v-2.2h-2.2V8.3H24V6.1h-6.8v2.2z"
      />
      <path fill="#3367D6" d="M3 13.5v-2.3h1.5zM11.2 13.5v-2.3h1.3zM19.5 9.8V8.3h2.3z" />
    </g>
  </svg>
)
export default SvgApi
