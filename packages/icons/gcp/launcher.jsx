/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgLauncher = (props) => (
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
      <path fill="#5C85DE" d="M9.8 21.8h4.4v-1.6H9.8z" />
      <path fill="#3367D6" d="M12 21.8h2.2v-1.6H12z" />
      <path fill="#5C85DE" d="m19.7 23.2 2.9-8.1-3.9-2.2-2.4 7.4 1.4 2.9z" />
      <path fill="#3367D6" d="m18.7 12.9-2.4 7.4 1.4 2.9z" />
      <path fill="#85A4E6" d="m4.3 23.2-2.9-8.1 3.9-2.2 2.4 7.4-1.4 2.9z" />
      <path fill="#5C85DE" d="m5.3 12.9 2.4 7.4-1.4 2.9z" />
      <path
        fill="#85A4E6"
        d="M12 11.5c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5M12 .8 6.8 6v5.5l2.3 8h5.8l2.3-8V6z"
      />
      <path fill="#5C85DE" d="M12 .8v5.8c1.4 0 2.5 1.1 2.5 2.5s-1.1 2.5-2.5 2.5v8h2.9l2.3-8V6z" />
    </g>
  </svg>
)
export default SvgLauncher
